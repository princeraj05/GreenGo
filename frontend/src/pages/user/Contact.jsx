import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, RefreshCw, Send } from "lucide-react";
import io from "socket.io-client";
import { getApiUrl } from "../../utils/getApiUrl";
import API from "../../api/axios";

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
  }, [contacts]);

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
          className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4 bg-slate-50/20 dark:bg-slate-950/10 scrollbar-thin"
        >
          {contacts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-2 font-medium text-xs sm:text-sm">
              <span>💬</span>
              <span>No messages yet. Send a message to start the conversation!</span>
            </div>
          ) : (
            contacts.map((contact, cIdx) => (
              <div key={contact._id || cIdx} className="flex flex-col gap-3 md:gap-4 animate-fade-in">
                
                {/* Outgoing User Message */}
                <div className="flex justify-end">
                  <div className="bg-brand-500 text-white p-3.5 rounded-2xl rounded-tr-none max-w-[85%] sm:max-w-[80%] shadow-sm">
                    <p className="text-xs sm:text-sm leading-relaxed font-medium">{contact.message}</p>
                    <p className="text-[9px] text-brand-100 text-right mt-1 font-semibold">
                      {new Date(contact.createdAt || Date.now()).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                {/* Support Agent Replies */}
                {contact.replies && contact.replies.length > 0 ? (
                  contact.replies.map((replyObj, idx) => (
                    <div key={replyObj._id || idx} className="flex justify-start">
                      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 text-slate-800 dark:text-slate-200 p-3.5 rounded-2xl rounded-tl-none max-w-[85%] sm:max-w-[80%] shadow-sm transition-colors">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <div className="w-4.5 h-4.5 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white text-[8px] font-black shadow-sm shrink-0">
                            GG
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">GreenGo Support</span>
                        </div>
                        <p className="text-xs sm:text-sm leading-relaxed mt-1 font-medium">{replyObj.reply}</p>
                        {replyObj.createdAt && (
                          <p className="text-[9px] text-slate-400 dark:text-slate-500 text-right mt-1 font-semibold">
                            {new Date(replyObj.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : contact.reply ? (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 text-slate-800 dark:text-slate-200 p-3.5 rounded-2xl rounded-tl-none max-w-[85%] sm:max-w-[80%] shadow-sm transition-colors">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <div className="w-4.5 h-4.5 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white text-[8px] font-black shadow-sm shrink-0">
                          GG
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">GreenGo Support</span>
                      </div>
                      <p className="text-xs sm:text-sm leading-relaxed mt-1 font-medium">{contact.reply}</p>
                    </div>
                  </div>
                ) : (
                  /* Typing placeholder animation when reply is absent and it's the last message */
                  cIdx === contacts.length - 1 && (
                    <div className="flex justify-start">
                      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 text-slate-500 dark:text-slate-400 p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2 transition-colors">
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                          <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                          <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce"></span>
                        </div>
                        <span className="text-[10px] font-semibold tracking-wide">Support is typing...</span>
                      </div>
                    </div>
                  )
                )}

              </div>
            ))
          )}
        </div>

        {/* Input Bar (WhatsApp/Instagram Style) */}
        <form
          onSubmit={handleSubmit}
          className="p-3 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900/60 flex items-center gap-2.5 transition-colors"
        >
          <input
            required
            type="text"
            name="message"
            value={form.message}
            onChange={(event) => setForm({ ...form, message: event.target.value })}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-950 focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500 transition-all outline-none text-xs sm:text-sm font-medium"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !form.message.trim()}
            className="bg-brand-500 hover:bg-brand-600 active:scale-95 text-white p-3 rounded-full shadow-md transition-all shrink-0 flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
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
