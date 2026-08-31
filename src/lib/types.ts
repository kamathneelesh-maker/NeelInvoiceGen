/* ── TypeScript Type Definitions for InvoiceFlow ── */

export interface Profile {
  id: string;
  full_name: string;
  business_name: string | null;
  business_email: string | null;
  business_phone: string | null;
  business_address: string | null;
  business_logo_url: string | null;
  tax_number: string | null;
  currency: string;
  default_tax_rate: number;
  payment_terms: string | null;
  invoice_prefix: string;
  bank_account_name: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_ifsc: string | null;
  bank_upi_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  user_id: string;
  name: string;
  company: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  zip_code: string | null;
  tax_id: string | null;
  created_at: string;
  updated_at: string;
  invoice_count?: number;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';

export type DiscountType = 'fixed' | 'percentage';

export interface Invoice {
  id: string;
  user_id: string;
  client_id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  status: InvoiceStatus;
  subtotal: number;
  discount_type: DiscountType | null;
  discount_value: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  notes: string | null;
  payment_terms: string | null;
  created_at: string;
  updated_at: string;
  client?: Client;
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  service_name: string;
  description: string | null;
  quantity: number;
  unit_price: number;
  amount: number;
  sort_order: number;
  unit?: string;
}

export interface InvoiceFormData {
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  client_id: string;
  status: InvoiceStatus;
  discount_type: DiscountType | null;
  discount_value: number;
  tax_rate: number;
  notes: string;
  payment_terms: string;
  items: InvoiceItemFormData[];
}

export interface InvoiceItemFormData {
  id?: string;
  service_name: string;
  description: string;
  quantity: number;
  unit?: string;
  unit_price: number;
}

export interface ClientFormData {
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zip_code: string;
  tax_id: string;
}

export interface DashboardStats {
  totalInvoices: number;
  draftInvoices: number;
  paidInvoices: number;
  outstandingAmount: number;
}
