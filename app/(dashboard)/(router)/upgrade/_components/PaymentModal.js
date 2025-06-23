"use client";
import React, { useState, useEffect } from 'react';
import { CreditCard, Smartphone, Building2, QrCode, DollarSign, Calendar, Lock, User, ChevronDown, Trash2 } from 'lucide-react';
import Image from 'next/image';

export default function PaymentModal({ plan, onClose, onSuccess }) {
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [savedCards, setSavedCards] = useState([]);
  const [showSavedCards, setShowSavedCards] = useState(false);
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
    name: '',
    upiId: '',
    bank: ''
  });

  // Load saved cards from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem('savedCards');
    if (saved) {
      setSavedCards(JSON.parse(saved));
    }
  }, []);

  // Function to save card details
  const saveCard = (cardDetails) => {
    const newSavedCards = [...savedCards, cardDetails];
    setSavedCards(newSavedCards);
    localStorage.setItem('savedCards', JSON.stringify(newSavedCards));
  };

  // Function to select saved card
  const selectSavedCard = (card) => {
    setFormData({
      ...formData,
      cardNumber: card.cardNumber,
      expiry: card.expiry,
      name: card.name
    });
    setShowSavedCards(false);
  };

  // Add delete card function
  const deleteCard = (cardToDelete) => {
    const updatedCards = savedCards.filter(card => card.cardNumber !== cardToDelete.cardNumber);
    setSavedCards(updatedCards);
    localStorage.setItem('savedCards', JSON.stringify(updatedCards));
  };

  // Format card number with spaces every 4 digits
  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  // Format expiry date (MM/YY) with validation
  const formatExpiryDate = (value) => {
    const cleanValue = value.replace(/[^\d]/g, '');
    if (cleanValue.length >= 2) {
      const month = parseInt(cleanValue.slice(0, 2));
      if (month > 12) {
        return '12/' + cleanValue.slice(2, 4);
      } else if (month < 1) {
        return '01/' + cleanValue.slice(2, 4);
      }
      return cleanValue.slice(0, 2) + '/' + cleanValue.slice(2, 4);
    }
    return cleanValue;
  };

  const handleExpiryChange = (e) => {
    let value = e.target.value;
    if (value.length <= 5) {
      value = formatExpiryDate(value);
      // Validate year to be current or future
      if (value.length === 5) {
        const [month, year] = value.split('/');
        const currentYear = new Date().getFullYear() % 100;
        const currentMonth = new Date().getMonth() + 1;
        
        if (parseInt(year) < currentYear || 
            (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
          // If date is in past, set to current month/year
          const formattedMonth = currentMonth.toString().padStart(2, '0');
          const formattedYear = currentYear.toString();
          value = `${formattedMonth}/${formattedYear}`;
        }
      }
      setFormData({ ...formData, expiry: value });
    }
  };

  const handleCardNumberChange = (e) => {
    let value = e.target.value;
    if (value.length <= 19) { // Max length including spaces
      value = formatCardNumber(value);
      setFormData({ ...formData, cardNumber: value });
    }
  };

  // Modify handleSubmit to include card saving
  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);

    if (paymentMethod === 'card') {
      const cardNumbers = formData.cardNumber.replace(/\s/g, '');
      if (cardNumbers.length !== 16) {
        alert('Please enter a valid 16-digit card number');
        setProcessing(false);
        return;
      }
      
      // Save card if it's not already saved
      const isCardSaved = savedCards.some(card => card.cardNumber === formData.cardNumber);
      if (!isCardSaved) {
        const cardToSave = {
          cardNumber: formData.cardNumber,
          expiry: formData.expiry,
          name: formData.name
        };
        saveCard(cardToSave);
      }
    } else if (paymentMethod === 'upi' && !formData.upiId) {
      alert('Please enter a valid UPI ID');
      setProcessing(false);
      return;
    } else if (paymentMethod === 'netbanking' && !formData.bank) {
      alert('Please select a bank');
      setProcessing(false);
      return;
    }

    // Simulate payment processing
    setTimeout(() => {
      setProcessing(false);
      onSuccess();
    }, 2000);
  };

  const banks = [
    "State Bank of India",
    "HDFC Bank",
    "ICICI Bank",
    "Axis Bank",
    "Kotak Mahindra Bank",
    "Bank of Baroda"
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-8 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <DollarSign className="text-blue-600" size={24} />
            </div>
            <h2 className="text-2xl font-bold">Payment Details</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        {/* Payment Method Selector */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          <button
            onClick={() => setPaymentMethod('card')}
            className={`p-3 flex flex-col items-center gap-1 rounded-lg border ${
              paymentMethod === 'card' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            }`}
          >
            <CreditCard size={20} />
            <span className="text-xs">Card</span>
          </button>
          <button
            onClick={() => setPaymentMethod('upi')}
            className={`p-3 flex flex-col items-center gap-1 rounded-lg border ${
              paymentMethod === 'upi' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            }`}
          >
            <Smartphone size={20} />
            <span className="text-xs">UPI</span>
          </button>
          <button
            onClick={() => setPaymentMethod('netbanking')}
            className={`p-3 flex flex-col items-center gap-1 rounded-lg border ${
              paymentMethod === 'netbanking' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            }`}
          >
            <Building2 size={20} />
            <span className="text-xs">NetBanking</span>
          </button>
          <button
            onClick={() => setPaymentMethod('qr')}
            className={`p-3 flex flex-col items-center gap-1 rounded-lg border ${
              paymentMethod === 'qr' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            }`}
          >
            <QrCode size={20} />
            <span className="text-xs">QR</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {paymentMethod === 'card' && (
            <>
              {/* Saved Cards Section */}
              {savedCards.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Saved Cards</label>
                  <div className="space-y-2">
                    {savedCards.map((card, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-blue-500 transition-colors"
                      >
                        <button
                          type="button"
                          onClick={() => selectSavedCard(card)}
                          className="flex items-center gap-3 flex-1"
                        >
                          <CreditCard size={20} className="text-gray-400" />
                          <div className="flex flex-col">
                            <span className="font-medium">•••• {card.cardNumber.slice(-4)}</span>
                            <span className="text-sm text-gray-500">{card.name}</span>
                          </div>
                          <span className="text-sm text-gray-500 ml-auto">{card.expiry}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteCard(card)}
                          className="ml-2 p-1.5 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50"
                          title="Delete card"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                <div className="relative flex items-center">
                  <CreditCard className="absolute left-3 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="4242 4242 4242 4242"
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-0 transition-colors"
                    value={formData.cardNumber}
                    onChange={handleCardNumberChange}
                    maxLength="19"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                  <div className="relative flex items-center">
                    <Calendar className="absolute left-3 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="MM/YY"
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-0 transition-colors"
                      value={formData.expiry}
                      onChange={handleExpiryChange}
                      maxLength="5"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="123"
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-0 transition-colors"
                      maxLength="3"
                      value={formData.cvv}
                      onChange={(e) => setFormData({...formData, cvv: e.target.value.replace(/\D/g, '').slice(0, 3)})}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cardholder Name</label>
                <div className="relative flex items-center">
                  <User className="absolute left-3 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="John Doe"
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-0 transition-colors"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>
            </>
          )}

          {paymentMethod === 'upi' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">UPI ID</label>
              <div className="mt-1 relative">
                <input
                  type="text"
                  placeholder="username@upi"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  value={formData.upiId}
                  onChange={(e) => setFormData({...formData, upiId: e.target.value})}
                />
              </div>
            </div>
          )}

          {paymentMethod === 'netbanking' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Select Bank</label>
              <select
                className="mt-1 block w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                value={formData.bank}
                onChange={(e) => setFormData({...formData, bank: e.target.value})}
              >
                <option value="">Select a bank</option>
                {banks.map((bank) => (
                  <option key={bank} value={bank}>{bank}</option>
                ))}
              </select>
            </div>
          )}

          {paymentMethod === 'qr' && (
            <div className="flex flex-col items-center gap-4">
              <Image src="/qr-code.png" alt="Payment QR Code" className="w-48 h-48" />
              <p className="text-sm text-gray-600">Scan with any UPI app to pay</p>
            </div>
          )}

          <button
            type="submit"
            disabled={processing}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <DollarSign size={20} />
                <span>Pay ₹{plan} Plan</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
