"use client";
import React from 'react';
import Link from 'next/link';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md p-8">
        <nav className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            ← Back to Home
          </Link>
        </nav>
        
        <h1 className="text-3xl font-bold mb-8 text-gray-900">Privacy Policy</h1>
        
        <div className="space-y-6 text-gray-600">
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-800">Data Collection</h2>
            <p>We collect only necessary information to provide our file sharing service, including:</p>
            <ul className="list-disc ml-6 mt-2">
              <li>Email address for account creation and file sharing</li>
              <li>File metadata (name, size, type)</li>
              <li>Upload and download timestamps</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-800">Data Security</h2>
            <p>Your files are protected using industry-standard encryption and security measures. We implement:</p>
            <ul className="list-disc ml-6 mt-2">
              <li>End-to-end encryption for file transfers</li>
              <li>Secure password protection for shared files</li>
              <li>Regular security audits and updates</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-800">Data Retention</h2>
            <p>Files are automatically deleted after:</p>
            <ul className="list-disc ml-6 mt-2">
              <li>7 days from upload for free users</li>
              <li>30 days in recycle bin</li>
              <li>Account deletion (immediate)</li>
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
