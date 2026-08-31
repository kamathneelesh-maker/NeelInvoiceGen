'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useLayout } from '../../../layout';
import type { Client, Invoice, InvoiceItem, InvoiceItemFormData } from '@/lib/types';

export default function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { profile } = useLayout();
  const supabase = createClient();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mobileTab, setMobileTab] = useState<'edit' | 'preview'>('edit');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('draft');
  const [items, setItems] = useState<InvoiceItemFormData[]>([]);
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');
  const [discountValue, setDiscountValue] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [notes, setNotes] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    // Fetch clients
    const { data: clientData } = await supabase.from('clients').select('*').order('name');
    if (clientData) setClients(clientData);

    // Fetch invoice with items
    const { data: invoiceData } = await supabase
      .from('invoices')
      .select('*, client:clients(*), items:invoice_items(*)')
      .eq('id', id)
      .single();

    if (invoiceData) {
      setInvoice(invoiceData);
      setInvoiceNumber(invoiceData.invoice_number);
      setInvoiceDate(invoiceData.invoice_date);
      setDueDate(invoiceData.due_date);
      setStatus(invoiceData.status);
      setDiscountType((invoiceData.discount_type as 'fixed' | 'percentage') || 'fixed');
      setDiscountValue(invoiceData.discount_value || 0);
      setTaxRate(invoiceData.tax_rate || 0);
      setNotes(invoiceData.notes || '');
      setPaymentTerms(invoiceData.payment_terms || '');

      if (invoiceData.client) {
        setSelectedClient(invoiceData.client as Client);
      }

      const existingItems = (invoiceData.items as InvoiceItem[]) || [];
      if (existingItems.length > 0) {
        setItems(existingItems.sort((a, b) => a.sort_order - b.sort_order).map(item => ({
          id: item.id,
          service_name: item.service_name,
          description: item.description || '',
          quantity: item.quantity,
          unit_price: item.unit_price,
        })));
      } else {
        setItems([{ service_name: '', description: '', quantity: 1, unit: 'Hours', unit_price: 0 }]);
      }
    }

    setLoading(false);
  };

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const discountAmount = discountType === 'percentage' ? (subtotal * discountValue) / 100 : discountValue;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = (taxableAmount * taxRate) / 100;
  const total = taxableAmount + taxAmount;

  useEffect(() => {
    if (loading) return;

    const timer = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const payload = {
          profile,
          client: selectedClient,
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
        };
        const res = await fetch('/api/pdf/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          setPdfUrl(prev => {
            if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
            return url;
          });
        } else {
          const html = await res.text();
          let errorMessage = 'Check server logs';
          
          // Try to extract the error message from Next.js error overlay
          const match = html.match(/<title>(.*?)<\/title>/);
          if (match && match[1]) {
            errorMessage = match[1];
          } else {
            // Check for raw text if it's not HTML
            try {
              const j = JSON.parse(html);
              errorMessage = j.details || j.error || errorMessage;
            } catch (e) {
              errorMessage = html.slice(0, 500); // Raw text
            }
          }

          const errorHtml = `
            <html>
              <body style="font-family: sans-serif; padding: 20px; color: #ef4444; background: #fee2e2;">
                <h2>PDF Generation Failed</h2>
                <p><strong>Error:</strong> ${errorMessage}</p>
                <p style="font-size: 12px; margin-top: 20px;">If this is a module error, the server crashed during boot.</p>
              </body>
            </html>
          `;
          setPdfUrl(`data:text/html;charset=utf-8,${encodeURIComponent(errorHtml)}`);
        }
      } catch (err) {
        console.error('Failed to generate preview', err);
      } finally {
        setPreviewLoading(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [profile, selectedClient, invoiceNumber, invoiceDate, dueDate, items, subtotal, discountAmount, taxRate, taxAmount, total, notes, paymentTerms, loading]);

  const updateItem = (index: number, field: keyof InvoiceItemFormData, value: string | number) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const addItem = () => setItems(prev => [...prev, { service_name: '', description: '', quantity: 1, unit: 'Hours', unit_price: 0 }]);
  const removeItem = (index: number) => { if (items.length > 1) setItems(prev => prev.filter((_, i) => i !== index)); };

  const handleSave = async () => {
    if (!selectedClient) return;
    setSaving(true);

    await supabase
      .from('invoices')
      .update({
        client_id: selectedClient.id,
        invoice_number: invoiceNumber,
        invoice_date: invoiceDate,
        due_date: dueDate,
        status,
        subtotal,
        discount_type: discountValue > 0 ? discountType : null,
        discount_value: discountValue,
        discount_amount: discountAmount,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total,
        notes: notes || null,
        payment_terms: paymentTerms || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    // Delete old items and insert new ones
    await supabase.from('invoice_items').delete().eq('invoice_id', id);

    const itemsToInsert = items
      .filter(item => item.service_name)
      .map((item, index) => ({
        invoice_id: id,
        service_name: item.service_name,
        description: item.description || null,
        quantity: item.quantity,
        unit: item.unit || null,
        unit_price: item.unit_price,
        amount: item.quantity * item.unit_price,
        sort_order: index,
      }));

    if (itemsToInsert.length > 0) {
      await supabase.from('invoice_items').insert(itemsToInsert);
    }

    setSaving(false);
    router.push('/invoices');
  };

  const formatCurrency = useCallback((amount: number) => {
    const currency = profile?.currency || 'INR';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
  }, [profile]);

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    (c.company && c.company.toLowerCase().includes(clientSearch.toLowerCase()))
  );

  if (loading) {
    return <div><div className="skeleton skeleton-title" /><div className="skeleton skeleton-card" style={{ height: 400 }} /></div>;
  }

  if (!invoice) {
    return <div className="empty-state"><h3 className="empty-state-title">Invoice not found</h3></div>;
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <h2 className="section-title">Edit Invoice — {invoiceNumber}</h2>
          <p className="section-subtitle">Modify your invoice details</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <a href={`/api/invoices/${id}/pdf`} className="btn btn-primary" download>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7,10 12,15 17,10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download PDF
          </a>
        </div>
      </div>

      <div className="invoice-mobile-tabs tabs" style={{ marginBottom: 'var(--space-6)' }}>
        <button className={`tab ${mobileTab === 'edit' ? 'active' : ''}`} onClick={() => setMobileTab('edit')}>Edit</button>
        <button className={`tab ${mobileTab === 'preview' ? 'active' : ''}`} onClick={() => setMobileTab('preview')}>Preview</button>
      </div>

      <div className="invoice-editor-layout">
        <div className={mobileTab === 'preview' ? 'hide-on-mobile' : ''}>
          <div className="invoice-editor-panel">
            {/* Invoice Info */}
            <div className="card">
              <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-5)' }}>Invoice Information</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Invoice Number</label>
                    <input type="text" className="form-input" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-input form-select" value={status} onChange={e => setStatus(e.target.value)}>
                      <option value="draft">Draft</option>
                      <option value="sent">Sent</option>
                      <option value="paid">Paid</option>
                      <option value="overdue">Overdue</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Invoice Date</label>
                    <input type="date" className="form-input" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Due Date</label>
                    <input type="date" className="form-input" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>

            {/* Client */}
            <div className="card">
              <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-5)' }}>Client</h3>
              {selectedClient ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 'var(--font-weight-semibold)' }}>{selectedClient.name}</div>
                    {selectedClient.company && <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>{selectedClient.company}</div>}
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)' }}>{selectedClient.email}</div>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setSelectedClient(null); setClientSearch(''); }}>Change</button>
                </div>
              ) : (
                <div className="relative">
                  <input type="text" className="form-input" placeholder="Search clients..." value={clientSearch} onChange={e => { setClientSearch(e.target.value); setShowClientDropdown(true); }} onFocus={() => setShowClientDropdown(true)} />
                  {showClientDropdown && (
                    <div className="dropdown">
                      {filteredClients.map(client => (
                        <button key={client.id} className="dropdown-item" onClick={() => { setSelectedClient(client); setShowClientDropdown(false); }}>
                          <div><div style={{ fontWeight: 'var(--font-weight-medium)' }}>{client.name}</div></div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Line Items */}
            <div className="card">
              <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-5)' }}>Services / Items</h3>
              <div style={{ overflowX: 'auto' }}>
                <table className="line-items-table">
                  <thead><tr><th style={{ minWidth: 160 }}>Service</th><th style={{ minWidth: 120 }}>Description</th><th style={{ minWidth: 160 }}>Qty & Unit</th><th style={{ minWidth: 120 }}>Rate</th><th style={{ width: 100 }}>Amount</th><th style={{ width: 40 }}></th></tr></thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index}>
                        <td><input type="text" className="form-input" placeholder="Service name" value={item.service_name} onChange={e => updateItem(index, 'service_name', e.target.value)} /></td>
                        <td><input type="text" className="form-input" placeholder="Description" value={item.description} onChange={e => updateItem(index, 'description', e.target.value)} /></td>
                        <td>
                          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                            <input type="number" className="form-input" style={{ padding: 'var(--space-2) var(--space-3)', width: '70px' }} min="0" value={item.quantity} onChange={e => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)} />
                            <select className="form-input" style={{ padding: 'var(--space-2) var(--space-1)', flex: 1 }} value={item.unit || ''} onChange={e => updateItem(index, 'unit', e.target.value)}>
                              <option value="">-</option>
                              <option value="Hours">Hours</option>
                              <option value="Days">Days</option>
                              <option value="Month">Month</option>
                              <option value="Project">Project</option>
                              <option value="Designs">Designs</option>
                              <option value="Concepts">Concepts</option>
                              <option value="Articles">Articles</option>
                              <option value="Videos">Videos</option>
                              <option value="Sessions">Sessions</option>
                              <option value="Units">Units</option>
                              <option value="Pieces">Pieces</option>
                              <option value="KM">KM</option>
                              <option value="Visits">Visits</option>
                              <option value="Participants">Participants</option>
                              <option value="Impressions">Impressions</option>
                            </select>
                          </div>
                        </td>
                        <td><input type="number" className="form-input" style={{ padding: 'var(--space-2) var(--space-3)' }} min="0" value={item.unit_price} onChange={e => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)} /></td>
                        <td className="line-item-amount">{formatCurrency(item.quantity * item.unit_price)}</td>
                        <td>{items.length > 1 && <button className="line-item-remove" onClick={() => removeItem(index)}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg></button>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button className="btn btn-ghost" onClick={addItem} style={{ marginTop: 'var(--space-4)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                Add Service
              </button>
            </div>

            {/* Calculations */}
            <div className="card">
              <div className="invoice-summary">
                <div className="invoice-summary-row"><span style={{ color: 'var(--color-text-secondary)' }}>Subtotal</span><span className="amount">{formatCurrency(subtotal)}</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--color-text-secondary)', minWidth: 70 }}>Discount</span>
                  <select className="form-input form-select" style={{ width: 'auto', padding: 'var(--space-2) var(--space-8) var(--space-2) var(--space-3)', fontSize: 'var(--font-size-sm)' }} value={discountType} onChange={e => setDiscountType(e.target.value as 'fixed' | 'percentage')}>
                    <option value="fixed">Fixed (₹)</option><option value="percentage">Percentage (%)</option>
                  </select>
                  <input type="number" className="form-input" style={{ width: 100, padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--font-size-sm)' }} min="0" value={discountValue} onChange={e => setDiscountValue(parseFloat(e.target.value) || 0)} />
                  {discountAmount > 0 && <span style={{ marginLeft: 'auto', color: 'var(--color-error)' }}>-{formatCurrency(discountAmount)}</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <span style={{ color: 'var(--color-text-secondary)', minWidth: 70 }}>Tax (%)</span>
                  <input type="number" className="form-input" style={{ width: 80, padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--font-size-sm)' }} min="0" max="100" value={taxRate} onChange={e => setTaxRate(parseFloat(e.target.value) || 0)} />
                  {taxAmount > 0 && <span style={{ marginLeft: 'auto', color: 'var(--color-text-secondary)' }}>+{formatCurrency(taxAmount)}</span>}
                </div>
                <div className="invoice-summary-row total"><span>Grand Total</span><span>{formatCurrency(total)}</span></div>
              </div>
            </div>

            {/* Notes */}
            <div className="card">
              <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-5)' }}>Additional Information</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div className="form-group"><label className="form-label">Notes</label><textarea className="form-input form-textarea" value={notes} onChange={e => setNotes(e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Payment Terms</label><textarea className="form-input form-textarea" value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} /></div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
              <Link href="/invoices" className="btn btn-secondary">Cancel</Link>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving || !selectedClient}>
                {saving ? <><span className="spinner" /> Saving...</> : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>

        <div className={mobileTab === 'edit' ? 'hide-on-mobile' : ''}>
          <div className="invoice-preview-panel" style={{ height: '100%', minHeight: '800px', display: 'flex', flexDirection: 'column', backgroundColor: '#f3f4f6', borderRadius: 'var(--radius-lg)' }}>
            {previewLoading && !pdfUrl && (
              <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <span className="spinner" style={{ marginRight: 'var(--space-2)' }} /> Generating PDF Preview...
              </div>
            )}
            {pdfUrl && (
              <object 
                data={pdfUrl.startsWith('data:') ? pdfUrl : `${pdfUrl}#view=FitH`} 
                type={pdfUrl.startsWith('data:') ? "text/html" : "application/pdf"}
                style={{ width: '100%', height: '100%', flex: 1, border: 'none', borderRadius: 'var(--radius-lg)' }} 
              >
                <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
                  <p>Your browser does not support inline PDFs.</p>
                  <a href={pdfUrl} download="invoice-preview.pdf" className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }}>Download Preview</a>
                </div>
              </object>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
