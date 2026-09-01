import { NextRequest, NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';
import InvoicePDFDocument from '@/components/InvoicePDF';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    // Render the PDF to a stream
    const stream = await renderToStream(<InvoicePDFDocument {...data} />);

    // Collect the stream into a buffer using standard events
    const chunks: Uint8Array[] = [];
    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });

    try {
      require('fs').writeFileSync('/Users/neeleshkamath/Neelesh Projects AI/Freelance Invoice Generators/pdf_debug.log', `Buffer size: ${pdfBuffer.length} bytes`);
    } catch (e) {}

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="preview.pdf"',
      },
    });
  } catch (error: any) {
    console.error('Error generating PDF preview:', error);
    try {
      require('fs').writeFileSync('/Users/neeleshkamath/Neelesh Projects AI/Freelance Invoice Generators/pdf_error.log', error.stack || error.toString());
    } catch (e) {}
    return NextResponse.json({ error: 'Failed to generate PDF', details: error.message, stack: error.stack }, { status: 500 });
  }
}
