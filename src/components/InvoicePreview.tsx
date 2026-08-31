import type { Profile, Client, InvoiceItemFormData } from '@/lib/types';

interface InvoicePreviewProps {
  profile: Profile | null;
  client: Client | null;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  items: InvoiceItemFormData[];
  subtotal: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes: string;
  paymentTerms: string;
  formatCurrency: (amount: number) => string;
}

export default function InvoicePreview({
  profile,
  client,
  invoiceNumber,
  invoiceDate,
  dueDate,
  items,
  subtotal,
  discountAmount,
  taxRate,
  taxAmount,
  total,
  notes,
  paymentTerms,
  formatCurrency,
}: InvoicePreviewProps) {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const validItems = items.filter(i => i.service_name);

  return (
    <div className="invoice-preview-container">
      <div className="invoice-preview-inner">
        {/* Header */}
        <div className="preview-header">
          <div>
            <div className="preview-business-name">
              {profile?.business_name || 'Your Business'}
            </div>
            <div className="preview-business-detail">
              {profile?.business_address && <>{profile.business_address}<br /></>}
              {profile?.business_email && <>{profile.business_email}<br /></>}
              {profile?.business_phone && <>{profile.business_phone}<br /></>}
              {profile?.tax_number && <>GST: {profile.tax_number}</>}
            </div>
          </div>
          <div>
            <div className="preview-invoice-title">INVOICE</div>
            <div className="preview-invoice-meta">
              <strong>{invoiceNumber || 'INV-0001'}</strong><br />
              Date: {formatDate(invoiceDate)}<br />
              Due: {formatDate(dueDate)}
            </div>
          </div>
        </div>

        {/* Bill To */}
        <div className="preview-parties">
          <div>
            <div className="preview-party-label">Bill To</div>
            {client ? (
              <>
                <div className="preview-party-name">{client.name}</div>
                <div className="preview-party-detail">
                  {client.company && <>{client.company}<br /></>}
                  {client.address && <>{client.address}<br /></>}
                  {client.city && client.state && <>{client.city}, {client.state}<br /></>}
                  {client.email}<br />
                  {client.tax_id && <>Tax ID: {client.tax_id}</>}
                </div>
              </>
            ) : (
              <div className="preview-party-detail" style={{ color: '#ccc', fontStyle: 'italic' }}>
                Select a client...
              </div>
            )}
          </div>
        </div>

        {/* Items Table */}
        {validItems.length > 0 ? (
          <table className="preview-items-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Description</th>
                <th>Qty</th>
                <th>Rate</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {validItems.map((item, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 500 }}>{item.service_name}</td>
                  <td>{item.description || '—'}</td>
                  <td>{item.quantity}{item.unit ? ' ' + item.unit : ''}</td>
                  <td>{formatCurrency(item.unit_price)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>
                    {formatCurrency(item.quantity * item.unit_price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: '20px 0', textAlign: 'center', color: '#ccc', fontStyle: 'italic', fontSize: '10px' }}>
            Add line items to preview...
          </div>
        )}

        {/* Summary */}
        <div className="preview-summary">
          <div className="preview-summary-table">
            <div className="preview-summary-row">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="preview-summary-row">
                <span>Discount</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            {taxRate > 0 && (
              <div className="preview-summary-row">
                <span>Tax ({taxRate}%)</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
            )}
            <div className="preview-summary-row total">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="preview-footer">
          {paymentTerms && (
            <div style={{ marginBottom: 8 }}>
              <strong>Payment Terms:</strong> {paymentTerms}
            </div>
          )}
          {profile?.bank_account_name && (
            <div style={{ marginBottom: 8 }}>
              <strong>Bank Details:</strong><br />
              {profile.bank_account_name} — {profile.bank_name}<br />
              A/C: {profile.bank_account_number}
              {profile.bank_ifsc && <> | IFSC: {profile.bank_ifsc}</>}
              {profile.bank_upi_id && <><br />UPI: {profile.bank_upi_id}</>}
            </div>
          )}
          {notes && <div>{notes}</div>}
        </div>
      </div>
    </div>
  );
}
