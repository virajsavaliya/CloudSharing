"use client";
import { usePathname } from 'next/navigation';
import Footer from './_components/Footer'; // Adjust path to your Footer component

export default function PathBasedLayout({ children }) {
  const pathname = usePathname();

  // Define the routes where you want to hide the footer
  const hideFooterOnRoutes = ['/chat'];

  const shouldHideFooter = hideFooterOnRoutes.includes(pathname);

  return (
    <>
      {children}
      {!shouldHideFooter && <Footer />}
    </>
  );
}