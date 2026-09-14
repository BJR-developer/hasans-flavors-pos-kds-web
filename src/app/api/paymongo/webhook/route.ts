import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
// Use service role key if available, otherwise anon key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const WEBHOOK_SECRET = process.env.PAYMONGO_WEBHOOK_SECRET || '';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signatureHeader = req.headers.get('paymongo-signature');

    // 1. Verify webhook signature if secret is configured
    if (WEBHOOK_SECRET && signatureHeader) {
      const parts = signatureHeader.split(',');
      const timestampPart = parts.find((p) => p.startsWith('t='));
      const testSigPart = parts.find((p) => p.startsWith('te='));
      const liveSigPart = parts.find((p) => p.startsWith('li='));

      const timestamp = timestampPart ? timestampPart.replace('t=', '') : '';
      const signature = (liveSigPart ? liveSigPart.replace('li=', '') : '') || (testSigPart ? testSigPart.replace('te=', '') : '');

      const payloadToSign = `${timestamp}.${rawBody}`;
      const expectedSignature = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(payloadToSign)
        .digest('hex');

      if (signature !== expectedSignature) {
        console.error('PayMongo signature verification failed');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
    }

    // 2. Parse payload
    const event = JSON.parse(rawBody);
    const eventType = event?.data?.attributes?.type;

    // We listen for checkout_session.payment.paid or payment.paid
    if (eventType === 'checkout_session.payment.paid') {
      const checkoutSession = event.data.attributes.data;
      const metadata = checkoutSession?.attributes?.metadata || {};
      const orderId = metadata.order_id || metadata.orderId;

      const payments = checkoutSession?.attributes?.payments || [];
      const paymentData = payments[0] || {};
      const amountPaid = paymentData?.attributes?.amount ? paymentData.attributes.amount / 100 : undefined;
      const detectedMethod =
        paymentData?.attributes?.source?.type ||
        paymentData?.attributes?.payment_method_type ||
        metadata.payment_method ||
        'gcash';
      const paymentMethod = detectedMethod.toLowerCase().includes('card') ? 'card' : 'gcash';

      if (orderId) {
        // Update order in Supabase
        const { data: existing } = await supabase
          .from('orders')
          .select('id, status, total, amount_paid, payment_history')
          .eq('id', orderId)
          .single();

        const orderTotal = existing ? Number(existing.total || 0) : 0;
        const finalAmountPaid = amountPaid !== undefined ? amountPaid : orderTotal;
        const history = Array.isArray(existing?.payment_history) ? [...existing.payment_history] : [];

        history.push({
          id: paymentData.id || `pay_${Date.now()}`,
          amount: finalAmountPaid,
          method: paymentMethod,
          timestamp: new Date().toISOString(),
          note: 'Paid via PayMongo Checkout',
        });

        // If order was in 'draft', transition it to 'pending' so kitchen receives it
        const newStatus = existing?.status === 'draft' ? 'pending' : existing?.status || 'pending';

        await supabase
          .from('orders')
          .update({
            status: newStatus,
            payment_status: 'paid',
            payment_method: paymentMethod,
            amount_paid: finalAmountPaid,
            payment_history: history,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);

        console.log(`[PayMongo Webhook] Order ${orderId} marked as paid (status: ${newStatus}).`);
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error('[PayMongo Webhook Error]:', error);
    return NextResponse.json({ error: error.message || 'Webhook error' }, { status: 500 });
  }
}
