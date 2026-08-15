import jsPDF from 'jspdf';

// Generates a simple, clean invoice PDF and triggers a download.
// `bill` is the saved bill object returned from the backend (has _id, items, totals, date).
export const downloadInvoicePDF = (bill) => {
  const doc = new jsPDF();
  const marginX = 14;
  let y = 20;

  doc.setFontSize(18);
  doc.text('Empress-XT', marginX, y);
  doc.setFontSize(11);
  doc.text('Invoice', 180, y, { align: 'right' });

  y += 8;
  doc.setFontSize(9);
  doc.text(`Bill ID: ${bill.billId || bill._id}`, marginX, y);
  doc.text(`Date: ${new Date(bill.date).toLocaleString()}`, 180, y, { align: 'right' });

  y += 6;
  doc.text(`Customer: ${bill.customerName || 'Walk-in Customer'}`, marginX, y);
  if (bill.customerPhone) {
    y += 5;
    doc.text(`Phone: ${bill.customerPhone}`, marginX, y);
  }
  if (bill.customerAddress) {
    y += 5;
    doc.text(`Address: ${bill.customerAddress}`, marginX, y);
  }
  if (bill.customerGST) {
    y += 5;
    doc.text(`Customer GSTIN: ${bill.customerGST}`, marginX, y);
  }

  y += 8;
  doc.setDrawColor(200);
  doc.line(marginX, y, 196, y);

  y += 7;
  doc.setFontSize(10);
  doc.text('Item', marginX, y);
  doc.text('Qty', 120, y, { align: 'right' });
  doc.text('Price', 155, y, { align: 'right' });
  doc.text('Amount', 196, y, { align: 'right' });

  y += 3;
  doc.line(marginX, y, 196, y);
  y += 6;

  bill.items.forEach((item) => {
    doc.text(item.name, marginX, y);
    doc.text(String(item.quantity), 120, y, { align: 'right' });
    doc.text(`Rs.${item.price.toFixed(2)}`, 155, y, { align: 'right' });
    doc.text(`Rs.${(item.price * item.quantity).toFixed(2)}`, 196, y, { align: 'right' });
    y += 7;
  });

  y += 3;
  doc.line(marginX, y, 196, y);
  y += 8;

  doc.text(`Subtotal:`, 155, y, { align: 'right' });
  doc.text(`Rs.${bill.subtotal.toFixed(2)}`, 196, y, { align: 'right' });
  y += 7;

  doc.text(`GST (${bill.taxRate}%):`, 155, y, { align: 'right' });
  doc.text(`Rs.${bill.taxAmount.toFixed(2)}`, 196, y, { align: 'right' });
  y += 7;

  doc.setFontSize(12);
  doc.text(`Total:`, 155, y, { align: 'right' });
  doc.text(`Rs.${bill.totalAmount.toFixed(2)}`, 196, y, { align: 'right' });

  y += 15;
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text('Thank you for your purchase!', marginX, y);

  doc.save(`invoice-${bill.billId || bill._id}.pdf`);
};
