import { Inter } from "next/font/google";
import "./globals.css";
import 'react-toastify/dist/ReactToastify.css';
import PageWrapper from "./PageWrapper"; // Import the new component

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "CloudSharing",
  description: "File Sharing Website",
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
      </body>
    </html>
  );
}