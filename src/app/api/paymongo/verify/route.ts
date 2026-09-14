import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY || '';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, checkoutSessionId } = body;

    if (!orderId && !checkoutSessionId) {
      return NextResponse.json({ error: 'orderId or checkoutSessionId required' }, { status: 400 });
    }

    // 1. Check Supabase first
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

    // 2. If not yet marked paid in Supabase, verify directly with PayMongo API
    if (checkoutSessionId && PAYMONGO_SECRET_KEY) {
      const basicAuth = Buffer.from(`${PAYMONGO_SECRET_KEY}:`).toString('base64');
      const response = await fetch(`https://api.paymongo.com/v1/checkout_sessions/${checkoutSessionId}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Basic ${basicAuth}`,
        },
      });

      if (response.ok) {
        const pmData = await response.json();
        const session = pmData?.data;
        const sessionStatus = session?.attributes?.status; // 'active' | 'paid' | 'expired'
        const payments = session?.attributes?.payments || [];
        const paymentData = payments[0] || {};

        if (sessionStatus === 'paid') {
          const amountPaid = paymentData?.attributes?.amount
            ? paymentData.attributes.amount / 100
            : undefined;
          const detectedMethod =
            paymentData?.attributes?.source?.type ||
            paymentData?.attributes?.payment_method_type ||
            'gcash';
          const paymentMethod = detectedMethod.toLowerCase().includes('card') ? 'card' : 'gcash';

          if (orderId) {
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
              note: 'Verified via PayMongo API',
            });

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
          }

          return NextResponse.json({
            paid: true,
            status: 'pending',
            paymentStatus: 'paid',
            orderId,
          });
        } else {
          return NextResponse.json({
            paid: false,
            status: sessionStatus || 'unpaid',
            orderId,
          });
        }
      }
    }

    return NextResponse.json({ paid: false, status: 'unpaid', orderId });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ error: error.message || 'Verification error' }, { status: 500 });
  }
}
