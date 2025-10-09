"use client";
import { useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import Head from "next/head";

// Utility function to generate FAQ schema for SEO
const generateFaqSchema = (faqs) => {
  const mainEntity = faqs.map(faq => {
    const question = {
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    };
    if (faq.videoLink) {
      question.acceptedAnswer.text += ` For a clearer understanding, watch the video.`;
      question.acceptedAnswer["hasPart"] = {
        "@type": "VideoObject",
        "name": `Video for ${faq.question}`,
        "description": `Video demonstration for ${faq.question}`,
        "embedUrl": faq.videoLink.replace('googleusercontent.com/', '').trim(),
      };
    }
    return question;
  });

  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": mainEntity,
  }, null, 2);
};

export default function HelpPage() {
  const [expanded, setExpanded] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleAnswer = (index) => {
    setExpanded(expanded === index ? null : index);
  };

  const featureFAQs = [
    {
      question: "File sending capacity?",
      answer: "Maximum file sending capacity depends on your plan. If your plan is Free, the capacity is 50MB. For the Pro plan, the capacity is 2GB, and for the Premium plan, there is no size limit on transfers.",
    },
    {
      question: "How do you send a file?",
      answer: "To initiate the file sending process, first, log in to your account. Then, click on the upload button located on the menu bar, followed by selecting the option to send files.",
      videoLink: 'https://www.youtube.com/embed/L-5D2Q-eSTw?si=DHmdVciRW-ntyD8F'
    },
    {
      question: "How can file history be displayed?",
      answer: 'To display file history, click on the "Files" button in the menu bar. This feature allows you to view files along with their respective history.',
    },
    {
      question: "Can permanently deleted files be recovered?",
      answer: "Once a file is permanently deleted from the recycle bin, it cannot be recovered. However, if a file is deleted from the files page, it can still be recovered from the recycle bin.",
    },
    {
      question: "Can I set a password for my files?",
      answer: "Yes, you can send password-protected files. This feature is available when you upload a file and go to the file preview page. At that page, there will be a password toggle. Enable it, enter the password of your choice, and click on save.",
      videoLink: "https://www.youtube.com/embed/7jVvI77tALI?si=9BC3VkACgk2J5EYJ",
    },
    {
      question: "Can my data be encrypted?",
      answer: "Yes, your data is end-to-end encrypted and stored in our database system. You can send your private files without hesitation.",
    },
  ];

  const supportFAQs = [
    {
      question: "How can I reset my password?",
      answer: 'To reset your password, please follow these steps: Go to the "Your Profile" logo. Click on "Manage Password." Then click on "Security." Click on "Set Password." Enter the new password and confirm it, then click on the "Save" button. For a clearer understanding, watch the video.',
      videoLink: 'https://www.youtube.com/embed/Z8VRSGW2wKc?si=Ta7FbHTSx2xooqOI '
    },
    {
      question: "How can you delete and recover files?",
      answer: 'To delete files, select the "Files" option from the menu bar where you can find the delete button. To recover files, select the recycle bin from the menu bar, where you will see both the delete and recover file options. Clicking on the delete button will permanently delete the file, while clicking on the recover button will restore the file, making it visible again in the files menu.',
      videoLink: "https://www.youtube.com/embed/Y5xDveCrw_U?si=l5rXK5i_pN2Pz412",
    },
    {
      question: "What issue are you having with file or email sending?",
      answer: "If you have any issues, check the email address you entered and your Gmail spam folder. If you still don't receive the message, contact us at cloudsharing.fileshare@gmail.com, and we'll respond within 48 hours.",
      videoLink: "https://www.youtube.com/embed/V6xbgSudX3o?si=NZiR40URBPm4jMUB",
    },
  ];

  const paymentFAQs = [
    {
      question: "What payment methods do you accept?",
      answer: "Sorry for the inconvenience. Right now, we are offering a trial version completely free. After some time, we will announce our accepted payment methods soon.",
    },
  ];

  const filteredFeatureFAQs = featureFAQs.filter((faq) =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSupportFAQs = supportFAQs.filter((faq) =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPaymentFAQs = paymentFAQs.filter((faq) =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const allFAQs = [...featureFAQs, ...supportFAQs, ...paymentFAQs];

  const renderFaqSection = (faqs, sectionStartIdx) => (
    faqs.map((item, index) => {
      const fullIndex = sectionStartIdx + index;
      const isExpanded = expanded === fullIndex;

      return (
        <div key={fullIndex} className="bg-white border border-gray-200 rounded-xl shadow-md mb-4 transition-all duration-300 hover:shadow-lg">
          <div
            className="p-5 cursor-pointer flex justify-between items-center"
            onClick={() => toggleAnswer(fullIndex)}
          >
            <span className="text-gray-800 font-semibold">{item.question}</span>
            <ChevronDown
              size={24}
              className={`transform transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
            />
          </div>
          <div
            className={`grid transition-all duration-300 ease-in-out ${isExpanded ? "grid-rows-[1fr] mt-0" : "grid-rows-[0fr]"}`}
          >
            <div className="overflow-hidden">
              <div className="p-5 pt-0">
                <p className="text-gray-600 leading-relaxed mb-4">{item.answer}</p>
                {item.videoLink && (
                  <iframe
                    className="w-full aspect-video rounded-lg border-none shadow-md"
                    src={item.videoLink.replace('googleusercontent.com/', '')}
                    title={`Video Preview for ${item.question}`}
                    allowFullScreen
                  ></iframe>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    })
  );

  return (
    <>
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: generateFaqSchema(allFAQs) }}
        />
      </Head>
      <div className="flex justify-center w-full my-8 md:my-10 px-4">
        <div className="relative w-full max-w-2xl">
          <input
            type="text"
            placeholder="Search FAQs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-6 pr-12 py-3 rounded-full border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 shadow-sm"
          />
          <Search size={24} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Feature FAQs</h2>
          {renderFaqSection(filteredFeatureFAQs, 0)}
        </div>
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Support FAQs</h2>
          {renderFaqSection(filteredSupportFAQs, featureFAQs.length)}
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 mt-8 sm:mt-10">Payment FAQs</h2>
          {renderFaqSection(filteredPaymentFAQs, featureFAQs.length + supportFAQs.length)}
        </div>
      </div>
    </>
  );
}