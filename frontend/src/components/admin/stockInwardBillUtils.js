import { formatPrice } from '../../utils/price';

export const formatStockInwardBillDate = (value) => {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
};

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const getStockInwardEntryItems = (entry = {}) => {
  if (Array.isArray(entry.items) && entry.items.length) {
    return entry.items.map((item, index) => ({
      id: item._id || `item-${index}`,
      productName: item.productName || item.product?.name || '-',
      quantity: Number(item.quantity || 0),
      costPrice: Number(item.costPrice || 0),
      lineTotal: Number(item.lineTotal || 0) || Number(item.quantity || 0) * Number(item.costPrice || 0),
    }));
  }

  if (entry.product) {
    return [{
      id: 'legacy-item',
      productName: entry.productName || entry.product?.name || '-',
      quantity: Number(entry.quantity || 0),
      costPrice: Number(entry.costPrice || 0),
      lineTotal: Number(entry.totalCost || 0) || Number(entry.quantity || 0) * Number(entry.costPrice || 0),
    }];
  }

  return [];
};

export const getStockInwardBillRows = (entry) => [
  ['Total Cost', entry.totalCost],
  ['Transport Charges', entry.transportCharges],
  ['Rent Charges', entry.rentCharges],
  ['Loading Charges', entry.loadingCharges],
  ['Other Charges', entry.otherCharges],
  ['Final Total', entry.finalTotalCost],
  ['Paid Amount', entry.paidAmount],
  ['Pending Amount', entry.pendingAmount],
];

export const buildStockInwardBillHtml = (entry) => {
  const invoiceRows = getStockInwardEntryItems(entry)
    .map(
      (item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(item.productName)}</td>
          <td>${escapeHtml(item.quantity)}</td>
          <td>${escapeHtml(formatPrice(item.costPrice))}</td>
          <td>${escapeHtml(formatPrice(item.lineTotal))}</td>
        </tr>
      `
    )
    .join('');

  const summaryRows = getStockInwardBillRows(entry)
    .map(
      ([label, value]) => `
        <tr>
          <td>${escapeHtml(label)}</td>
          <td>${escapeHtml(formatPrice(value))}</td>
        </tr>
      `
    )
    .join('');

  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>K.S. Sports Bill - ${escapeHtml(entry.billNumber || entry._id)}</title>
      <style>
        :root{color-scheme:light;}
        *{box-sizing:border-box;}
        body{margin:0;background:#f4f4f5;padding:24px;font-family:Arial,sans-serif;color:#111827;}
        .page{max-width:900px;margin:0 auto;background:#fff;border:1px solid #111827;border-radius:12px;overflow:hidden;}
        .head{padding:24px 28px;border-bottom:2px solid #111827;}
        .row{display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap;}
        .brand{font-size:30px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;}
        .sub{margin-top:4px;font-size:13px;color:#4b5563;text-transform:uppercase;letter-spacing:.12em;}
        .bill-title{margin-top:16px;display:inline-block;padding:8px 14px;border:1px solid #991b1b;background:#991b1b;color:#fff;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;}
        .meta{min-width:240px;border:1px solid #111827;padding:14px 16px;}
        .party-grid{display:grid;grid-template-columns:1fr 1fr;gap:0;border-top:1px solid #111827;border-left:1px solid #111827;}
        .cell{border-right:1px solid #111827;border-bottom:1px solid #111827;padding:12px 14px;}
        .label{font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#6b7280;}
        .value{margin-top:6px;font-size:14px;font-weight:700;color:#111827;}
        .section{padding:24px 28px;}
        table{width:100%;border-collapse:collapse;}
        th,td{border:1px solid #111827;padding:12px 14px;text-align:left;}
        th{background:#f3f4f6;font-size:11px;letter-spacing:.14em;text-transform:uppercase;}
        td{font-size:14px;}
        .summary-wrap{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:24px;align-items:start;}
        .notes{min-height:180px;border:1px solid #111827;padding:16px;}
        .signature{margin-top:24px;display:flex;justify-content:space-between;gap:20px;align-items:flex-end;flex-wrap:wrap;}
        .sig-box{min-width:220px;text-align:center;}
        .sig-line{height:1px;background:#111827;margin-bottom:10px;}
        .thanks{margin-top:18px;font-size:12px;color:#4b5563;text-transform:uppercase;letter-spacing:.12em;}
        @media print{body{padding:0;background:#fff;}.page{max-width:none;border:none;border-radius:0;}}
      </style>
    </head>
    <body>
      <div class="page">
        <div class="head">
          <div class="row">
            <div><div class="brand">K.S. Sports</div><div class="sub">Premium Athletic Goods</div><div class="bill-title">Stock Inward Bill / Purchase Bill</div></div>
            <div class="meta"><div class="label">Bill Number</div><div class="value">${escapeHtml(entry.billNumber || '-')}</div><div class="label" style="margin-top:14px;">Date</div><div class="value">${escapeHtml(formatStockInwardBillDate(entry.date))}</div></div>
          </div>
        </div>
        <div class="section"><div class="party-grid"><div class="cell"><div class="label">Supplier Name</div><div class="value">${escapeHtml(entry.supplierName || '-')}</div></div><div class="cell"><div class="label">Supplier Phone</div><div class="value">${escapeHtml(entry.supplierPhone || 'Not provided')}</div></div><div class="cell"><div class="label">Address</div><div class="value">Not provided</div></div><div class="cell"><div class="label">Payment Status</div><div class="value">${escapeHtml(entry.paymentStatus || '-')}</div></div></div></div>
        <div class="section" style="padding-top:0;"><table><thead><tr><th>Sr. No.</th><th>Product Name</th><th>Quantity</th><th>Rate</th><th>Amount</th></tr></thead><tbody>${invoiceRows}</tbody></table></div>
        <div class="section" style="padding-top:0;"><div class="summary-wrap"><div class="notes"><div class="label">Notes</div><div class="value">${escapeHtml(entry.notes || 'No additional notes')}</div><div class="thanks">Thank you for supporting K.S. Sports procurement operations.</div></div><table><tbody>${summaryRows}</tbody></table></div><div class="signature"><div style="font-size:12px;color:#4b5563;letter-spacing:.12em;text-transform:uppercase;">This is a system generated inward bill for inventory records.</div><div class="sig-box"><div class="sig-line"></div><div class="label">Authorized Signature</div></div></div></div>
      </div>
    </body>
  </html>`;
};
