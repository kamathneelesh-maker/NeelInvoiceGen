import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'InvoiceFlow — Professional Invoice Generator',
  description: 'Create professional invoices for your clients in minutes. Manage clients, generate PDFs, and streamline your billing workflow.',
  keywords: 'invoice generator, freelancer invoice, billing, PDF invoice, client management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
