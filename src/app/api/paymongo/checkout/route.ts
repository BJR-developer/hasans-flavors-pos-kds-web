import { NextRequest, NextResponse } from 'next/server';

const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY || '';

export async function POST(req: NextRequest) {
  try {
    if (!PAYMONGO_SECRET_KEY) {
      return NextResponse.json(
        { error: 'PAYMONGO_SECRET_KEY is not configured in web/.env.local' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const {
      orderId,
      orderNumber,
      amount, // Total amount in PHP (pesos)
      paymentMethod = 'card', // 'gcash' | 'card'
      items = [], // [{ name, price, quantity }]
      customerName = 'Valued Customer',
      customerEmail = 'customer@hasansflavors.com',
      customerPhone = '',
      successUrl,
      cancelUrl,
    } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
    }

    // Default base URL for redirects
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      req.headers.get('origin') ||
      'http://localhost:3000';

    // Format line items for PayMongo (amount in centavos)
    const lineItems =
      items.length > 0
        ? items.map((item: any) => ({
            currency: 'PHP',
            amount: Math.round(Number(item.price) * 100),
            name: item.name || 'Food Item',
            quantity: Number(item.quantity) || 1,
          }))
        : [
            {
              currency: 'PHP',
              amount: Math.round(Number(amount) * 100),
              name: `Restaurant Order #${orderNumber || orderId}`,
              quantity: 1,
            },
          ];

    const basicAuth = Buffer.from(`${PAYMONGO_SECRET_KEY}:`).toString('base64');

    // Send only the selected payment method type to PayMongo
    const paymentMethodTypes =
      paymentMethod === 'gcash' ? ['gcash'] : paymentMethod === 'card' ? ['card'] : ['card', 'gcash'];

    const paymongoPayload = {
      data: {
        attributes: {
          billing: {
            name: customerName,
            email: customerEmail,
            phone: customerPhone || undefined,
          },
          send_email_receipt: true,
          show_description: true,
          show_line_items: true,
          description: `Order #${orderNumber || orderId}`,
          line_items: lineItems,
          payment_method_types: paymentMethodTypes,
          success_url: successUrl || `${baseUrl}/payment/success?order_id=${orderId}`,
          cancel_url: cancelUrl || `${baseUrl}/payment/cancel?order_id=${orderId}`,
          metadata: {
            order_id: String(orderId),
            orderNumber: String(orderNumber || ''),
            payment_method: paymentMethod,
          },
        },
      },
    };

    const response = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Basic ${basicAuth}`,
      },
      body: JSON.stringify(paymongoPayload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('PayMongo Checkout Session error:', data);
      return NextResponse.json(
        { error: data.errors?.[0]?.detail || 'Failed to create checkout session' },
        { status: response.status }
      );
    }

    const checkoutUrl = data?.data?.attributes?.checkout_url;
    const checkoutSessionId = data?.data?.id;

    return NextResponse.json({
      checkoutUrl,
      checkoutSessionId,
    });
  } catch (err: any) {
    console.error('Create checkout error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
