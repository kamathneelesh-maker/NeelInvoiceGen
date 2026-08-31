'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useLayout } from '../layout';
import type { Invoice } from '@/lib/types';

export default function InvoicesPage() {
  const router = useRouter();
  const { profile } = useLayout();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    const { data } = await supabase
      .from('invoices')
      .select('*, client:clients(name, company)')
      .order('created_at', { ascending: false });

    if (data) setInvoices(data);
    setLoading(false);
  };

  const formatCurrency = useCallback((amount: number) => {
    const currency = profile?.currency || 'INR';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  }, [profile]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleDuplicate = async (invoice: Invoice) => {
    setOpenMenuId(null);
    // Get next invoice number
    const prefix = profile?.invoice_prefix || 'INV-';
    const lastNum = parseInt(invoice.invoice_number.replace(/\D/g, '')) || 0;
    const newNumber = `${prefix}${String(lastNum + 1).padStart(4, '0')}`;

    // Fetch items from original invoice
    const { data: items } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoice.id);

    // Create duplicate invoice
    const { data: newInvoice } = await supabase
      .from('invoices')
      .insert({
        client_id: invoice.client_id,
        invoice_number: newNumber,
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: invoice.due_date,
        status: 'draft',
        subtotal: invoice.subtotal,
        discount_type: invoice.discount_type,
        discount_value: invoice.discount_value,
        discount_amount: invoice.discount_amount,
        tax_rate: invoice.tax_rate,
        tax_amount: invoice.tax_amount,
        total: invoice.total,
        notes: invoice.notes,
        payment_terms: invoice.payment_terms,
      })
      .select()
      .single();

    if (newInvoice && items) {
      const newItems = items.map(item => ({
        invoice_id: newInvoice.id,
        service_name: item.service_name,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: item.amount,
        sort_order: item.sort_order,
      }));
      await supabase.from('invoice_items').insert(newItems);
    }

    fetchInvoices();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await supabase.from('invoices').delete().eq('id', deleteTarget.id);
    setDeleteTarget(null);
    fetchInvoices();
  };

  const handleStatusChange = async (invoiceId: string, newStatus: string) => {
    setOpenMenuId(null);
    await supabase.from('invoices').update({ status: newStatus }).eq('id', invoiceId);
    fetchInvoices();
  };

  const filtered = invoices
    .filter(i => statusFilter === 'all' || i.status === statusFilter)
    .filter(i =>
      i.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      (i.client as unknown as { name: string })?.name?.toLowerCase().includes(search.toLowerCase())
    );

  if (loading) {
    return (
      <div>
        <div className="skeleton skeleton-title" />
        {[1, 2, 3].map(i => (
          <div key={i} className="skeleton skeleton-card" style={{ marginBottom: 'var(--space-3)' }} />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <h2 className="section-title">Invoices</h2>
          <p className="section-subtitle">Manage and track your invoices</p>
        </div>
        <Link href="/invoices/create" className="btn btn-primary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Create Invoice
        </Link>
      </div>

      {invoices.length > 0 && (
        <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
          <div className="search-input-wrapper" style={{ flex: 1, minWidth: 200 }}>
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Search invoices..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="tabs" style={{ border: 'none' }}>
            {['all', 'draft', 'sent', 'paid', 'overdue'].map(status => (
              <button
                key={status}
                className={`tab ${statusFilter === status ? 'active' : ''}`}
                onClick={() => setStatusFilter(status)}
                style={{ textTransform: 'capitalize' }}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 && !search && statusFilter === 'all' ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14,2 14,8 20,8" />
            </svg>
          </div>
          <h3 className="empty-state-title">No invoices yet</h3>
          <p className="empty-state-description">Create your first invoice to get started.</p>
          <Link href="/invoices/create" className="btn btn-primary">Create Your First Invoice</Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <h3 className="empty-state-title">No results</h3>
          <p className="empty-state-description">No invoices match your filters.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Client</th>
                <th>Date</th>
                <th>Due Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(invoice => (
                <tr key={invoice.id}>
                  <td>
                    <Link href={`/invoices/${invoice.id}/edit`} style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                      {invoice.invoice_number}
                    </Link>
                  </td>
                  <td style={{ color: 'var(--color-text-secondary)' }}>
                    {(invoice.client as unknown as { name: string })?.name || '—'}
                  </td>
                  <td style={{ color: 'var(--color-text-secondary)' }}>{formatDate(invoice.invoice_date)}</td>
                  <td style={{ color: 'var(--color-text-secondary)' }}>{formatDate(invoice.due_date)}</td>
                  <td className="amount">{formatCurrency(invoice.total || 0)}</td>
                  <td><span className={`badge badge-${invoice.status}`}>{invoice.status}</span></td>
                  <td>
                    <div className="actions-menu">
                      <button
                        className="actions-menu-btn"
                        onClick={() => setOpenMenuId(openMenuId === invoice.id ? null : invoice.id)}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <circle cx="12" cy="5" r="1" />
                          <circle cx="12" cy="12" r="1" />
                          <circle cx="12" cy="19" r="1" />
                        </svg>
                      </button>
                      {openMenuId === invoice.id && (
                        <div className="actions-dropdown">
                          <Link
                            href={`/invoices/${invoice.id}/edit`}
                            className="actions-dropdown-item"
                            onClick={() => setOpenMenuId(null)}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            Edit
                          </Link>
                          <button className="actions-dropdown-item" onClick={() => handleDuplicate(invoice)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                            </svg>
                            Duplicate
                          </button>
                          {invoice.status === 'draft' && (
                            <button className="actions-dropdown-item" onClick={() => handleStatusChange(invoice.id, 'sent')}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <line x1="22" y1="2" x2="11" y2="13" />
                                <polygon points="22,2 15,22 11,13 2,9" />
                              </svg>
                              Mark as Sent
                            </button>
                          )}
                          {invoice.status !== 'paid' && (
                            <button className="actions-dropdown-item" onClick={() => handleStatusChange(invoice.id, 'paid')}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                                <polyline points="22,4 12,14.01 9,11.01" />
                              </svg>
                              Mark as Paid
                            </button>
                          )}
                          <button
                            className="actions-dropdown-item danger"
                            onClick={() => { setOpenMenuId(null); setDeleteTarget(invoice); }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <polyline points="3,6 5,6 21,6" />
                              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Delete Invoice?</h3>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--color-text-secondary)' }}>
                Are you sure you want to delete <strong style={{ color: 'var(--color-text-primary)' }}>{deleteTarget.invoice_number}</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete Invoice</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
