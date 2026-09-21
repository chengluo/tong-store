// app/admin/orders/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatOrderReference } from '@/lib/orderRef';
import type { Order, FulfillmentStatus } from '@/types/order';

const STATUS_OPTIONS: FulfillmentStatus[] = ['processing', 'shipped', 'delivered'];

const STATUS_STYLES: Record<FulfillmentStatus, string> = {
  processing: 'bg-amber-50 text-amber-700 border-amber-200',
  shipped: 'bg-blue-50 text-blue-700 border-blue-200',
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const PAYMENT_STYLES: Record<string, string> = {
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  unpaid: 'bg-red-50 text-red-700 border-red-200',
  no_payment_required: 'bg-stone-100 text-stone-600 border-stone-200',
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId: string, fulfillmentStatus: FulfillmentStatus) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, fulfillmentStatus }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, fulfillmentStatus } : o))
        );
      } else {
        alert('Failed to update order status');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const formatAddress = (order: Order) => {
    const addr = order.shippingAddress;
    if (!addr) return '—';
    const lines = [addr.line1, addr.line2, addr.city, addr.state, addr.postalCode, addr.country].filter(Boolean);
    return lines.join(', ');
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 py-12 px-6 sm:px-12 max-w-7xl mx-auto font-sans">
      <header className="border-b border-stone-200/80 pb-6 mb-10 flex items-center justify-between">
        <div>
          <span className="text-xs tracking-[0.25em] uppercase text-stone-400">Order Management</span>
          <h1 className="font-serif text-3xl font-light mt-1">Customer Orders</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="text-xs uppercase tracking-widest border border-stone-300 px-4 py-2 hover:bg-stone-900 hover:text-white transition"
          >
            Inventory
          </Link>
          <Link
            href="/"
            className="text-xs uppercase tracking-widest border border-stone-300 px-4 py-2 hover:bg-stone-900 hover:text-white transition"
          >
            Storefront
          </Link>
        </div>
      </header>

      {loading ? (
        <p className="text-xs text-stone-400 italic py-12 text-center font-serif">Loading orders...</p>
      ) : orders.length === 0 ? (
        <p className="text-xs text-stone-400 italic py-12 text-center font-serif">No orders yet.</p>
      ) : (
        <div className="bg-white border border-stone-200/80 shadow-xs overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[900px]">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/50 uppercase tracking-wider text-[10px] text-stone-500">
                <th className="py-3 px-4">Order</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Shipping Address</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Fulfillment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {orders.map((order) => (
                <tr key={order.id} className="align-top hover:bg-stone-50/80 transition">
                  <td className="py-3 px-4">
                    <p className="font-mono text-stone-900">{formatOrderReference(order.id)}</p>
                    <p className="text-[10px] text-stone-400 mt-0.5">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-stone-900">{order.customerName || '—'}</p>
                    <p className="text-[10px] text-stone-400 mt-0.5">{order.customerEmail || '—'}</p>
                  </td>
                  <td className="py-3 px-4 max-w-[220px]">
                    <p className="text-stone-600">{formatAddress(order)}</p>
                  </td>
                  <td className="py-3 px-4 max-w-[220px]">
                    {order.items.map((item, i) => (
                      <p key={i} className="text-stone-600">
                        {item.quantity}&times; {item.name}
                      </p>
                    ))}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-stone-900 whitespace-nowrap">
                    £{(order.amountTotal / 100).toFixed(2)}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block text-[9px] uppercase tracking-wider px-1.5 py-0.5 border rounded-xs ${
                        PAYMENT_STYLES[order.paymentStatus] || 'bg-stone-100 text-stone-600 border-stone-200'
                      }`}
                    >
                      {order.paymentStatus.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={order.fulfillmentStatus}
                      disabled={updatingId === order.id}
                      onChange={(e) =>
                        handleStatusChange(order.id, e.target.value as FulfillmentStatus)
                      }
                      className={`text-[10px] uppercase tracking-wider px-2 py-1 border rounded-xs outline-hidden disabled:opacity-50 ${STATUS_STYLES[order.fulfillmentStatus]}`}
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
