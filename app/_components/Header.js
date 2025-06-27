import Link from "next/link";
import Image from "next/image";
import React from "react";
import { Share2 } from "lucide-react";

function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-transparent py-4">
      <div className="container mx-auto px-4">
        <div
          className="bg-white/60 backdrop-blur-xl rounded-full shadow-lg border border-white/30 p-3 flex items-center justify-between"
          style={{
            boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.10)",
            border: "1px solid rgba(255,255,255,0.18)",
          }}
        >
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 font-black text-xl text-primary ml-2 tracking-tight"
            >
              <Image 
                src="/logo.svg" 
                alt="Loading..." 
                width={150}
                height={40}
                className="w-100 h-100" 
              />
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/upload"
              className="rounded-full bg-blue-600 text-white px-6 py-2 font-semibold shadow hover:bg-blue-700 transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;