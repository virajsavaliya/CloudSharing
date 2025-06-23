"use client";
import { useState } from "react";
import styled from "styled-components";
import { ChevronDown, Search } from "lucide-react";


const Container = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const SearchBarContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
  grid-column: span 2;

  @media (max-width: 768px) {
    padding: 10px;
  }
`;

const SearchBarWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
    
`;

const SearchBar = styled.input`
  width: 100%;
  max-width: 600px;
  padding: 10px 40px 10px 10px; // Adjust padding to accommodate the icon
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 16px;
`;
const SearchIcon = styled(Search)`
  position: absolute;
  right: 10px; // Adjust as needed
  color: #ccc;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
`;

const Title = styled.h2`
  margin-bottom: 20px;
  font-size: 20px;
  font-weight: bold;
`;

const Question = styled.div`
  position: relative;
  width: 100%;
  padding: 15px;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  margin-bottom: 20px;

  &:hover {
    background-color: #e0e0e0;
  }
`;

const QuestionContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Answer = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== "expanded"
})`
  display: ${(props) => (props.expanded ? "block" : "none")};
  padding: 15px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background-color: #fff;
  margin-top: 10px;
  max-height: ${(props) => (props.expanded ? "500px" : "0")};
  overflow: hidden;
  transition: max-height 0.3s ease;
`;


const VideoPreview = styled.iframe`
  width: 100%;
  height: 250px;
  border: none;
  border-radius: 8px;
  margin-top: 10px;
`;

const AnswerText = styled.div`
  margin-bottom: 10px;
`;

const RotateChevronDown = styled(ChevronDown).withConfig({
  shouldForwardProp: (prop) => prop !== "expanded"
})`
  transition: transform 0.3s ease;
  transform: ${(props) => (props.expanded ? "rotate(180deg)" : "none")};
`;


export default function HelpPage() {
  const [expanded, setExpanded] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleAnswer = (index) => {
    setExpanded(expanded === index ? null : index);
  };

  const featureFAQs = [
    {
      question: "File sending capacity?",
      answer:
        "Maximum file sending capacity depends on your plan. If your plan is Free, the capacity is 50MB. For the Pro plan, the capacity is 2GB, and for the Premium plan, there is no size limit on transfers.",
    },
    {
      question: "How do you send a file?",
      answer:
        "To initiate the file sending process, first, log in to your account. Then, click on the upload button located on the menu bar, followed by selecting the option to send files.",
      videoLink: 'https://www.youtube.com/embed/L-5D2Q-eSTw?si=DHmdVciRW-ntyD8F'
    },
    {
      question: "How can file history be displayed?",
      answer:
        'To display file history, click on the "Files" button in the menu bar. This feature allows you to view files along with their respective history.',
    },
    {
      question: "Can permanently deleted files be recovered?",
      answer:
        "Once a file is permanently deleted from the recycle bin, it cannot be recovered. However, if a file is deleted from the files page, it can still be recovered from the recycle bin.",
    },
    {
      question: "Can I set a password for my files?",
      answer:
        "Yes, you can send password-protected files. This feature is available when you upload a file and go to the file preview page. At that page, there will be a password toggle. Enable it, enter the password of your choice, and click on save.",
      videoLink: "https://www.youtube.com/embed/7jVvI77tALI?si=9BC3VkACgk2J5EYJ",
    },
    {
      question: "Can my data be encrypted?",
      answer:
        "Yes, your data is end-to-end encrypted and stored in our database system. You can send your private files without hesitation.",
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
      answer:
        'To delete files, select the "Files" option from the menu bar where you can find the delete button. To recover files, select the recycle bin from the menu bar, where you will see both the delete and recover file options. Clicking on the delete button will permanently delete the file, while clicking on the recover button will restore the file, making it visible again in the files menu.',
      videoLink: "https://www.youtube.com/embed/Y5xDveCrw_U?si=l5rXK5i_pN2Pz412",
    },
    {
      question: "What issue are you having with file or email sending?",
      answer:
        "If you have any issues, check the email address you entered and your Gmail spam folder. If you still don't receive the message, contact us at cloudsharing.fileshare@gmail.com, and we'll respond within 48 hours.",
      videoLink: "https://www.youtube.com/embed/V6xbgSudX3o?si=NZiR40URBPm4jMUB",
    },

  ];

  const paymentFAQs = [
    {
      question: "What payment methods do you accept?",
      answer:
        "Sorry for the inconvenience. Right now, we are offering a trial version completely free. After some time, we will announce our accepted payment methods soon.",
    },
    // Add more FAQs as needed
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

  return (
    <>
      <SearchBarContainer>
        <SearchBarWrapper>
          <SearchBar
            type="text"
            placeholder="Search FAQs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <SearchIcon size={24} />
        </SearchBarWrapper>
      </SearchBarContainer>
      <Container>
        <Section>
          <Title>Feature FAQs</Title>
          {filteredFeatureFAQs.map((item, index) => (
            <div key={index}>
              <Question onClick={() => toggleAnswer(index)}>
                <QuestionContent>
                  {item.question}
                  <RotateChevronDown expanded={expanded === index ? 'true' : undefined} size={24} />
                </QuestionContent>
                <Answer expanded={expanded === index ? true : undefined}>
                  <AnswerText>{item.answer}</AnswerText>
                  {expanded === index && item.videoLink && (
                    <VideoPreview
                      src={item.videoLink}
                      title={`Video Preview for ${item.question}`}
                    />
                  )}
                </Answer>
              </Question>
            </div>
          ))}
        </Section>
        <Section>
          <Title>Support FAQs</Title>
          {filteredSupportFAQs.map((item, index) => (
            <div key={index}>
              <Question
                onClick={() => toggleAnswer(index + featureFAQs.length)}
              >
                <QuestionContent>
                  {item.question}
                  <RotateChevronDown
                    expanded={expanded === index + featureFAQs.length}
                    size={24}
                  />
                </QuestionContent>
                <Answer expanded={expanded === index + featureFAQs.length ? true : undefined}>
                  <AnswerText>{item.answer}</AnswerText>
                  {expanded === index + featureFAQs.length &&
                    item.videoLink && (
                      <VideoPreview
                        src={item.videoLink}
                        title={`Video Preview for ${item.question}`}
                      />
                    )}
                </Answer>
              </Question>
            </div>
          ))}
          <Title>Payment FAQs</Title>
          {filteredPaymentFAQs.map((item, index) => (
            <div key={index}>
              <Question
                onClick={() =>
                  toggleAnswer(index + featureFAQs.length + supportFAQs.length)
                }
              >
                <QuestionContent>
                  {item.question}
                  <RotateChevronDown
                    expanded={
                      expanded ===
                      index + featureFAQs.length + supportFAQs.length
                    }
                    size={24}
                  />
                </QuestionContent>
                <Answer
                  expanded={
                    expanded === index + featureFAQs.length + supportFAQs.length ? true : undefined
                  }
                >
                  <AnswerText>{item.answer}</AnswerText>
                </Answer>
              </Question>
            </div>
          ))}
        </Section>
      </Container>
    </>
  );
}
