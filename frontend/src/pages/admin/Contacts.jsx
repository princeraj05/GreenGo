import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, MessageCircle, Search, Send, Mail, Phone, User, ArrowLeft, Paperclip, Smile } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import io from "socket.io-client";
import { getApiUrl } from "../../utils/getApiUrl";
import API from "../../api/axios";
import { getToken } from "../../utils/getToken";
import EmojiPicker from "../../components/ui/EmojiPicker";

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

  // File upload & Emoji picker states
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(false);
  const fileInputRef = useRef(null);

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

  // Ref container targeting the scrollable chat history container
  const chatContainerRef = useRef(null);

  // URL search parameter hooks
  const [searchParams, setSearchParams] = useSearchParams();
  const chatParam = searchParams.get("chat") || "";
  const userParam = searchParams.get("user") || "";

  // Mobile layout detection
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Save scroll position for conversation list
  const conversationListRef = useRef(null);
  const [savedScrollTop, setSavedScrollTop] = useState(0);

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

  const socketRef = useRef(null);

  // Load support submissions and user list on initial mount
  useEffect(() => {
    loadContacts();
    loadAllUsers();

    let socket;
    const initSocket = async () => {
      const token = await getToken();
      if (!token) return;

      socket = io(getApiUrl(), {
        auth: { token },
        transports: ["websocket", "polling"],
      });
      socketRef.current = socket;

      socket.on("connect", () => {
        console.log("[Socket] Admin connected to support real-time");
      });

      socket.on("support:new-message", (incomingContact) => {
        console.log("[Socket] Admin received support message:", incomingContact);

        setContacts((prevContacts) => {
          const exists = prevContacts.some((c) => c._id === incomingContact._id);
          if (exists) {
            return prevContacts.map((c) =>
              c._id === incomingContact._id ? incomingContact : c
            );
          } else {
            return [incomingContact, ...prevContacts];
          }
        });
      });
      socket.on("support:read-status", ({ key, readBy }) => {
        console.log("[Socket] Admin received read-status:", { key, readBy });
        if (readBy === "user") {
          setContacts((prevContacts) =>
            prevContacts.map((c) => {
              const contactKey = String(c.email || c.uid || c._id || "unknown").toLowerCase();
              if (contactKey === key) {
                const updatedReplies = c.replies ? c.replies.map((r) => ({ ...r, read: true })) : [];
                return { ...c, replies: updatedReplies, replyRead: true };
              }
              return c;
            })
          );
        } else if (readBy === "admin") {
          setContacts((prevContacts) =>
            prevContacts.map((c) => {
              const contactKey = String(c.email || c.uid || c._id || "unknown").toLowerCase();
              if (contactKey === key) {
                return { ...c, read: true };
              }
              return c;
            })
          );
        }
      });
    };

    initSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.off("connect");
        socketRef.current.off("support:new-message");
        socketRef.current.off("support:read-status");
        socketRef.current.disconnect();
      }
    };
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
        
        const pendingCount = messages.filter((m) => m.read === false).length;

        let latestMsgObj = null;
        if (messages.length > 0) {
          const lastContact = messages[messages.length - 1];
          if (lastContact.replies && lastContact.replies.length > 0) {
            const lastReply = lastContact.replies[lastContact.replies.length - 1];
            latestMsgObj = {
              text: lastReply.reply,
              attachment: lastReply.attachment,
              createdAt: lastReply.repliedAt || lastReply.createdAt || lastContact.createdAt,
            };
          } else if (lastContact.reply) {
            latestMsgObj = {
              text: lastContact.reply,
              attachment: lastContact.attachment,
              createdAt: lastContact.repliedAt || lastContact.createdAt,
            };
          } else {
            latestMsgObj = {
              text: lastContact.message,
              attachment: lastContact.attachment,
              createdAt: lastContact.createdAt,
            };
          }
        }

        return {
          ...conversation,
          name: latest?.name || conversation.name,
          email: latest?.email || conversation.email,
          latest,
          latestMsgObj,
          messages,
          pendingCount,
        };
      })
      .sort((a, b) => new Date(b.latestMsgObj?.createdAt || 0) - new Date(a.latestMsgObj?.createdAt || 0));
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
    
    if (selectedKey) {
      const found = conversations.find((conversation) => conversation.key === selectedKey);
      if (found) return found;
    }

    return null;
  }, [conversations, selectedKey, selectedUser]);

  // Flatten messages into a sequential list of incoming (customer) and outgoing (admin) messages
  const chatMessages = useMemo(() => {
    if (!selectedConversation || !selectedConversation.messages) return [];
    
    const list = [];
    selectedConversation.messages.forEach((msg) => {
      // Customer message (incoming to admin)
      list.push({
        _id: msg._id,
        type: "incoming",
        text: msg.message,
        createdAt: msg.createdAt,
        name: selectedConversation.name,
        attachment: msg.attachment || null,
      });

      // Admin replies (outgoing from admin)
      if (msg.replies && msg.replies.length > 0) {
        msg.replies.forEach((replyObj, idx) => {
          list.push({
            _id: replyObj._id || `${msg._id}-reply-${idx}`,
            type: "outgoing",
            text: replyObj.reply,
            createdAt: replyObj.repliedAt || msg.createdAt,
            emailReplyStatus: replyObj.emailReplyStatus,
            attachment: replyObj.attachment || null,
            read: replyObj.read,
          });
        });
      } else if (msg.reply) {
        list.push({
          _id: `${msg._id}-reply`,
          type: "outgoing",
          text: msg.reply,
          createdAt: msg.repliedAt || msg.createdAt,
          emailReplyStatus: msg.emailReplyStatus,
          attachment: msg.attachment || null,
          read: msg.replyRead,
        });
      }
    });

    // Sort by createdAt
    return list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [selectedConversation]);

  // Set of active conversation keys to quickly check if a user already has an active thread
  const conversationsKeys = useMemo(() => {
    return new Set(conversations.map((c) => c.key));
  }, [conversations]);

  // Filtered active conversations matching the search input
  const filteredConversations = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (c) =>
        (c.name || "").toLowerCase().includes(q) ||
        (c.email || "").toLowerCase().includes(q)
    );
  }, [conversations, search]);

  // Filtered users matching the search input who do not yet have an active conversation
  const filteredNewUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return users.filter((u) => {
      const userKey = String(u.email || u.uid || u._id || "unknown").toLowerCase();
      if (conversationsKeys.has(userKey)) return false;
      return (
        (u.name || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.phone || "").toLowerCase().includes(q)
      );
    });
  }, [users, search, conversationsKeys]);

  // Local scroll to the bottom of the chat history container when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [selectedConversation?.messages]);

  // Automatically mark customer messages as read when selecting a conversation
  useEffect(() => {
    if (!selectedConversation || selectedConversation.isNewConversation) return;

    const hasUnreadCustomer = selectedConversation.messages.some(m => m.read === false);

    if (hasUnreadCustomer) {
      const key = selectedConversation.key;
      getToken().then((token) => {
        API.patch(
          "/api/admin/contacts/read",
          { key },
          { headers: { Authorization: `Bearer ${token}` } }
        ).then(() => {
          setContacts((prev) =>
            prev.map((c) => {
              const contactKey = String(c.email || c.uid || c._id || "unknown").toLowerCase();
              if (contactKey === key) {
                return { ...c, read: true };
              }
              return c;
            })
          );
        }).catch(console.error);
      });
    }
  }, [selectedConversation]);

  // Sync URL search parameters with selection states
  useEffect(() => {
    if (chatParam) {
      setSelectedKey(chatParam);
    } else {
      setSelectedKey("");
    }
  }, [chatParam]);

  useEffect(() => {
    if (userParam) {
      const u = users.find((usr) => usr._id === userParam);
      setSelectedUser(u || null);
    } else {
      setSelectedUser(null);
    }
  }, [userParam, users]);

  // Restore scroll position when list is shown
  useEffect(() => {
    if (!chatParam && conversationListRef.current && savedScrollTop > 0) {
      const listEl = conversationListRef.current;
      requestAnimationFrame(() => {
        listEl.scrollTop = savedScrollTop;
      });
    }
  }, [chatParam, savedScrollTop]);

  const handleUserSelect = (userId) => {
    const u = users.find((usr) => usr._id === userId);
    if (u) {
      const key = String(u.email || u.uid || u._id || "unknown").toLowerCase();
      const shouldReplace = !!(chatParam || userParam);
      setSearchParams({ user: u._id, chat: key }, { replace: shouldReplace });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

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
    if (!attachment || !attachment.url) return null;
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
            ? "bg-brand-600/40 border-brand-400/35 hover:bg-brand-600/60 text-white" 
            : "bg-slate-50 dark:bg-slate-900 border-slate-200/60 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100"
        }`}
      >
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
          isOutgoing
            ? "bg-brand-400/20 text-brand-100"
            : "bg-red-50 dark:bg-red-950/20 text-red-500 dark:text-red-450"
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
   * Sends the admin's reply message to the server for the current conversation.
   */
  const sendReply = async () => {
    if (!selectedConversation) return;

    const reply = (replyText[selectedConversation.key] || "").trim();
    if (!reply && !selectedFile) return;

    try {
      setSending(true);
      setError("");
      const token = await getToken();

      let uploadedAttachment = null;
      if (selectedFile) {
        setUploadProgress(true);
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

      if (selectedConversation.isNewConversation) {
        const res = await API.post(
          "/api/admin/contacts/initiate",
          { 
            userId: selectedConversation.userId, 
            message: reply,
            attachment: uploadedAttachment 
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setReplyText((prev) => ({ ...prev, [selectedConversation.key]: "" }));
        setSelectedFile(null);
        setFilePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        await loadContacts();

        if (res.data?.contact) {
          const key = String(res.data.contact.email || res.data.contact.uid || res.data.contact._id).toLowerCase();
          const shouldReplace = !!(chatParam || userParam);
          setSearchParams({ chat: key }, { replace: shouldReplace });
        }
      } else {
        const target =
          [...selectedConversation.messages].reverse().find((message) => !message.reply) ||
          selectedConversation.latest;
        
        if (!target) return;

        await API.post(
          `/api/admin/contacts/${target._id}/reply`,
          { 
            reply,
            attachment: uploadedAttachment 
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setReplyText((prev) => ({ ...prev, [selectedConversation.key]: "" }));
        setSelectedFile(null);
        setFilePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        await loadContacts();
      }
    } catch (err) {
      console.log(err);
      setError(err.response?.data?.message || err.message || "Failed to send reply");
    } finally {
      setSending(false);
      setUploadProgress(false);
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
        <div className="flex flex-col lg:flex-row gap-0 lg:h-[700px] animate-fade-in w-full relative">
          {/* --- LEFT SIDEBAR: ACTIVE CHATS & SEARCH --- */}
          <div 
            className={`w-full lg:w-80 xl:w-96 flex flex-col bg-transparent h-[300px] lg:h-full shrink-0 border-r border-slate-200/80 dark:border-slate-800/80 pr-2 ${
              selectedConversation ? "hidden lg:flex" : "flex"
            }`}
          >
            {/* Search header */}
            <div className="py-2.5 pb-4 bg-transparent">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search chats or customers..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-xs font-semibold text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:bg-slate-950"
                />
              </div>
            </div>

            {/* Scrollable Conversation List */}
            <div ref={conversationListRef} className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 scrollbar-thin">
              {/* Active Conversations */}
              {filteredConversations.length > 0 && (
                <div>
                  <div className="px-1 py-2 text-[9px] font-extrabold uppercase tracking-wider text-slate-400 bg-transparent">
                    Conversations
                  </div>
                  {filteredConversations.map((c) => {
                    const isSelected = selectedConversation?.key === c.key;
                    const latestMsgObj = c.latestMsgObj;
                    const hasAttachment = latestMsgObj?.attachment && latestMsgObj.attachment.url;
                    const lastMsg = latestMsgObj?.text
                      ? latestMsgObj.text
                      : hasAttachment
                        ? (latestMsgObj.attachment.type === "image" || latestMsgObj.attachment.mimeType?.startsWith("image/") ? "📷 Image" : `📄 ${latestMsgObj.attachment.fileName || "File"}`)
                        : "";
                    return (
                      <button
                        key={c.key}
                        onClick={() => {
                          if (conversationListRef.current) {
                            setSavedScrollTop(conversationListRef.current.scrollTop);
                          }
                          setSelectedKey(c.key);
                          setSelectedUser(null);
                          setSearch("");
                          const shouldReplace = !!(chatParam || userParam);
                          setSearchParams({ chat: c.key }, { replace: shouldReplace });
                        }}
                        className={`w-full text-left px-3 py-3.5 flex items-center gap-3 transition-colors border-b border-slate-100 dark:border-slate-800/60 ${
                          isSelected
                            ? "bg-slate-200/50 dark:bg-slate-900 border-l-4 border-brand-500"
                            : "hover:bg-slate-100/50 dark:hover:bg-slate-900/35 border-l-4 border-transparent"
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-450 flex items-center justify-center font-bold text-sm shrink-0 shadow-sm border border-brand-100/50 dark:border-brand-900/30">
                          {initialsFor(c.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex justify-between items-baseline">
                            <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                              {c.name}
                            </h4>
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 shrink-0 font-medium ml-1">
                              {formatTime(latestMsgObj?.createdAt)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center gap-1.5 mt-0.5">
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {lastMsg}
                            </p>
                            {c.pendingCount > 0 && (
                              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-bold text-white shrink-0">
                                {c.pendingCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Start New Chat List */}
              {filteredNewUsers.length > 0 && (
                <div>
                  <div className="px-1 py-2 text-[9px] font-extrabold uppercase tracking-wider text-slate-400 bg-transparent">
                    Start New Chat
                  </div>
                  {filteredNewUsers.map((u) => {
                    const userKey = String(u.email || u.uid || u._id || "unknown").toLowerCase();
                    const isSelected = selectedConversation?.key === `new-user-${u._id}` || selectedConversation?.key === userKey;
                    return (
                      <button
                        key={u._id}
                        onClick={() => {
                          if (conversationListRef.current) {
                            setSavedScrollTop(conversationListRef.current.scrollTop);
                          }
                          handleUserSelect(u._id);
                          setSearch("");
                        }}
                        className={`w-full text-left px-3 py-3.5 flex items-center gap-3 transition-colors border-b border-slate-100 dark:border-slate-800/60 ${
                          isSelected
                            ? "bg-slate-200/50 dark:bg-slate-900 border-l-4 border-brand-500"
                            : "hover:bg-slate-100/50 dark:hover:bg-slate-900/35 border-l-4 border-transparent"
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-450 flex items-center justify-center font-bold text-sm shrink-0 border border-slate-200/50 dark:border-slate-800/50">
                          {initialsFor(u.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {u.name || "Customer"}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {u.phone || "Click to start conversation"}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {filteredConversations.length === 0 && filteredNewUsers.length === 0 && (
                <div className="p-8 text-center text-slate-400 dark:text-slate-500 font-medium text-xs">
                  No conversations or users found.
                </div>
              )}
            </div>
          </div>

          {/* --- RIGHT SIDEBAR: LIVE CHAT WINDOW --- */}
          {/* On mobile, this will overlay as a full-screen screen when a chat is open. */}
          <div 
            className={`fixed inset-0 z-[900] bg-white dark:bg-slate-950 flex flex-col transition-all duration-300 ease-in-out lg:relative lg:inset-auto lg:z-auto lg:flex-1 lg:h-full lg:border-l lg:border-slate-200/80 lg:dark:border-slate-800/80 ${
              selectedConversation 
                ? "translate-x-0 opacity-100" 
                : "translate-x-full opacity-0 pointer-events-none lg:opacity-100 lg:translate-x-0 lg:flex"
            }`}
          >
            {/* Mobile Chat Header (Only visible on mobile when chat is open) */}
            {selectedConversation && (
              <div 
                className="flex items-center justify-between px-4 bg-slate-900 dark:bg-slate-950 border-b border-slate-800/60 lg:hidden shrink-0 text-white"
                style={{
                  paddingTop: "env(safe-area-inset-top)",
                  height: "calc(4rem + env(safe-area-inset-top))"
                }}
              >
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                      if (conversationListRef.current) {
                        setSavedScrollTop(conversationListRef.current.scrollTop);
                      }
                      setSelectedKey("");
                      setSelectedUser(null);
                      setSearchParams({}, { replace: true });
                    }}
                    className="w-10 h-10 flex items-center justify-center rounded-full text-slate-350 hover:text-white hover:bg-slate-800 active:bg-slate-800/50 transition-colors"
                    aria-label="Back to contacts"
                  >
                    <ArrowLeft size={24} />
                  </button>
                  
                  <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-extrabold text-sm shrink-0 shadow-sm border border-emerald-450/30">
                    {initialsFor(selectedConversation.name)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-extrabold text-white leading-tight">
                        {selectedConversation.name}
                      </h3>
                      <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block shrink-0 animate-pulse"></span>
                    </div>
                    <p className="text-[9px] text-slate-400 font-semibold mt-0.5">
                      {selectedConversation.isNewConversation ? "New Chat Thread" : "Live Chat Session"}
                    </p>
                  </div>
                </div>

                {!selectedConversation.isNewConversation && selectedConversation.pendingCount > 0 && (
                  <span className="rounded-full bg-slate-800 dark:bg-slate-900 border border-slate-700/50 px-3 py-1 text-[9px] font-black uppercase text-emerald-400 shadow-sm">
                    {selectedConversation.pendingCount} pending
                  </span>
                )}
              </div>
            )}

            {/* Desktop Chat Header */}
            <div className="hidden lg:flex items-center justify-between border-b border-slate-100 bg-slate-50 p-4 transition-colors dark:border-slate-800/60 dark:bg-slate-900/80 md:p-5">
              {selectedConversation ? (
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                      if (conversationListRef.current) {
                        setSavedScrollTop(conversationListRef.current.scrollTop);
                      }
                      setSelectedKey("");
                      setSelectedUser(null);
                      setSearchParams({}, { replace: true });
                    }}
                    className="w-10 h-10 flex items-center justify-center rounded-full text-slate-455 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 active:bg-slate-300 dark:active:bg-slate-700/50 transition-colors mr-1 shrink-0"
                    aria-label="Back to contacts"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <div className="w-10 h-10 rounded-full bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-450 flex items-center justify-center font-bold text-sm shrink-0 shadow-sm border border-brand-100/50 dark:border-brand-900/30">
                    {initialsFor(selectedConversation.name)}
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {selectedConversation.name}
                    </h3>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">
                      {selectedConversation.isNewConversation ? "New Chat Thread" : "Live Chat Session"}
                    </p>
                  </div>
                </div>
              ) : (
                <h3 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-450 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  Support Live Inbox
                </h3>
              )}

              {selectedConversation && !selectedConversation.isNewConversation && selectedConversation.pendingCount > 0 && (
                <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase text-slate-500 dark:text-slate-300 shadow-sm">
                  {selectedConversation.pendingCount} pending
                </span>
              )}
            </div>

            {/* Chat History Messages */}
            <div ref={chatContainerRef} className="scrollbar-thin flex-1 overflow-y-auto bg-[#efeae2] dark:bg-[#0b141a] p-4 md:p-6 space-y-1">
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
                (() => {
                  let prevDate = null;
                  return chatMessages.map((msg, idx) => {
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
                            /* Outgoing Admin Message (RIGHT) */
                            <div className={`relative max-w-[85%] sm:max-w-[75%] px-3.5 pt-2 pb-5 bg-brand-500 text-white shadow-sm ${
                              isFirstInGroup ? "rounded-2xl rounded-tr-none" : "rounded-2xl"
                            }`}>
                              {msg.text && (
                                <p className="text-xs sm:text-sm font-medium leading-relaxed break-words pr-12">
                                  {msg.text}
                                </p>
                              )}
                              {msg.attachment && msg.attachment.url && renderAttachment(msg.attachment, "outgoing")}
                              <div className="absolute bottom-1 right-2 flex items-center gap-1.5 select-none">
                                {msg.emailReplyStatus && msg.emailReplyStatus !== "not_required" && (
                                  <span className="text-[8px] font-extrabold uppercase text-brand-100 flex items-center bg-brand-650/40 px-1.5 py-0.5 rounded">
                                    <CheckCircle2 className="mr-0.5 inline h-2.5 w-2.5" />
                                    {msg.emailReplyStatus === "sent" ? "Email sent" : msg.emailReplyStatus === "failed" ? "Email failed" : "Email pending"}
                                  </span>
                                )}
                                <span className="text-[9px] font-bold text-brand-100 flex items-center gap-1">
                                  {formatTime(msg.createdAt)}
                                  <span className="text-[10px] font-bold">{msg.read === false ? "✓" : "✓✓"}</span>
                                </span>
                              </div>
                            </div>
                          ) : (
                            /* Incoming Customer Message (LEFT) */
                            <div className={`relative max-w-[85%] sm:max-w-[75%] px-3.5 pt-2 pb-5 bg-white dark:bg-[#202c33] text-slate-800 dark:text-slate-100 border border-slate-200/50 dark:border-none shadow-sm ${
                              isFirstInGroup ? "rounded-2xl rounded-tl-none" : "rounded-2xl"
                            }`}>
                              {msg.text && (
                                <p className="text-xs sm:text-sm font-medium leading-relaxed break-words pr-12">
                                  {msg.text}
                                </p>
                              )}
                              {msg.attachment && msg.attachment.url && renderAttachment(msg.attachment, "incoming")}
                              <span className="absolute bottom-1 right-2 text-[9px] font-bold text-slate-400 dark:text-slate-500 select-none">
                                {formatTime(msg.createdAt)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()
              )}
            </div>

            {/* Chat Reply Area */}
            {selectedConversation && (
              <div className="p-3 bg-[#f0f2f5] dark:bg-[#111b21] border-t border-slate-200/50 dark:border-slate-800/80 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:pb-3 flex flex-col gap-2 shrink-0 relative">
                {error && (
                  <p className="w-full rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-[11px] font-bold text-red-600 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
                    {error}
                  </p>
                )}

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
                      const currentText = replyText[selectedConversation.key] || "";
                      setReplyText({ ...replyText, [selectedConversation.key]: currentText + emoji });
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
                
                <div className="flex items-center gap-2">
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
                      value={replyText[selectedConversation.key] || ""}
                      onChange={(event) =>
                        setReplyText({ ...replyText, [selectedConversation.key]: event.target.value })
                      }
                      onKeyDown={handleKeyDown}
                      placeholder={uploadProgress ? "Uploading attachment..." : `Type a message...`}
                      disabled={uploadProgress}
                      className="w-full rounded-full border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#2a3942] px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white outline-none transition placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 disabled:opacity-65"
                    />
                  </div>

                  {/* Attachment Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadProgress}
                    className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white p-2 transition-colors shrink-0 disabled:opacity-50"
                    aria-label="Add attachment"
                  >
                    <Paperclip className="h-5.5 w-5.5 rotate-45" />
                  </button>

                  <button
                    type="button"
                    disabled={sending || (!replyText[selectedConversation.key]?.trim() && !selectedFile)}
                    onClick={sendReply}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 hover:bg-brand-600 text-white shadow-md transition-all active:scale-[0.95] disabled:cursor-not-allowed disabled:opacity-60 shrink-0"
                  >
                    {sending ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- EMAIL TAB --- */}
      {activeTab === "email" && (
        <div className="max-w-2xl mx-auto w-full animate-fade-in">
          <div className="p-5 md:p-8">
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
                    if (u) {
                      setSearchParams({ user: u._id });
                    } else {
                      setSearchParams({}, { replace: true });
                    }
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
