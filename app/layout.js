import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import ChatBot from './_components/ChatBot';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from "./_utils/FirebaseAuthContext";
import { PresenceProvider } from "./_components/PresenceProvider"; // ✅ Now a proper provider


// Load the fonts
const inter = Inter({ subsets: ["latin"] });
const outfit = Outfit({ subsets: ["latin"] });

export const metadata = {
  title: "CloudSharing",
  description: "File Sharing Website",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
        {/* Favicons for multiple platforms */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/svg+xml" href="/favicon_io/favicon.svg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon_io/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon_io/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon_io/favicon-16x16.png" />
        <link rel="manifest" href="/favicon_io/site.webmanifest" />
        <meta name="theme-color" content="#2563eb" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          {/* ✅ WRAP children and other components inside PresenceProvider */}
          <PresenceProvider> 
            {children}
            <ChatBot />
            <ToastContainer
              position="bottom-right"
              autoClose={4000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
            />
            <Toaster
              position="top-center"
              reverseOrder={false}
              gutter={8}
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
              }}
            />
          </PresenceProvider>
        </AuthProvider>
      </body>
    </html>
  );
}