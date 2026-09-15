import { Order } from '@/types';

/**
 * Extracts a Google Maps URL from order deliveryAddress or specialNotes if present,
 * or generates one based on the deliveryAddress string.
 */
export function getOrderMapsUrl(order: Order): string | null {
  const rawTarget = `${order.deliveryAddress || ''} ${order.specialNotes || ''}`;
  const mapMatch = rawTarget.match(/https:\/\/maps\.google\.com\/\?q=[^\s|]+/);
  if (mapMatch) return mapMatch[0];

  if (order.deliveryAddress && order.deliveryAddress.trim()) {
    // If it looks like GPS coordinates "GPS Location (lat, lng)"
    const coordsMatch = order.deliveryAddress.match(/([-+]?\d+\.\d+),\s*([-+]?\d+\.\d+)/);
    if (coordsMatch) {
      return `https://maps.google.com/?q=${coordsMatch[1]},${coordsMatch[2]}`;
    }
    return `https://maps.google.com/?q=${encodeURIComponent(order.deliveryAddress.trim())}`;
  }

  return null;
}

/**
 * Generates a clean, beautifully structured text message suitable for sending
 * to delivery riders or customers over Messenger, Instagram DM, WhatsApp, Messages (SMS), etc.
 */
export function formatDeliveryShareText(order: Order): string {
  const lines: string[] = [];

  const typeLabel =
    order.type === 'delivery'
      ? '🛵 DELIVERY ORDER'
      : order.type === 'takeout'
      ? '🛍️ TAKEOUT ORDER'
      : `🍽️ DINE-IN (${order.tableNumber || 'Table'})`;

  lines.push(`${typeLabel} • ${order.orderNumber}`);
  lines.push(`Customer: ${order.customerName || 'Valued Diner'}`);

  if (order.customerPhone) {
    lines.push(`Phone: ${order.customerPhone}`);
  }

  if (order.deliveryAddress) {
    lines.push(`Address: ${order.deliveryAddress}`);
  }

  const mapsUrl = getOrderMapsUrl(order);
  if (mapsUrl) {
    lines.push(`📍 Google Maps: ${mapsUrl}`);
  }

  if (order.specialNotes) {
    lines.push(`📝 Note: ${order.specialNotes}`);
  }

  const paymentDesc =
    order.paymentStatus === 'paid'
      ? `PAID in full (${order.paymentMethod === 'gcash' ? 'GCash' : order.paymentMethod === 'card' ? 'Card' : order.paymentMethod === 'inr_qr' ? 'INR UPI' : 'Cash'})`
      : order.paymentMethod === 'cash'
      ? `COLLECT ₱${order.total.toLocaleString()} (${order.type === 'delivery' ? 'Cash on Delivery' : 'Cash at Counter'})`
      : `UNPAID (${order.paymentMethod.toUpperCase()} Pending Payment)`;

  lines.push(`💰 Bill: ₱${order.total.toLocaleString()} [${paymentDesc}]`);

  if (order.items && order.items.length > 0) {
    lines.push(`Items (${order.items.reduce((s, i) => s + (i.quantity || 1), 0)}):`);
    order.items.forEach((it) => {
      lines.push(`• ${it.quantity}x ${it.dish?.name || 'Item'}`);
    });
  }

  return lines.join('\n');
}

/**
 * Executes a native share if supported (opening native OS share dialog with Messenger, Instagram, Messages, etc.)
 * Fallbacks to clipboard copy.
 */
export async function shareOrder(order: Order): Promise<{
  success: boolean;
  method: 'native' | 'clipboard';
  message: string;
}> {
  const shareText = formatDeliveryShareText(order);
  const mapsUrl = getOrderMapsUrl(order);

  // Try Web Share API first
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: `Hasan's Flavors Delivery - ${order.orderNumber}`,
        text: shareText,
        url: mapsUrl || undefined,
      });
      return {
        success: true,
        method: 'native',
        message: 'Shared successfully via device share sheet!',
      };
    } catch (err: any) {
      // If user aborted or canceled share, don't fallback to clipboard
      if (err.name === 'AbortError') {
        return {
          success: false,
          method: 'native',
          message: 'Share cancelled',
        };
      }
      console.warn('Native share failed, copying to clipboard:', err);
    }
  }

  // Fallback: Copy formatted text to clipboard
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareText);
      return {
        success: true,
        method: 'clipboard',
        message: 'Delivery details copied to clipboard! Paste into Messenger, Instagram, or SMS.',
      };
    }
  } catch (clipErr) {
    console.warn('Clipboard write error:', clipErr);
  }

  return {
    success: false,
    method: 'clipboard',
    message: 'Unable to share or copy text automatically.',
  };
}
