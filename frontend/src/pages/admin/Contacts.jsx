import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, MessageCircle, Search, Send, Mail, Phone, User } from "lucide-react";
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

  // All users fetched from database
  const [users, setUsers] = useState([]);

  // The unique identifier matching the selected user conversation
  const [selectedKey, setSelectedKey] = useState("");

  // Currently selected user object (for composing new app messages or emails)
  const [selectedUser, setSelectedUser] = useState(null);

  // Dictionary keeping track of draft replies typed for each conversation key
  const [replyText, setReplyText] = useState({});

  // Query state for search filters
  const [search, setSearch] = useState("");
  const [emailSearch, setEmailSearch] = useState("");
  const [callSearch, setCallSearch] = useState("");

  // Tab State
  const [activeTab, setActiveTab] = useState("appMessage");

  // Sending status indicator for the reply submission trigger
  const [sending, setSending] = useState(false);

  // Common UI error feedback container
  const [error, setError] = useState("");

  // Email form states
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null);

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

  /**
   * Fetches all user profiles from backend.
   */
  async function loadAllUsers() {
    try {
      const token = await getToken();
      const res = await API.get("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data || []);
    } catch (err) {
      console.log("Failed to load users:", err);
    }
  }

  // Load support submissions and user list on initial mount
  useEffect(() => {
    loadContacts();
    loadAllUsers();
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

  // Evaluates which conversation object is currently selected based on selectedKey / selectedUser
  const selectedConversation = useMemo(() => {
    if (selectedUser) {
      const key = String(selectedUser.email || selectedUser.uid || selectedUser._id || "unknown").toLowerCase();
      const existing = conversations.find((c) => c.key === key);
      if (existing) {
        return existing;
      }
      return {
        key: `new-user-${selectedUser._id}`,
        name: selectedUser.name || "Customer",
        email: selectedUser.email || "No email",
        isNewConversation: true,
        userId: selectedUser._id,
        messages: [],
        pendingCount: 0,
      };
    }
    
    const found = conversations.find((conversation) => conversation.key === selectedKey);
    if (found) return found;

    return conversations[0] || null;
  }, [conversations, selectedKey, selectedUser]);

  // Auto-scrolls chat interface to the bottom whenever conversation messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedConversation?.messages]);

  const handleUserSelect = (userId) => {
    const u = users.find((usr) => usr._id === userId);
    setSelectedUser(u || null);
    if (u) {
      const key = String(u.email || u.uid || u._id || "unknown").toLowerCase();
      setSelectedKey(key);
    } else {
      setSelectedKey("");
    }
  };

  /**
   * Sends the admin's reply message to the server for the current conversation.
   */
  const sendReply = async () => {
    if (!selectedConversation) return;

    const reply = (replyText[selectedConversation.key] || "").trim();
    if (!reply) return;

    try {
      setSending(true);
      setError("");
      const token = await getToken();

      if (selectedConversation.isNewConversation) {
        const res = await API.post(
          "/api/admin/contacts/initiate",
          { userId: selectedConversation.userId, message: reply },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setReplyText((prev) => ({ ...prev, [selectedConversation.key]: "" }));
        await loadContacts();

        if (res.data?.contact) {
          const key = String(res.data.contact.email || res.data.contact.uid || res.data.contact._id).toLowerCase();
          setSelectedKey(key);
        }
      } else {
        const target =
          [...selectedConversation.messages].reverse().find((message) => !message.reply) ||
          selectedConversation.latest;
        
        if (!target) return;

        await API.post(
          `/api/admin/contacts/${target._id}/reply`,
          { reply },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setReplyText((prev) => ({ ...prev, [selectedConversation.key]: "" }));
        await loadContacts();
      }
    } catch (err) {
      console.log(err);
      setError(err.response?.data?.message || "Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  const sendEmailMessage = async () => {
    if (!selectedUser || !emailSubject.trim() || !emailMessage.trim()) return;

    try {
      setEmailSending(true);
      setEmailStatus(null);
      const token = await getToken();
      const res = await API.post(
        "/api/admin/contacts/send-email",
        {
          userId: selectedUser._id,
          subject: emailSubject,
          message: emailMessage,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEmailStatus({ type: "success", text: res.data?.message || "Email sent successfully!" });
      setEmailSubject("");
      setEmailMessage("");
    } catch (err) {
      console.error(err);
      setEmailStatus({
        type: "error",
        text: err.response?.data?.message || "Failed to send email. Check SMTP settings.",
      });
    } finally {
      setEmailSending(false);
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
    <div className="mx-auto w-full max-w-7xl pt-6 md:pt-0 pb-10 px-4 sm:px-6 lg:px-8">
      
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

      {/* --- SUPPORT NAVIGATION TABS --- */}
      <div className="flex border-b border-slate-200 dark:border-slate-800/80 mb-6 gap-2 flex-wrap">
        <button
          onClick={() => setActiveTab("appMessage")}
          className={`pb-3 px-4 text-sm font-black transition-all flex items-center gap-2 border-b-2 -mb-[2px] ${
            activeTab === "appMessage"
              ? "border-brand-500 text-brand-700 dark:text-brand-300"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
          }`}
        >
          <MessageCircle size={16} />
          App Message
        </button>
        <button
          onClick={() => setActiveTab("email")}
          className={`pb-3 px-4 text-sm font-black transition-all flex items-center gap-2 border-b-2 -mb-[2px] ${
            activeTab === "email"
              ? "border-brand-500 text-brand-700 dark:text-brand-300"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
          }`}
        >
          <Mail size={16} />
          Email Message
        </button>
        <button
          onClick={() => setActiveTab("call")}
          className={`pb-3 px-4 text-sm font-black transition-all flex items-center gap-2 border-b-2 -mb-[2px] ${
            activeTab === "call"
              ? "border-brand-500 text-brand-700 dark:text-brand-300"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
          }`}
        >
          <Phone size={16} />
          Call Users
        </button>
      </div>

      {/* --- APP MESSAGE TAB --- */}
      {activeTab === "appMessage" && (
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8 animate-fade-in">
          {/* --- LEFT HAND: COMPOSE REPLY FORM --- */}
          <div className="flex-1">
            <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-premium transition-colors dark:border-slate-800/60 dark:bg-slate-950 md:p-8">
              <div className="space-y-4">
                
                {/* Search & Select User */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300 sm:text-sm">
                    Customer
                  </label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Type name or email to search..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:bg-slate-950"
                    />
                  </div>
                  
                  <select
                    value={selectedUser?._id || ""}
                    onChange={(event) => handleUserSelect(event.target.value)}
                    className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                  >
                    <option value="">-- Select Customer --</option>
                    {users
                      .filter((u) => {
                        const q = search.trim().toLowerCase();
                        if (!q) return true;
                        return (
                          (u.name || "").toLowerCase().includes(q) ||
                          (u.email || "").toLowerCase().includes(q)
                        );
                      })
                      .map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.name || "Customer"} ({u.email || u.phone || "No contact"})
                        </option>
                      ))}
                  </select>
                </div>

                {/* Message TextArea */}
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
                    placeholder={selectedConversation ? "Type admin reply..." : "No customer selected"}
                  />
                </div>

                {error && (
                  <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-bold text-red-600 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
                    {error}
                  </p>
                )}

                <button
                  type="button"
                  disabled={sending || !selectedConversation || !replyText[selectedConversation.key]?.trim()}
                  onClick={sendReply}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 py-3 text-xs font-bold text-white shadow-md shadow-brand-500/20 transition-all hover:from-brand-650 hover:to-brand-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm md:py-4"
                >
                  {sending ? "Sending..." : "Send Message"}
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* --- RIGHT HAND: SUPPORT LIVE INBOX CHAT WINDOW --- */}
          <div className="flex h-[450px] flex-1 flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-premium transition-colors dark:border-slate-800/60 dark:bg-slate-950 md:h-[600px]">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 p-4 transition-colors dark:border-slate-800/60 dark:bg-slate-900/80 md:p-5">
              <h3 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-450 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                Support Live Inbox
              </h3>
              {selectedConversation && !selectedConversation.isNewConversation && (
                <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase text-slate-500 shadow-sm dark:bg-slate-950 dark:text-slate-300">
                  {selectedConversation.pendingCount} pending
                </span>
              )}
            </div>

            <div className="scrollbar-thin flex-1 space-y-4 overflow-y-auto bg-slate-50/50 p-4 dark:bg-slate-950/25 md:space-y-5 md:p-6">
              {!selectedConversation ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-xs font-medium text-slate-400 dark:text-slate-500 sm:text-sm">
                  <MessageCircle className="h-8 w-8" />
                  <span>Select a customer to view conversation.</span>
                </div>
              ) : selectedConversation.isNewConversation ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-xs font-medium text-slate-400 dark:text-slate-500 sm:text-sm">
                  <MessageCircle className="h-8 w-8 text-brand-500" />
                  <span>No prior messages. Send a message to start a conversation with {selectedConversation.name}.</span>
                </div>
              ) : (
                selectedConversation.messages.map((contact) => (
                  <div key={contact._id} className="flex animate-fade-in flex-col gap-3 md:gap-4">
                    
                    {/* Outgoing from user */}
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

                    {/* Replies from support */}
                    {contact.replies && contact.replies.length > 0 ? (
                      contact.replies.map((replyObj, idx) => (
                        <div key={replyObj._id || idx} className="flex justify-start">
                          <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-slate-200/80 bg-white p-3.5 text-slate-800 shadow-sm transition-colors dark:border-slate-800/80 dark:bg-slate-900 dark:text-slate-200 sm:max-w-[80%]">
                            <div className="mb-1.5 flex items-center gap-1.5">
                              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-[8px] font-black text-white shadow-sm">
                                A
                              </div>
                              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Admin Support</span>
                            </div>
                            <p className="mt-1 text-xs font-medium leading-relaxed sm:text-sm">{replyObj.reply}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              {replyObj.emailReplyStatus && replyObj.emailReplyStatus !== "not_required" && (
                                <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-black uppercase text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                                  <CheckCircle2 className="mr-1 inline h-3 w-3" />
                                  {getEmailStatusText(replyObj)}
                                </span>
                              )}
                              <span className="text-[9px] font-bold text-slate-400">
                                {formatTime(replyObj.repliedAt || contact.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : contact.reply ? (
                      <div className="flex justify-start">
                        <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-slate-200/80 bg-white p-3.5 text-slate-800 shadow-sm transition-colors dark:border-slate-800/80 dark:bg-slate-900 dark:text-slate-200 sm:max-w-[80%]">
                          <div className="mb-1.5 flex items-center gap-1.5">
                            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-[8px] font-black text-white shadow-sm">
                              A
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Admin Support</span>
                          </div>
                          <p className="mt-1 text-xs font-medium leading-relaxed sm:text-sm">{contact.reply}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            {contact.emailReplyStatus && contact.emailReplyStatus !== "not_required" && (
                              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-black uppercase text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                                <CheckCircle2 className="mr-1 inline h-3 w-3" />
                                {getEmailStatusText(contact)}
                              </span>
                            )}
                            <span className="text-[9px] font-bold text-slate-400">
                              {formatTime(contact.repliedAt || contact.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-start">
                        <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-slate-200/80 bg-white p-3 text-slate-500 shadow-sm transition-colors dark:border-slate-800/80 dark:bg-slate-900 dark:text-slate-400">
                          <div className="flex items-center gap-1">
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-500 [animation-delay:-0.3s]" />
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-500 [animation-delay:-0.15s]" />
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-500" />
                          </div>
                          <span className="text-[10px] font-semibold tracking-wide">Waiting for admin reply...</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>
          </div>
        </div>
      )}

      {/* --- EMAIL TAB --- */}
      {activeTab === "email" && (
        <div className="max-w-2xl mx-auto w-full animate-fade-in">
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-premium transition-colors dark:border-slate-800/60 dark:bg-slate-950 md:p-8">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Mail className="h-5 w-5 text-brand-500" />
              Send Email Message
            </h3>

            <div className="space-y-4">
              {/* Search User */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300 sm:text-sm">
                  Search User
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={emailSearch}
                    onChange={(event) => setEmailSearch(event.target.value)}
                    placeholder="Search user by name or email..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:bg-slate-950"
                  />
                </div>

                <select
                  value={selectedUser?._id || ""}
                  onChange={(event) => {
                    const u = users.find((usr) => usr._id === event.target.value);
                    setSelectedUser(u || null);
                  }}
                  className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                >
                  <option value="">-- Select User --</option>
                  {users
                    .filter((u) => {
                      const q = emailSearch.trim().toLowerCase();
                      if (!q) return true;
                      return (
                        (u.name || "").toLowerCase().includes(q) ||
                        (u.email || "").toLowerCase().includes(q)
                      );
                    })
                    .map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.name || "User"} ({u.email || u.phone || "No contact"})
                      </option>
                    ))}
                </select>
              </div>

              {/* Selected User Details */}
              {selectedUser && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 space-y-3">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">User Name</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{selectedUser.name || "GreenGo User"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Registered Email</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200">
                      {selectedUser.email ? (
                        <a href={`mailto:${selectedUser.email}`} className="text-brand-500 hover:underline">
                          {selectedUser.email}
                        </a>
                      ) : (
                        <span className="text-red-500">No registered email address found</span>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Subject Input */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300 sm:text-sm">
                  Email Subject
                </label>
                <input
                  type="text"
                  required
                  value={emailSubject}
                  onChange={(event) => setEmailSubject(event.target.value)}
                  disabled={!selectedUser || !selectedUser.email}
                  placeholder="Regarding Your GreenGo Order"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:bg-slate-950"
                />
              </div>

              {/* Message Input */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-300 sm:text-sm">
                  Email Message
                </label>
                <textarea
                  required
                  value={emailMessage}
                  onChange={(event) => setEmailMessage(event.target.value)}
                  disabled={!selectedUser || !selectedUser.email}
                  placeholder="Hello Lakhman, your order has been successfully processed..."
                  className="h-32 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800/80 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-slate-950 sm:text-sm md:h-40"
                />
              </div>

              {/* Send Status Notification */}
              {emailStatus && (
                <p className={`rounded-xl border px-4 py-3 text-xs font-bold ${
                  emailStatus.type === "success"
                    ? "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-950/40 dark:bg-emerald-950/20 dark:text-emerald-300"
                    : "border-red-100 bg-red-50 text-red-700 dark:border-red-950/40 dark:bg-red-950/20 dark:text-red-300"
                }`}>
                  {emailStatus.text}
                </p>
              )}

              {/* Send Button */}
              <button
                type="button"
                disabled={emailSending || !selectedUser || !selectedUser.email || !emailSubject.trim() || !emailMessage.trim()}
                onClick={sendEmailMessage}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 py-3 text-xs font-bold text-white shadow-md shadow-brand-500/20 transition-all hover:from-brand-650 hover:to-brand-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm md:py-4"
              >
                {emailSending ? "Sending..." : "Send Email"}
                <Mail className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CALL USERS TAB --- */}
      {activeTab === "call" && (
        <div className="w-full animate-fade-in">
          {/* Search bar */}
          <div className="relative w-full max-w-md mb-6">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search size={20} className="text-slate-400 dark:text-slate-500" />
            </div>
            <input
              type="text"
              placeholder="Search users by name, email, phone..."
              value={callSearch}
              onChange={(e) => setCallSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:bg-slate-950"
            />
          </div>

          {/* User grid directory */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {users
              .filter((u) => {
                const q = callSearch.trim().toLowerCase();
                if (!q) return true;
                return (
                  (u.name || "").toLowerCase().includes(q) ||
                  (u.email || "").toLowerCase().includes(q) ||
                  (u.phone || "").toLowerCase().includes(q)
                );
              })
              .map((u) => (
                <div
                  key={u._id}
                  className="rounded-2xl border border-slate-100 bg-white p-5 shadow-premium transition-colors dark:border-slate-800/60 dark:bg-slate-950 flex flex-col justify-between min-h-[170px]"
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-450 flex items-center justify-center font-bold text-sm shrink-0">
                        {initialsFor(u.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-slate-950 dark:text-white truncate">{u.name || "GreenGo User"}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{u.email || "No email"}</p>
                      </div>
                    </div>
                    <p className="mt-4 flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                      <span className="text-base">📱</span> {u.phone || "Phone missing"}
                    </p>
                  </div>
                  <div className="mt-5">
                    {u.phone ? (
                      <a
                        href={`tel:${u.phone}`}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 py-3 text-xs font-bold text-white shadow-md shadow-emerald-500/20 transition-all active:scale-[0.98] text-center w-full min-h-11 flex items-center justify-center gap-2"
                      >
                        <Phone size={15} />
                        Call
                      </a>
                    ) : (
                      <button
                        disabled
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-900 py-3 text-xs font-bold text-slate-400 dark:text-slate-600 cursor-not-allowed w-full min-h-11"
                      >
                        <Phone size={15} />
                        No Phone Number
                      </button>
                    )}
                  </div>
                </div>
              ))}
            {users.filter((u) => {
              const q = callSearch.trim().toLowerCase();
              if (!q) return true;
              return (
                (u.name || "").toLowerCase().includes(q) ||
                (u.email || "").toLowerCase().includes(q) ||
                (u.phone || "").toLowerCase().includes(q)
              );
            }).length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-400 dark:text-slate-500 font-medium">
                No users matched your query.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
