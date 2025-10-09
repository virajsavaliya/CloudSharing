"use client";
import React from "react";
import HelpPage from "./_components/HelpPage";
import Link from "next/link";
import Head from "next/head";

function Help() {
  const HelpTitle = () => (
    <div className="text-center my-10 md:my-16 px-4">
      <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
        Frequently Asked Questions
      </h1>
      <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto">
        Find answers to common questions about our features, support, and pricing.
      </p>
    </div>
  );

  const NavLocation = () => (
    <div className="block mt-4 sm:mt-8 ml-4 sm:ml-8">
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-1 text-sm text-gray-500">
          <li>
            <Link href="/" className="block transition hover:text-gray-700">
              <span className="sr-only"> Home </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
            </Link>
          </li>
          <li className="rtl:rotate-180">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </li>
          <li>
            <a href="#" className="block transition font-bold text-gray-700">
              Help
            </a>
          </li>
        </ol>
      </nav>
    </div>
  );

  return (
    <>
      <Head>
        <title>Help & FAQ | Cloudsharing</title>
        <meta name="description" content="Find answers to frequently asked questions about file sharing, features, and support on our help page." />
      </Head>
      <div className="bg-gray-50 min-h-screen">
        <NavLocation />
        <HelpTitle />
        <HelpPage />
      </div>
    </>
  );
}

export default Help;