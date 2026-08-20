import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, RefreshCw, Send, Paperclip, Smile } from "lucide-react";
import io from "socket.io-client";
import { getApiUrl } from "../../utils/getApiUrl";
import API from "../../api/axios";
import EmojiPicker from "../../components/ui/EmojiPicker";

/**
 * Helper to format datetime stamps to readable 2-digit locale time strings.
 */
function formatTime(date) {
  if (!date) return "";
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * Helper to determine date separator text (e.g. Today, Yesterday, or standard date format).
 */
function getDateSeparatorText(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" });
  }
}

/**
 * Contact Component
 * 
 * Provides a customer support chat/ticketing dashboard allowing users to submit new questions
 * and view automated/agent live-replies inside a scrollable inbox view.
 */
export default function Contact() {
  const navigate = useNavigate();
  
  /* --- STATE DECLARATIONS --- */
  // form: Handles message, name, and email fields for contact message submission
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  // contacts: Array of prior support tickets and agent reply threads
  const [contacts, setContacts] = useState([]);
  // loading: Disables the submit action while backend processes the contact request
  const [loading, setLoading] = useState(false);

  // File upload & Emoji picker states
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(false);
  const fileInputRef = useRef(null);

  // Flatten customer messages and support agent replies sequentially
  const chatMessages = useMemo(() => {
    if (!contacts) return [];
    
    const list = [];
    contacts.forEach((msg) => {
      // Customer message (outgoing from customer)
      list.push({
        _id: msg._id,
        type: "outgoing",
        text: msg.message,
        createdAt: msg.createdAt,
        attachment: msg.attachment || null,
      });

      // Support replies (incoming to customer)
      if (msg.replies && msg.replies.length > 0) {
        msg.replies.forEach((replyObj, idx) => {
          list.push({
            _id: replyObj._id || `${msg._id}-reply-${idx}`,
            type: "incoming",
            text: replyObj.reply,
            createdAt: replyObj.createdAt || msg.createdAt,
            attachment: replyObj.attachment || null,
          });
        });
      } else if (msg.reply) {
        list.push({
          _id: `${msg._id}-reply`,
          type: "incoming",
          text: msg.reply,
          createdAt: msg.createdAt, // fallback
          attachment: msg.attachment || null,
        });
      }
    });

    // Sort by createdAt
    return list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [contacts]);

  /* --- REFS --- */
  // chatContainerRef: Scroll container of the support message stream
  const chatContainerRef = useRef(null);
  // socketRef: Keeps track of the active Socket.IO connection
  const socketRef = useRef(null);

  /* --- DATA FETCHING & EFFECTS --- */

  /**
   * loadUserProfile: Pre-fills contact name and email properties using the active user account details.
   */
  async function loadUserProfile() {
    try {
      const res = await API.get("/api/users/me");
      const user = res.data;

      setForm((prev) => ({
        ...prev,
        name: prev.name || user?.name || "",
        email: prev.email || user?.email || "",
      }));
    } catch (err) {
      console.error("Failed to load user profile", err);
    }
  }

  /**
   * loadMyContacts: Retrieves prior message threads submitted by the current authenticated user.
   */
  async function loadMyContacts() {
    try {
      const res = await API.get("/api/contact/my");
      const data = res.data;
      setContacts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load messages", err);
    }
  }

  // Load account properties and user message threads on mount, initialize Socket.IO
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/", {
        state: {
          from: { pathname: "/user/contact" },
          loginRequired: true,
        },
      });
      return;
    }
    loadUserProfile();
    loadMyContacts();

    // Connect socket
    const socket = io(getApiUrl(), {
      auth: { token },
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[Socket] Customer connected to support real-time");
    });

    socket.on("support:new-message", (incomingContact) => {
      console.log("[Socket] Customer received support message:", incomingContact);

      setContacts((prevContacts) => {
        const exists = prevContacts.some((c) => c._id === incomingContact._id);
        if (exists) {
          return prevContacts.map((c) =>
            c._id === incomingContact._id ? incomingContact : c
          );
        } else {
          return [...prevContacts, incomingContact];
        }
      });
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  // Scrolls support inbox stream down when a new message or reply is updated
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  /* --- EVENT HANDLERS --- */

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File size exceeds 10MB limit.");
      return;
    }

    const ext = file.name.split('.').pop().toLowerCase();
    const allowed = ["jpg", "jpeg", "png", "webp", "pdf", "doc", "docx", "xls", "xlsx", "txt"];
    if (!allowed.includes(ext)) {
      alert("Unsupported file type.");
      return;
    }

    setSelectedFile(file);
    if (file.type.startsWith("image/")) {
      setFilePreview(URL.createObjectURL(file));
    } else {
      setFilePreview(null);
    }
  };

  const handleCancelFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const renderAttachment = (attachment, type) => {
    if (!attachment) return null;
    const isImage = attachment.type === "image" || attachment.mimeType?.startsWith("image/");
    if (isImage) {
      return (
        <div className="mt-1 rounded-lg overflow-hidden max-w-xs border border-black/10 dark:border-white/10 shadow-sm bg-white dark:bg-slate-900">
          <img 
            src={attachment.url} 
            alt={attachment.fileName || "Image"} 
            className="w-full h-auto max-h-60 object-cover cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(attachment.url, "_blank")}
          />
        </div>
      );
    }
    const isOutgoing = type === "outgoing";
    return (
      <a 
        href={attachment.url} 
        target="_blank" 
        rel="noopener noreferrer" 
        className={`mt-1.5 flex items-center gap-3 p-3 rounded-xl border transition-colors w-64 text-left ${
          isOutgoing 
            ? "bg-brand-600 border-brand-400 hover:bg-brand-700 text-white" 
            : "bg-slate-50 dark:bg-slate-900 border-slate-200/60 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100"
        }`}
      >
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
          isOutgoing
            ? "bg-brand-400/20 text-brand-100"
            : "bg-red-50 dark:bg-red-950/20 text-red-500 dark:text-red-400"
        }`}>
          {attachment.fileName?.split('.').pop().toUpperCase() || "DOC"}
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-xs font-bold truncate ${isOutgoing ? "text-white" : "text-slate-850 dark:text-slate-200"}`}>
            {attachment.fileName || "attachment"}
          </p>
          <p className={`text-[10px] font-semibold uppercase mt-0.5 ${isOutgoing ? "text-brand-200" : "text-slate-400 dark:text-slate-500"}`}>
            {attachment.fileName?.split('.').pop() || "FILE"} • {attachment.size ? (attachment.size / (1024 * 1024)).toFixed(1) : "0.1"} MB
          </p>
        </div>
      </a>
    );
  };

  /**
   * handleSubmit: Submits contact message to database and refreshes local inbox logs.
   */
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.message.trim() && !selectedFile) return;

    setLoading(true);
    setUploadProgress(true);
    let uploadedAttachment = null;

    try {
      const token = localStorage.getItem("token");
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const uploadRes = await API.post("/api/contact/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`
          }
        });

        if (uploadRes.data?.success) {
          uploadedAttachment = uploadRes.data.attachment;
        } else {
          throw new Error(uploadRes.data?.message || "Upload failed");
        }
      }

      await API.post("/api/contact", {
        ...form,
        attachment: uploadedAttachment
      });

      setForm({ ...form, message: "" });
      setSelectedFile(null);
      setFilePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await loadMyContacts();
    } catch (err) {
      console.error("Failed to submit support request:", err);
      alert(err.message || "Failed to send support message. Please try again.");
    } finally {
      setLoading(false);
      setUploadProgress(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full animate-fade-in pb-10 px-4 md:px-0 bg-transparent">
      {/* Chat Title / Heading */}
      <div className="mb-6 md:mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <MessageCircle className="w-6 h-6 md:w-8 md:h-8 text-brand-500" />
            Support
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-xs sm:text-sm font-medium">
            We're here to help. Chat with our support team.
          </p>
        </div>
      </div>

      {/* --- COMBINED CHAT WINDOW CONTAINER (WhatsApp/Instagram Style) --- */}
      <div className="bg-white dark:bg-slate-950 flex flex-col h-[550px] md:h-[650px] transition-colors w-full">
        
        {/* Chat Window Header */}
        <div className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-250 dark:border-slate-800/60 p-4 flex items-center justify-between transition-colors">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-500 to-brand-600 flex items-center justify-center text-white font-bold shadow-sm shrink-0">
                GG
              </div>
              <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"></span>
            </div>
            
            {/* Active support representative name & status */}
            <div className="flex flex-col">
              <span className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm leading-tight">
                GreenGo Support
              </span>
              <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                Online
              </span>
            </div>
          </div>

          {/* Refresh Action */}
          <button 
            type="button"
            onClick={loadMyContacts}
            disabled={loading}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-brand-500 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors disabled:opacity-50"
            title="Refresh chat"
          >
            <RefreshCw className={`w-4.5 h-4.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Message Stream */}
        <div 
          ref={chatContainerRef} 
          className="flex-1 p-4 md:p-6 overflow-y-auto space-y-1 bg-[#efeae2] dark:bg-[#0b141a] scrollbar-thin"
        >
          {chatMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-2 font-medium text-xs sm:text-sm">
              <span>💬</span>
              <span>No messages yet. Send a message to start the conversation!</span>
            </div>
          ) : (
            (() => {
              let prevDate = null;
              const mapped = chatMessages.map((msg, idx) => {
                const messageDate = new Date(msg.createdAt).toDateString();
                const showDateSeparator = messageDate !== prevDate;
                prevDate = messageDate;

                const isFirstInGroup = idx === 0 || chatMessages[idx - 1].type !== msg.type || showDateSeparator;
                const mtClass = isFirstInGroup ? "mt-3" : "mt-1";

                return (
                  <div key={msg._id} className="flex flex-col">
                    {showDateSeparator && (
                      <div className="flex justify-center my-4 animate-fade-in">
                        <span className="bg-white/90 dark:bg-slate-800/90 text-slate-500 dark:text-slate-400 px-3 py-1 rounded-lg text-[10px] font-bold shadow-sm uppercase tracking-wider">
                          {getDateSeparatorText(msg.createdAt)}
                        </span>
                      </div>
                    )}

                    <div className={`flex ${msg.type === "outgoing" ? "justify-end" : "justify-start"} ${mtClass} animate-fade-in`}>
                      {msg.type === "outgoing" ? (
                        /* Outgoing User Message (RIGHT) */
                        <div className={`relative max-w-[85%] sm:max-w-[75%] px-3.5 pt-2 pb-5 bg-brand-500 text-white shadow-sm ${
                          isFirstInGroup ? "rounded-2xl rounded-tr-none" : "rounded-2xl"
                        }`}>
                          {msg.text && (
                            <p className="text-xs sm:text-sm font-medium leading-relaxed break-words pr-12">
                              {msg.text}
                            </p>
                          )}
                          {renderAttachment(msg.attachment, "outgoing")}
                          <span className="absolute bottom-1 right-2 text-[9px] font-bold text-brand-100 select-none">
                            {formatTime(msg.createdAt)}
                          </span>
                        </div>
                      ) : (
                        /* Incoming Support Agent Message (LEFT) */
                        <div className={`relative max-w-[85%] sm:max-w-[75%] px-3.5 pt-2 pb-5 bg-white dark:bg-[#202c33] text-slate-800 dark:text-slate-100 border border-slate-200/50 dark:border-none shadow-sm transition-colors ${
                          isFirstInGroup ? "rounded-2xl rounded-tl-none" : "rounded-2xl"
                        }`}>
                          {isFirstInGroup && (
                            <div className="flex items-center gap-1.5 mb-1.5 select-none">
                              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white text-[8px] font-black shadow-sm shrink-0">
                                GG
                              </div>
                              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">GreenGo Support</span>
                            </div>
                          )}
                          {msg.text && (
                            <p className="text-xs sm:text-sm font-medium leading-relaxed break-words pr-12">
                              {msg.text}
                            </p>
                          )}
                          {renderAttachment(msg.attachment, "incoming")}
                          <span className="absolute bottom-1 right-2 text-[9px] font-bold text-slate-400 dark:text-slate-500 select-none">
                            {formatTime(msg.createdAt)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              });

              // Add typing indicator at the end of mapped list if applicable
              const lastContact = contacts[contacts.length - 1];
              const showTyping = lastContact && !lastContact.reply && (!lastContact.replies || lastContact.replies.length === 0);

              return (
                <>
                  {mapped}
                  {showTyping && (
                    <div className="flex justify-start mt-3 animate-fade-in">
                      <div className="bg-white dark:bg-[#202c33] text-slate-500 dark:text-slate-400 p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2 border border-slate-200/50 dark:border-none transition-colors">
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                          <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                          <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce"></span>
                        </div>
                        <span className="text-[10px] font-semibold tracking-wide">Support is typing...</span>
                      </div>
                    </div>
                  )}
                </>
              );
            })()
          )}
        </div>

        {/* Input Bar (WhatsApp/Instagram Style) */}
        <div className="bg-[#f0f2f5] dark:bg-[#111b21] border-t border-slate-100 dark:border-slate-900/60 p-3 flex flex-col gap-2 shrink-0 relative transition-colors">
          {/* File Preview Bar */}
          {selectedFile && (
            <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-fade-in shadow-sm">
              <div className="flex items-center gap-2 min-w-0">
                {filePreview ? (
                  <img src={filePreview} alt="Preview" className="w-10 h-10 object-cover rounded-lg shrink-0" />
                ) : (
                  <div className="w-10 h-10 bg-brand-500/10 text-brand-500 rounded-lg flex items-center justify-center shrink-0 font-extrabold text-xs">
                    {selectedFile.name.split('.').pop().toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-850 dark:text-slate-200 truncate">{selectedFile.name}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCancelFile}
                className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-850 text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              >
                ✕
              </button>
            </div>
          )}

          {/* Emoji Picker Popover */}
          {showEmojiPicker && (
            <EmojiPicker
              onSelectEmoji={(emoji) => {
                setForm((prev) => ({ ...prev, message: prev.message + emoji }));
              }}
              onClose={() => setShowEmojiPicker(false)}
            />
          )}

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          />

          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 transition-colors w-full"
          >
            {/* Emoji Button */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white p-2 transition-colors shrink-0"
              aria-label="Emojis"
            >
              <Smile className="h-5.5 w-5.5" />
            </button>

            <div className="flex-1">
              <input
                type="text"
                name="message"
                value={form.message}
                onChange={(event) => setForm({ ...form, message: event.target.value })}
                placeholder={uploadProgress ? "Uploading attachment..." : "Type a message..."}
                className="w-full rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#2a3942] px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white outline-none transition placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 disabled:opacity-65"
                disabled={loading || uploadProgress}
              />
            </div>

            {/* Attachment Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || uploadProgress}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white p-2 transition-colors shrink-0 disabled:opacity-50"
              aria-label="Add attachment"
            >
              <Paperclip className="h-5.5 w-5.5 rotate-45" />
            </button>

            <button
              type="submit"
              disabled={loading || (!form.message.trim() && !selectedFile)}
              className="bg-brand-500 hover:bg-brand-600 active:scale-95 text-white p-2.5 rounded-full shadow-md transition-all shrink-0 flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <RefreshCw className="w-4.5 h-4.5 animate-spin" />
              ) : (
                <Send className="w-4.5 h-4.5" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
