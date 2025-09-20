'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { OrderData } from '@/types';

interface DownloadPDFButtonProps {
  order: OrderData;
  orderId: string;
}

// TypeScript fix for lastAutoTable
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable?: {
      finalY?: number;
    };
  }
}

export default function DownloadPDFButton({ order, orderId }: DownloadPDFButtonProps) {
  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF('p', 'pt', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();

      // HEADER
      doc.setFontSize(20);
      doc.setTextColor('#0077B6');
      doc.text('AXION', pageWidth / 2, 40, { align: 'center' });
      doc.setFontSize(10);
      doc.setTextColor('#444');
      doc.text('Your Trusted E-commerce Partner', pageWidth / 2, 55, { align: 'center' });

      doc.setFontSize(16);
      doc.setTextColor('#0077B6');
      doc.text(`Order Invoice`, pageWidth / 2, 80, { align: 'center' });

      // Order info
      const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const getOrderStatus = () => {
        if (order.isCancelled) return 'Cancelled';
        if (order.isDelivered) return 'Delivered';
        if (order.isPaid) return 'Paid';
        return 'Pending';
      };

      doc.setFontSize(12);
      doc.setTextColor('#000');

      doc.text(`Order ID: #${orderId}`, 40, 110);
      doc.text(`Order Date: ${orderDate}`, 40, 130);
      doc.text(`Status: ${getOrderStatus()}`, 40, 150);
      doc.text(`Payment: ${order.paymentMethod || 'N/A'}`, 40, 170);

      // Customer Info
      doc.text(`Customer: ${order.user?.name || 'N/A'}`, 300, 110);
      doc.text(`Email: ${order.user?.email || 'N/A'}`, 300, 130);
      doc.text(`Phone: ${order.shippingAddress?.phone || 'N/A'}`, 300, 150);

      // Shipping Address
      doc.setFontSize(12);
      doc.text('Shipping Address:', 40, 200);
      const shipping = [
        order.shippingAddress?.fullName || 'N/A',
        order.shippingAddress?.address || 'N/A',
        `${order.shippingAddress?.city || 'N/A'}, ${order.shippingAddress?.postalCode || 'N/A'}`,
        order.shippingAddress?.country || 'Pakistan',
      ];
      shipping.forEach((line, i) => doc.text(line, 40, 215 + i * 15));
      const totalShippingPrice = order.shippingPrice;
      // Products Table
      const tableData =
        order.orderItems?.map((item) => [
          item.name,
          item.qty.toString(),
          `Rs. ${item.price?.toLocaleString()}`,
          `Rs. ${totalShippingPrice.toLocaleString()}`,
          `Rs. ${(item.price * item.qty)?.toLocaleString()}`,
        ]) || [];

      autoTable(doc, {
        startY: 280,
        head: [['Product Name', 'Quantity', 'Unit Price','Shipping Price', 'Total']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: '#0077B6', textColor: '#fff' },
        didParseCell: (data) => {
          if (data.section === 'body') {
            // Alternate row colors
            if (data.row.index % 2 === 0) {
              data.cell.styles.fillColor = [249, 249, 249]; // light gray
            } else {
              data.cell.styles.fillColor = [255, 255, 255]; // white
            }
          }
        },
        columnStyles: {
          0: { cellWidth: 180 },
          1: { cellWidth: 60, halign: 'center' },
          2: { cellWidth: 80, halign: 'right' },
          3: { cellWidth: 80, halign: 'right' },
          4: { cellWidth: 80, halign: 'right' },
        },
      });

      // Total Amount
      const finalY = doc.lastAutoTable?.finalY || 300;
      doc.setFontSize(14);
      doc.setTextColor('#0077B6');
      doc.text(
        `Total Amount: Rs. ${order.totalPrice?.toLocaleString()}`,
        pageWidth - 40,
        finalY + 30,
        { align: 'right' },
      );

      // Footer
      doc.setFontSize(10);
      doc.setTextColor('#666');
      doc.text('Thank you for your business!', pageWidth / 2, finalY + 60, { align: 'center' });
      doc.text('For queries, contact support@axion.com', pageWidth / 2, finalY + 75, {
        align: 'center',
      });
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, finalY + 90, {
        align: 'center',
      });

      // Download
      doc.save(`OrderInvoice_${orderId.slice(-6)}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  return (
    <Button
      onClick={handleDownloadPDF}
      className="bg-(--color-logo) hover:bg-(--color-logo)/90 text-white"
    >
      <Download className="mr-2 h-4 w-4" />
      Download PDF
    </Button>
  );
}
