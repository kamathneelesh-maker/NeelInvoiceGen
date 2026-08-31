'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLayout } from '../layout';

export default function SettingsPage() {
  const { profile, refreshProfile } = useLayout();
  const supabase = createClient();
  const [saving, setSaving] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Business Profile
  const [businessName, setBusinessName] = useState('');
  const [businessLogo, setBusinessLogo] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [taxNumber, setTaxNumber] = useState('');

  // Invoice Defaults
  const [currency, setCurrency] = useState('INR');
  const [defaultTaxRate, setDefaultTaxRate] = useState(0);
  const [paymentTerms, setPaymentTerms] = useState('');
  const [invoicePrefix, setInvoicePrefix] = useState('INV-');

  // Bank Details
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [bankUpiId, setBankUpiId] = useState('');

  useEffect(() => {
    if (profile) {
      setBusinessName(profile.business_name || '');
      setBusinessLogo(profile.business_logo_url || '');
      setBusinessEmail(profile.business_email || '');
      setBusinessPhone(profile.business_phone || '');
      setBusinessAddress(profile.business_address || '');
      setTaxNumber(profile.tax_number || '');
      setCurrency(profile.currency || 'INR');
      setDefaultTaxRate(profile.default_tax_rate || 0);
      setPaymentTerms(profile.payment_terms || '');
      setInvoicePrefix(profile.invoice_prefix || 'INV-');
      setBankAccountName(profile.bank_account_name || '');
      setBankName(profile.bank_name || '');
      setBankAccountNumber(profile.bank_account_number || '');
      setBankIfsc(profile.bank_ifsc || '');
      setBankUpiId(profile.bank_upi_id || '');
    }
  }, [profile]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const saveBusinessProfile = async () => {
    setSaving('business');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('profiles').update({
      business_name: businessName || null,
      business_logo_url: businessLogo || null,
      business_email: businessEmail || null,
      business_phone: businessPhone || null,
      business_address: businessAddress || null,
      tax_number: taxNumber || null,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id);

    await refreshProfile();
    setSaving(null);
    showSuccess('Business profile saved.');
  };

  const saveInvoiceDefaults = async () => {
    setSaving('defaults');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('profiles').update({
      currency,
      default_tax_rate: defaultTaxRate,
      payment_terms: paymentTerms || null,
      invoice_prefix: invoicePrefix,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id);

    await refreshProfile();
    setSaving(null);
    showSuccess('Invoice defaults saved.');
  };

  const saveBankDetails = async () => {
    setSaving('bank');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('profiles').update({
      bank_account_name: bankAccountName || null,
      bank_name: bankName || null,
      bank_account_number: bankAccountNumber || null,
      bank_ifsc: bankIfsc || null,
      bank_upi_id: bankUpiId || null,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id);

    await refreshProfile();
    setSaving(null);
    showSuccess('Bank details saved.');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 300;
        const MAX_HEIGHT = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.85);
          setBusinessLogo(dataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <h2 className="section-title">Settings</h2>
          <p className="section-subtitle">Configure your business and invoice preferences</p>
        </div>
      </div>

      {/* Success Toast */}
      {successMsg && (
        <div style={{
          position: 'fixed',
          top: 'var(--space-6)',
          right: 'var(--space-6)',
          background: 'var(--color-success-bg)',
          border: '1px solid var(--color-success-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-3) var(--space-5)',
          color: 'var(--color-success)',
          fontSize: 'var(--font-size-sm)',
          fontWeight: 'var(--font-weight-medium)',
          zIndex: 9999,
          animation: 'fadeInDown 0.3s ease-out',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            <polyline points="22,4 12,14.01 9,11.01" />
          </svg>
          {successMsg}
        </div>
      )}

      {/* Business Profile */}
      <div className="settings-section">
        <div className="card">
          <h3 className="settings-section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9,22 9,12 15,12 15,22" />
            </svg>
            Business Profile
          </h3>
          <div className="settings-grid">
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Company Logo</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                {businessLogo ? (
                  <div style={{ position: 'relative', width: '80px', height: '80px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={businessLogo} alt="Company Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                ) : (
                  <div style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-md)', border: '1px dashed var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)', background: 'var(--color-bg-secondary)' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  </div>
                )}
                <div>
                  <input type="file" id="logoUpload" accept="image/png, image/jpeg" style={{ display: 'none' }} onChange={handleLogoUpload} />
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <label htmlFor="logoUpload" className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                      {businessLogo ? 'Change Logo' : 'Upload Logo'}
                    </label>
                    {businessLogo && (
                      <button className="btn btn-ghost btn-sm" onClick={() => setBusinessLogo('')} style={{ color: 'var(--color-error)' }}>
                        Remove
                      </button>
                    )}
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginTop: 'var(--space-1)' }}>JPG or PNG, max 1MB. Resized automatically.</p>
                </div>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Business Name</label>
              <input type="text" className="form-input" placeholder="Your Business Name" value={businessName} onChange={e => setBusinessName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" placeholder="business@example.com" value={businessEmail} onChange={e => setBusinessEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input type="text" className="form-input" placeholder="+91 98765 43210" value={businessPhone} onChange={e => setBusinessPhone(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Tax / GST Number</label>
              <input type="text" className="form-input" placeholder="GSTIN" value={taxNumber} onChange={e => setTaxNumber(e.target.value)} />
            </div>
          </div>
          <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
            <label className="form-label">Address</label>
            <textarea className="form-input form-textarea" placeholder="Full business address" value={businessAddress} onChange={e => setBusinessAddress(e.target.value)} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-5)' }}>
            <button className="btn btn-primary" onClick={saveBusinessProfile} disabled={saving === 'business'}>
              {saving === 'business' ? <><span className="spinner" /> Saving...</> : 'Save Business Profile'}
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Defaults */}
      <div className="settings-section">
        <div className="card">
          <h3 className="settings-section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14,2 14,8 20,8" />
            </svg>
            Invoice Defaults
          </h3>
          <div className="settings-grid">
            <div className="form-group">
              <label className="form-label">Currency</label>
              <select className="form-input form-select" value={currency} onChange={e => setCurrency(e.target.value)}>
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="AUD">AUD (A$)</option>
                <option value="CAD">CAD (C$)</option>
                <option value="JPY">JPY (¥)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Default Tax Rate (%)</label>
              <input type="number" className="form-input" min="0" max="100" value={defaultTaxRate} onChange={e => setDefaultTaxRate(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="form-group">
              <label className="form-label">Invoice Prefix</label>
              <input type="text" className="form-input" placeholder="INV-" value={invoicePrefix} onChange={e => setInvoicePrefix(e.target.value)} />
            </div>
          </div>
          <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
            <label className="form-label">Default Payment Terms</label>
            <textarea className="form-input form-textarea" placeholder="Payment due within 15 days." value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-5)' }}>
            <button className="btn btn-primary" onClick={saveInvoiceDefaults} disabled={saving === 'defaults'}>
              {saving === 'defaults' ? <><span className="spinner" /> Saving...</> : 'Save Invoice Defaults'}
            </button>
          </div>
        </div>
      </div>

      {/* Bank Details */}
      <div className="settings-section">
        <div className="card">
          <h3 className="settings-section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
            Bank Details
          </h3>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-5)' }}>
            These details will appear on your generated invoices.
          </p>
          <div className="settings-grid">
            <div className="form-group">
              <label className="form-label">Account Name</label>
              <input type="text" className="form-input" placeholder="Account holder name" value={bankAccountName} onChange={e => setBankAccountName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Bank Name</label>
              <input type="text" className="form-input" placeholder="Bank name" value={bankName} onChange={e => setBankName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Account Number</label>
              <input type="text" className="form-input" placeholder="Account number" value={bankAccountNumber} onChange={e => setBankAccountNumber(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">IFSC Code</label>
              <input type="text" className="form-input" placeholder="IFSC code" value={bankIfsc} onChange={e => setBankIfsc(e.target.value)} />
            </div>
          </div>
          <div className="form-group" style={{ marginTop: 'var(--space-4)', maxWidth: '50%' }}>
            <label className="form-label">UPI ID</label>
            <input type="text" className="form-input" placeholder="your@upi" value={bankUpiId} onChange={e => setBankUpiId(e.target.value)} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-5)' }}>
            <button className="btn btn-primary" onClick={saveBankDetails} disabled={saving === 'bank'}>
              {saving === 'bank' ? <><span className="spinner" /> Saving...</> : 'Save Bank Details'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
