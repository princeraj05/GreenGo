import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Mail, MessageSquare, Send } from "lucide-react";
import API from "../../api/axios";
import { getToken } from "../../utils/getToken";

function getEmailStatusText(message) {
  if (message.emailReplyStatus === "sent") return "Sent";
  if (message.emailReplyStatus === "failed") return "Failed";
  return "Pending";
}

const avatarColors = [
  "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200/60 dark:border-red-900/30",
  "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border-orange-200/60 dark:border-orange-900/30",
  "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200/60 dark:border-amber-900/30",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-900/30",
  "bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 border-teal-200/60 dark:border-teal-900/30",
  "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200/60 dark:border-blue-900/30",
  "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-200/60 dark:border-indigo-900/30",
  "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200/60 dark:border-purple-900/30",
  "bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-400 border-pink-200/60 dark:border-pink-900/30",
];

function getAvatarStyle(name) {
  if (!name) return avatarColors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % avatarColors.length;
  return avatarColors[index];
}

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [selectedKey, setSelectedKey] = useState("");
  const [replyText, setReplyText] = useState({});
  const [error, setError] = useState("");

  async function loadContacts() {
    try {
      const token = await getToken();
      const res = await API.get("/api/admin/contacts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setContacts(res.data);
    } catch (err) {
      console.log(err);
    }
  }

  useEffect(() => {
    // Initial fetch populates the admin inbox from the API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadContacts();
  }, []);

  const conversations = useMemo(() => {
    const grouped = contacts.reduce((acc, contact) => {
      // Group by lowercase email address to combine guest and user chats for the same person
      const emailKey = String(contact.email || "").toLowerCase();

      if (!acc[emailKey]) {
        acc[emailKey] = {
          key: emailKey,
          name: contact.name,
          email: contact.email,
          messages: [],
        };
      }

      acc[emailKey].messages.push(contact);
      return acc;
    }, {});

    return Object.values(grouped)
      .map((conversation) => {
        const messages = [...conversation.messages].sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
        const latest = messages[messages.length - 1];
        const unreadCount = messages.filter((message) => !message.reply).length;

        // Determine isUserChat based on the latest message in the conversation
        const isUserChat = latest ? (latest.source === "user" || Boolean(latest.uid)) : false;

        return {
          ...conversation,
          isUserChat,
          name: latest?.name || conversation.name,
          email: latest?.email || conversation.email,
          messages,
          latest,
          unreadCount,
        };
      })
      .sort((a, b) => new Date(b.latest?.createdAt || 0) - new Date(a.latest?.createdAt || 0));
  }, [contacts]);

  const selectedConversation =
    conversations.find((conversation) => conversation.key === selectedKey) || conversations[0];

  const { initials, avatarStyle } = useMemo(() => {
    if (!selectedConversation) return { initials: "U", avatarStyle: avatarColors[0] };
    return {
      initials: (selectedConversation.name || "U").trim().substring(0, 2).toUpperCase(),
      avatarStyle: getAvatarStyle(selectedConversation.name),
    };
  }, [selectedConversation]);

  const sendReply = async () => {
    if (!selectedConversation) return;

    const target =
      [...selectedConversation.messages].reverse().find((message) => !message.reply) ||
      selectedConversation.latest;
    const reply = (replyText[selectedConversation.key] || "").trim();
    if (!target || !reply) return;

    try {
      setError("");
      const token = await getToken();
      await API.post(
        `/api/admin/contacts/${target._id}/reply`,
        { reply },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReplyText((prev) => ({ ...prev, [selectedConversation.key]: "" }));
      loadContacts();
    } catch (err) {
      console.log(err);
      setError(err.response?.data?.message || "Failed to send reply");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendReply();
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-transparent px-4 py-8 transition-colors duration-300">
      <div className="relative max-w-7xl mx-auto">
        {/* Header section */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/25">
            <Mail className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-800 dark:text-white tracking-tight">User Contacts</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Manage user inbox chats and email replies in real-time</p>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl border border-red-150 dark:border-red-900/30 bg-red-50 dark:bg-red-950/20 px-4 py-3 text-sm font-semibold text-red-650 dark:text-red-400">
            {error}
          </div>
        )}

        {conversations.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800/80 px-8 py-16 text-center shadow-premium transition-all">
            <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 text-slate-400 dark:text-slate-500">
              <Mail className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Inbox is empty</h3>
            <p className="text-sm text-slate-400 dark:text-slate-500 max-w-xs mx-auto mt-2">
              All caught up! No contact messages or customer tickets found.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 lg:h-[calc(100vh-220px)] lg:min-h-[620px]">
            {/* Conversations List Panel */}
            <div
              className={`bg-white dark:bg-slate-955 rounded-3xl border border-slate-100 dark:border-slate-800/60 shadow-premium overflow-hidden flex-col lg:flex transition-all duration-300 ${
                selectedKey ? "hidden" : "flex"
              }`}
            >
              <div className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-800/60 p-5 flex flex-col transition-colors">
                <p className="font-extrabold text-slate-900 dark:text-white text-sm uppercase tracking-wider">Conversations</p>
                <p className="text-xs text-slate-500 dark:text-slate-450 mt-1 font-medium">{conversations.length} active chats</p>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/55 scrollbar-thin">
                {conversations.map((conversation) => {
                  const active = selectedConversation?.key === conversation.key;
                  const latestText = conversation.latest?.message || conversation.latest?.reply || "";
                  const initials = (conversation.name || "U").trim().substring(0, 2).toUpperCase();
                  const avatarStyle = getAvatarStyle(conversation.name);

                  return (
                    <button
                      key={conversation.key}
                      onClick={() => setSelectedKey(conversation.key)}
                      className={`w-full text-left px-5 py-4 transition-all duration-200 flex items-start gap-3 relative ${
                        active
                          ? "bg-brand-500/10 dark:bg-brand-500/15 border-l-4 border-brand-500 pl-4"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/30"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border shrink-0 ${avatarStyle}`}>
                        {initials}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className={`font-bold truncate text-sm ${active ? "text-brand-600 dark:text-brand-400" : "text-slate-800 dark:text-slate-200"}`}>
                            {conversation.name}
                          </p>
                          <span className="text-[10px] text-slate-450 dark:text-slate-500 shrink-0 font-medium">
                            {conversation.latest?.createdAt ? new Date(conversation.latest.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                          </span>
                        </div>
                        
                        <p className="text-xs text-slate-400 dark:text-slate-450 truncate mt-0.5">{conversation.email}</p>
                        
                        <div className="flex items-center justify-between gap-2 mt-2">
                          <p className="text-xs text-slate-400 dark:text-slate-500 truncate flex-1 font-medium">{latestText}</p>
                          {conversation.unreadCount > 0 && (
                            <span className="shrink-0 rounded-full bg-brand-500 text-white font-extrabold text-[9px] px-1.5 py-0.5 flex items-center justify-center animate-pulse">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 mt-2">
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            conversation.isUserChat 
                              ? "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30" 
                              : "bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/30"
                          }`}>
                            {conversation.isUserChat ? "User Chat" : "Email Inbox"}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Conversation Messages Panel */}
            <div
              className={`bg-white dark:bg-slate-955 rounded-3xl border border-slate-100 dark:border-slate-800/60 shadow-premium overflow-hidden flex-col min-h-[620px] lg:flex transition-all duration-300 ${
                selectedKey ? "flex" : "hidden"
              }`}
            >
              <div className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-800/60 p-5 flex items-center justify-between gap-4 transition-colors">
                <div className="min-w-0 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedKey("")}
                    className="lg:hidden shrink-0 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 p-2 text-slate-600 dark:text-slate-400 shadow-sm hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all"
                    aria-label="Back to conversations"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  
                  <div className="min-w-0">
                    <p className="font-extrabold text-slate-900 dark:text-white truncate text-sm uppercase tracking-wider leading-tight">{selectedConversation.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1 font-medium">{selectedConversation.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider border ${
                    selectedConversation.isUserChat
                      ? "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30"
                      : "bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/30"
                  }`}>
                    {selectedConversation.isUserChat ? "Chat" : "Email"}
                  </span>
                  
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider border ${
                    selectedConversation.latest?.reply
                      ? "bg-brand-50 dark:bg-brand-950/20 text-brand-650 dark:text-brand-400 border-brand-100 dark:border-brand-900/30"
                      : "bg-amber-50 dark:bg-amber-950/20 text-amber-650 dark:text-amber-455 border-amber-100 dark:border-amber-900/30"
                  }`}>
                    {selectedConversation.latest?.reply ? "Replied" : "Pending"}
                  </span>
                </div>
              </div>

              {/* Message History area */}
              <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-955/25 transition-colors scrollbar-thin">
                <div className="p-4 sm:p-6 space-y-6">
                  {selectedConversation.messages.map((message) => (
                    <div key={message._id} className="space-y-4">
                      {/* User Message Bubble */}
                      <div className="flex justify-start">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 text-slate-800 dark:text-slate-200 p-4 rounded-2xl rounded-tl-sm max-w-[80%] shadow-sm transition-colors">
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] border shrink-0 ${avatarStyle}`}>
                              {initials}
                            </div>
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-450">{selectedConversation.name}</span>
                            <span className={`text-[8px] px-1.5 py-0.5 rounded border uppercase tracking-wider font-extrabold ${
                              message.source === "user"
                                ? "bg-blue-50 dark:bg-blue-950/20 text-blue-500 border-blue-100 dark:border-blue-900/20"
                                : "bg-purple-50 dark:bg-purple-950/20 text-purple-500 border-purple-100 dark:border-purple-900/20"
                            }`}>
                              {message.source === "user" ? "Chat" : "Email"}
                            </span>
                          </div>
                          
                          {message.subject && (
                            <p className="text-[11px] font-extrabold text-brand-600 dark:text-brand-400 mb-2 uppercase tracking-wider mt-2.5">{message.subject}</p>
                          )}
                          <p className="text-sm leading-relaxed mt-2.5 font-medium">{message.message}</p>
                          <p className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold mt-2.5 flex items-center gap-1">
                            <span>📅</span>
                            {new Date(message.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </p>
                        </div>
                      </div>

                      {/* Admin Reply Bubble */}
                      {message.reply && (
                        <div className="flex justify-end animate-fade-in">
                          <div className="bg-brand-500 text-white p-4 rounded-2xl rounded-tr-sm max-w-[80%] shadow-md shadow-brand-500/10">
                            <p className="text-sm leading-relaxed font-medium">{message.reply}</p>
                            
                            {/* Email Status Indicator */}
                            {message.replyDelivery === "email" && (
                              <div className="flex items-center gap-1.5 mt-2.5 justify-end bg-black/15 px-2 py-0.5 rounded-lg w-fit ml-auto border border-white/5">
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  message.emailReplyStatus === "sent" 
                                    ? "bg-emerald-300" 
                                    : message.emailReplyStatus === "failed" 
                                    ? "bg-red-400 animate-pulse" 
                                    : "bg-amber-300 animate-pulse"
                                }`} />
                                <span className="text-[9px] font-black uppercase tracking-wider text-white/90">
                                  Email: {getEmailStatusText(message)}
                                </span>
                              </div>
                            )}
                            
                            <p className="text-[10px] text-brand-100 text-right mt-1.5 font-semibold">
                              {new Date(message.repliedAt || message.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              {/* Chat Input Footer */}
              <div className="border-t border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-955 p-4 transition-colors">
                <div className="relative flex items-end gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-2 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/10 transition-all">
                  <textarea
                    placeholder={
                      selectedConversation.isUserChat
                        ? "Type reply in user chat..."
                        : "Type reply to user's email..."
                    }
                    value={replyText[selectedConversation.key] || ""}
                    onChange={(event) =>
                      setReplyText({ ...replyText, [selectedConversation.key]: event.target.value })
                    }
                    onKeyDown={handleKeyDown}
                    rows={2}
                    className="flex-grow resize-none bg-transparent px-3 py-2 text-sm outline-none text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 min-h-[44px] max-h-[120px] scrollbar-thin"
                  />
                  <button
                    disabled={!replyText[selectedConversation.key]?.trim()}
                    onClick={sendReply}
                    className="shrink-0 w-11 h-11 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-650 hover:to-brand-700 text-white shadow-md hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40 flex items-center justify-center transition-all duration-200 active:scale-95"
                    title="Send Reply"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
