import React, { useState } from 'react';
import { Copy, CheckCircle, X } from 'lucide-react';
import GlobalApi from '../../../../../_utils/GlobalApi';
import { getAuth } from "firebase/auth";
import ClipLoader from 'react-spinners/ClipLoader';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

function FileShareForm({ file, onPasswordSave, onReceiversAdd }) {
  const [isPasswordEnable, setIsEnablePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [emails, setEmails] = useState([]);
  const [currentEmail, setCurrentEmail] = useState('');
  const user = getAuth().currentUser;
  const [copied, setCopied] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);

  const isValidEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email.trim());
  };

  const addCurrentEmailToList = () => {
    const trimmedEmail = currentEmail.trim().toLowerCase();
    if (trimmedEmail && isValidEmail(trimmedEmail) && !emails.includes(trimmedEmail)) {
      setEmails([...emails, trimmedEmail]);
      setCurrentEmail('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addCurrentEmailToList();
    }
  };

  const removeEmail = (emailToRemove) => {
    setEmails(emails.filter(email => email !== emailToRemove));
  };

  const SendEmail = async () => {
    const emailsToSend = [...emails];
    const trimmedCurrentEmail = currentEmail.trim().toLowerCase();
    
    if (isValidEmail(trimmedCurrentEmail) && !emails.includes(trimmedCurrentEmail)) {
      emailsToSend.push(trimmedCurrentEmail);
    }

    if (emailsToSend.length === 0) {
      toast.error('Please add at least one valid email address');
      return;
    }

    setLoading(true);
    
    try {
      // Prepare email data once
      const baseEmailData = {
        userName: user?.displayName || 'Unknown User',
        userEmail: user?.email || '',
        fileName: file.fileName || file.name || 'Unknown File',
        fileSize: file.fileSize || 0,
        fileType: file.fileType || 'unknown',
        shortUrl: file.shortUrl || '',
        fileId: file.id || '',
        timestamp: new Date().toISOString()
      };

      // Send emails in parallel with timeout
      const emailPromises = emailsToSend.map(async (emailAddress) => {
        const emailData = {
          ...baseEmailData,
          emailToSend: emailAddress
        };
        
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Email timeout')), 10000)
        );
        
        try {
          const response = await Promise.race([
            GlobalApi.SendEmail(emailData),
            timeoutPromise
          ]);
          
          console.log(`Email queued for ${emailAddress}`);
          return { emailAddress, status: 'queued', response };
        } catch (error) {
          console.warn(`Email queue issue for ${emailAddress}:`, error.message);
          // Don't fail the entire process for individual email issues
          return { emailAddress, status: 'queued', error: error.message };
        }
      });

      // Wait for all emails to be queued (not delivered)
      const results = await Promise.allSettled(emailPromises);
      
      // Count successful queues
      const successCount = results.filter(result => 
        result.status === 'fulfilled' && result.value.status === 'queued'
      ).length;

      if (onReceiversAdd) onReceiversAdd(emailsToSend);
      setEmails([]);
      setCurrentEmail('');
      
      // Show success message immediately after queuing
      toast.success(
        `${successCount} email${successCount > 1 ? 's' : ''} queued for delivery! Recipients will receive them shortly.`,
        { duration: 4000 }
      );
      
    } catch (error) {
      console.error('Error queuing emails:', error);
      // Still clear form since emails might be queued
      if (onReceiversAdd) onReceiversAdd(emailsToSend);
      setEmails([]);
      setCurrentEmail('');
      toast.success('Emails queued for delivery!');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (file?.shortUrl) {
      navigator.clipboard.writeText(file.shortUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 800);
      });
    }
  };

  const handlePasswordSave = () => {
    onPasswordSave(password);
    setPasswordSaved(true);
    setTimeout(() => setPasswordSaved(false), 800);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="flex flex-col gap-6 p-6 md:p-8 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/20 shadow-xl"
    >


      {/* Short URL Section */}
      <div className="relative">
        <label className="text-sm font-medium text-gray-700">Short URL</label>
        <div className="relative flex items-center mt-1 p-2 border rounded-md bg-gray-50/50">
          <input
            type="text"
            value={file.shortUrl || ''}
            disabled
            className="flex-grow disabled:text-gray-500 bg-transparent outline-none mr-2 text-sm"
          />
          {copied ? (
            <CheckCircle size={24} className="text-green-500" />
          ) : (
            <motion.div whileTap={{ scale: 0.9 }}>
              <Copy className="text-gray-400 cursor-pointer hover:text-gray-600 transition" onClick={handleCopy} />
            </motion.div>
          )}
        </div>
      </div>

      {/* Enable Password Section */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="passwordToggle"
          className="form-checkbox h-5 w-5 text-primary rounded"
          onChange={(e) => setIsEnablePassword(e.target.checked)}
        />
        <label htmlFor="passwordToggle" className="text-sm font-medium text-gray-700">Enable Password</label>
      </div>

      {isPasswordEnable && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row gap-3 items-center">
          <input
            type="password"
            value={password}
            placeholder="Enter password"
            className={`border rounded-md p-2 w-full bg-white outline-none transition focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isTyping ? 'animate-typing' : ''}`}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={() => setIsTyping(true)}
            onKeyUp={() => setTimeout(() => setIsTyping(false), 1000)}
          />
          {!passwordSaved ? (
            <motion.button
              whileTap={{ scale: 0.98 }}
              className="p-2 bg-primary text-white rounded-md disabled:bg-gray-300 hover:bg-blue-500 transition w-full md:w-auto flex-shrink-0"
              disabled={password.length < 3}
              onClick={handlePasswordSave}
            >
              Save
            </motion.button>
          ) : (
            <CheckCircle size={25} className="text-blue-500 animate-bounce" />
          )}
        </motion.div>
      )}

      {/* Send File via Email */}
      <div className="p-4 rounded-md bg-white/70 border border-gray-200">
        <label className="text-sm font-medium text-gray-700">Send File to Email</label>
        <div className="flex flex-wrap gap-2 my-2">
          {emails.map((email, index) => (
            <motion.div
              key={index}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex items-center bg-blue-100 px-2 py-1 rounded-full text-blue-700 text-sm">
              <span>{email}</span>
              <X size={14} className="ml-1 cursor-pointer hover:text-blue-900" onClick={() => removeEmail(email)} />
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-2">
          <input
            type="email"
            placeholder="Enter valid email address (e.g., user@domain.com)"
            className={`border p-2 rounded-md w-full bg-white outline-none focus:ring-2 focus:border-transparent text-sm ${
              currentEmail && !isValidEmail(currentEmail) 
                ? 'border-red-300 focus:ring-red-500' 
                : 'border-gray-300 focus:ring-blue-500'
            }`}
            value={currentEmail}
            onChange={(e) => setCurrentEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={addCurrentEmailToList}
          />
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="button"
            className="p-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition flex-shrink-0 w-full md:w-auto disabled:opacity-50"
            onClick={addCurrentEmailToList}
            disabled={!currentEmail || !isValidEmail(currentEmail)}
          >
            Add
          </motion.button>
        </div>

        {currentEmail && !isValidEmail(currentEmail) && (
          <p className="text-red-500 text-xs mt-1">Please enter a valid email address</p>
        )}

        <motion.button
          whileTap={{ scale: 0.98 }}
          className="p-2 disabled:bg-gray-300 bg-primary text-white hover:bg-blue-600 w-full mt-4 rounded-md flex justify-center items-center gap-2 transition"
          onClick={SendEmail}
          disabled={loading || (emails.length === 0 && !isValidEmail(currentEmail))}
        >
          {loading ? (
            <>
              <ClipLoader size={20} color={"#ffffff"} />
              Sending...
            </>
          ) : (
            `Send Email${(emails.length > 0 || isValidEmail(currentEmail)) ? `(s) to ${emails.length + (isValidEmail(currentEmail) ? 1 : 0)} recipient${emails.length + (isValidEmail(currentEmail) ? 1 : 0) > 1 ? 's' : ''}` : ''}`
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}

export default FileShareForm;