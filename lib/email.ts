import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface OrderEmailItem {
  name: string;
  quantity: number;
  unitPrice: number; // cents
  careInstructions?: string[];
}

interface OrderConfirmationEmailParams {
  to: string;
  orderId: string;
  items: OrderEmailItem[];
  totalCents: number;
}

export async function sendOrderConfirmationEmail({
  to,
  orderId,
  items,
  totalCents,
}: OrderConfirmationEmailParams) {
  if (!resend) {
    console.warn('RESEND_API_KEY not set — skipping order confirmation email.');
    return;
  }

  const itemsHtml = items
    .map((item) => {
      const care = item.careInstructions?.length
        ? `<ul style="margin:6px 0 0;padding-left:18px;color:#78716C;font-size:12px;line-height:1.5;">${item.careInstructions
            .map((instruction) => `<li>${instruction}</li>`)
            .join('')}</ul>`
        : '';
      return `
        <tr>
          <td style="padding:14px 0;border-bottom:1px solid #E7E3DC;vertical-align:top;">
            <p style="margin:0;font-size:14px;color:#1C1917;">${item.quantity}&times; ${item.name}</p>
            ${care}
          </td>
          <td style="padding:14px 0;border-bottom:1px solid #E7E3DC;text-align:right;white-space:nowrap;font-family:monospace;font-size:14px;color:#1C1917;vertical-align:top;">
            $${((item.unitPrice * item.quantity) / 100).toFixed(2)}
          </td>
        </tr>`;
    })
    .join('');

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1C1917;background:#FAF8F5;padding:32px;">
      <h1 style="font-weight:300;font-size:22px;margin:0 0 4px;">Thank you for your order</h1>
      <p style="color:#78716C;font-size:12px;letter-spacing:0.05em;margin:0 0 24px;">Order Reference: ${orderId}</p>
      <table style="width:100%;border-collapse:collapse;">
        ${itemsHtml}
      </table>
      <p style="text-align:right;font-weight:600;margin-top:16px;font-family:monospace;font-size:14px;">
        Total Paid: $${(totalCents / 100).toFixed(2)}
      </p>
      <p style="color:#78716C;font-size:12px;margin-top:32px;line-height:1.6;">
        Please retain this email as your receipt. Care instructions for each piece are listed above —
        we recommend keeping them close during unboxing.
      </p>
    </div>
  `;

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Komorebi Kiln <onboarding@resend.dev>',
      to,
      subject: `Your Order Confirmation — ${orderId}`,
      html,
    });
  } catch (err) {
    console.error('Failed to send order confirmation email:', err);
  }
}
