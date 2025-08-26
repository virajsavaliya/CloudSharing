"use client";
import { usePathname } from 'next/navigation';
import { AuthProvider } from "./_utils/FirebaseAuthContext";
import { PresenceProvider } from "./_components/PresenceProvider";
import ChatBot from './_components/ChatBot';
import { ToastContainer } from 'react-toastify';
import { Toaster } from 'react-hot-toast';
// import Footer from './_components/Footer'; // Make sure this path is correct

export default function RootContent({ children }) {
    const pathname = usePathname();
    const shouldHideFooter = pathname.startsWith('/chat');

    return (
        <AuthProvider>
            <PresenceProvider>
                {children}
                <ChatBot />
                {/* Conditionally render the footer */}
                {/* {!shouldHideFooter && <Footer />} */}
                <ToastContainer position="bottom-right" autoClose={4000} />
                <Toaster position="top-center" />
            </PresenceProvider>
        </AuthProvider>
    );
}