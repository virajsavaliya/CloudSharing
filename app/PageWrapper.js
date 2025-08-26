"use client";
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { AuthProvider } from "./_utils/FirebaseAuthContext";
import { PresenceProvider } from "./_components/PresenceProvider";
import ChatBot from './_components/ChatBot';
import { ToastContainer } from 'react-toastify';
import { Toaster } from 'react-hot-toast';
// import Footer from './_components/Footer'; // Assuming you have a footer

export default function PageWrapper({ children }) {
    const pathname = usePathname();

    useEffect(() => {
        document.body.setAttribute('data-path', pathname);
    }, [pathname]);

    // ✅ Conditionally show the chatbot
    const shouldShowChatBot = !pathname.startsWith('/chat');

    return (
        <AuthProvider>
            <PresenceProvider>
                {children}
                
                {/* Render ChatBot only if not on the chat page */}
                {shouldShowChatBot && <ChatBot />}

                {/* The footer logic can be kept as well */}
                {/* {!pathname.startsWith('/chat') && <Footer />} */}

                <ToastContainer position="bottom-right" autoClose={4000} />
                <Toaster position="top-center" />
            </PresenceProvider>
        </AuthProvider>
    );
}