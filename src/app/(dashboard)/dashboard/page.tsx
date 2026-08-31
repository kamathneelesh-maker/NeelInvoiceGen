'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useLayout } from '../layout';
import type { Invoice, DashboardStats } from '@/lib/types';

export default function DashboardPage() {
  const { profile } = useLayout();
  const [stats, setStats] = useState<DashboardStats>({
    totalInvoices: 0,
    draftInvoices: 0,
    paidInvoices: 0,
    outstandingAmount: 0,
  });
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const supabase = createClient();

    // Fetch all invoices for stats
    const { data: invoices } = await supabase
      .from('invoices')
      .select('*, client:clients(name, company)')
      .order('created_at', { ascending: false });

    if (invoices) {
      const total = invoices.length;
      const drafts = invoices.filter(i => i.status === 'draft').length;
      const paid = invoices.filter(i => i.status === 'paid').length;
      const outstanding = invoices
        .filter(i => i.status !== 'paid')
        .reduce((sum, i) => sum + (i.total || 0), 0);

      setStats({
        totalInvoices: total,
        draftInvoices: drafts,
        paidInvoices: paid,
        outstandingAmount: outstanding,
      });

      setRecentInvoices(invoices.slice(0, 5));
    }

    setLoading(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formatCurrency = (amount: number) => {
    const currency = profile?.currency || 'INR';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    return <span className={`badge badge-${status}`}>{status}</span>;
  };

  if (loading) {
    return (
      <div>
        <div className="dashboard-greeting">
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-text" style={{ width: '40%' }} />
        </div>
        <div className="stats-grid">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton skeleton-card" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Greeting */}
      <div className="dashboard-greeting">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div>
            <h2>{getGreeting()}, {profile?.full_name?.split(' ')[0] || 'there'}</h2>
            <p>Here&apos;s an overview of your invoicing activity.</p>
          </div>
          <Link href="/invoices/create" className="btn btn-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Create Invoice
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--color-accent-primary-light)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14,2 14,8 20,8" />
            </svg>
          </div>
          <div className="stat-value">{stats.totalInvoices}</div>
          <div className="stat-label">Total Invoices</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--color-warning-bg)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-warning)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </div>
          <div className="stat-value">{stats.draftInvoices}</div>
          <div className="stat-label">Draft Invoices</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--color-success-bg)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22,4 12,14.01 9,11.01" />
            </svg>
          </div>
          <div className="stat-value">{stats.paidInvoices}</div>
          <div className="stat-label">Paid Invoices</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--color-info-bg)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-info)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 3h12" />
              <path d="M6 8h12" />
              <path d="M6 13l8.5 8" />
              <path d="M6 13h3c3.314 0 6-2.239 6-5s-2.686-5-6-5H6" />
            </svg>
          </div>
          <div className="stat-value">{formatCurrency(stats.outstandingAmount)}</div>
          <div className="stat-label">Outstanding Amount</div>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="section-header">
        <div>
          <h3 className="section-title">Recent Invoices</h3>
          <p className="section-subtitle">Your latest invoicing activity</p>
        </div>
        <Link href="/invoices" className="btn btn-secondary btn-sm">
          View All
        </Link>
      </div>

      {recentInvoices.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14,2 14,8 20,8" />
            </svg>
          </div>
          <h3 className="empty-state-title">No invoices yet</h3>
          <p className="empty-state-description">Create your first invoice to get started with InvoiceFlow.</p>
          <Link href="/invoices/create" className="btn btn-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Create Your First Invoice
          </Link>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Client</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentInvoices.map(invoice => (
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
                  <td className="amount">{formatCurrency(invoice.total || 0)}</td>
                  <td>{getStatusBadge(invoice.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
