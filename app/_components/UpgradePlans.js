'use client';

import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

const calculatePrice = (basePrice, duration) => {
  const inrPrice = basePrice * 83;
  switch (duration) {
    case '3months':
      return Math.round(inrPrice * 3 * 0.85);
    case 'annual':
      return Math.round(inrPrice * 12 * 0.7);
    default:
      return Math.round(inrPrice);
  }
};

const plans = [
  {
    name: 'Free',
    basePrice: 0,
    features: ['50MB file size limit', 'Basic sharing', 'Email support'],
    storageLimit: '1 GB',
    isFree: true,
  },
  {
    name: 'Pro',
    basePrice: 9.99,
    features: ['2GB file size limit', 'Password protection', 'Priority support'],
    storageLimit: '100 GB',
    isFree: false,
    isPopular: true, // Mark Pro as the most popular
  },
  {
    name: 'Premium',
    basePrice: 19.99,
    features: ['Unlimited file size', 'Advanced analytics', '24/7 support'],
    storageLimit: '500 GB',
    isFree: false,
  },
];

export default function UpgradePlans() {
  const router = useRouter();
  const [duration, setDuration] = useState('monthly');

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tighter mb-8">
          Upgrade Your Plan
        </h2>

        {/* Duration Selector */}
        <div className="flex justify-center gap-4 mb-8 flex-wrap">
          <button
            onClick={() => setDuration('monthly')}
            className={`px-4 py-2 rounded-lg ${
              duration === 'monthly' ? 'bg-blue-600 text-white' : 'bg-gray-100'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setDuration('3months')}
            className={`px-4 py-2 rounded-lg ${
              duration === '3months' ? 'bg-blue-600 text-white' : 'bg-gray-100'
            }`}
          >
            3 Months <span className="text-sm text-green-500 ml-1">Save 15%</span>
          </button>
          <button
            onClick={() => setDuration('annual')}
            className={`px-4 py-2 rounded-lg ${
              duration === 'annual' ? 'bg-blue-600 text-white' : 'bg-gray-100'
            }`}
          >
            Annual <span className="text-sm text-green-500 ml-1">Save 30%</span>
          </button>
        </div>

        {/* Plan Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`rounded-lg border p-6 flex flex-col justify-between shadow hover:shadow-lg transition-all relative ${
                plan.isPopular ? 'border-blue-600' : 'border-gray-200'
              }`}
            >
              {plan.isPopular && (
                <span className="absolute top-4 right-4 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">
                  Most Popular
                </span>
              )}

              <div>
                <h3 className="text-2xl font-bold mb-4">{plan.name}</h3>
                <p className="text-3xl font-bold mb-4">
                  ₹{calculatePrice(plan.basePrice, duration)}
                  {!plan.isFree && (
                    <span className="text-sm font-normal">
                      /{duration === 'annual' ? 'year' : duration === '3months' ? '3 months' : 'month'}
                    </span>
                  )}
                </p>

                <p className="text-gray-600 mb-4">Storage: {plan.storageLimit}</p>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <Check className="text-green-500" size={20} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => !plan.isFree && router.push('/upgrade')}
                disabled={plan.isFree}
                className={`w-full py-2 rounded-md ${
                  plan.isFree
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {plan.isFree ? 'Current Plan' : 'Upgrade'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
