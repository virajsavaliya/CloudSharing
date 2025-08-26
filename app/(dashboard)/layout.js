"use client"

import React, { useState, useEffect } from 'react';
import SideNav from './_components/SideNav';
import TopHeader from './_components/TopHeader';
import Footer from '../_components/FooterWeb';

function Layout({ children }) {
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth <= 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div 
        // Changed 'transition-all' to 'transition-[width]' for a smoother, more specific animation
        className={`h-full flex-col fixed inset-y-0 z-50 md:flex hidden transition-[width] duration-300 ease-in-out ${
          isExpanded ? 'md:w-64' : 'md:w-20'
        }`}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        <SideNav isExpanded={isExpanded}/>
      </div>

      <div
        // Changed 'transition-all' to 'transition-[margin-left]'
        className={`transition-[margin-left] duration-300 ease-in-out ${
          isExpanded ? 'md:ml-64' : 'md:ml-20'
        }`}
        style={{
          flex: '1',
          paddingTop: '64px',
        }}
      >
        <style jsx>{`
          @media (min-width: 768px) {
            div[style*="padding-top"] {
              padding-top: 0 !important;
            }
          }
        `}</style>
        <TopHeader />
        {children}
      </div>
      {isSmallScreen && <Footer />}
    </div>
  );
}

export default Layout;