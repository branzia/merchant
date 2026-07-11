/**
 * PDF-based order receipt printing — see CLAUDE.md "Order Printing". Built
 * entirely from OrderObject + MerchantObject, no API calls.
 *
 * Opens the OS print dialog (expo-print), which works with any configured
 * printer — including a real thermal printer via a print-service app — and
 * always offers "Save as PDF" as a destination.
 */
import * as Print from 'expo-print';

function money(symbol: string, amount: number): string {
  return `${symbol}${Number(amount).toFixed(2)}`;
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const STYLES = `
  <style>
    * { box-sizing: border-box; font-family: -apple-system, Roboto, Helvetica, Arial, sans-serif; }
    body { padding: 28px; color: #111; }
    .muted { color: #666; font-size: 13px; }
    .divider { border-top: 1px solid #ddd; margin: 14px 0; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    td { padding: 5px 0; vertical-align: top; }
    .right { text-align: right; }
    .total td { font-weight: bold; font-size: 16px; border-top: 1px solid #111; padding-top: 8px; }
    .badge { display: inline-block; padding: 6px 14px; border: 2px solid #111; border-radius: 6px; font-weight: bold; font-size: 16px; margin-top: 10px; letter-spacing: 1px; }
    .label-title { text-align: center; font-size: 13px; font-weight: bold; letter-spacing: 2px; color: #444; border: 1px solid #111; border-radius: 4px; padding: 6px; margin-bottom: 16px; }
    .cols { display: flex; gap: 24px; }
    .col { flex: 1; }
    .col-title { font-size: 11px; font-weight: bold; color: #888; letter-spacing: 1px; margin-bottom: 4px; }
    th { text-align: left; font-size: 11px; color: #888; letter-spacing: 0.5px; border-bottom: 1px solid #111; padding-bottom: 6px; }
    th.right { text-align: right; }
    .item-row td { border-bottom: 1px solid #eee; padding: 8px 0; }
    .cod-box { border: 2px solid #111; border-radius: 8px; padding: 14px; margin-top: 16px; display: flex; justify-content: space-between; align-items: center; background: #fafafa; }
    .cod-box .amount { font-size: 22px; font-weight: bold; }
    .ref { text-align: center; font-size: 11px; color: #999; margin-top: 20px; letter-spacing: 1px; }
  </style>
`;

function buildInvoiceHtml(order: any, merchant: any): string {
  const symbol = merchant?.currency_symbol ?? '';
  const items = order.items ?? [];
  const isCodDue = order.payment_method === 'cod' && order.payment_status !== 'paid';

  const rows = items
    .map(
      (item: any) => `
        <tr class="item-row">
          <td>${escapeHtml(item.product_name)}</td>
          <td class="right">${item.quantity}</td>
          <td class="right">${money(symbol, item.price)}</td>
          <td class="right">${money(symbol, item.subtotal)}</td>
        </tr>
      `,
    )
    .join('');

  return `
    <html><head><meta charset="utf-8">${STYLES}</head><body>
      <div class="label-title">INVOICE-CUM-SHIPPING LABEL</div>

      <div class="cols">
        <div class="col">
          <div class="col-title">SOLD BY</div>
          <div><strong>${escapeHtml(merchant?.shop_name)}</strong></div>
          ${merchant?.address ? `<div class="muted">${escapeHtml(merchant.address)}</div>` : ''}
          ${merchant?.phone ? `<div class="muted">${escapeHtml(merchant.phone)}</div>` : ''}
        </div>
        <div class="col">
          <div class="col-title">SHIP TO</div>
          <div><strong>${escapeHtml(order.customer_name)}</strong></div>
          <div class="muted">${escapeHtml(order.customer_phone)}</div>
          ${order.customer_address ? `<div class="muted">${escapeHtml(order.customer_address)}</div>` : ''}
        </div>
      </div>

      <div class="divider"></div>

      <div class="cols">
        <div class="col">
          <div class="col-title">ORDER</div>
          <div><strong>#${escapeHtml(order.id)}</strong></div>
          <div class="muted">${escapeHtml(new Date(order.created_at).toLocaleString())}</div>
        </div>
        <div class="col">
          <div class="col-title">FULFILMENT</div>
          <div class="badge">${order.order_type === 'pickup' ? 'PICKUP' : 'DELIVERY'}</div>
        </div>
      </div>

      <div class="divider"></div>

      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th class="right">Qty</th>
            <th class="right">Price</th>
            <th class="right">Amount</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <table style="margin-top: 10px;">
        <tr><td>Subtotal</td><td class="right">${money(symbol, order.subtotal)}</td></tr>
        ${Number(order.delivery_charge) > 0 ? `<tr><td>Delivery</td><td class="right">${money(symbol, order.delivery_charge)}</td></tr>` : ''}
        <tr class="total"><td>Total</td><td class="right">${money(symbol, order.total)}</td></tr>
      </table>

      ${
        isCodDue
          ? `<div class="cod-box"><span>💰 CASH ON DELIVERY — amount to collect</span><span class="amount">${money(symbol, order.total)}</span></div>`
          : `<div class="muted" style="margin-top: 12px;">Payment: ${escapeHtml(String(order.payment_method ?? '').toUpperCase())} — ${escapeHtml(String(order.payment_status ?? '').toUpperCase())}</div>`
      }

      <div class="ref">ORDER REF: ${escapeHtml(order.confirmation_token)}</div>
    </body></html>
  `;
}

/** Opens the OS print dialog — any configured printer, or "Save as PDF". */
export async function printReceipt(order: any, merchant: any): Promise<void> {
  await Print.printAsync({ html: buildInvoiceHtml(order, merchant) });
}
