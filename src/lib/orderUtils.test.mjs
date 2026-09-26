import test from 'node:test';
import assert from 'node:assert/strict';
import { isMobileOrder, isCashOrderPendingReview } from './orderUtils.ts';

test('isMobileOrder correctly classifies mobile vs counter POS orders', () => {
  assert.equal(isMobileOrder({ id: 'ord_mob_1720000000' }), true);
  assert.equal(isMobileOrder({ id: 'ord_12345' }), true);
  assert.equal(isMobileOrder({ id: 'ord-abc' }), true);
  assert.equal(isMobileOrder({ id: 'order_1720000000' }), false);
  assert.equal(isMobileOrder({ id: 'ord_12345', notes: 'Counter POS order' }), false);
  assert.equal(isMobileOrder(null), false);
});

test('isCashOrderPendingReview identifies unapproved mobile cash orders', () => {
  // Mobile Cash on Delivery order in pending state -> MUST require review
  const codPendingOrder = {
    id: 'ord_mob_123',
    paymentMethod: 'cash',
    paymentStatus: 'unpaid',
    status: 'pending',
  };
  assert.equal(isCashOrderPendingReview(codPendingOrder), true);

  // Mobile Cash order in sent_to_kitchen state -> still requires review
  const codSentOrder = {
    id: 'ord_mob_124',
    paymentMethod: 'cash',
    paymentStatus: 'unpaid',
    status: 'sent_to_kitchen',
  };
  assert.equal(isCashOrderPendingReview(codSentOrder), true);

  // Online Paid order (Card/GCash) -> approved automatically, no COD review
  const paidCardOrder = {
    id: 'ord_mob_125',
    paymentMethod: 'card',
    paymentStatus: 'paid',
    status: 'pending',
  };
  assert.equal(isCashOrderPendingReview(paidCardOrder), false);

  // Counter POS Cash order taken by staff -> does NOT require mobile review
  const counterPosOrder = {
    id: 'order_126',
    paymentMethod: 'cash',
    paymentStatus: 'unpaid',
    status: 'pending',
  };
  assert.equal(isCashOrderPendingReview(counterPosOrder), false);

  // Order that was already accepted and is now cooking -> review completed
  const cookingOrder = {
    id: 'ord_mob_127',
    paymentMethod: 'cash',
    paymentStatus: 'unpaid',
    status: 'preparing',
  };
  assert.equal(isCashOrderPendingReview(cookingOrder), false);

  // Order that was declined/cancelled -> review completed
  const cancelledOrder = {
    id: 'ord_mob_128',
    paymentMethod: 'cash',
    paymentStatus: 'unpaid',
    status: 'cancelled',
  };
  assert.equal(isCashOrderPendingReview(cancelledOrder), false);
});
