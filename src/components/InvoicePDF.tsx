// Server-side PDF generation component

import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import type { Profile, Client, InvoiceItemFormData } from '@/lib/types';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#1a1a1a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30, paddingBottom: 20, borderBottomWidth: 2, borderBottomColor: '#8b5cf6' },
  businessName: { fontSize: 18, fontWeight: 700, marginBottom: 4 },
  businessDetail: { fontSize: 9, color: '#666', lineHeight: 1.6 },
  invoiceTitle: { fontSize: 26, fontWeight: 700, color: '#8b5cf6', textAlign: 'right' },
  invoiceMeta: { textAlign: 'right', fontSize: 9, color: '#666', lineHeight: 1.8, marginTop: 4 },
  invoiceMetaBold: { color: '#1a1a1a', fontWeight: 600 },
  parties: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  partyLabel: { fontSize: 8, textTransform: 'uppercase', letterSpacing: 1, color: '#999', marginBottom: 6, fontWeight: 600 },
  partyName: { fontSize: 12, fontWeight: 600, marginBottom: 2 },
  partyDetail: { fontSize: 9, color: '#666', lineHeight: 1.5 },
  table: { marginBottom: 20 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f8f9fa', paddingVertical: 8, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  tableHeaderText: { fontSize: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: '#666' },
  tableRow: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  tableCell: { fontSize: 9, color: '#333' },
  tableCellBold: { fontSize: 9, fontWeight: 600, color: '#333' },
  colService: { width: '30%' },
  colDesc: { width: '25%' },
  colQty: { width: '10%', textAlign: 'center' },
  colRate: { width: '15%', textAlign: 'right' },
  colAmount: { width: '20%', textAlign: 'right' },
  summaryContainer: { alignItems: 'flex-end', marginBottom: 24 },
  summaryTable: { width: 220 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, fontSize: 9, color: '#666' },
  summaryTotal: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, marginTop: 4, borderTopWidth: 2, borderTopColor: '#8b5cf6', fontSize: 13, fontWeight: 700, color: '#1a1a1a' },
  footer: { marginTop: 'auto', paddingTop: 16, borderTopWidth: 1, borderTopColor: '#e5e7eb', fontSize: 8, color: '#999', lineHeight: 1.6 },
  footerBold: { color: '#666', fontWeight: 600 },
});

interface InvoicePDFProps {
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
}

function formatCurrencyPDF(amount: number, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}

function formatDatePDF(dateStr: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' });
}

function InvoicePDFDocument(props: InvoicePDFProps) {
  const { profile, client, invoiceNumber, invoiceDate, dueDate, items, subtotal, discountAmount, taxRate, taxAmount, total, notes, paymentTerms } = props;
  const currency = profile?.currency || 'INR';
  const fmt = (n: number) => formatCurrencyPDF(n, currency);
  const validItems = items.filter(i => i.service_name);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {profile?.business_logo_url && (
              <Image 
                src={profile.business_logo_url} 
                style={{ width: 60, height: 60, marginRight: 12, objectFit: 'contain' }} 
              />
            )}
            <View>
              <Text style={styles.businessName}>{profile?.business_name || 'Your Business'}</Text>
              <Text style={styles.businessDetail}>
                {profile?.business_address ? `${profile.business_address}\n` : ''}
                {profile?.business_email ? `${profile.business_email}\n` : ''}
                {profile?.business_phone ? `${profile.business_phone}\n` : ''}
                {profile?.tax_number ? `GST: ${profile.tax_number}` : ''}
              </Text>
            </View>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceMeta}>
              <Text style={styles.invoiceMetaBold}>{invoiceNumber}</Text>
              {'\n'}Date: {formatDatePDF(invoiceDate)}
              {'\n'}Due: {formatDatePDF(dueDate)}
            </Text>
          </View>
        </View>

        {/* Bill To */}
        <View style={styles.parties}>
          <View>
            <Text style={styles.partyLabel}>Bill To</Text>
            {client ? (
              <>
                <Text style={styles.partyName}>{client.name}</Text>
                <Text style={styles.partyDetail}>
                  {client.company ? `${client.company}\n` : ''}
                  {client.address ? `${client.address}\n` : ''}
                  {client.city && client.state ? `${client.city}, ${client.state}\n` : ''}
                  {client.email}
                  {client.tax_id ? `\nTax ID: ${client.tax_id}` : ''}
                </Text>
              </>
            ) : (
              <Text style={styles.partyDetail}>—</Text>
            )}
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colService]}>Service</Text>
            <Text style={[styles.tableHeaderText, styles.colDesc]}>Description</Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderText, styles.colRate]}>Rate</Text>
            <Text style={[styles.tableHeaderText, styles.colAmount]}>Amount</Text>
          </View>
          {validItems.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.tableCellBold, styles.colService]}>{item.service_name}</Text>
              <Text style={[styles.tableCell, styles.colDesc]}>{item.description || '—'}</Text>
              <Text style={[styles.tableCell, styles.colQty]}>{item.quantity}{item.unit ? ' ' + item.unit : ''}</Text>
              <Text style={[styles.tableCell, styles.colRate]}>{fmt(item.unit_price)}</Text>
              <Text style={[styles.tableCellBold, styles.colAmount]}>{fmt(item.quantity * item.unit_price)}</Text>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryTable}>
            <View style={styles.summaryRow}>
              <Text>Subtotal</Text>
              <Text>{fmt(subtotal)}</Text>
            </View>
            {discountAmount > 0 && (
              <View style={styles.summaryRow}>
                <Text>Discount</Text>
                <Text>-{fmt(discountAmount)}</Text>
              </View>
            )}
            {taxRate > 0 && (
              <View style={styles.summaryRow}>
                <Text>Tax ({taxRate}%)</Text>
                <Text>{fmt(taxAmount)}</Text>
              </View>
            )}
            <View style={styles.summaryTotal}>
              <Text>Total</Text>
              <Text>{fmt(total)}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          {paymentTerms ? (
            <Text style={{ marginBottom: 6 }}>
              <Text style={styles.footerBold}>Payment Terms: </Text>{paymentTerms}
            </Text>
          ) : null}
          {profile?.bank_account_name ? (
            <Text style={{ marginBottom: 6 }}>
              <Text style={styles.footerBold}>Bank Details: </Text>
              {'\n'}{profile.bank_account_name} — {profile.bank_name}
              {'\n'}A/C: {profile.bank_account_number}
              {profile.bank_ifsc ? ` | IFSC: ${profile.bank_ifsc}` : ''}
              {profile.bank_upi_id ? `\nUPI: ${profile.bank_upi_id}` : ''}
            </Text>
          ) : null}
          {notes ? <Text>{notes}</Text> : null}
        </View>
      </Page>
    </Document>
  );
}

export default InvoicePDFDocument;
