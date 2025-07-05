"use client";
import React from 'react';
import Link from 'next/link';

const sections = [
  {
    id: "data-collection",
    icon: (
      <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <rect x="4" y="4" width="16" height="16" rx="4" />
        <path d="M8 12h8" strokeLinecap="round"/>
      </svg>
    ),
    title: "Data Collection",
    content: (
      <>
        <p className="mb-2">We collect only necessary information to provide our file sharing service, including:</p>
        <ul className="list-disc ml-6 space-y-1">
          <li>Email address for account creation and file sharing</li>
          <li>File metadata (name, size, type)</li>
          <li>Upload and download timestamps</li>
        </ul>
      </>
    ),
  },
  {
    id: "data-security",
    icon: (
      <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <path d="M9 12l2 2l4 -4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Data Security",
    content: (
      <>
        <p className="mb-2">Your files are protected using industry-standard encryption and security measures. We implement:</p>
        <ul className="list-disc ml-6 space-y-1">
          <li>End-to-end encryption for file transfers</li>
          <li>Secure password protection for shared files</li>
          <li>Regular security audits and updates</li>
        </ul>
      </>
    ),
  },
  {
    id: "data-retention",
    icon: (
      <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path d="M12 8v4l3 3" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="12" r="10" />
      </svg>
    ),
    title: "Data Retention",
    content: (
      <>
        <p className="mb-2">Files are automatically deleted after:</p>
        <ul className="list-disc ml-6 space-y-1">
          <li>7 days from upload for free users</li>
          <li>30 days in recycle bin</li>
          <li>Account deletion (immediate)</li>
        </ul>
      </>
    ),
  },
];

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white py-12 px-2 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation */}
        <aside className="md:w-1/4 mb-8 md:mb-0 sticky top-8 self-start">
          <div className="bg-white rounded-xl shadow p-6">
            <nav className="space-y-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white font-semibold shadow hover:bg-purple-700 transition-colors mb-4"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Back to Home
              </Link>
              {sections.map(sec => (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  className="flex items-center gap-2 text-gray-700 hover:text-purple-600 transition-colors"
                >
                  {sec.icon}
                  <span>{sec.title}</span>
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <div className="bg-white rounded-2xl shadow-lg p-10">
            <header className="mb-10 text-center">
              <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">Privacy Policy</h1>
              <p className="text-lg text-gray-500">Your privacy is important to us. Please review our policy below.</p>
            </header>
            <div className="space-y-12">
              {sections.map(sec => (
                <section key={sec.id} id={sec.id} className="group">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="rounded-full bg-purple-100 p-2 group-hover:scale-110 transition-transform">{sec.icon}</span>
                    <h2 className="text-2xl font-semibold text-gray-800">{sec.title}</h2>
                  </div>
                  <div className="text-gray-700 text-base pl-2">{sec.content}</div>
                </section>
              ))}
            </div>
            <footer className="mt-12 pt-8 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
