"use client";
import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, User, RotateCcw, Copy, ThumbsUp, ThumbsDown, ArrowLeft, Clock, Mic, MicOff } from 'lucide-react';
import Image from 'next/image';
import { getGeminiResponse } from '../_utils/geminiApi';

const trainingData = {
  general: {
    greeting: {
      keywords: ["hi", "hello", "hey", "start", "help"],
      answer: "Hello! I'm your CloudShare assistant. I can help you with:\nFile sharing & management\nAccount settings\nSecurity features\nTechnical support\nWhat would you like to know?"
    },
    pricing: {
      keywords: ["price", "cost", "plan", "subscription", "upgrade", "premium", "pro"],
      answer: "CloudShare offers 3 plans:\n\nFree Plan:\n50MB file limit\n7-day storage\nBasic features\n\nPro Plan ($9.99/month):\n2GB file limit\n30-day storage\nPassword protection\n\nPremium Plan ($19.99/month):\nUnlimited file size\n90-day storage\nAll features"
    },
    troubleshooting: {
      keywords: ["error", "issue", "problem", "not working", "failed", "help"],
      answer: "I can help troubleshoot common issues:\n\nUpload failed?\nCheck file size limit\nVerify internet connection\n\nDownload issues?\nCheck link expiration\nVerify password if protected\n\nStill having problems?\nContact support at cloudsharing.fileshare@gmail.com"
    }
  },
  
  account: {
    login: {
      keywords: ["login", "signin", "account", "password reset", "forgot"],
      answer: "Account assistance:\n1. To login:\n   • Click Sign In button\n   • Use email/password or social login\n2. Forgot password?\n   • Click 'Forgot Password'\n   • Follow email instructions\n3. Account locked?\n   • Contact support"
    },
    settings: {
      keywords: ["settings", "profile", "account settings", "preferences"],
      answer: "Manage your account:\n1. Profile Settings:\n   • Update personal info\n   • Change password\n   • Set preferences\n2. Notifications:\n   • Email preferences\n   • Activity alerts\n3. Storage Management:\n   • View usage\n   • Clean up files"
    }
  },

  features: {
    upload: {
      keywords: ["upload", "send", "transfer", "store"],
      answer: "How to upload files:\n1. Click 'Upload' button\n2. Choose files or drag & drop\n3. Options available:\n   • Single/multiple files\n   • Folder upload\n   • Large file handling\n4. Progress tracking\n5. Instant sharing options"
    },
    share: {
      keywords: ["share", "send", "link", "access"],
      answer: "Sharing options:\n1. Direct Link:\n   • Copy & share link\n   • Set expiration\n2. Email Share:\n   • Enter recipient(s)\n   • Add message\n3. Security Options:\n   • Password protection\n   • Access controls"
    },
    folders: {
      keywords: ["folder", "organize", "structure"],
      answer: "Folder management:\n1. Create folders:\n   • Click 'New Folder'\n   • Name & organize\n2. Upload to folders:\n   • Drag & drop\n   • Bulk upload\n3. Share folders:\n   • Entire folder sharing\n   • Access control"
    }
  },

  security: {
    sharing: {
      keywords: ["share securely", "secure sharing", "protect share"],
      answer: "To share files securely on CloudShare:\n\nPassword Protection:\nAdd a password to your shared files\nRecipients need the password to access\n\nLink Settings:\nSet link expiration date\nLimit number of downloads\n\nAccess Control:\nChoose who can view/edit\nRevoke access anytime"
    },
    storage: {
      keywords: ["storage duration", "how long", "stored"],
      answer: "File storage duration by plan:\n\nFree Plan:\n7 days storage\nAutomatic deletion after expiry\n\nPro Plan:\n30 days storage\nRecycle bin recovery\n\nPremium Plan:\n90 days storage\nExtended recovery period"
    },
    protection: {
      keywords: ["password protect", "protect files"],
      answer: "Password protection features:\n\nFile Protection:\nSet custom passwords\nChange passwords anytime\n\nSharing Options:\nUnique passwords per share\nPassword expiration settings\n\nSecurity:\nEncrypted storage\nSecure password handling"
    }
  },

  management: {
    delete: {
      keywords: ["delete", "remove", "trash"],
      answer: "File deletion process:\n1. Delete options:\n   • Move to trash\n   • Permanent delete\n2. Recycle Bin:\n   • 30-day retention\n   • Restore option\n3. Bulk deletion:\n   • Select multiple\n   • Folder deletion"
    },
    restore: {
      keywords: ["restore", "recover", "recycle"],
      answer: "File recovery:\n1. Access Recycle Bin\n2. Find deleted files\n3. Click 'Restore'\n4. Verify restoration\n• Note: 30-day limit applies"
    }
  },

  storage: {
    maxSize: {
      keywords: ["maximum", "file size", "limit", "how big"],
      answer: "The maximum file size on CloudShare depends on your plan:\n\nFree: 50MB\nPro: 2GB\nPremium: Unlimited"
    }
  }
};

const commonQuestions = [
  {
    question: "What's the maximum file size?",
    category: "Storage",
    answer: trainingData.storage.maxSize.answer
  },
  {
    question: "How do I share files securely?",
    category: "Security",
    answer: trainingData.security.sharing.answer
  },
  {
    question: "How long are files stored?",
    category: "Storage",
    answer: trainingData.security.storage.answer
  },
  {
    question: "Can I password protect files?",
    category: "Security",
    answer: trainingData.security.protection.answer
  },
  {
    question: "What file types can I upload?",
    category: "General",
    answer: "CloudShare supports all common file types:\n\nDocuments:\nPDF, Word, Excel, PowerPoint\n\nMedia:\nImages, Videos, Audio files\n\nOther:\nZIP archives\nText files\nAnd more"
  }
];

const formatBotResponse = (text) => {
  // Remove markdown asterisks and keep the text between them
  return text.replace(/\*(.*?)\*/g, '$1');
};

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [showQuestions, setShowQuestions] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [currentConversationIndex, setCurrentConversationIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Add new state for reactions
  const [messageReactions, setMessageReactions] = useState({});

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Load conversation history from localStorage
    const savedHistory = localStorage.getItem('chatHistory');
    if (savedHistory) {
      setConversationHistory(JSON.parse(savedHistory));
    }

    // Initialize speech recognition
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        console.log('Speech recognition started');
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');

        setInput(transcript);
        
        // Only send if it's a final result
        if (event.results[0].isFinal) {
          handleSend(transcript);
          setIsListening(false);
          recognition.stop();
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          alert('Please allow microphone access to use voice input.');
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      setVoiceSupported(true);
    } else {
      setVoiceSupported(false);
    }
  }, []);

  const saveConversation = () => {
    const newHistory = [...conversationHistory, messages];
    setConversationHistory(newHistory);
    localStorage.setItem('chatHistory', JSON.stringify(newHistory));
  };

  const startNewChat = () => {
    saveConversation();
    setMessages([]);
    setShowQuestions(true);
    setCurrentConversationIndex(conversationHistory.length + 1);
  };

  const goBack = () => {
    if (messages.length > 0) {
      setMessages(messages.slice(0, -2));
      if (messages.length <= 2) {
        setShowQuestions(true);
      }
    }
  };

  const handleReaction = (messageIndex, reaction) => {
    setMessageReactions(prev => ({
      ...prev,
      [messageIndex]: reaction
    }));
  };

  const copyMessage = (text) => {
    navigator.clipboard.writeText(text);
    // Show copy success message
    // You can add a toast notification here
  };

  const formatTimestamp = (date) => {
    return new Intl.DateTimeFormat('en', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const SUPPORT_EMAIL = "cloudsharing.fileshare@gmail.com";

  const findAnswer = async (question) => {
    try {
      const response = await getGeminiResponse(question);
      // If response is empty or undefined, return the default support message
      if (!response || response.trim() === '') {
        return `I apologize, but I don't have an answer for that question. Please contact our support team at ${SUPPORT_EMAIL} for assistance.`;
      }
      return response;
    } catch (error) {
      console.error('Error getting answer:', error);
      return `I'm having trouble right now. Please contact our support team at ${SUPPORT_EMAIL} for assistance.`;
    }
  };

  const handleSend = async (voiceInput) => {
    const textToSend = voiceInput || input;
    if (!textToSend.trim()) return;

    const userMessage = { text: textToSend, sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const answer = await findAnswer(input);
      const botMessage = {
        text: formatBotResponse(answer),
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsTyping(false);
    }

    setShowQuestions(false);
  };

  const handleQuestionClick = async (question) => {
    const userMessage = { text: question, sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      // Use predefined answer if available
      const answer = commonQuestions.find(q => q.question === question)?.answer || await findAnswer(question);
      const botMessage = {
        text: answer,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsTyping(false);
    }

    setShowQuestions(false);
  };

  const ASSISTANT_NAME = "Cloudie";
  const ASSISTANT_STATUS = "AI Assistant | Always ready to help";
  
  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-end">
      {/* Chat Window - Change display instead of just opacity */}
      <div className={`${isOpen ? 'block' : 'hidden'} absolute bottom-0 right-0 mb-16`}>
        <div className="bg-white rounded-lg shadow-xl w-96 max-h-[600px] flex flex-col">
          {/* Header with Profile */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="relative">
                <Image
                  src="/assistant-avatar.png"
                  alt="Assistant"
                  width={56}
                  height={56}
                  className="rounded-full border-2 border-white"
                />
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{ASSISTANT_NAME}</h3>
                <p className="text-xs opacity-90">{ASSISTANT_STATUS}</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={startNewChat}
                  className="hover:bg-white/20 p-1.5 rounded"
                  title="New Chat"
                >
                  <RotateCcw size={18} />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="hover:bg-white/20 p-1.5 rounded"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Update Chat Area */}
          <div className="flex-1 overflow-y-auto p-4 max-h-[400px] chat-background">
            <div className="chat-section rounded-lg p-4">
              {showQuestions && messages.length === 0 ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Image
                      src="/assistant-avatar.png"
                      alt="Assistant"
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                    <div className="flex-1">
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <p className="text-gray-800">Hi! How can I help you today? 👋</p>
                      </div>
                      <div className="mt-4 faq-section">
                        <p className="faq-title">🔍 Frequently Asked Questions</p>
                        <div className="space-y-2">
                          {commonQuestions.map((item, index) => (
                            <button
                              key={index}
                              onClick={() => handleQuestionClick(item.question)}
                              className="faq-button w-full text-left flex items-center gap-2"
                            >
                              <span className="text-blue-500 text-sm">{index + 1}.</span>
                              <span className="text-gray-700 text-sm flex-1">{item.question}</span>
                              <span className="text-xs text-gray-400 px-2 py-1 bg-gray-50 rounded-full">
                                {item.category}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {messages.map((message, index) => (
                    <div key={index} className="group animate-fade-in">
                      <div className={`flex flex-col ${message.sender === 'user' ? 'items-end' : 'items-start'}`}>
                        {message.sender === 'bot' && (
                          <div className="relative mb-2">
                            <Image
                              src="/assistant-avatar.png"
                              alt={ASSISTANT_NAME}
                              width={48}
                              height={48}
                              className="rounded-full border-2 border-white shadow-sm"
                            />
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                          </div>
                        )}
                        <div className="flex flex-col max-w-[80%]">
                          {(!messages[index - 1] || messages[index - 1].sender !== message.sender) && (
                            <p className="text-xs text-gray-500 mb-1 px-2">
                              {message.sender === 'user' ? 'You' : ASSISTANT_NAME}
                            </p>
                          )}
                          <div className={`p-3 ${
                            message.sender === 'user'
                              ? 'chat-bubble-user text-white ml-auto'
                              : 'chat-bubble-bot text-gray-800'
                          }`}>
                            <p className="whitespace-pre-wrap">{message.text}</p>
                          </div>
                          <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock size={12} />
                              {formatTimestamp(message.timestamp)}
                            </span>
                            {message.sender === 'bot' && (
                              <>
                                <button
                                  onClick={() => copyMessage(message.text)}
                                  className="text-gray-400 hover:text-gray-600"
                                  title="Copy"
                                >
                                  <Copy size={12} />
                                </button>
                                <button
                                  onClick={() => handleReaction(index, 'helpful')}
                                  className={`${messageReactions[index] === 'helpful' ? 'text-green-500' : 'text-gray-400'}`}
                                  title="Helpful"
                                >
                                  <ThumbsUp size={12} />
                                </button>
                                <button
                                  onClick={() => handleReaction(index, 'not-helpful')}
                                  className={`${messageReactions[index] === 'not-helpful' ? 'text-red-500' : 'text-gray-400'}`}
                                  title="Not Helpful"
                                >
                                  <ThumbsDown size={12} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Update typing indicator */}
                  {isTyping && (
                    <div className="flex items-start gap-3 animate-fade-in">
                      <div className="relative">
                        <Image
                          src="/assistant-avatar.png"
                          alt={ASSISTANT_NAME}
                          width={48}
                          height={48}
                          className="rounded-full border-2 border-white shadow-sm"
                        />
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                      </div>
                      <div className="flex flex-col">
                        <p className="text-xs text-gray-500 mb-1 px-2">{ASSISTANT_NAME}</p>
                        <div className="typing-indicator chat-bubble-bot">
                          <div className="typing-dot"></div>
                          <div className="typing-dot"></div>
                          <div className="typing-dot"></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>

          {/* Input area with voice support */}
          <div className="p-4 border-t">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder={isListening ? 'Listening...' : 'Type your question...'}
                className="flex-1 p-2 outline-none text-gray-700 placeholder-gray-400 rounded-lg border focus:border-blue-500 transition-colors"
              />
              {voiceSupported && (
                <button
                  onClick={() => {
                    try {
                      if (isListening) {
                        recognitionRef.current?.stop();
                      } else {
                        // Reset input when starting new recording
                        setInput('');
                        // Request microphone permission before starting
                        navigator.mediaDevices.getUserMedia({ audio: true })
                          .then(() => {
                            recognitionRef.current?.start();
                          })
                          .catch((err) => {
                            console.error('Microphone permission denied:', err);
                            alert('Please allow microphone access to use voice input.');
                          });
                      }
                    } catch (error) {
                      console.error('Speech recognition error:', error);
                      setIsListening(false);
                    }
                  }}
                  className={`p-2 rounded-full transition-colors ${
                    isListening 
                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                  }`}
                  title={isListening ? 'Stop recording' : 'Start voice input'}
                >
                  {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
              )}
              <button
                onClick={() => handleSend()}
                disabled={!input.trim()}
                className="p-2"
              >
                <Send 
                  size={20} 
                  className={input.trim() ? 'text-gray-400 hover:text-blue-500' : 'text-gray-300'} 
                />
              </button>
            </div>
            {isListening && (
              <div className="text-xs text-center mt-2 text-gray-500">
                Speak now... Click the microphone icon when you're done.
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Chat Trigger Button - Always visible and clickable */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="chat-trigger bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 rounded-full shadow-lg hover:opacity-90 transition-all"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>
    </div>
  );
}
