// pages/_app.js

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { getAuth, onAuthStateChanged } from "firebase/auth";

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  // Set color scheme to light when the app loads
  useEffect(() => {
    const handleRouteChange = () => {
      document.documentElement.setAttribute('color-scheme', 'light');
    };
    handleRouteChange();
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router]);

  // Auth route protection
  useEffect(() => {
    const protectedRoutes = [
      "/files",
      "/upload",
      "/recycle",
      "/admin",
      "/meeting", // <-- Add meeting to protected routes
      "/chats"
    ];
    const auth = getAuth();
    let unsub = onAuthStateChanged(auth, (user) => {
      const isProtected = protectedRoutes.some((route) =>
        router.pathname.startsWith(route)
      );
      if (isProtected) {
        if (!user) {
          // Not logged in, redirect to login
          router.replace(`/login?redirect_url=${encodeURIComponent(router.asPath)}`);
        } else if (
          router.pathname.startsWith("/admin") &&
          user.email !== "savaliyaviraj5@gmail.com"
        ) {
          // Not admin, redirect to home
          router.replace("/");
        }
      }
    });
    return () => unsub && unsub();
  }, [router]);

  return <Component {...pageProps} />;
}

export default MyApp;
