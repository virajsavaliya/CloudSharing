import React, { useState } from 'react';
import { Copy, CheckCircle, X } from 'lucide-react';
import GlobalApi from '../../../../../_utils/GlobalApi';
import { getAuth } from "firebase/auth";
import ClipLoader from 'react-spinners/ClipLoader';
import toast from 'react-hot-toast';

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

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const addCurrentEmailToList = () => {
    if (currentEmail && isValidEmail(currentEmail) && !emails.includes(currentEmail)) {
      setEmails([...emails, currentEmail]);
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

  // ✅ 1. UPDATE THE SendEmail FUNCTION
  // This now checks for a valid email in the input box before sending.
  const SendEmail = () => {
    const emailsToSend = [...emails];
    if (isValidEmail(currentEmail) && !emails.includes(currentEmail)) {
      emailsToSend.push(currentEmail);
    }

    if (emailsToSend.length === 0) return;
    
    setLoading(true);
    const promises = emailsToSend.map(emailAddress => {
      const data = {
        emailToSend: emailAddress,
        userName: user?.displayName,
        fileName: file.fileName,
        fileSize: file.fileSize,
        fileType: file.fileType,
        shortUrl: file.shortUrl,
      };
      return GlobalApi.SendEmail(data);
    });
    Promise.all(promises).then(() => {
      setLoading(false);
      if (onReceiversAdd) onReceiversAdd(emailsToSend);
      setEmails([]);
      setCurrentEmail('');
      toast.success('Emails sent successfully!');
    }).catch(error => {
      console.error('Error sending emails:', error);
      setLoading(false);
      toast.error('Failed to send emails. Please try again.');
    });
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
    <div className="flex flex-col gap-4 border p-5 rounded-md">
      
      {/* Short URL Section */}
      <div>
        <label className="text-[14px] text-gray-500">Short URL</label>
        <div className="relative flex items-center p-2 border rounded-md">
          <input
            type="text"
            value={file.shortUrl || ''}
            disabled
            className="flex-grow disabled:text-gray-500 bg-transparent outline-none mr-2"
          />
          {copied ? (
            <CheckCircle size={24} className="text-green-500" />
          ) : (
            <Copy className="text-gray-400 cursor-pointer hover:text-gray-600" onClick={handleCopy} />
          )}
        </div>
      </div>

      {/* Enable Password Section */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          onChange={(e) => setIsEnablePassword(e.target.checked)}
        />
        <label>Enable Password</label>
      </div>

      {isPasswordEnable && (
        <div className="flex flex-col md:flex-row gap-3 items-center">
          <input
            type="password"
            value={password}
            className={`border rounded-md p-2 w-full bg-transparent outline-none ${isTyping ? 'animate-typing' : ''}`}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={() => setIsTyping(true)}
            onKeyUp={() => setTimeout(() => setIsTyping(false), 1000)}
          />
          {!passwordSaved ? (
            <button
              className="p-2 bg-primary text-white rounded-md disabled:bg-gray-300 hover:bg-blue-500"
              disabled={password.length < 3}
              onClick={handlePasswordSave}
            >
              Save
            </button>
          ) : (
            <CheckCircle size={25} className="text-blue-500 animate-bounce" />
          )}
        </div>
      )}

      {/* Send File via Email */}
      <div className="border rounded-md p-4">
        <label className="text-[14px] text-gray-500">Send File to Email</label>
        <div className="flex flex-wrap gap-2 my-2">
          {emails.map((email, index) => (
            <div key={index} className="flex items-center bg-blue-100 px-2 py-1 rounded">
              <span className="text-sm text-blue-700">{email}</span>
              <X size={14} className="ml-1 cursor-pointer hover:text-blue-900" onClick={() => removeEmail(email)} />
            </div>
          ))}
        </div>
        
        <div className="flex gap-2">
          <input
            type="email"
            placeholder="Enter email address"
            className="border p-2 rounded-md w-full bg-transparent outline-none"
            value={currentEmail}
            onChange={(e) => setCurrentEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={addCurrentEmailToList}
          />
          <button
            type="button"
            className="p-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            onClick={addCurrentEmailToList}
          >
            Add
          </button>
        </div>

        <button
          className="p-2 disabled:bg-gray-300 bg-primary text-white hover:bg-blue-600 w-full mt-2 rounded-md flex justify-center"
          onClick={SendEmail}
          // ✅ 2. UPDATE THE DISABLED LOGIC
          // The button is enabled if the list is not empty OR if a valid email is currently typed.
          disabled={loading || (emails.length === 0 && !isValidEmail(currentEmail))}
        >
          {loading ? <ClipLoader size={20} color={"#ffffff"} /> : "Send Email(s)"}
        </button>
      </div>
    </div>
  );
}

export default FileShareForm;