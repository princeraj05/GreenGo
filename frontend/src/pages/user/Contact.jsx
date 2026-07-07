import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, RefreshCw, Send } from "lucide-react";
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
  // chatEndRef: Tracks the bottom of the support message stream to automatically focus latest messages
  const chatEndRef = useRef(null);

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

  // Load account properties and user message threads on mount
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
  }, []);

  // Scrolls support inbox stream down when a new message or reply is updated
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
    /* --- MAIN PAGE LAYOUT --- */
    /* Tailwind: lg:flex-row arranges support form side-by-side with live inbox on larger screens; vertical flex-col on mobile */
    <div className="max-w-6xl mx-auto w-full animate-fade-in pb-10 flex flex-col lg:flex-row gap-6 md:gap-8 bg-transparent">
      
      {/* --- SUPPORT REQUEST FORM PANEL --- */}
      <div className="flex-1">
        <div className="mb-6 md:mb-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <MessageCircle className="w-6 h-6 md:w-8 md:h-8 text-brand-500" />
            Support
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-xs sm:text-sm md:text-base font-medium">We're here to help. Send our team a message.</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-950 rounded-3xl p-5 md:p-8 border border-slate-100 dark:border-slate-800/60 shadow-premium transition-colors"
        >
          <div className="space-y-4">
            <div>
              <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">Message</label>
              <textarea
                required
                name="message"
                value={form.message}
                onChange={(event) => setForm({ ...form, message: event.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-950 focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500 transition-all outline-none h-28 md:h-32 resize-none font-medium text-xs sm:text-sm"
                placeholder="How can we help you today?"
              />
            </div>
            <button
              disabled={loading}
              className="w-full py-3 md:py-4 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-650 hover:to-brand-700 text-white font-bold rounded-xl shadow-md shadow-brand-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed text-xs sm:text-sm"
            >
              {loading ? "Sending..." : "Send Message"}
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* --- SUPPORT LIVE INBOX PANEL --- */}
      {/* Tailwind: h-[450px] md:h-[600px] establishes fixed window limits to trigger inner message scrollbars */}
      <div className="flex-1 bg-white dark:bg-slate-950 rounded-3xl border border-slate-100 dark:border-slate-800/60 shadow-premium overflow-hidden flex flex-col h-[450px] md:h-[600px] transition-colors">
        
        {/* Inbox Header */}
        <div className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-800/60 p-4 md:p-5 flex items-center justify-between transition-colors">
          <h3 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2 text-xs uppercase tracking-wider">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-450 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Support Live Inbox
          </h3>
        </div>

        {/* Live Messages List View */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4 md:space-y-5 bg-slate-50/50 dark:bg-slate-950/25 scrollbar-thin">
          {contacts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-2 font-medium text-xs sm:text-sm">
              <span>💬</span>
              <span>No support messages yet.</span>
            </div>
          ) : (
            contacts.map((contact) => (
              <div key={contact._id} className="flex flex-col gap-3 md:gap-4 animate-fade-in">
                
                {/* Outgoing Message Sent By User */}
                <div className="flex justify-end">
                  <div className="bg-brand-500 text-white p-3.5 rounded-2xl rounded-tr-sm max-w-[85%] sm:max-w-[80%] shadow-md shadow-brand-500/10">
                    <p className="text-xs sm:text-sm leading-relaxed font-medium">{contact.message}</p>
                    <p className="text-[9px] text-brand-100 text-right mt-1 font-semibold">
                      {new Date(contact.createdAt || Date.now()).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                {/* Incoming Message Received From Support Agent */}
                <div className="flex justify-start">
                  {contact.reply ? (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 text-slate-800 dark:text-slate-200 p-3.5 rounded-2xl rounded-tl-sm max-w-[85%] sm:max-w-[80%] shadow-sm transition-colors">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <div className="w-4.5 h-4.5 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white text-[8px] font-black shadow-sm shrink-0">
                          B
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">GreenGo Support</span>
                      </div>
                      <p className="text-xs sm:text-sm leading-relaxed mt-1 font-medium">{contact.reply}</p>
                    </div>
                  ) : (
                    /* Typing placeholder animation when reply is absent */
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 text-slate-500 dark:text-slate-400 p-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2 transition-colors">
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce"></span>
                      </div>
                      <span className="text-[10px] font-semibold tracking-wide">Support is typing...</span>
                    </div>
                  )}
                </div>
                
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>
        
      </div>
    </div>
  );
}


