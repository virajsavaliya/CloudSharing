"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useUser } from "@clerk/nextjs";
import { doc, getFirestore, setDoc, getDoc } from "firebase/firestore";
import { app } from "../../../firebaseConfig";

export default function Unsubscribe() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const { user } = useUser();
  const db = getFirestore(app);

  const handleUnsubscribe = async (e) => {
    e.preventDefault();
    const emailToUnsubscribe = email || user?.primaryEmailAddress?.emailAddress;
    
    if (!emailToUnsubscribe) {
      setStatus('error');
      return;
    }

    try {
      setStatus('processing');
      
      // Check if user exists in subscriptions
      const userDocRef = doc(db, "emailSubscriptions", emailToUnsubscribe);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        setStatus('not-found');
        return;
      }

      // Update subscription status
      await setDoc(userDocRef, {
        email: emailToUnsubscribe,
        subscribed: false,
        unsubscribedAt: new Date(),
        userId: user?.id || null
      });

      setStatus('success');
      setEmail('');
      
    } catch (error) {
      console.error("Unsubscribe error:", error);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md p-8">
        <nav className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            ← Back to Home
          </Link>
        </nav>

        <h1 className="text-3xl font-bold mb-8 text-gray-900">Unsubscribe</h1>

        <div className="space-y-6">
          <p className="text-gray-600">
            Unsubscribe from CloudShare email notifications. You can resubscribe at any time from your account settings.
          </p>

          <form onSubmit={handleUnsubscribe} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email || (user?.primaryEmailAddress?.emailAddress || '')}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your email"
                required
              />
            </div>

            <button
              type="submit"
              disabled={status === 'processing'}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                status === 'processing' 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {status === 'processing' ? 'Processing...' : 'Unsubscribe'}
            </button>
          </form>

          {status === 'success' && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-700">
                You have been successfully unsubscribed from our emails.
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700">
                There was an error processing your request. Please try again.
              </p>
            </div>
          )}

          {status === 'not-found' && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-yellow-700">
                This email address is not found in our subscription list.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
