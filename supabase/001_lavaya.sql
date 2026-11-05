-- Run in a NEW Supabase project. Does not migrate the original lavadero tables.
begin;
create table public.businesses (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid unique not null references auth.users(id) on delete cascade,
 name text not null check(char_length(name) between 2 and 100),
 created_at timestamptz not null default now()
);
create table public.subscriptions (
 business_id uuid primary key references public.businesses(id) on delete cascade,
 paddle_subscription_id text unique not null,
 paddle_customer_id text not null,
 status text not null check(status in ('trialing','active','past_due','paused','canceled')),
 access_until timestamptz,
 event_occurred_at timestamptz not null
);
create table public.billing_checkouts (
 business_id uuid primary key references public.businesses(id) on delete cascade,
 transaction_id text unique,
 price_id text,
 started_at timestamptz not null default now(),
 consented_at timestamptz
);
create table public.billing_events (event_id text primary key, occurred_at timestamptz not null);
create table public.wash_jobs (
 id uuid primary key default gen_random_uuid(),
 business_id uuid not null references public.businesses(id) on delete cascade,
 plate text not null check(plate ~ '^[A-Z0-9 -]{3,15}$'),
 service text not null check(char_length(service) between 2 and 80),
 amount bigint not null check(amount between 1 and 100000000),
 state text not null default 'espera' check(state in ('espera','lavando','listo','entregado')),
 payment_method text check(payment_method in ('efectivo','transferencia')),
 created_at timestamptz not null default now(),
 check((state='entregado' and payment_method is not null) or (state<>'entregado' and payment_method is null))
);
create index wash_jobs_business_created on public.wash_jobs(business_id,created_at desc);

create function public.create_owner_business() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.businesses(owner_id,name) values(new.id,left(coalesce(nullif(trim(new.raw_user_meta_data->>'business_name'),''),'Mi lavadero'),100));
 return new;
end;$$;
create trigger on_lavaya_signup after insert on auth.users for each row execute function public.create_owner_business();

alter table public.businesses enable row level security;
alter table public.subscriptions enable row level security;
alter table public.billing_checkouts enable row level security;
alter table public.billing_events enable row level security;
alter table public.wash_jobs enable row level security;
revoke all on public.businesses,public.subscriptions,public.billing_checkouts,public.billing_events,public.wash_jobs from anon,authenticated;
grant select on public.businesses,public.subscriptions,public.wash_jobs to authenticated;
grant insert(plate,service,amount,business_id),update(state,payment_method) on public.wash_jobs to authenticated;
grant all on public.businesses,public.subscriptions,public.billing_checkouts,public.billing_events,public.wash_jobs to service_role;
create policy own_business on public.businesses for select to authenticated using(owner_id=(select auth.uid()));
create policy own_subscription on public.subscriptions for select to authenticated using(exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=(select auth.uid())));
create function public.can_use_business(p_business uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.businesses b join public.subscriptions s on s.business_id=b.id where b.id=p_business and b.owner_id=(select auth.uid()) and s.status in ('active','trialing') and s.access_until>now());
$$;
revoke all on function public.can_use_business(uuid) from public;
grant execute on function public.can_use_business(uuid) to authenticated;
create policy own_jobs on public.wash_jobs for select to authenticated using(public.can_use_business(business_id));
create policy insert_own_jobs on public.wash_jobs for insert to authenticated with check(public.can_use_business(business_id) and state='espera' and payment_method is null);
create policy update_own_jobs on public.wash_jobs for update to authenticated using(public.can_use_business(business_id)) with check(public.can_use_business(business_id));
create function public.validate_job_transition() returns trigger language plpgsql set search_path='' as $$
begin
 if not ((old.state='espera' and new.state='lavando') or (old.state='lavando' and new.state='listo') or (old.state='listo' and new.state='entregado')) then raise exception 'Invalid transition'; end if;
 return new;
end;$$;
create trigger valid_job_transition before update on public.wash_jobs for each row execute function public.validate_job_transition();

create function public.claim_checkout(p_business uuid) returns boolean language plpgsql security definer set search_path='' as $$
begin
 perform 1 from public.businesses where id=p_business for update;
 if not found then raise exception 'Business missing'; end if;
 if exists(select 1 from public.subscriptions where business_id=p_business) then raise exception 'Subscription already exists'; end if;
 if exists(select 1 from public.billing_checkouts where business_id=p_business and started_at>now()-interval '10 minutes') then return false; end if;
 insert into public.billing_checkouts(business_id) values(p_business)
 on conflict(business_id) do update set started_at=now(),transaction_id=null,price_id=null,consented_at=null;
 return true;
end;$$;
create function public.apply_billing_event(p_event text,p_occurred timestamptz,p_subscription text,p_customer text,p_transaction text,p_status text,p_until timestamptz,p_price text) returns void language plpgsql security definer set search_path='' as $$
declare v_business uuid; v_previous timestamptz;
begin
 -- Serialize creation and updates for the same provider subscription.
 perform pg_advisory_xact_lock(hashtextextended(p_subscription,0));
 if exists(select 1 from public.billing_events where event_id=p_event) then return; end if;
 select business_id,event_occurred_at into v_business,v_previous from public.subscriptions where paddle_subscription_id=p_subscription;
 if v_business is null then
  select business_id into v_business from public.billing_checkouts where transaction_id=p_transaction and price_id=p_price and consented_at is not null;
  if v_business is null then raise exception 'No trusted checkout'; end if;
  perform 1 from public.businesses where id=v_business for update;
  if exists(select 1 from public.subscriptions where business_id=v_business) then raise exception 'Subscription already linked'; end if;
 end if;
 insert into public.billing_events(event_id,occurred_at) values(p_event,p_occurred);
 if v_previous is not null and p_occurred<=v_previous then return; end if;
 insert into public.subscriptions(business_id,paddle_subscription_id,paddle_customer_id,status,access_until,event_occurred_at)
 values(v_business,p_subscription,p_customer,p_status,p_until,p_occurred)
 on conflict(business_id) do update set status=excluded.status,access_until=excluded.access_until,event_occurred_at=excluded.event_occurred_at;
end;$$;
revoke all on function public.create_owner_business(),public.validate_job_transition(),public.claim_checkout(uuid),public.apply_billing_event(text,timestamptz,text,text,text,text,timestamptz,text) from public,anon,authenticated;
grant execute on function public.claim_checkout(uuid),public.apply_billing_event(text,timestamptz,text,text,text,text,timestamptz,text) to service_role;
commit;
