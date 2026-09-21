import Stripe from 'stripe';
import Link from 'next/link';
import ClearCartOnSuccess from '@/components/ClearCartOnSuccess';
import { Check } from 'lucide-react';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2026-08-26.dahlia',
});

interface SuccessPageProps {
  searchParams: Promise<{ session_id?: string }> | { session_id?: string };
}

export default async function SuccessPage(props: SuccessPageProps) {
  // Await searchParams defensively for both Promise and plain object formats
  const resolvedParams = await props.searchParams;
  const session_id = resolvedParams?.session_id;

  if (!session_id) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col items-center justify-center p-6 text-center font-serif">
        <h1 className="text-2xl font-light">No Order Session Found</h1>
        <p className="text-sm font-sans text-stone-500 mt-2">
          Could not locate a valid session ID in the query parameters.
        </p>
        <Link
          href="/"
          className="mt-6 px-6 py-2.5 bg-stone-900 text-stone-100 text-xs uppercase tracking-widest font-sans"
        >
          Return to Store
        </Link>
      </div>
    );
  }

  let session: Stripe.Checkout.Session;

  try {
    session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['line_items', 'customer_details'],
    });
  } catch (error: any) {
    console.error('Error retrieving Stripe checkout session:', error.message);
    return (
      <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col items-center justify-center p-6 text-center font-serif">
        <h1 className="text-2xl font-light">Unable to Retrieve Order</h1>
        <p className="text-sm font-sans text-stone-500 mt-2 max-w-md">
          {error.message || 'Payment succeeded, but session details could not be loaded.'}
        </p>
        <Link
          href="/"
          className="mt-6 px-6 py-2.5 bg-stone-900 text-stone-100 text-xs uppercase tracking-widest font-sans"
        >
          Return to Store
        </Link>
      </div>
    );
  }

  const customerName = session.customer_details?.name || 'Valued Collector';
  const customerEmail = session.customer_details?.email;
  const lineItems = session.line_items?.data || [];
  const totalAmount = session.amount_total ? session.amount_total / 100 : 0;

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 py-16 px-6 sm:px-12 font-serif">
      <ClearCartOnSuccess />

      <div className="max-w-2xl mx-auto border border-stone-200/80 bg-white/40 backdrop-blur-xs p-8 sm:p-12 shadow-xs">
        <header className="text-center space-y-3 pb-8 border-b border-stone-200/60">
          <div className="mx-auto w-10 h-10 rounded-full bg-stone-900 text-stone-50 flex items-center justify-center">
            <Check className="w-5 h-5 stroke-[1.5]" />
          </div>
          <span className="text-[11px] uppercase tracking-[0.25em] text-stone-400 font-sans block">
            Payment Confirmed
          </span>
          <h1 className="text-3xl font-light tracking-wide text-stone-900">
            Thank You, {customerName}
          </h1>
          <p className="text-xs font-sans text-stone-500 font-light max-w-sm mx-auto leading-relaxed">
            Your acquisition has been safely received. An itemized invoice has been dispatched to{' '}
            <span className="text-stone-800">{customerEmail}</span>.
          </p>
        </header>

        {/* Order Breakdown */}
        <section className="py-8 border-b border-stone-200/60 space-y-4">
          <h2 className="text-xs uppercase tracking-[0.2em] text-stone-400 font-sans">
            Acquired Works
          </h2>
          <div className="space-y-4 font-sans text-sm">
            {lineItems.map((item) => (
              <div key={item.id} className="flex justify-between items-baseline">
                <div>
                  <p className="font-serif text-stone-900 text-base">{item.description}</p>
                  <p className="text-xs text-stone-500 font-light">Quantity: {item.quantity}</p>
                </div>
                <span className="text-stone-800 font-mono text-xs">
                  £{((item.amount_total || 0) / 100).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Totals */}
        <section className="py-6 border-b border-stone-200/60 flex justify-between items-baseline font-sans">
          <span className="text-xs uppercase tracking-[0.2em] text-stone-500">Total Settled</span>
          <span className="text-lg font-serif text-stone-900">
            £{totalAmount.toFixed(2)}
          </span>
        </section>

        {/* Footer */}
        <footer className="pt-8 space-y-6 text-center font-sans">
          <p className="text-xs text-stone-500 font-light leading-relaxed">
            Each ceramic piece is prepared in cedar wood shavings and multi-ply acid-free paper to ensure safe passage.
          </p>
          <div>
            <Link
              href="/"
              className="inline-block px-8 py-3 bg-stone-900 text-stone-100 text-xs uppercase tracking-[0.2em] transition-colors duration-300 hover:bg-stone-700"
            >
              Return to Collection
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}