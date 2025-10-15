import { Inter } from "next/font/google";
import "./globals.css";
// Import react-toastify CSS without source maps to prevent 404 errors
import './toastify.css';
import PageWrapper from "./PageWrapper"; // Import the new component
import { SpeedInsights } from '@vercel/speed-insights/next';

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "CloudSharing - Secure File Sharing & Video Conferencing Platform",
  description: "Share files securely with advanced encryption, real-time video meetings, and collaborative tools. Upload, share, and manage your files with ease. Free cloud storage with premium features.",
  keywords: "file sharing, cloud storage, video conferencing, secure file transfer, online collaboration, document sharing, video meetings, file management",
  authors: [{ name: "CloudSharing Team" }],
  creator: "CloudSharing",
  publisher: "CloudSharing",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://cloudsharing.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "CloudSharing - Secure File Sharing & Video Conferencing",
    description: "Share files securely with advanced encryption, real-time video meetings, and collaborative tools.",
    url: "https://cloudsharing.vercel.app",
    siteName: "CloudSharing",
    images: [
      {
        url: "/logo.svg",
        width: 1200,
        height: 630,
        alt: "CloudSharing Logo"
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: "summary_large_image",
    title: "CloudSharing - Secure File Sharing & Video Conferencing",
    description: "Share files securely with advanced encryption, real-time video meetings, and collaborative tools.",
    images: ["/logo.svg"],
    creator: "@cloudsharing",
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  other: {
    'permissions-policy': 'camera=*, microphone=*, display-capture=*'
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#ffffff" />
        {/* Favicon and App Icons */}
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon_io/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon_io/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon_io/favicon-16x16.png" />
        <link rel="manifest" href="/favicon_io/site.webmanifest" />
        <link rel="shortcut icon" href="/favicon_io/favicon.ico" />
      </head>

      <body className={inter.className}>
        <PageWrapper>
          {children}
        </PageWrapper>
        <SpeedInsights />
      </body>
    </html>
  );
}