import { redirect } from 'next/navigation';
import { account, authConfigured } from '@/lib/server';
import { hasAccess } from '@/lib/billing-core';
import Board from '@/components/board';
import Billing from '@/components/billing';
import { Brand } from '@/components/brand';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mi lavadero', robots: { index: false, follow: false } };
export default async function Page() {
 if(!authConfigured())redirect('/ingresar');
 let a;try{a=await account();}catch{redirect('/ingresar');}
 const {data:sub}=await a.db.from('subscriptions').select('status,access_until,paddle_subscription_id').eq('business_id',a.business.id).maybeSingle();
 const billing=<Billing status={sub?.status||'none'} until={sub?.access_until||null} subscribed={Boolean(sub?.paddle_subscription_id)} enabled={process.env.BILLING_ENABLED==='true'&&Boolean(process.env.PADDLE_API_KEY&&process.env.PADDLE_PRICE_ID&&process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN&&process.env.PADDLE_WEBHOOK_SECRET)} sandbox={process.env.PADDLE_ENVIRONMENT!=='production'} token={process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN||''}/>;
 if(!hasAccess(sub))return <main className="app-shell"><Brand/><div className="section"><h1 style={{fontSize:40}}>Hola, {a.business.name}.</h1><p className="lead">Tu cuenta está creada. El tablero se habilita cuando el proveedor confirma la prueba o un período pagado.</p>{billing}<p className="micro">Si acabás de completar el checkout, esperá unos segundos y recargá. Volver del checkout no activa acceso por sí solo.</p><a className="text-button" href="/panel">Actualizar estado ↻</a><p><a href="/demo">Mientras tanto, explorá la demo →</a></p></div></main>;
 const {data:jobs,error}=await a.db.from('wash_jobs').select('id,plate,service,amount,state,payment_method,created_at').eq('business_id',a.business.id).order('created_at',{ascending:false}).limit(100);
 if(error) return <main className="app-shell"><Brand/><p className="notice error">No pudimos cargar los vehículos. Recargá para intentar de nuevo.</p></main>;
 return <Board demo={false} title={a.business.name} initialJobs={jobs||[]}>{billing}</Board>;
}
