import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateShiftMetrics,
  normalizeStaffEmail,
  validateUsername,
  sanitizeUsername,
} from './shiftCalculations.ts';

test('validateUsername strictly enforces no spaces and no symbols', () => {
  // Invalid cases: spaces
  assert.equal(validateUsername('rashed khan').isValid, false);
  assert.equal(validateUsername('person 1').isValid, false);
  assert.equal(validateUsername(' cashier').isValid, false);

  // Invalid cases: special symbols
  assert.equal(validateUsername('user@hasan').isValid, false);
  assert.equal(validateUsername('user#123').isValid, false);
  assert.equal(validateUsername('test$name').isValid, false);
  assert.equal(validateUsername('name.surname').isValid, false);
  assert.equal(validateUsername('user!').isValid, false);

  // Invalid cases: length
  assert.equal(validateUsername('').isValid, false);
  assert.equal(validateUsername('ab').isValid, false);
  assert.equal(validateUsername('a'.repeat(35)).isValid, false);

  // Valid cases: letters, numbers, and underscores
  assert.equal(validateUsername('rashed').isValid, true);
  assert.equal(validateUsername('rashed_khan').isValid, true);
  assert.equal(validateUsername('person_1').isValid, true);
  assert.equal(validateUsername('cashier2').isValid, true);
  assert.equal(validateUsername('Main_POS_1').isValid, true);
});

test('sanitizeUsername cleans and formats valid usernames', () => {
  assert.equal(sanitizeUsername('Rashed Khan'), 'rashed_khan');
  assert.equal(sanitizeUsername('Person - 1'), 'person_1');
  assert.equal(sanitizeUsername('Cashier#2026!'), 'cashier2026');
  assert.equal(sanitizeUsername('  Alice_123  '), 'alice_123');
});

test('normalizeStaffEmail handles pure usernames and full email addresses', () => {
  assert.equal(normalizeStaffEmail('person1'), 'person1@hasan.com');
  assert.equal(normalizeStaffEmail('cashier_2'), 'cashier_2@hasan.com');
  assert.equal(normalizeStaffEmail('Alice'), 'alice@hasan.com');
  assert.equal(normalizeStaffEmail('owner@hasan.com'), 'owner@hasan.com');
  assert.equal(normalizeStaffEmail('  STAFF@GMAIL.COM  '), 'staff@gmail.com');
});

test('calculateShiftMetrics correctly filters orders by time window and cashier', () => {
  const shiftStartTime = '2026-09-26T09:00:00.000Z';
  const shiftEndTime = '2026-09-26T17:00:00.000Z';
  const openingFloat = 1000;

  const mockOrders = [
    {
      id: 'ord_1',
      orderNumber: '#1',
      cashierName: 'Person - 1',
      total: 500,
      amountPaid: 500,
      paymentMethod: 'cash',
      discount: 50,
      status: 'completed',
      createdAt: '2026-09-26T10:30:00.000Z',
    },
    {
      id: 'ord_2',
      orderNumber: '#2',
      cashierName: 'Person - 1',
      total: 800,
      amountPaid: 800,
      paymentMethod: 'card',
      discount: 0,
      status: 'completed',
      createdAt: '2026-09-26T12:15:00.000Z',
    },
    {
      id: 'ord_3',
      orderNumber: '#3',
      cashierName: 'Person - 1',
      total: 350,
      amountPaid: 350,
      paymentMethod: 'gcash',
      discount: 0,
      status: 'completed',
      createdAt: '2026-09-26T15:45:00.000Z',
    },
    {
      id: 'ord_4',
      orderNumber: '#4',
      cashierName: 'Person - 1',
      total: 300,
      amountPaid: 300,
      paymentMethod: 'cash',
      discount: 0,
      status: 'completed',
      createdAt: '2026-09-26T08:30:00.000Z',
    },
  ];

  const result = calculateShiftMetrics({
    startTime: shiftStartTime,
    endTime: shiftEndTime,
    cashierName: 'Person - 1',
    openingCash: openingFloat,
    orders: mockOrders,
  });

  assert.equal(result.totalOrders, 3);
  assert.equal(result.grossSales, 1650);
  assert.equal(result.cashSales, 500);
  assert.equal(result.expectedCash, 1500);
});

test('session order attribution correctly includes mobile self-checkout and cashier orders while excluding other cashier orders', () => {
  const currentCashierId = 'cashier_rashed';
  const orders = [
    { id: 'ord_1', cashierId: null, cashierName: null, total: 190, paymentMethod: 'cash', status: 'completed' },
    { id: 'ord_mob_3', cashierId: null, cashierName: null, total: 122, paymentMethod: 'cash', status: 'completed' },
    { id: 'ord_mob_4', cashierId: null, cashierName: null, total: 320, paymentMethod: 'gcash', status: 'completed' },
    { id: 'ord_5', cashierId: 'cashier_rashed', cashierName: 'Rashed khan', total: 100, paymentMethod: 'cash', status: 'completed' },
    { id: 'ord_6', cashierId: 'cashier_rashed', cashierName: 'Rashed khan', total: 500, paymentMethod: 'cash', status: 'completed' },
    { id: 'ord_7_other', cashierId: 'other_staff_id', cashierName: 'Other Staff', total: 450, paymentMethod: 'card', status: 'completed' },
    { id: 'ord_8_cancelled', cashierId: currentCashierId, total: 200, paymentMethod: 'cash', status: 'cancelled' },
  ];

  // All session scope: includes current cashier's orders + unassigned/mobile orders; excludes other cashier & cancelled
  const sessionOrders = orders.filter((o) => {
    if (o.status === 'cancelled' || o.status === 'draft') return false;
    if (o.cashierId && o.cashierId !== currentCashierId) return false;
    return true;
  });

  assert.equal(sessionOrders.length, 5);

  const totalGross = sessionOrders.reduce((sum, o) => sum + o.total, 0);
  assert.equal(totalGross, 1232); // 190 + 122 + 320 + 100 + 500

  const cashOrders = sessionOrders.filter((o) => o.paymentMethod === 'cash');
  const gcashOrders = sessionOrders.filter((o) => o.paymentMethod === 'gcash');

  assert.equal(cashOrders.length, 4);
  assert.equal(cashOrders.reduce((s, o) => s + o.total, 0), 912); // 190 + 122 + 100 + 500

  assert.equal(gcashOrders.length, 1);
  assert.equal(gcashOrders[0].total, 320);

  // Direct POS only scope: strictly matches current cashier
  const directOrders = orders.filter((o) => o.cashierId === currentCashierId && o.status === 'completed');
  assert.equal(directOrders.length, 2);
  assert.equal(directOrders.reduce((s, o) => s + o.total, 0), 600); // 100 + 500
});

