"use client"

import React, { useState, useEffect } from 'react';
import SideNav from './_components/SideNav';
import TopHeader from './_components/TopHeader';
import Footer from '../_components/FooterWeb';

function Layout({ children }) {
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth <= 768); // Adjust the threshold as needed
    };

    handleResize(); // Call once on initial render to set the initial state
    window.addEventListener('resize', handleResize); // Add event listener for window resize

    return () => {
      window.removeEventListener('resize', handleResize); // Clean up event listener
    };
  }, []); // Empty dependency array to run the effect only once on initial render

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className='h-full md:w-64 flex-col fixed inset-y-0 z-50 md:flex hidden'>
        <SideNav/>
      </div>
      <div className='md:ml-64' style={{ flex: '1' }}>
        <TopHeader />
        {children}
      </div>
      {isSmallScreen && <Footer />} {/* Render footer only on small screens */}
    </div>
  );
}

export default Layout;
