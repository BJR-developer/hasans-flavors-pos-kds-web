import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';

const RAZORPAY_KEY_ID = process.env.RAZORPAY_API_KEY || process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_API_SECRET_KEY || process.env.RAZORPAY_KEY_SECRET || '';

export async function POST(req: NextRequest) {
  try {
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { error: 'Razorpay credentials not configured in web/.env.local' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const {
      orderId,
      orderNumber,
      inrAmount,
      customerName = 'Valued Diner',
      customerEmail,
      customerPhone,
    } = body;

    if (!orderId || !inrAmount || Number(inrAmount) <= 0) {
      return NextResponse.json(
        { error: 'orderId and valid inrAmount are required' },
        { status: 400 }
      );
    }

    const amountInPaise = Math.round(Number(inrAmount) * 100);
    const basicAuth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');

    // 1. Try Razorpay Native QR Code API (/v1/payments/qr_codes) first
    try {
      const qrRes = await fetch('https://api.razorpay.com/v1/payments/qr_codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${basicAuth}`,
        },
        body: JSON.stringify({
          type: 'upi_qr',
          name: `Order #${orderNumber || orderId}`,
          usage: 'single_use',
          fixed_amount: true,
          payment_amount: amountInPaise,
          description: `Order #${orderNumber || orderId}`,
          close_by: Math.floor(Date.now() / 1000) + 1200, // 20 mins expiry
          notes: {
            order_id: String(orderId),
            order_number: String(orderNumber || ''),
          },
        }),
      });

      if (qrRes.ok) {
        const qrData = await qrRes.json();
        return NextResponse.json({
          success: true,
          type: 'qr_code',
          id: qrData.id,
          qrImageUrl: qrData.image_url,
          paymentUrl: qrData.image_url,
          amountInr: inrAmount,
        });
      }
    } catch (qrErr) {
      console.warn('Native Razorpay QR Code creation attempt failed, falling back to Payment Link:', qrErr);
    }

    // 2. Fallback to Razorpay Payment Link (/v1/payment_links)
    // Works across both Test Mode and Live Mode out-of-the-box
    const linkRes = await fetch('https://api.razorpay.com/v1/payment_links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${basicAuth}`,
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        accept_partial: false,
        description: `Order #${orderNumber || orderId}`,
        reference_id: `ord_${orderId}_${Date.now().toString().slice(-6)}`,
        customer: {
          name: customerName,
          email: customerEmail || undefined,
          contact: customerPhone || undefined,
        },
        notes: {
          order_id: String(orderId),
          order_number: String(orderNumber || ''),
        },
      }),
    });

    const linkData = await linkRes.json();

    if (!linkRes.ok) {
      console.error('Razorpay Payment Link creation error:', linkData);
      return NextResponse.json(
        { error: linkData.error?.description || 'Failed to initialize Razorpay payment' },
        { status: linkRes.status }
      );
    }

    // Generate high-resolution QR code Data URL for mobile display
    const qrDataUrl = await QRCode.toDataURL(linkData.short_url, {
      margin: 2,
      width: 320,
      color: {
        dark: '#111827',
        light: '#FFFFFF',
      },
    });

    return NextResponse.json({
      success: true,
      type: 'payment_link',
      id: linkData.id,
      qrImageUrl: qrDataUrl,
      paymentUrl: linkData.short_url,
      amountInr: inrAmount,
    });
  } catch (err: any) {
    console.error('Razorpay create-qr unexpected error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
