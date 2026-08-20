import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, RefreshCw, Send, Paperclip, Smile } from "lucide-react";
import io from "socket.io-client";
import { getApiUrl } from "../../utils/getApiUrl";
import API from "../../api/axios";

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
      });

      // Support replies (incoming to customer)
      if (msg.replies && msg.replies.length > 0) {
        msg.replies.forEach((replyObj, idx) => {
          list.push({
            _id: replyObj._id || `${msg._id}-reply-${idx}`,
            type: "incoming",
            text: replyObj.reply,
            createdAt: replyObj.createdAt || msg.createdAt,
          });
        });
      } else if (msg.reply) {
        list.push({
          _id: `${msg._id}-reply`,
          type: "incoming",
          text: msg.reply,
          createdAt: msg.createdAt, // fallback
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

  /**
   * handleSubmit: Submits contact message to database and refreshes local inbox logs.
   */
  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      await API.post("/api/contact", form);
      setForm({ ...form, message: "" });
      await loadMyContacts();
    } catch (err) {
      console.error("Failed to submit support request:", err);
      alert("Failed to send support message. Please try again.");
    } finally {
      setLoading(false);
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
      <div className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-100 dark:border-slate-800/60 shadow-premium overflow-hidden flex flex-col h-[500px] md:h-[600px] transition-colors">
        
        {/* Chat Window Header */}
        <div className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-800/60 p-4 flex items-center justify-between transition-colors">
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
                          <p className="text-xs sm:text-sm font-medium leading-relaxed break-words pr-12">
                            {msg.text}
                          </p>
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
                          <p className="text-xs sm:text-sm font-medium leading-relaxed break-words pr-12">
                            {msg.text}
                          </p>
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
        <form
          onSubmit={handleSubmit}
          className="p-3 bg-[#f0f2f5] dark:bg-[#111b21] border-t border-slate-100 dark:border-slate-900/60 flex items-center gap-2 transition-colors shrink-0"
        >
          {/* Emoji Button */}
          <button
            type="button"
            onClick={() => alert("Emoji picker coming soon!")}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white p-2 transition-colors shrink-0"
            aria-label="Emojis"
          >
            <Smile className="h-5.5 w-5.5" />
          </button>

          <div className="flex-1">
            <input
              required
              type="text"
              name="message"
              value={form.message}
              onChange={(event) => setForm({ ...form, message: event.target.value })}
              placeholder="Type a message..."
              className="w-full rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#2a3942] px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white outline-none transition placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
              disabled={loading}
            />
          </div>

          {/* Attachment Button */}
          <button
            type="button"
            onClick={() => alert("File attachment coming soon!")}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white p-2 transition-colors shrink-0"
            aria-label="Add attachment"
          >
            <Paperclip className="h-5.5 w-5.5 rotate-45" />
          </button>

          <button
            type="submit"
            disabled={loading || !form.message.trim()}
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
  );
}
