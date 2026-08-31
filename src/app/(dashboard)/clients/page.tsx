'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Client } from '@/lib/types';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: '', company: '', email: '', phone: '',
    address: '', city: '', state: '', country: '', zip_code: '', tax_id: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    const { data } = await supabase
      .from('clients')
      .select('*, invoices:invoices(count)')
      .order('created_at', { ascending: false });

    if (data) {
      const clientsWithCount = data.map(c => ({
        ...c,
        invoice_count: (c.invoices as unknown as { count: number }[])?.[0]?.count || 0,
      }));
      setClients(clientsWithCount);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      name: '', company: '', email: '', phone: '',
      address: '', city: '', state: '', country: '', zip_code: '', tax_id: '',
    });
    setFormErrors({});
    setEditingClient(null);
  };

  const openAddForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name || '',
      company: client.company || '',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      city: client.city || '',
      state: client.state || '',
      country: client.country || '',
      zip_code: client.zip_code || '',
      tax_id: client.tax_id || '',
    });
    setFormErrors({});
    setShowForm(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Client name is required.';
    if (!formData.email.trim()) errors.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      errors.email = 'Please enter a valid email.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);

    if (editingClient) {
      await supabase
        .from('clients')
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingClient.id);
    } else {
      await supabase.from('clients').insert(formData);
    }

    setSaving(false);
    setShowForm(false);
    resetForm();
    fetchClients();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await supabase.from('clients').delete().eq('id', deleteTarget.id);
    setDeleteTarget(null);
    fetchClients();
  };

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.company && c.company.toLowerCase().includes(search.toLowerCase())) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  if (loading) {
    return (
      <div>
        <div className="section-header">
          <div className="skeleton skeleton-title" />
        </div>
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
          <h2 className="section-title">Clients</h2>
          <p className="section-subtitle">Manage your client information</p>
        </div>
        <button className="btn btn-primary" onClick={openAddForm}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Client
        </button>
      </div>

      {clients.length > 0 && (
        <div className="search-input-wrapper" style={{ marginBottom: 'var(--space-6)' }}>
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search clients..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      )}

      {filteredClients.length === 0 && !search ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
          </div>
          <h3 className="empty-state-title">No clients yet</h3>
          <p className="empty-state-description">Add your first client to start creating invoices for them.</p>
          <button className="btn btn-primary" onClick={openAddForm}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Your First Client
          </button>
        </div>
      ) : filteredClients.length === 0 && search ? (
        <div className="empty-state">
          <h3 className="empty-state-title">No results found</h3>
          <p className="empty-state-description">No clients match &quot;{search}&quot;. Try a different search term.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Invoices</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map(client => (
                <tr key={client.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <div className="client-avatar" style={{ width: 36, height: 36, fontSize: 'var(--font-size-xs)', borderRadius: 'var(--radius-md)' }}>
                        {getInitials(client.name)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 'var(--font-weight-semibold)' }}>{client.name}</div>
                        {client.company && (
                          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>{client.company}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--color-text-secondary)' }}>{client.email}</td>
                  <td style={{ color: 'var(--color-text-secondary)' }}>{client.phone || '—'}</td>
                  <td>
                    <span className="badge badge-draft">{client.invoice_count}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEditForm(client)} title="Edit">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <Link href={`/invoices/create?client=${client.id}`} className="btn btn-ghost btn-sm" title="Create Invoice">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                          <polyline points="14,2 14,8 20,8" />
                          <line x1="12" y1="18" x2="12" y2="12" />
                          <line x1="9" y1="15" x2="15" y2="15" />
                        </svg>
                      </Link>
                      <button className="btn btn-ghost btn-sm" onClick={() => setDeleteTarget(client)} title="Delete" style={{ color: 'var(--color-text-muted)' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <polyline points="3,6 5,6 21,6" />
                          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Client Slide-over */}
      {showForm && (
        <>
          <div className="slide-over-overlay" onClick={() => { setShowForm(false); resetForm(); }} />
          <div className="slide-over">
            <div className="slide-over-header">
              <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)' }}>
                {editingClient ? 'Edit Client' : 'Add Client'}
              </h3>
              <button className="btn btn-ghost btn-icon" onClick={() => { setShowForm(false); resetForm(); }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="slide-over-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
                <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Basic Information</h4>

                <div className="form-group">
                  <label className="form-label">Client Name <span className="required">*</span></label>
                  <input
                    type="text"
                    className={`form-input ${formErrors.name ? 'error' : ''}`}
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                  {formErrors.name && <span className="form-error">{formErrors.name}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Company Name</label>
                  <input type="text" className="form-input" placeholder="ABC Technologies" value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Email <span className="required">*</span></label>
                    <input
                      type="email"
                      className={`form-input ${formErrors.email ? 'error' : ''}`}
                      placeholder="client@example.com"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                    {formErrors.email && <span className="form-error">{formErrors.email}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input type="text" className="form-input" placeholder="+91 98765 43210" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                  </div>
                </div>

                <hr className="divider" />
                <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Billing Address</h4>

                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input type="text" className="form-input" placeholder="123 Main Street" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input type="text" className="form-input" placeholder="Mumbai" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">State</label>
                    <input type="text" className="form-input" placeholder="Maharashtra" value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Country</label>
                    <input type="text" className="form-input" placeholder="India" value={formData.country} onChange={e => setFormData({ ...formData, country: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">ZIP/PIN Code</label>
                    <input type="text" className="form-input" placeholder="400001" value={formData.zip_code} onChange={e => setFormData({ ...formData, zip_code: e.target.value })} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">GST/VAT/Tax ID</label>
                  <input type="text" className="form-input" placeholder="GSTIN or Tax ID" value={formData.tax_id} onChange={e => setFormData({ ...formData, tax_id: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="slide-over-footer">
              <button className="btn btn-secondary" onClick={() => { setShowForm(false); resetForm(); }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <><span className="spinner" /> Saving...</> : (editingClient ? 'Update Client' : 'Save Client')}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Delete this client?</h3>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--color-text-secondary)', lineHeight: 'var(--line-height-relaxed)' }}>
                Are you sure you want to delete <strong style={{ color: 'var(--color-text-primary)' }}>{deleteTarget.name}</strong>? This won&apos;t delete invoices already created for this client.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete Client</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
