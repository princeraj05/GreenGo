import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, MessageCircle, Search, Send } from "lucide-react";
import API from "../../api/axios";
import { getToken } from "../../utils/getToken";

/**
 * Helper to format datetime stamps to readable 2-digit locale time strings.
 */
function formatTime(date) {
  if (!date) return "";
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * Helper to generate initials from a name (max 2 characters).
 */
function initialsFor(name = "User") {
  return name.trim().substring(0, 2).toUpperCase() || "U";
}

/**
 * Helper to get the status text for email responses.
 */
function getEmailStatusText(message) {
  if (message.emailReplyStatus === "sent") return "Email sent";
  if (message.emailReplyStatus === "failed") return "Email failed";
  return "Email pending";
}

/**
 * Contacts Component
 * Manages customer queries and support messages in a live chat inbox format.
 * Admins can filter contacts by search text, review conversation histories,
 * and reply to pending messages directly via email/API integration.
 */
export default function Contacts() {
  
  // ==========================================
  // STATE DECLARATIONS
  // ==========================================
  
  // Entire list of messages fetched from the database
  const [contacts, setContacts] = useState([]);

  // The unique identifier matching the selected user conversation
  const [selectedKey, setSelectedKey] = useState("");

  // Dictionary keeping track of draft replies typed for each conversation key
  const [replyText, setReplyText] = useState({});

  // Query state for search filter
  const [search, setSearch] = useState("");

  // Sending status indicator for the reply submission trigger
  const [sending, setSending] = useState(false);

  // Common UI error feedback container
  const [error, setError] = useState("");

  // Ref container targeting the bottom scroll target in the chat window
  const chatEndRef = useRef(null);

  // ==========================================
  // DATA FETCHING & EVENT HANDLERS
  // ==========================================

  /**
   * Fetches contact submissions from backend admin endpoints.
   */
  async function loadContacts() {
    try {
      const token = await getToken();
      const res = await API.get("/api/admin/contacts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setContacts(res.data || []);
    } catch (err) {
      console.log(err);
      setError("Failed to load messages");
    }
  }

  // Load support submissions on initial mount
  useEffect(() => {
    loadContacts();
  }, []);

  /**
   * Memoized logic to group messages into conversations by email/uid.
   * Calculates pending messages and sorts by the most recent conversation date.
   */
  const conversations = useMemo(() => {
    const grouped = contacts.reduce((acc, contact) => {
      const key = String(contact.email || contact.uid || contact._id || "unknown").toLowerCase();
      if (!acc[key]) {
        acc[key] = {
          key,
          name: contact.name || "Customer",
          email: contact.email || "No email",
          messages: [],
        };
      }
      acc[key].messages.push(contact);
      return acc;
    }, {});

    return Object.values(grouped)
      .map((conversation) => {
        const messages = [...conversation.messages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        const latest = messages[messages.length - 1];
        return {
          ...conversation,
          name: latest?.name || conversation.name,
          email: latest?.email || conversation.email,
          latest,
          messages,
          pendingCount: messages.filter((message) => !message.reply).length,
        };
      })
      .sort((a, b) => new Date(b.latest?.createdAt || 0) - new Date(a.latest?.createdAt || 0));
  }, [contacts]);

  /**
   * Memoized logic to filter conversations by matching name, email, or latest message text.
   */
  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return conversations;
    return conversations.filter((conversation) =>
      `${conversation.name} ${conversation.email} ${conversation.latest?.message || ""}`.toLowerCase().includes(query)
    );
  }, [conversations, search]);

  // Evaluates which conversation object is currently selected based on selectedKey
  const selectedConversation =
    filteredConversations.find((conversation) => conversation.key === selectedKey) ||
    conversations.find((conversation) => conversation.key === selectedKey) ||
    filteredConversations[0] ||
    conversations[0] ||
    null;

  // Auto-selects the first active conversation if no selectedKey is present
  useEffect(() => {
    if (!selectedKey && selectedConversation?.key) {
      setSelectedKey(selectedConversation.key);
    }
  }, [selectedConversation, selectedKey]);

  // Auto-scrolls chat interface to the bottom whenever conversation messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedConversation?.messages]);

  /**
   * Sends the admin's reply message to the server for the current conversation.
   */
  const sendReply = async () => {
    if (!selectedConversation) return;

    const target =
      [...selectedConversation.messages].reverse().find((message) => !message.reply) ||
      selectedConversation.latest;
    const reply = (replyText[selectedConversation.key] || "").trim();
    if (!target || !reply) return;

    try {
      setSending(true);
      setError("");
      const token = await getToken();
      await API.post(
        `/api/admin/contacts/${target._id}/reply`,
        { reply },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReplyText((prev) => ({ ...prev, [selectedConversation.key]: "" }));
      await loadContacts();
    } catch (err) {
      console.log(err);
      setError(err.response?.data?.message || "Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  /**
   * Allows replying to support tickets via the Enter key.
   */
  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendReply();
    }
  };

  return (
    // Main layouts wrapper. Employs responsive horizontal-to-vertical layout logic: flex-col with lg:flex-row
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 pb-10 lg:flex-row lg:gap-8">
      
      {/* --- LEFT HAND: COMPOSE REPLY FORM --- */}
      {/* Tailwind details: flex-1 allows sharing horizontal screen space evenly on desktop */}
      <div className="flex-1">
        
        {/* Header section */}
        <div className="mb-6 md:mb-8">
          <h2 className="flex items-center gap-2.5 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-4xl">
            <MessageCircle className="h-8 w-8 text-brand-500" />
            Support
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400 md:text-base">
            Reply to customer messages from the same live inbox experience.
          </p>
        </div>

        {/* Search, Dropdown and Textarea Form controls */}
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-premium transition-colors dark:border-slate-800/60 dark:bg-slate-950 md:p-8">
          <div className="space-y-4">
            
            {/* Customer Search & Select section */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300 sm:text-sm">
                Customer
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search customer..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:bg-slate-950"
                />
              </div>
              {filteredConversations.length > 0 && (
                <select
                  value={selectedConversation?.key || ""}
                  onChange={(event) => setSelectedKey(event.target.value)}
                  className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                >
                  {filteredConversations.map((conversation) => (
                    <option key={conversation.key} value={conversation.key}>
                      {conversation.name} - {conversation.email}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Admin Message Area input */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300 sm:text-sm">
                Message
              </label>
              <textarea
                value={selectedConversation ? replyText[selectedConversation.key] || "" : ""}
                onChange={(event) =>
                  selectedConversation &&
                  setReplyText({ ...replyText, [selectedConversation.key]: event.target.value })
                }
                onKeyDown={handleKeyDown}
                disabled={!selectedConversation}
                className="h-28 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800/80 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-slate-950 sm:text-sm md:h-32"
                placeholder={selectedConversation ? "Type admin reply..." : "No customer conversation selected"}
              />
            </div>

            {/* Error notifications */}
            {error && (
              <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-bold text-red-600 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
                {error}
              </p>
            )}

            {/* Submit Button */}
            <button
              type="button"
              disabled={sending || !selectedConversation || !replyText[selectedConversation.key]?.trim()}
              onClick={sendReply}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 py-3 text-xs font-bold text-white shadow-md shadow-brand-500/20 transition-all hover:from-brand-600 hover:to-brand-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm md:py-4"
            >
              {sending ? "Sending..." : "Send Message"}
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      {/* --- END LEFT HAND SECTION --- */}

      {/* --- RIGHT HAND: SUPPORT LIVE INBOX CHAT WINDOW --- */}
      {/* Tailwind details: fixed height (h-[450px] md:h-[600px]) coupled with flex-col overflow-hidden to support scrolling chat logs */}
      <div className="flex h-[450px] flex-1 flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-premium transition-colors dark:border-slate-800/60 dark:bg-slate-950 md:h-[600px]">
        
        {/* Inbox header status */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 p-4 transition-colors dark:border-slate-800/60 dark:bg-slate-900/80 md:p-5">
          <h3 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-450 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Support Live Inbox
          </h3>
          {selectedConversation && (
            <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase text-slate-500 shadow-sm dark:bg-slate-950 dark:text-slate-300">
              {selectedConversation.pendingCount} pending
            </span>
          )}
        </div>

        {/* Live chat logs */}
        <div className="scrollbar-thin flex-1 space-y-4 overflow-y-auto bg-slate-50/50 p-4 dark:bg-slate-950/25 md:space-y-5 md:p-6">
          {!selectedConversation ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-xs font-medium text-slate-400 dark:text-slate-500 sm:text-sm">
              <MessageCircle className="h-8 w-8" />
              <span>No support messages yet.</span>
            </div>
          ) : (
            selectedConversation.messages.map((contact) => (
              <div key={contact._id} className="flex animate-fade-in flex-col gap-3 md:gap-4">
                
                {/* --- CUSTOMER MESSAGE OUTLET --- */}
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-brand-500 p-3.5 text-white shadow-md shadow-brand-500/10 sm:max-w-[80%]">
                    <div className="mb-1 flex items-center justify-end gap-1.5">
                      <span className="text-[10px] font-bold text-brand-100">
                        {selectedConversation.name}
                      </span>
                    </div>
                    <p className="text-xs font-medium leading-relaxed sm:text-sm">{contact.message}</p>
                    <p className="mt-1 text-right text-[9px] font-semibold text-brand-100">
                      {formatTime(contact.createdAt || Date.now())}
                    </p>
                  </div>
                </div>

                {/* --- ADMIN REPLY OUTLET --- */}
                <div className="flex justify-start">
                  {contact.reply ? (
                    <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-slate-200/80 bg-white p-3.5 text-slate-800 shadow-sm transition-colors dark:border-slate-800/80 dark:bg-slate-900 dark:text-slate-200 sm:max-w-[80%]">
                      <div className="mb-1.5 flex items-center gap-1.5">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-[8px] font-black text-white shadow-sm">
                          A
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Admin Support</span>
                      </div>
                      <p className="mt-1 text-xs font-medium leading-relaxed sm:text-sm">{contact.reply}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-black uppercase text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                          <CheckCircle2 className="mr-1 inline h-3 w-3" />
                          {getEmailStatusText(contact)}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400">
                          {formatTime(contact.repliedAt || contact.createdAt)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* --- WAITING PLACEHOLDER --- */
                    <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-slate-200/80 bg-white p-3 text-slate-500 shadow-sm transition-colors dark:border-slate-800/80 dark:bg-slate-900 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-500 [animation-delay:-0.3s]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-500 [animation-delay:-0.15s]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-500" />
                      </div>
                      <span className="text-[10px] font-semibold tracking-wide">Waiting for admin reply...</span>
                    </div>
                  )}
                </div>

              </div>
            ))
          )}
          {/* Scroll anchor tag targeting the bottom boundary */}
          <div ref={chatEndRef} />
        </div>
      </div>
      {/* --- END SUPPORT LIVE INBOX SECTION --- */}

    </div>
  );
}
