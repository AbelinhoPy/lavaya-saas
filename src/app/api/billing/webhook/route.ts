import { NextRequest,NextResponse } from 'next/server';
import { adminDB } from '@/lib/server';
import { verifySignature } from '@/lib/billing-core';
export const runtime='nodejs';
export async function POST(req:NextRequest){
 const secret=process.env.PADDLE_WEBHOOK_SECRET;
 if(!secret||process.env.BILLING_ENABLED!=='true')return NextResponse.json({error:'Not configured'},{status:503});
 const raw=await req.text();if(raw.length>250000)return NextResponse.json({error:'Too large'},{status:413});
 if(!verifySignature(raw,req.headers.get('paddle-signature')||'',secret))return NextResponse.json({error:'Invalid signature'},{status:401});
 try{
  const event=JSON.parse(raw);if(typeof event.event_type!=='string'||!event.event_type.startsWith('subscription.'))return NextResponse.json({received:true});
  const d=event.data;const allowed=['trialing','active','past_due','paused','canceled'];
  if(!d||typeof d.id!=='string'||!d.id.startsWith('sub_')||!allowed.includes(d.status)||!event.event_id||!Number.isFinite(Date.parse(event.occurred_at)))return NextResponse.json({error:'Invalid event'},{status:400});
  if(!Array.isArray(d.items)||d.items.length!==1||d.items[0]?.price?.id!==process.env.PADDLE_PRICE_ID||d.items[0]?.quantity!==1)return NextResponse.json({error:'Unexpected price'},{status:400});
  const end=d.current_billing_period?.ends_at||d.next_billed_at||null;
  let until=end&&Number.isFinite(Date.parse(end))?end:null;
  const cancellation=d.scheduled_change?.action==='cancel'?d.scheduled_change.effective_at:null;
  if(until&&cancellation&&Date.parse(cancellation)<Date.parse(until))until=cancellation;
  const {error}=await adminDB().rpc('apply_billing_event',{p_event:event.event_id,p_occurred:event.occurred_at,p_subscription:d.id,p_customer:d.customer_id,p_transaction:d.transaction_id||null,p_status:d.status,p_until:until,p_price:d.items[0].price.id});
  if(error)return NextResponse.json({error:'Event could not be applied'},{status:500});
  return NextResponse.json({received:true});
 }catch{return NextResponse.json({error:'Event could not be processed'},{status:500});}
}
