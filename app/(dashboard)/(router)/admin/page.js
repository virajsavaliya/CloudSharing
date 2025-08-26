"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AdminDashboard from "./_components/AdminDashboard";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import Link from "next/link"; // Use Link for client-side navigation in breadcrumbs

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace(`/login?redirect_url=/admin`);
      } else {
        // Fetch user role from Firestore for live role updates
        import("../../../../firebaseConfig").then(async ({ db }) => {
          const { doc, getDoc } = await import("firebase/firestore");
          const userDoc = await getDoc(doc(db, "users", user.uid));
          const role = userDoc.exists() ? userDoc.data().role : undefined;
          if (role !== "admin") {
            router.replace('/');
          }
        });
      }
    }
  }, [loading, user, router]);

  if (loading || !user) {
    // Return a loading skeleton for better UX
    return (
      <div className="p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-8"></div>
        <div className="h-12 bg-gray-200 rounded w-full"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="md:block mb-6">
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-1 text-sm text-gray-600">
            <li>
              {/* Using Link for better performance */}
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
              <span className="block transition hover:text-gray-700">
                Admin Panel
              </span>
            </li>
          </ol>
        </nav>
      </div>
      <AdminDashboard />
    </div>
  );
}