"use client";
import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import FilesPage from "./_components/FilesPage";
import { useAuth } from "../../../_utils/FirebaseAuthContext";

function Files() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [files, setFiles] = useState([]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?redirect_url=${encodeURIComponent(pathname)}`);
    }
  }, [loading, user, router, pathname]);

  if (loading || !user) return null;

  return (
    <div>
      <FilesPage files={files} setFiles={setFiles} />
    </div>
  );
}

export default Files;
