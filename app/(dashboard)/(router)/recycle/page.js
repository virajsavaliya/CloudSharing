"use client";
import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Recycle from "./_components/Recycle"; // <-- fix import
import { useAuth } from "../../../_utils/FirebaseAuthContext";

function RecyclePageWrapper() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [recycleFiles, setRecycleFiles] = useState([]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?redirect_url=${encodeURIComponent(pathname)}`);
    }
  }, [loading, user, router, pathname]);

  if (loading || !user) return null;

  return (
    <div>
      <Recycle recycleFiles={recycleFiles} setRecycleFiles={setRecycleFiles} />
    </div>
  );
}

export default RecyclePageWrapper;
