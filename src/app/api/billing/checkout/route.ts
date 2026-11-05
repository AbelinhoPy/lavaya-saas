import { NextRequest,NextResponse } from 'next/server';
import { account,adminDB,originCheck,fail,boundedJSON } from '@/lib/server';
import { paddle } from '@/lib/paddle';
import { validPrice } from '@/lib/billing-core';
export async function POST(req:NextRequest){try{
 originCheck(req);const a=await account();const b=await boundedJSON(req);if(b.consent!==true)throw new Error('Completá la autorización de renovación para continuar.');
 const price=await paddle(`/prices/${process.env.PADDLE_PRICE_ID}`);
 if(!validPrice(price,process.env.MONTHLY_PRICE_CENTS||'2000'))throw new Error('Configuración de precio incompatible: debe ser US$20/mes y 7 días gratis con tarjeta.');
 const admin=adminDB();const {data:claimed,error:claimError}=await admin.rpc('claim_checkout',{p_business:a.business.id});
 if(claimError)throw new Error('Esperá unos minutos antes de abrir otro checkout, o gestioná tu suscripción existente.');
 if(!claimed)throw new Error('Esperá unos minutos antes de abrir otro checkout.');
 const transaction=await paddle('/transactions','POST',{items:[{price_id:process.env.PADDLE_PRICE_ID,quantity:1}],collection_mode:'automatic',custom_data:{business_id:a.business.id}});
 const {error}=await admin.from('billing_checkouts').update({transaction_id:transaction.id,price_id:process.env.PADDLE_PRICE_ID,consented_at:new Date().toISOString()}).eq('business_id',a.business.id);
 if(error)throw error;
 return NextResponse.json({transactionId:transaction.id});
}catch(e){return fail(e);}}
