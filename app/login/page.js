"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const redirect = searchParams.get("redirect_url")
      ? `/sign-in?redirect_url=${encodeURIComponent(searchParams.get("redirect_url"))}`
      : "/sign-in";
    router.replace(redirect);
  }, [router, searchParams]);

  return null;
}
