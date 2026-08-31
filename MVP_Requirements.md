# Product Requirements Document — Invoice Generator MVP

## 1. Product Overview

Product name: InvoiceFlow (working name)
Product type: Web application
Target users: Freelancers, consultants, contractors, independent professionals, and small businesses.

Core value proposition:
Create professional invoices for clients in minutes, reuse saved client information, preview invoices instantly, and download them as PDFs.

The MVP will focus on making invoice creation fast, simple, professional, and repeatable.

## 2. Problem Statement

Freelancers and small businesses often create invoices manually using Word, Excel, Google Docs, or complicated accounting software.

Common problems include:
* Re-entering client information for every invoice
* Manually calculating totals
* Poor-looking invoices
* Difficulty managing multiple services/products on one invoice
* No easy preview before sending
* Manual PDF generation
* Lack of a simple client database
* Complicated accounting applications that have features users don't need

The product should provide a simple invoice-first experience without requiring accounting expertise.

## 3. MVP Goals

**Primary goals**
* Allow users to securely sign up and log in.
* Allow users to create and manage clients.
* Allow users to create invoices for a client.
* Allow multiple services/items to be added to a single invoice.
* Automatically calculate subtotal, tax, discount and grand total.
* Provide a professional invoice preview.
* Generate invoices as PDF.
* Allow users to download the PDF.
* Allow users to reuse saved client information.
* Provide polished authentication, validation, loading, error and success states.

**Success criteria**
A new user should be able to:
Sign up → confirm email → log in → add client → create invoice → add multiple services → preview → generate PDF → download
in under 5 minutes.

## 4. Target Users

**Persona 1 — Freelancer**
* Example: A freelance software developer bills a client ₹75,000 for development, testing and deployment.
* Needs:
  * Quick invoice creation
  * Multiple line items
  * Client reuse
  * Professional PDF
  * Tax support

**Persona 2 — Consultant**
* Example: A management consultant bills a company for consulting hours and travel expenses.
* Needs:
  * Multiple services
  * Quantity × rate calculations
  * Notes/payment terms
  * Professional invoices

**Persona 3 — Small Service Business**
* Example: An electrician creates an invoice containing installation, wiring and service charges.
* Needs:
  * Saved clients
  * Multiple services
  * Easy invoice generation
  * PDF download

## 5. MVP Feature Scope

### 5.1 Authentication
Authentication will be handled using Supabase Auth.

**Sign Up**
Fields:
* Full Name
* Email
* Password
* Confirm Password

CTA: Create Account

After successful signup:
"Account created! We've sent a confirmation email to your inbox."
The user should be instructed to confirm their email before logging in.

**Login**
Fields:
* Email
* Password

Actions:
* Sign In
* Forgot Password
* Create Account

**Email confirmation**
Supabase sends the confirmation email. After confirmation, the user can log in.

**Authentication error handling**
Examples:
* Incorrect password: "The email or password you entered is incorrect."
* Email already registered: "An account with this email already exists. Try signing in instead."
* Invalid email: "Please enter a valid email address."
* Weak password: "Password must contain at least 8 characters."
* Unconfirmed email: "Please confirm your email before signing in."

**UI behavior**
Use modern:
* Inline validation
* Toast notifications
* Loading indicators
* Disabled button states
* Success states
* Error states
* Password visibility toggle

## 6. Application Navigation
After authentication, users enter the main application.

Primary navigation:
* Dashboard
* Invoices
* Clients
* Settings

Primary CTA:
* `+ Create Invoice`

The navigation should be responsive and work well on desktop and tablet.

## 7. Dashboard
The dashboard should provide a quick overview.

Header: Good morning, [Name]
Primary CTA: `+ Create Invoice`

Summary cards:
* Total Invoices
* Draft Invoices
* Paid Invoices
* Outstanding Amount
(For MVP, these can be simple calculated metrics.)

Recent invoices
Display: Invoice | Client | Date | Amount | Status
Statuses: Draft, Sent, Paid, Overdue
(For the MVP, Draft and basic invoice status management are sufficient; payment processing is outside MVP scope.)

## 8. Client Management
**Clients tab**
The Clients page should allow users to manage reusable client information.

Client list
Display: Client name, Company, Email, Phone, Number of invoices
Actions: View, Edit, Delete, Create Invoice

Add Client
Fields:
* Basic information: Client Name *, Company Name, Email *, Phone
* Billing information: Address, City, State, Country, ZIP/PIN Code, GST/VAT/Tax ID (optional)

CTA: Save Client
Success: "Client added successfully."

Edit client: Users can modify saved information.
Delete client: Confirmation modal warning "This won't delete invoices already created for this client."

## 9. Invoice Creation
This is the core MVP experience.
CTA: Create Invoice

Step 1 — Invoice Information
Fields: Invoice Number, Invoice Date, Due Date, Client
Invoice number should be automatically generated (Example: INV-0001). Users may optionally edit it.

## 10. Client Selection
The user should be able to select an existing client.
Once selected, the saved client details automatically populate the invoice.
Option: `+ Add New Client`
This should open the client creation flow without forcing the user to leave invoice creation.

## 11. Invoice Line Items
Users can add multiple services/products.
Button: `+ Add Service`

Each line item contains:
* Service name
* Description
* Quantity
* Unit price
* Amount

Calculation: Amount = Quantity × Unit Price
Users can: Add items, Remove items, Edit items, Reorder items (optional for MVP)

## 12. Invoice Calculations
The system should automatically calculate:
* Subtotal (Sum of all line items)
* Discount (Optional. Can be Fixed amount or Percentage)
* Tax (Optional. Example GST 18%)
* Total (Subtotal − Discount + Tax = Grand Total)

Calculations should update instantly as the user edits the invoice.

## 13. Additional Invoice Information
Optional fields:
* Notes (Example: Thank you for your business.)
* Payment Terms (Example: Payment due within 15 days.)
* Bank details (Optional: Account Name, Bank Name, Account Number, IFSC, UPI ID) - These can be configured in Settings and automatically added to invoices.

## 14. Invoice Preview
The application should provide a live invoice preview.

Recommended layout:
Desktop - Two-column interface (Left: Invoice editor, Right: Live invoice preview)
Mobile - Tabs (Edit | Preview)

## 15. Invoice Design
The generated invoice should look premium and professional, not like a spreadsheet.
Invoice should contain:
* Header: Business logo, Business name, Business address, Email/phone, Invoice title, Invoice metadata (number, dates)
* Client: Client name, Company, Address, Email, Tax ID
* Items: Description, Quantity, Rate, Amount
* Summary: Subtotal, Discount, Tax, Total
* Footer: Payment instructions, Notes, Thank-you message

## 16. PDF Generation
The user should have a "Generate PDF" button, then "Download PDF".
The PDF should:
* Match the preview
* Be professionally formatted
* Be A4-friendly
* Contain all invoice information
* Have a meaningful filename (e.g., INV-0001-ABC-Technologies.pdf)
* Open correctly in Chrome, Safari, Adobe Acrobat, Mobile PDF viewers

## 17. Invoice Management
Invoices tab should display all invoices.
Invoice list columns: Invoice, Client, Date, Due Date, Amount, Status
Actions: View, Edit, Duplicate, Download PDF, Delete

Duplicate invoice:
Useful feature for recurring clients. Example: Duplicate INV-0001 creates INV-0002 with the same client and line items.

## 18. Settings
Settings should contain:
* Business Profile: Business Name, Logo, Email, Phone, Address, Tax/GST Number
* Invoice Defaults: Currency, Default tax rate, Payment terms, Invoice prefix (e.g., INV-)
* Bank Details: Account Name, Bank, Account Number, IFSC, UPI

These details can automatically appear on generated invoices.
