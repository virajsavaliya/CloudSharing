"use client";
import React from 'react';
import Image from 'next/image';

export default function Invoice({
  orderId,
  userEmail,
  planName,
  duration,
  finalAmount,
  paymentMethod
}) {
  const today = new Date();

  // --- GST Calculations ---
  const taxableAmount = finalAmount / 1.18;
  const sgst = taxableAmount * 0.09;
  const cgst = taxableAmount * 0.09;

  const getMonths = (d) => {
    if (d === 'annual') return 12;
    if (d === '3months') return 3;
    return 1;
  };
  const months = getMonths(duration);
  const unitPriceMonthlyPreGst = taxableAmount / months;

  return (
    <div id="invoice-to-download" className="p-10 bg-white text-gray-800 font-sans w-[800px]">
      {/* Header */}
      <div className="border-b-2 border-gray-200 pb-6 mb-8 flex justify-between items-start">
        <div>
          <Image src="/logo.svg" alt="CloudSharing Logo" width={150} height={50} />
          <p className="text-sm text-gray-500 mt-3">
            CloudSharing Inc.<br />
            123 Innovation Drive<br />
            Surat, Gujarat, 395009, India
          </p>
        </div>
        <div className="text-right">
          <h1 className="text-4xl font-bold text-gray-800 uppercase">Invoice</h1>
          <p className="text-sm text-gray-500 mt-2">Invoice #: {orderId.slice(0, 8)}</p>
          <p className="text-sm text-gray-500">Date Issued: {today.toLocaleDateString()}</p>
        </div>
      </div>
      
      {/* Billing & Payment Info */}
      <div className="grid grid-cols-2 gap-4 mb-10">
        <div>
            <h2 className="text-sm font-semibold text-gray-600 mb-2 uppercase">Billed To</h2>
            <p className="text-gray-800 font-medium">{userEmail}</p>
        </div>
        <div>
            <h2 className="text-sm font-semibold text-gray-600 mb-2 uppercase">Payment Method</h2>
            <p className="text-gray-800 font-medium capitalize">
                {paymentMethod?.replace('_', ' ') || 'N/A'}
            </p>
        </div>
      </div>

      {/* Invoice Table */}
      <table className="w-full mb-10">
        <thead className="bg-gray-50">
          <tr className="text-left">
            <th className="p-3 font-semibold text-sm text-gray-600 uppercase">Description</th>
            <th className="p-3 font-semibold text-sm text-gray-600 uppercase text-center">Subscription Period</th>
            <th className="p-3 font-semibold text-sm text-gray-600 uppercase text-right">Unit Price (Monthly)</th>
            <th className="p-3 font-semibold text-sm text-gray-600 uppercase text-right">Amount (Pre-Tax)</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-gray-100">
            <td className="p-3">
              <p className="font-medium text-gray-800">{planName} Plan Subscription</p>
            </td>
            <td className="p-3 text-center capitalize">{months} Months</td>
            <td className="p-3 text-right">₹{unitPriceMonthlyPreGst.toFixed(2)}</td>
            <td className="p-3 text-right">₹{taxableAmount.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      {/* Totals Section */}
      <div className="flex justify-end mb-10">
        <div className="w-full max-w-sm">
          <div className="flex justify-between text-gray-600 py-2">
            <span>Subtotal</span>
            <span>₹{taxableAmount.toFixed(2)}</span>
          </div>
          {/* ✅ Reverted to two separate lines for GST */}
          <div className="flex justify-between text-gray-600 py-2">
            <span>SGST (9%)</span>
            <span>₹{sgst.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-600 py-2 border-b border-gray-200">
            <span>CGST (9%)</span>
            <span>₹{cgst.toFixed(2)}</span>
          </div>
          <div className="border-t-2 border-gray-200 mt-2 pt-2 flex justify-between font-bold text-xl text-gray-800">
            <span>Total Paid</span>
            <span>₹{finalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Footer & Conditions */}
      <div className="border-t-2 border-gray-200 pt-6 text-sm text-gray-500">
        <h3 className="font-semibold text-gray-600 mb-2">Terms & Conditions</h3>
        <p className="mb-1">1. This is a digital receipt for a subscription service. No physical goods will be delivered.</p>
        <p className="mb-1">2. All payments are final and non-refundable, except as required by law.</p>
        <p>3. Your subscription will auto-renew unless canceled. You can manage your subscription from your account settings.</p>
      </div>
    </div>
  );
}