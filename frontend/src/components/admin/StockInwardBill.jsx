import { Building2, Phone, ReceiptText } from 'lucide-react';
import { formatPrice } from '../../utils/price';
import {
  formatStockInwardBillDate,
  getStockInwardBillRows,
  getStockInwardEntryItems,
} from './stockInwardBillUtils';

const StockInwardBill = ({ entry, className = '' }) => {
  if (!entry) {
    return null;
  }

  const items = getStockInwardEntryItems(entry);

  return (
    <div className={`stock-inward-bill-root ${className}`}>
      <div className="stock-inward-bill-sheet">
        <div className="stock-inward-bill-header">
          <div className="stock-inward-bill-brand">
            <div className="stock-inward-bill-badge">Purchase Bill</div>
            <h2 className="stock-inward-bill-brand-name">K.S. Sports</h2>
            <p className="stock-inward-bill-brand-subtitle">Premium Athletic Goods</p>
            <div className="stock-inward-bill-title">Stock Inward Bill / Purchase Bill</div>
          </div>

          <div className="stock-inward-bill-meta">
            <div className="stock-inward-bill-meta-item">
              <span className="stock-inward-bill-label">Bill Number</span>
              <span className="stock-inward-bill-value">{entry.billNumber || '-'}</span>
            </div>
            <div className="stock-inward-bill-meta-item">
              <span className="stock-inward-bill-label">Date</span>
              <span className="stock-inward-bill-value">{formatStockInwardBillDate(entry.date)}</span>
            </div>
          </div>
        </div>

        <div className="stock-inward-bill-grid">
          <div className="stock-inward-bill-cell"><span className="stock-inward-bill-label">Supplier Name</span><span className="stock-inward-bill-value">{entry.supplierName || '-'}</span></div>
          <div className="stock-inward-bill-cell"><span className="stock-inward-bill-label">Supplier Phone</span><span className="stock-inward-bill-value">{entry.supplierPhone || 'Not provided'}</span></div>
          <div className="stock-inward-bill-cell"><span className="stock-inward-bill-label">Address</span><span className="stock-inward-bill-value">Not provided</span></div>
          <div className="stock-inward-bill-cell"><span className="stock-inward-bill-label">Payment Status</span><span className="stock-inward-bill-value">{entry.paymentStatus || '-'}</span></div>
        </div>

        <div className="stock-inward-bill-table-wrap">
          <table className="stock-inward-bill-table">
            <thead>
              <tr><th>Sr. No.</th><th>Product Name</th><th>Quantity</th><th>Rate</th><th>Amount</th></tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td>{item.productName}</td>
                  <td>{item.quantity}</td>
                  <td>{formatPrice(item.costPrice)}</td>
                  <td>{formatPrice(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="stock-inward-bill-summary">
          <div className="stock-inward-bill-notes">
            <div className="stock-inward-bill-notes-head">
              <div className="stock-inward-bill-notes-icon"><ReceiptText size={18} /></div>
              <div><p className="stock-inward-bill-label">Notes</p><p className="stock-inward-bill-copy">{entry.notes || 'No additional notes'}</p></div>
            </div>

            <div className="stock-inward-bill-party-pills">
              <div className="stock-inward-bill-pill"><Building2 size={14} /><span>{entry.supplierName || 'Supplier'}</span></div>
              <div className="stock-inward-bill-pill"><Phone size={14} /><span>{entry.supplierPhone || 'Phone not provided'}</span></div>
            </div>

            <p className="stock-inward-bill-thanks">Thank you for supporting K.S. Sports procurement operations.</p>
          </div>

          <div className="stock-inward-bill-totals">
            {getStockInwardBillRows(entry).map(([label, value]) => (
              <div key={label} className={`stock-inward-bill-total-row ${label === 'Final Total' ? 'stock-inward-bill-total-row-strong' : ''}`}>
                <span>{label}</span>
                <span>{formatPrice(value)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="stock-inward-bill-footer">
          <p className="stock-inward-bill-business-note">This is a system generated inward bill for inventory records.</p>
          <div className="stock-inward-bill-signature"><div className="stock-inward-bill-signature-line"></div><span className="stock-inward-bill-label">Authorized Signature</span></div>
        </div>
      </div>
    </div>
  );
};

export default StockInwardBill;
