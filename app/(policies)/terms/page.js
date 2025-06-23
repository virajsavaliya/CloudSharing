"use client";
import React from 'react';
import Link from 'next/link';

export default function Terms() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md p-8">
        <nav className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            ← Back to Home
          </Link>
        </nav>

        <h1 className="text-3xl font-bold mb-8 text-gray-900">Terms of Service</h1>

        <div className="space-y-6 text-gray-600">
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-800">1. Acceptable Use</h2>
            <p>You agree not to use CloudShare for:</p>
            <ul className="list-disc ml-6 mt-2">
              <li>Sharing illegal or harmful content</li>
              <li>Distributing malware or viruses</li>
              <li>Violating intellectual property rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-800">2. Service Limitations</h2>
            <p>Free accounts are limited to:</p>
            <ul className="list-disc ml-6 mt-2">
              <li>50MB file size limit</li>
              <li>7-day file retention</li>
              <li>Basic sharing features</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-800">3. Account Termination</h2>
            <p>We reserve the right to terminate accounts that:</p>
            <ul className="list-disc ml-6 mt-2">
              <li>Violate our terms of service</li>
              <li>Engage in suspicious activities</li>
              <li>Remain inactive for extended periods</li>
            </ul>
          </section>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
