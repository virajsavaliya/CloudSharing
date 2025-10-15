  import Header from "./_components/Header";
  import Hero from "./_components/Hero";
  import Footer from "./_components/FooterWeb";

  export const metadata = {
    title: "CloudSharing - Secure File Sharing & Video Conferencing Platform",
    description: "Share files securely with advanced encryption, real-time video meetings, and collaborative tools. Upload, share, and manage your files with ease. Free cloud storage with premium features.",
    keywords: "file sharing, cloud storage, video conferencing, secure file transfer, online collaboration, document sharing, video meetings",
    openGraph: {
      title: "CloudSharing - Secure File Sharing & Video Conferencing",
      description: "Share files securely with advanced encryption, real-time video meetings, and collaborative tools.",
      type: "website",
      url: "https://cloudsharing.vercel.app",
      siteName: "CloudSharing",
      images: [
        {
          url: "/logo.svg",
          width: 1200,
          height: 630,
          alt: "CloudSharing Logo"
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title: "CloudSharing - Secure File Sharing & Video Conferencing",
      description: "Share files securely with advanced encryption, real-time video meetings, and collaborative tools.",
      images: ["/logo.svg"]
    }
  };

  export default function Home() {
    return (
      <div>
      <Header/>
      <Hero/>
      <Footer/>
      </div>
    );
  }
