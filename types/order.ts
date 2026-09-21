// types/order.ts
export type FulfillmentStatus = 'processing' | 'shipped' | 'delivered';

export interface OrderItem {
  productId?: string;
  name: string;
  quantity: number;
  unitPrice: number; // cents
}

export interface ShippingAddress {
  name: string;
  line1: string | null;
  line2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
}

export interface Order {
  id: string; // Stripe Checkout Session ID
  paymentIntentId: string | null;
  customerEmail: string | null;
  customerName: string | null;
  shippingAddress: ShippingAddress | null;
  items: OrderItem[];
  amountSubtotal: number; // cents
  shippingAmount: number; // cents
  amountTotal: number; // cents
  currency: string;
  paymentStatus: string;
  fulfillmentStatus: FulfillmentStatus;
  createdAt: number; // epoch ms
}
