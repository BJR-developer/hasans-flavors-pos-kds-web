'use client';

import React from 'react';
import { Printer, X } from 'lucide-react';
import { Order } from '@/types';

interface ThermalReceiptModalProps {
  order: Order | null;
  onClose: () => void;
}

export function ThermalReceiptModal({ order, onClose }: ThermalReceiptModalProps) {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = new Date(order.createdAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-[#E9E8E7] my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Control Bar (Hidden when printing) */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#F4F3F2] border-b border-[#E9E8E7]">
          <div className="flex items-center gap-2 text-xs font-bold text-[#2D2926]">
            <Printer className="w-4 h-4 text-[#BA1A20]" />
            <span>Thermal Receipt Slip (80mm)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#BA1A20] hover:bg-[#8B0000] text-white text-xs font-bold transition-all shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#8F6F6C] hover:text-[#2D2926] hover:bg-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="p-6 overflow-y-auto max-h-[75vh] flex justify-center bg-[#FAF9F8]">
          {/* Printable 80mm Slip Container */}
          <div
            id="printable-thermal-receipt"
            className="w-full max-w-[320px] bg-white p-5 rounded-lg border border-[#E9E8E7] shadow-sm font-mono text-xs text-[#1A1C1C] leading-relaxed"
          >
            {/* Header / Brand */}
            <div className="text-center pb-3 border-b border-dashed border-gray-400">
              <p className="font-extrabold text-sm tracking-wider uppercase text-black">
                HASAN&apos;S FLAVORS
              </p>
              <p className="text-[10px] tracking-wide text-gray-700">AUTHENTIC HALAL CUISINE</p>
              <p className="text-[9px] text-gray-500 mt-0.5">Zabihah Halal Certified • Fresh Daily</p>
              <p className="text-[9px] text-gray-500">Tel: +63 (02) 8842-6100</p>
            </div>

            {/* Order Metadata */}
            <div className="py-2.5 border-b border-dashed border-gray-400 text-[10px] space-y-0.5">
              <div className="flex justify-between font-bold text-xs text-black">
                <span>ORDER: {order.orderNumber}</span>
                <span className="uppercase">
                  {order.type === 'dine_in'
                    ? order.tableNumber || 'Dine-In'
                    : order.type === 'delivery'
                    ? 'Delivery'
                    : 'Takeout'}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Date: {formattedDate}</span>
                <span>Time: {formattedTime}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Cashier: POS Register #01</span>
                <span>Guest: {order.customerName}</span>
              </div>
              {order.customerPhone && (
                <div className="text-gray-600">Phone: {order.customerPhone}</div>
              )}
              {order.deliveryAddress && (
                <div className="text-gray-600 text-[9px] leading-tight">
                  Addr: {order.deliveryAddress}
                </div>
              )}
            </div>

            {/* Itemized Table */}
            <div className="py-3 border-b border-dashed border-gray-400">
              <div className="flex justify-between text-[10px] font-bold text-gray-800 pb-1 mb-1 border-b border-gray-200">
                <span className="w-8">QTY</span>
                <span className="flex-1 px-1">ITEM DESCRIPTION</span>
                <span className="w-14 text-right">AMOUNT</span>
              </div>

              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.cartItemId} className="text-[10px]">
                    <div className="flex justify-between items-start">
                      <span className="w-8 font-bold text-black">{item.quantity}x</span>
                      <span className="flex-1 px-1 font-semibold text-gray-900 leading-tight">
                        {item.dish.name}
                      </span>
                      <span className="w-14 text-right font-bold text-black">
                        ₱{item.totalPrice.toLocaleString()}
                      </span>
                    </div>

                    {/* Modifiers & Portions Details */}
                    <div className="pl-8 text-[9px] text-gray-500 space-y-0.5 mt-0.5">
                      {item.portion?.priceDelta > 0 && (
                        <div>• Portion: {item.portion.name} (+₱{item.portion.priceDelta})</div>
                      )}
                      {item.spiceLevel && (
                        <div>
                          • Spice: Level {item.spiceLevel} (
                          {item.spiceLevel === 1
                            ? 'Mild'
                            : item.spiceLevel === 2
                            ? 'Medium'
                            : item.spiceLevel === 3
                            ? 'Spicy'
                            : 'Fiery Special'}
                          )
                        </div>
                      )}
                      {item.selectedAddons?.map((addon) => (
                        <div key={addon.id}>
                          • Addon: {addon.name} (+₱{addon.price})
                        </div>
                      ))}
                      {item.specialNotes && (
                        <div className="italic text-gray-600">Note: {item.specialNotes}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="py-2.5 border-b border-dashed border-gray-400 text-[10px] space-y-1">
              <div className="flex justify-between text-gray-700">
                <span>Items Subtotal:</span>
                <span>₱{order.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Value Added Tax (5% VAT):</span>
                <span>₱{order.tax.toLocaleString()}</span>
              </div>
              {order.deliveryFee > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>Delivery Surcharge:</span>
                  <span>₱{order.deliveryFee.toLocaleString()}</span>
                </div>
              )}
              {order.discount > 0 && (
                <div className="flex justify-between text-green-700 font-semibold">
                  <span>Discount:</span>
                  <span>-₱{order.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-xs font-black pt-1 border-t border-gray-300 text-black">
                <span>TOTAL DUE:</span>
                <span>₱{order.total.toLocaleString()}</span>
              </div>
            </div>

            {/* Payment Record */}
            <div className="py-2 border-b border-dashed border-gray-400 text-[10px] space-y-0.5">
              <div className="flex justify-between">
                <span>Payment Method:</span>
                <span className="uppercase font-bold">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Status:</span>
                <span
                  className={`uppercase font-bold ${
                    order.paymentStatus === 'paid' ? 'text-green-700' : 'text-amber-700'
                  }`}
                >
                  {order.paymentStatus}
                </span>
              </div>
              {order.cashTendered !== undefined && (
                <>
                  <div className="flex justify-between">
                    <span>Cash Tendered:</span>
                    <span>₱{order.cashTendered.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-black">
                    <span>Change Returned:</span>
                    <span>₱{(order.changeDue || 0).toLocaleString()}</span>
                  </div>
                </>
              )}
            </div>

            {/* Barcode & Footer */}
            <div className="pt-3 text-center space-y-1">
              <div className="h-7 bg-gray-900 mx-auto w-3/4 rounded-xs opacity-85 flex items-center justify-center text-[8px] text-white tracking-[6px] font-mono">
                *HF{order.orderNumber.replace('#', '')}*
              </div>
              <p className="text-[9px] text-gray-600 font-medium">
                Thank you for dining with Hasan&apos;s Flavors!
              </p>
              <p className="text-[8px] text-gray-400">
                Please retain this receipt for verification.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-[#E9E8E7] flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-[#5B403D] hover:bg-[#F4F3F2] transition-all"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#BA1A20] hover:bg-[#8B0000] text-white text-xs font-bold transition-all shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
}
