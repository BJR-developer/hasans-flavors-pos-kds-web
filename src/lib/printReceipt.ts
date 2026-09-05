import { Order } from '@/types';

/**
 * Generate full thermal receipt HTML string for isolated printing
 */
export function generateThermalReceiptHtml(order: Order): string {
  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = new Date(order.createdAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const itemsHtml = order.items
    .map((item) => {
      const addons =
        item.selectedAddons && item.selectedAddons.length > 0
          ? item.selectedAddons
              .map((a) => `<div class="sub-detail">• Addon: ${a.name} (+₱${a.price})</div>`)
              .join('')
          : '';

      const portion =
        item.portion && item.portion.priceDelta > 0
          ? `<div class="sub-detail">• Portion: ${item.portion.name} (+₱${item.portion.priceDelta})</div>`
          : '';

      const spice =
        item.spiceLevel && item.spiceLevel > 1
          ? `<div class="sub-detail">• Spice: Level ${item.spiceLevel} (${
              item.spiceLevel === 2 ? 'Medium' : item.spiceLevel === 3 ? 'Spicy' : 'Fiery Hasan'
            })</div>`
          : '';

      const note = item.specialNotes
        ? `<div class="sub-detail" style="font-style: italic;">• Note: ${item.specialNotes}</div>`
        : '';

      return `
        <div class="receipt-item">
          <div class="receipt-item-row">
            <span class="qty">${item.quantity}x</span>
            <span class="desc">${item.dish.name}</span>
            <span class="price">₱${item.totalPrice.toLocaleString()}</span>
          </div>
          ${portion || spice || addons || note ? `<div class="sub-details">${portion}${spice}${addons}${note}</div>` : ''}
        </div>
      `;
    })
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Receipt ${order.orderNumber}</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 0mm;
    }
    *, *:before, *:after {
      box-sizing: border-box;
    }
    html, body {
      margin: 0;
      padding: 0;
      width: 80mm;
      max-width: 80mm;
      background: #fff;
      color: #000;
      font-family: 'Courier New', Courier, monospace, monospace;
      font-size: 11px;
      line-height: 1.35;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .receipt-container {
      width: 80mm;
      max-width: 80mm;
      padding: 6mm 4mm 12mm 4mm;
      margin: 0 auto;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .bold { font-weight: bold; }
    .bolder { font-weight: 900; }
    .uppercase { text-transform: uppercase; }
    .divider-dashed {
      border-top: 1px dashed #000;
      margin: 6px 0;
    }
    .divider-solid {
      border-top: 1px solid #000;
      margin: 6px 0;
    }
    .brand-title {
      font-size: 14px;
      font-weight: 900;
      letter-spacing: 1px;
      margin: 0 0 2px 0;
    }
    .brand-sub {
      font-size: 10px;
      letter-spacing: 0.5px;
      margin: 0 0 2px 0;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      margin-bottom: 2px;
    }
    .table-header {
      display: flex;
      justify-content: space-between;
      font-weight: bold;
      font-size: 10px;
      border-bottom: 1px solid #000;
      padding-bottom: 3px;
      margin-bottom: 4px;
    }
    .receipt-item {
      margin-bottom: 5px;
    }
    .receipt-item-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      font-size: 10.5px;
    }
    .qty {
      width: 22px;
      font-weight: bold;
      flex-shrink: 0;
    }
    .desc {
      flex: 1;
      padding-right: 4px;
      word-break: break-word;
      font-weight: 600;
    }
    .price {
      width: 58px;
      text-align: right;
      font-weight: bold;
      flex-shrink: 0;
    }
    .sub-details {
      padding-left: 22px;
      font-size: 9px;
      color: #333;
      margin-top: 1px;
      line-height: 1.3;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      font-size: 10.5px;
      margin-bottom: 2px;
    }
    .grand-total {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      font-weight: 900;
      border-top: 1px solid #000;
      border-bottom: 1px solid #000;
      padding: 4px 0;
      margin: 4px 0;
    }
    .barcode-box {
      height: 28px;
      background: #000;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9px;
      letter-spacing: 5px;
      margin: 8px auto 4px auto;
      width: 85%;
    }
    .footer-note {
      font-size: 9px;
      color: #222;
      margin: 2px 0;
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <!-- Store Header -->
    <div class="text-center">
      <div class="brand-title">HASAN'S FLAVORS</div>
      <div class="brand-sub">AUTHENTIC HALAL CUISINE</div>
      <div style="font-size: 9px; margin-bottom: 2px;">Zabihah Halal Certified • Fresh Daily</div>
      <div style="font-size: 9px;">Hotline: +63 (02) 8842-6100</div>
    </div>

    <div class="divider-dashed"></div>

    <!-- Order Metadata -->
    <div class="meta-row bold">
      <span>ORDER: ${order.orderNumber}</span>
      <span class="uppercase">${
        order.type === 'dine_in'
          ? order.tableNumber || 'DINE-IN'
          : order.type === 'delivery'
          ? 'DELIVERY'
          : 'TAKEOUT'
      }</span>
    </div>
    <div class="meta-row">
      <span>Date: ${formattedDate}</span>
      <span>Time: ${formattedTime}</span>
    </div>
    <div class="meta-row">
      <span>Cashier: POS Register #01</span>
      <span>Guest: ${order.customerName}</span>
    </div>
    ${order.customerPhone ? `<div class="meta-row"><span>Phone: ${order.customerPhone}</span></div>` : ''}
    ${order.deliveryAddress ? `<div class="meta-row"><span style="font-size: 9px;">Addr: ${order.deliveryAddress}</span></div>` : ''}

    <div class="divider-dashed"></div>

    <!-- Items Header -->
    <div class="table-header">
      <span style="width: 22px;">QTY</span>
      <span style="flex: 1;">DESCRIPTION</span>
      <span style="width: 58px; text-align: right;">AMOUNT</span>
    </div>

    <!-- Items List -->
    <div class="items-list">
      ${itemsHtml}
    </div>

    <div class="divider-dashed"></div>

    <!-- Financial Totals -->
    <div class="total-row">
      <span>Items Subtotal:</span>
      <span>₱${order.subtotal.toLocaleString()}</span>
    </div>
    <div class="total-row">
      <span>Tax & VAT (5%):</span>
      <span>₱${order.tax.toLocaleString()}</span>
    </div>
    ${
      order.deliveryFee > 0
        ? `<div class="total-row"><span>Delivery Surcharge:</span><span>₱${order.deliveryFee.toLocaleString()}</span></div>`
        : ''
    }
    ${
      order.discount > 0
        ? `<div class="total-row"><span>Discount Applied:</span><span>-₱${order.discount.toLocaleString()}</span></div>`
        : ''
    }

    <!-- Grand Total Due -->
    <div class="grand-total">
      <span>TOTAL DUE:</span>
      <span>₱${order.total.toLocaleString()}</span>
    </div>

    <!-- Payment Breakdown -->
    <div class="total-row" style="font-size: 10px;">
      <span>Tender: <span class="uppercase bold">${order.paymentMethod}</span></span>
      <span>Status: <span class="uppercase bold">${order.paymentStatus}</span></span>
    </div>
    ${
      order.cashTendered !== undefined && order.cashTendered > 0
        ? `
        <div class="total-row" style="font-size: 10px;">
          <span>Cash Tendered:</span>
          <span>₱${order.cashTendered.toLocaleString()}</span>
        </div>
        <div class="total-row bold" style="font-size: 10.5px;">
          <span>Change Returned:</span>
          <span>₱${(order.changeDue || 0).toLocaleString()}</span>
        </div>
        `
        : ''
    }

    <div class="divider-dashed"></div>

    <!-- Barcode & Footer Notes -->
    <div class="text-center">
      <div class="barcode-box">*HF${order.orderNumber.replace('#', '')}*</div>
      <div class="footer-note bold">Thank you for dining with Hasan's Flavors!</div>
      <div class="footer-note" style="font-size: 8px;">Please retain this receipt for warranty and order inquiry.</div>
      <div class="footer-note" style="font-size: 8px;">www.hasansflavors.com</div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Trigger pure 80mm thermal receipt printing using an isolated hidden iframe
 * Guarantees 0% clipping, complete page height, and full content output.
 */
export function printThermalReceipt(order: Order): void {
  if (typeof window === 'undefined') return;

  const htmlContent = generateThermalReceiptHtml(order);

  let iframe = document.getElementById('thermal-print-iframe') as HTMLIFrameElement | null;
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = 'thermal-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);
  }

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!doc) {
    console.error('Cannot access print iframe document');
    window.print();
    return;
  }

  doc.open();
  doc.write(htmlContent);
  doc.close();

  // Allow styles and DOM to settle before opening print dialog
  setTimeout(() => {
    try {
      iframe?.contentWindow?.focus();
      iframe?.contentWindow?.print();
    } catch (e) {
      console.warn('Iframe print failed, falling back to window.print()', e);
      window.print();
    }
  }, 250);
}
