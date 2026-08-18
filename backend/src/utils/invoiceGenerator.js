import PDFDocument from "pdfkit";

/**
 * Generates a professional PDF invoice buffer for a GreenGo order.
 * @param {object} order - Mongoose order document or lean object.
 * @param {object} customer - User profile associated with order.
 * @returns {Promise<Buffer>} - Resolves to the PDF buffer.
 */
export const generateInvoicePdfBuffer = (order, customer) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];
    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", (err) => reject(err));

    // Logo / Branding Header
    doc.fillColor("#059669").fontSize(26).text("GreenGo", { align: "left" });
    doc.fillColor("#374151").fontSize(10).text("Fresh Foods Delivered Fast", { align: "left" });
    doc.moveDown();

    // Invoice Meta Information
    doc.fontSize(16).fillColor("#1f2937").text("INVOICE / BILL", { align: "right" });
    doc.fontSize(10).fillColor("#4b5563");
    doc.text(`Order ID: #${String(order._id).toUpperCase()}`, { align: "right" });
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, { align: "right" });
    doc.text(`Payment: ${order.paymentMethod} (${order.paymentStatus || "Paid"})`, { align: "right" });
    doc.moveDown(2);

    // Two column layout for Customer and Store Info
    const yPosition = doc.y;
    doc.fontSize(12).fillColor("#111827").text("DELIVER TO:", 50, yPosition);
    doc.fontSize(10).fillColor("#4b5563");
    doc.text(customer?.name || order.userName || "Customer", 50, yPosition + 15);
    doc.text(customer?.email || "N/A", 50, yPosition + 30);
    doc.text(order.phone || customer?.phone || "N/A", 50, yPosition + 45);
    doc.text(order.address || "N/A", 50, yPosition + 60, { width: 220 });

    doc.fontSize(12).fillColor("#111827").text("FULFILLED BY:", 320, yPosition);
    doc.fontSize(10).fillColor("#4b5563");
    doc.text("GreenGo Kitchen Store #1", 320, yPosition + 15);
    doc.text("store@greengo.app", 320, yPosition + 30);
    doc.text("+91 9876543210", 320, yPosition + 45);
    doc.text("GreenGo Hub, Bangalore, Karnataka", 320, yPosition + 60, { width: 220 });

    doc.moveDown(5);

    // Draw a divider line
    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#e5e7eb").lineWidth(1).stroke();
    doc.moveDown();

    // Table Header
    const tableHeaderY = doc.y;
    doc.fontSize(10).fillColor("#111827").text("Items Ordered", 50, tableHeaderY, { bold: true });
    doc.text("Variant", 250, tableHeaderY, { bold: true });
    doc.text("Qty", 350, tableHeaderY, { align: "right", bold: true });
    doc.text("Unit Price", 420, tableHeaderY, { align: "right", bold: true });
    doc.text("Total", 500, tableHeaderY, { align: "right", bold: true });
    doc.moveDown();

    // Table Divider
    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#9ca3af").lineWidth(1).stroke();
    doc.moveDown(0.5);

    // Table Body
    order.items.forEach((item) => {
      const currentY = doc.y;
      doc.fontSize(10).fillColor("#374151").text(item.name, 50, currentY, { width: 190 });
      doc.text(item.variant || item.variantName || "-", 250, currentY, { width: 90 });
      doc.text(String(item.qty), 350, currentY, { align: "right" });
      doc.text(`₹${item.price}`, 420, currentY, { align: "right" });
      doc.text(`₹${item.price * item.qty}`, 500, currentY, { align: "right" });
      doc.moveDown(1.5);
    });

    // Subtotal and Totals Table
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#e5e7eb").lineWidth(1).stroke();
    doc.moveDown();

    const totalsY = doc.y;
    doc.fontSize(10).fillColor("#4b5563");
    
    // Subtotal, Fees, Surcharges
    let line = 0;
    const addTotalLine = (label, amount) => {
      const lineY = totalsY + line * 18;
      doc.text(label, 350, lineY, { align: "left" });
      doc.text(`₹${amount}`, 500, lineY, { align: "right" });
      line++;
    };

    const subtotal = order.items.reduce((sum, item) => sum + item.price * item.qty, 0);
    addTotalLine("Subtotal:", subtotal);
    if (order.packingCharge > 0) addTotalLine("Packaging Charges:", order.packingCharge);
    if (order.deliveryCharge > 0) addTotalLine("Delivery Charges:", order.deliveryCharge);
    if (order.discountAmount > 0) addTotalLine("Discounts:", -order.discountAmount);
    
    // Surcharges
    const rain = order.surcharges?.rainCharge || 0;
    const festival = order.surcharges?.festivalCharge || 0;
    const platform = order.surcharges?.platformCharge || 0;
    const custom = order.surcharges?.customSurcharge || 0;
    const surcharges = rain + festival + platform + custom;
    if (surcharges > 0) addTotalLine("Taxes & Surcharges:", surcharges);

    doc.moveDown();
    // Final Divider
    const finalDividerY = totalsY + line * 18 + 5;
    doc.moveTo(350, finalDividerY).lineTo(550, finalDividerY).strokeColor("#111827").lineWidth(1.5).stroke();

    // Net Total
    doc.fontSize(12).fillColor("#111827");
    doc.text("Net Paid Amount:", 350, finalDividerY + 10, { align: "left", bold: true });
    doc.text(`₹${order.total}`, 500, finalDividerY + 10, { align: "right", bold: true });

    // Footer
    doc.fontSize(10).fillColor("#9ca3af").text("Thank you for ordering from GreenGo! Your support keeps local kitchens green and sustainable.", 50, 680, { align: "center" });

    doc.end();
  });
};
