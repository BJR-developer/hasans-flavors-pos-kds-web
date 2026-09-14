import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';
const supabase = createClient(supabaseUrl, supabaseKey);

const RAZORPAY_KEY_ID = process.env.RAZORPAY_API_KEY || process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_API_SECRET_KEY || process.env.RAZORPAY_KEY_SECRET || '';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, paymentLinkId, qrCodeId } = body;

    if (!orderId && !paymentLinkId && !qrCodeId) {
      return NextResponse.json(
        { error: 'orderId, paymentLinkId, or qrCodeId required' },
        { status: 400 }
      );
    }

    // 1. Check Supabase database first (fastest, authoritative)
    if (orderId) {
      const { data: order } = await supabase
        .from('orders')
        .select('id, status, payment_status, total, amount_paid, payment_history')
        .eq('id', orderId)
        .single();

      if (order && order.payment_status === 'paid') {
        return NextResponse.json({
          paid: true,
          status: order.status,
          paymentStatus: order.payment_status,
          orderId: order.id,
        });
      }
    }

    // 2. Query Razorpay API directly if credentials exist
    if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
      const basicAuth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
      let isPaid = false;
      let paymentRecord: any = null;

      // A. Check Payment Link
      if (paymentLinkId) {
        const linkRes = await fetch(`https://api.razorpay.com/v1/payment_links/${paymentLinkId}`, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Basic ${basicAuth}`,
          },
        });

        if (linkRes.ok) {
          const linkData = await linkRes.json();
          if (linkData.status === 'paid' || (Number(linkData.amount_paid) > 0)) {
            isPaid = true;
            paymentRecord = {
              id: linkData.id,
              amount: linkData.amount_paid ? linkData.amount_paid / 100 : undefined,
              status: linkData.status,
            };
          }
        }
      }

      // B. Check Native QR Code payments
      if (!isPaid && qrCodeId) {
        const qrRes = await fetch(`https://api.razorpay.com/v1/payments/qr_codes/${qrCodeId}/payments`, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Basic ${basicAuth}`,
          },
        });

        if (qrRes.ok) {
          const qrData = await qrRes.json();
          const captured = (qrData.items || []).find((p: any) => p.status === 'captured');
          if (captured) {
            isPaid = true;
            paymentRecord = captured;
          }
        }
      }

      // 3. If paid on Razorpay but not yet in Supabase, update Supabase immediately
      if (isPaid && orderId) {
        const { data: existing } = await supabase
          .from('orders')
          .select('id, status, total, amount_paid, payment_history')
          .eq('id', orderId)
          .single();

        const orderTotal = existing ? Number(existing.total || 0) : 0;
        const history = Array.isArray(existing?.payment_history) ? [...existing.payment_history] : [];

        history.push({
          id: paymentRecord?.id || `rzp_${Date.now()}`,
          amount: orderTotal,
          method: 'inr_qr',
          timestamp: new Date().toISOString(),
          note: 'Verified via Razorpay API',
        });

        const newStatus = existing?.status === 'draft' ? 'pending' : existing?.status || 'pending';

        await supabase
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

        return NextResponse.json({
          paid: true,
          status: newStatus,
          paymentStatus: 'paid',
          orderId,
        });
      }
    }

    return NextResponse.json({ paid: false, orderId });
  } catch (error: any) {
    console.error('[Razorpay Verify Error]:', error);
    return NextResponse.json({ error: error.message || 'Verification failed' }, { status: 500 });
  }
}
