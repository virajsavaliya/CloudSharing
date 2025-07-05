"use client";
import React from 'react';
import Link from 'next/link';

const sections = [
	{
		id: "acceptable-use",
		icon: (
			<svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
				<path d="M9 12l2 2l4 -4" strokeLinecap="round" strokeLinejoin="round" />
				<circle cx="12" cy="12" r="10" />
			</svg>
		),
		title: "Acceptable Use",
		content: (
			<>
				<p className="mb-2">You agree not to use CloudShare for:</p>
				<ul className="list-disc ml-6 space-y-1">
					<li>Sharing illegal or harmful content</li>
					<li>Distributing malware or viruses</li>
					<li>Violating intellectual property rights</li>
				</ul>
			</>
		),
	},
	{
		id: "service-limitations",
		icon: (
			<svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
				<rect x="4" y="4" width="16" height="16" rx="4" />
				<path d="M8 12h8" strokeLinecap="round" />
			</svg>
		),
		title: "Service Limitations",
		content: (
			<>
				<p className="mb-2">Free accounts are limited to:</p>
				<ul className="list-disc ml-6 space-y-1">
					<li>50MB file size limit</li>
					<li>7-day file retention</li>
					<li>Basic sharing features</li>
				</ul>
			</>
		),
	},
	{
		id: "account-termination",
		icon: (
			<svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
				<path d="M18 6L6 18" strokeLinecap="round" />
				<path d="M6 6l12 12" strokeLinecap="round" />
			</svg>
		),
		title: "Account Termination",
		content: (
			<>
				<p className="mb-2">We reserve the right to terminate accounts that:</p>
				<ul className="list-disc ml-6 space-y-1">
					<li>Violate our terms of service</li>
					<li>Engage in suspicious activities</li>
					<li>Remain inactive for extended periods</li>
				</ul>
			</>
		),
	},
];

export default function Terms() {
	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-12 px-2 sm:px-6 lg:px-8">
			<div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8">
				{/* Sidebar Navigation */}
				<aside className="md:w-1/4 mb-8 md:mb-0 sticky top-8 self-start">
					<div className="bg-white rounded-xl shadow p-6">
						<nav className="space-y-4">
							<Link
								href="/"
								className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition-colors mb-4"
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
									className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
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
							<h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">Terms of Service</h1>
							<p className="text-lg text-gray-500">Please read these terms carefully before using CloudShare.</p>
						</header>
						<div className="space-y-12">
							{sections.map(sec => (
								<section key={sec.id} id={sec.id} className="group">
									<div className="flex items-center gap-3 mb-4">
										<span className="rounded-full bg-blue-100 p-2 group-hover:scale-110 transition-transform">{sec.icon}</span>
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
