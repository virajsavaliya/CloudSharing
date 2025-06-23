import Image from "next/image";
import React from "react";

function Header() {
  return (
    <header className="bg-white shadow-md">
      <div className="mx-auto flex h-16 max-w-screen-xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <Image 
            src="/logo.svg"
            alt="CloudShare Logo"
            width={180} 
            height={100}
            priority
            className="object-contain"
          />
        </div>

        <div className="flex items-center gap-4">
          <a
            className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            href="/upload"
          >
            Get Started
          </a>
        </div>
      </div>
    </header>
  );
}

export default Header;