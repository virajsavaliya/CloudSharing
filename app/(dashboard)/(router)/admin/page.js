"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AdminDashboard from "./_components/AdminDashboard";
import { getAuth, onAuthStateChanged } from "firebase/auth";

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
    return null;
  }

  return (
    <div className="p-6">
      <div className="md:block mb-6">
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-1 text-sm text-gray-600">
            <li>
              <a href="/" className="block transition hover:text-gray-700">
                Home
              </a>
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