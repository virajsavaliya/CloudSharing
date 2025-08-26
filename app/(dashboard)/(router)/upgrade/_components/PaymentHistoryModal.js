"use client";
import React, { useState, useEffect } from 'react';
import { db } from '../../../../../firebaseConfig';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { Download, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Invoice from './Invoice';

export default function PaymentHistoryModal({ user, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "paymentHistory"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const payments = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistory(payments);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleDownload = async (payment) => {
    setSelectedInvoice(payment);
    // Allow time for the hidden invoice to render before capturing
    await new Promise(resolve => setTimeout(resolve, 100));

    const invoiceElement = document.getElementById('invoice-to-download');
    html2canvas(invoiceElement, { scale: 2, useCORS: true }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`invoice-${payment.orderId.slice(0, 8)}.pdf`);
      setSelectedInvoice(null); // Clean up after download
    });
  };

  const StatusIcon = ({ status }) => {
    if (status === 'SUCCESS') return <CheckCircle className="text-green-500" />;
    if (status === 'PENDING') return <Clock className="text-yellow-500" />;
    return <AlertCircle className="text-red-500" />;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      {/* Hidden container for rendering the invoice for PDF generation */}
      {selectedInvoice && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <Invoice
            orderId={selectedInvoice.orderId}
            userEmail={user.email}
            planName={selectedInvoice.plan}
            duration={selectedInvoice.duration}
            basePrice={selectedInvoice.basePrice}
            finalAmount={selectedInvoice.amount}
            paymentMethod={selectedInvoice.paymentMethod} // <-- Pass the prop
          />
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Payment History</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 font-bold">✕</button>
        </div>
        <div className="flex-grow overflow-y-auto">
          {loading ? (
            <p>Loading history...</p>
          ) : history.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No payment history found.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Receipt</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.map(payment => (
                  <tr key={payment.id}>
                    <td className="px-4 py-4 text-sm text-gray-700">{new Date(payment.createdAt.seconds * 1000).toLocaleDateString()}</td>
                    <td className="px-4 py-4 text-sm text-gray-700">{payment.plan} ({payment.duration})</td>
                    <td className="px-4 py-4 text-sm text-gray-700">₹{payment.amount}</td>
                    <td className="px-4 py-4 text-sm">
                      <span className={`flex items-center gap-2 font-medium`}>
                        <StatusIcon status={payment.status} />
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      {payment.status === 'SUCCESS' ? (
                        <button onClick={() => handleDownload(payment)} className="text-blue-600 hover:text-blue-800">
                          <Download size={20} />
                        </button>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}