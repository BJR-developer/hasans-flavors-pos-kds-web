import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';
const supabase = createClient(supabaseUrl, supabaseKey);

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || '';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    // 1. Verify webhook signature if secret is configured
    if (WEBHOOK_SECRET && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');

      if (signature !== expectedSignature) {
        console.error('[Razorpay Webhook] Invalid signature verification');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
    }

    // 2. Parse event body
    const event = JSON.parse(rawBody);
    const eventName = event.event;
    console.log(`[Razorpay Webhook] Received event: ${eventName}`);

    // Listen for payment events
    const relevantEvents = [
      'payment_link.paid',
      'qr_code.credited',
      'payment.captured',
      'order.paid',
    ];

    if (relevantEvents.includes(eventName)) {
      const paymentEntity = event?.payload?.payment?.entity;
      const paymentLinkEntity = event?.payload?.payment_link?.entity;
      const qrCodeEntity = event?.payload?.qr_code?.entity;
      const orderEntity = event?.payload?.order?.entity;

      // Extract order_id from various note locations
      const orderId =
        paymentEntity?.notes?.order_id ||
        paymentLinkEntity?.notes?.order_id ||
        qrCodeEntity?.notes?.order_id ||
        orderEntity?.notes?.order_id ||
        paymentEntity?.notes?.orderId ||
        paymentLinkEntity?.notes?.orderId;

      const paymentId = paymentEntity?.id || paymentLinkEntity?.id || qrCodeEntity?.id;
      const amountInr = paymentEntity?.amount
        ? paymentEntity.amount / 100
        : paymentLinkEntity?.amount_paid
        ? paymentLinkEntity.amount_paid / 100
        : undefined;

      const utr =
        paymentEntity?.acquirer_data?.rrn ||
        paymentEntity?.acquirer_data?.upi_transaction_id ||
        paymentEntity?.acquirer_data?.bank_transaction_id ||
        '';

      if (orderId) {
        const { data: existing, error: findError } = await supabase
          .from('orders')
          .select('id, status, total, amount_paid, payment_history')
          .eq('id', orderId)
          .single();

        if (findError || !existing) {
          console.warn(`[Razorpay Webhook] Order ${orderId} not found in database`);
          return NextResponse.json({ received: true, warning: 'Order not found' }, { status: 200 });
        }

        const orderTotal = Number(existing.total || 0);
        const history = Array.isArray(existing?.payment_history) ? [...existing.payment_history] : [];

        history.push({
          id: paymentId || `rzp_${Date.now()}`,
          amount: orderTotal,
          amount_inr: amountInr,
          utr: utr || undefined,
          method: 'inr_qr',
          timestamp: new Date().toISOString(),
          note: `Auto-verified via Razorpay (${eventName})${utr ? ` | UTR: ${utr}` : ''}`,
        });

        const newStatus = existing.status === 'draft' ? 'pending' : existing.status;

        const { error: updateError } = await supabase
          .from('orders')
          .update({
            status: newStatus,
            payment_status: 'paid',
            payment_method: 'inr_qr',
            amount_paid: orderTotal,
            payment_history: history,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);

        if (updateError) {
          console.error(`[Razorpay Webhook] Failed to update order ${orderId}:`, updateError);
          return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
        }

        console.log(`[Razorpay Webhook] Order ${orderId} successfully marked PAID (${newStatus}).`);
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error('[Razorpay Webhook Error]:', error);
    return NextResponse.json({ error: error.message || 'Webhook handler error' }, { status: 500 });
  }
}
