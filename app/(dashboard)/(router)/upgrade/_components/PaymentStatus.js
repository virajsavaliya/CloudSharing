"use client";
import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Invoice from './Invoice';

export default function PaymentStatus({ status, plan, duration, basePrice, finalAmount, user, orderId, onClose, paymentMethod }) {
  const [downloading, setDownloading] = useState(false);
  const downloadTriggered = useRef(false);

  const statusConfig = {
    SUCCESS: {
      color: 'green',
      title: 'Payment Successful!',
      message: 'Your plan has been upgraded. Your receipt will download automatically.',
      animationClass: 'success'
    },
    PENDING: {
      color: 'yellow',
      title: 'Payment Pending',
      message: 'Your payment is being processed. We will notify you once complete.',
      animationClass: 'pending'
    },
    FAILED: {
      color: 'red',
      title: 'Payment Failed',
      message: 'There was an issue with your payment. Please try again.',
      animationClass: 'failed'
    }
  };

  const currentStatus = statusConfig[status] || statusConfig.FAILED;

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    const invoiceElement = document.getElementById('invoice-to-download');
    
    await new Promise(resolve => setTimeout(resolve, 100));

    html2canvas(invoiceElement, { scale: 2, useCORS: true }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`invoice-${orderId.slice(0, 8)}.pdf`);
      setDownloading(false);
    });
  };

  useEffect(() => {
    if (status === 'SUCCESS' && !downloadTriggered.current) {
      downloadTriggered.current = true;
      handleDownload();
    }
  }, [status]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      {status === 'SUCCESS' && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <Invoice
            orderId={orderId}
            userEmail={user.email}
            planName={plan}
            duration={duration}
            basePrice={basePrice}
            finalAmount={finalAmount}
            paymentMethod={paymentMethod} // <-- Pass the prop
          />
        </div>
      )}

      <div className="bg-white rounded-2xl p-8 text-center transform w-full max-w-sm">
        <div className={`payment-animation ${currentStatus.animationClass}`}>
          <div className="dots-container">
            <div className="dot dot-1"></div>
            <div className="dot dot-2"></div>
            <div className="dot dot-3"></div>
            <div className="progress-line"></div>
            <div className="status-circle">
              <div className="status-icon"></div>
            </div>
          </div>
        </div>
        <h2 className={`text-2xl font-bold text-${currentStatus.color}-600 mt-6`}>{currentStatus.title}</h2>
        <p className="text-gray-600 mt-2 mb-6">{currentStatus.message}</p>

        {status === 'SUCCESS' && (
          <div className="flex w-full items-center gap-3">
              <button 
                onClick={handleDownload} 
                disabled={downloading} 
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {downloading ? 'Generating...' : 'Download Again'}
              </button>
              <button 
                onClick={onClose} 
                className="w-full py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
              >
                OK
              </button>
          </div>
        )}
        {status === 'FAILED' && (
          <button onClick={onClose} className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg">
            Try Again
          </button>
        )}
        {status === 'PENDING' && (
            <button onClick={onClose} className="w-full py-2.5 bg-gray-500 hover:bg-gray-600 text-white rounded-lg">
                Close
            </button>
        )}
      </div>

      <style jsx>{`
        .payment-animation { height: 120px; position: relative; display: flex; align-items: center; justify-content: center; }
        .dots-container { width: 240px; height: 40px; position: relative; }
        .dot { width: 16px; height: 16px; background: #e2e8f0; border-radius: 50%; position: absolute; top: 50%; transform: translateY(-50%); }
        .dot-1 { left: 0; }
        .dot-2 { left: 50%; transform: translate(-50%, -50%); }
        .dot-3 { right: 0; }
        .progress-line { position: absolute; top: 50%; left: 0; transform: translateY(-50%); height: 4px; width: 0; }
        .status-circle { position: absolute; right: -8px; top: 50%; transform: translateY(-50%) scale(0); width: 32px; height: 32px; border-radius: 50%; }
        .status-icon { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0); }
        .success .progress-line { background: #4CAF50; animation: progress-success 1.5s forwards; }
        .success .status-circle { background: #4CAF50; animation: circle-appear 0.5s forwards 1.5s; }
        .success .status-icon { width: 8px; height: 16px; border: solid white; border-width: 0 2px 2px 0; transform: translate(-50%, -50%) rotate(45deg) scale(0); animation: tick-appear 0.5s forwards 1.8s; }
        .success .dot-1 { animation: dot-color-green 0.5s forwards 0.1s; }
        .success .dot-2 { animation: dot-color-green 0.5s forwards 0.8s; }
        .success .dot-3 { animation: dot-color-green 0.5s forwards 1.5s; }
        @keyframes dot-color-green { to { background: #4CAF50; } }
        @keyframes progress-success { to { width: 100%; } }
        .pending .progress-line { background: #FBBF24; animation: progress-pending 1.5s forwards; }
        .pending .dot-1 { animation: dot-color-yellow 0.5s forwards 0.1s; }
        .pending .dot-2 { animation: dot-color-yellow 0.5s forwards 0.8s, pulse 1.5s infinite 0.8s; }
        @keyframes dot-color-yellow { to { background: #FBBF24; } }
        @keyframes progress-pending { 0% { width: 0; } 50% { width: 50%; } 100% { width: 50%; } }
        @keyframes pulse { 0%, 100% { transform: translate(-50%, -50%) scale(1); } 50% { transform: translate(-50%, -50%) scale(1.3); } }
        .failed .progress-line { background: #EF4444; animation: progress-failed 0.5s forwards; }
        .failed .dot-1 { animation: dot-color-red 0.5s forwards 0.1s; }
        .failed .status-circle { background: #EF4444; animation: circle-appear 0.5s forwards 0.5s; }
        .failed .status-icon { width: 14px; height: 14px; animation: cross-appear 0.5s forwards 0.8s; }
        .failed .status-icon::before, .failed .status-icon::after { content: ''; position: absolute; left: 6px; top: 0; height: 14px; width: 2px; background-color: white; }
        .failed .status-icon::before { transform: rotate(45deg); }
        .failed .status-icon::after { transform: rotate(-45deg); }
        @keyframes dot-color-red { to { background: #EF4444; } }
        @keyframes progress-failed { to { width: 0; } }
        @keyframes circle-appear { 0% { transform: translateY(-50%) scale(0); } 50% { transform: translateY(-50%) scale(1.2); } 100% { transform: translateY(-50%) scale(1); } }
        @keyframes tick-appear { 0% { transform: translate(-50%, -50%) rotate(45deg) scale(0); } 50% { transform: translate(-50%, -50%) rotate(45deg) scale(1.2); } 100% { transform: translate(-50%, -50%) rotate(45deg) scale(1); } }
        @keyframes cross-appear { 0% { transform: translate(-50%, -50%) scale(0); } 100% { transform: translate(-50%, -50%) scale(1); } }
      `}</style>
    </div>
  );
}