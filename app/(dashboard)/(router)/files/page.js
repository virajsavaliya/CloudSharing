"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useRouter, usePathname } from "next/navigation";
import FilesPage from "./_components/FilesPage";
import { useAuth } from "../../../_utils/FirebaseAuthContext";
import Image from 'next/image';

function Files() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?redirect_url=${encodeURIComponent(pathname)}`);
    }
  }, [loading, user, router, pathname]);

  if (loading || !user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Image src="/loader.gif" alt="Loading..." width={350} height={350} />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <Suspense fallback={<div>Loading...</div>}>
        <FilesPage 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      </Suspense>
    </div>
  );
}

export default Files;
