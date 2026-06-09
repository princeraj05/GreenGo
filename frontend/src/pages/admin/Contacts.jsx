import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Inbox,
  Mail,
  MailCheck,
  MessageSquare,
  Search,
  Send,
} from "lucide-react";
import API from "../../api/axios";
import { getToken } from "../../utils/getToken";

function getEmailStatusText(message) {
  if (message.emailReplyStatus === "sent") return "Sent";
  if (message.emailReplyStatus === "failed") return "Failed";
  return "Pending";
}

const avatarColors = [
  "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900/50",
  "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900/50",
  "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-900/50",
  "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900/50",
  "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900/50",
];

function getAvatarStyle(name) {
  if (!name) return avatarColors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

function initialsFor(name = "User") {
  return name.trim().substring(0, 2).toUpperCase() || "U";
}

function formatTime(date) {
  if (!date) return "";
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDateTime(date) {
  if (!date) return "";
  return new Date(date).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [selectedKey, setSelectedKey] = useState("");
  const [replyText, setReplyText] = useState({});
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function loadContacts() {
    try {
      const token = await getToken();
      const res = await API.get("/api/admin/contacts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setContacts(res.data || []);
    } catch (err) {
      console.log(err);
    }
  }

  useEffect(() => {
    loadContacts();
  }, []);

  const conversations = useMemo(() => {
    const grouped = contacts.reduce((acc, contact) => {
      const emailKey = String(contact.email || "unknown").toLowerCase();
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
        const messages = [...conversation.messages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        const latest = messages[messages.length - 1];
        const unreadCount = messages.filter((message) => !message.reply).length;
        const isUserChat = latest ? latest.source === "user" || Boolean(latest.uid) : false;

        return {
          ...conversation,
          isUserChat,
          name: latest?.name || conversation.name || "User",
          email: latest?.email || conversation.email || "No email",
          messages,
          latest,
          unreadCount,
        };
      })
      .sort((a, b) => new Date(b.latest?.createdAt || 0) - new Date(a.latest?.createdAt || 0));
  }, [contacts]);

  const filteredConversations = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((conversation) => {
      const latestText = conversation.latest?.message || conversation.latest?.reply || "";
      return `${conversation.name} ${conversation.email} ${latestText}`.toLowerCase().includes(q);
    });
  }, [conversations, search]);

  const selectedConversation =
    filteredConversations.find((conversation) => conversation.key === selectedKey) ||
    conversations.find((conversation) => conversation.key === selectedKey) ||
    filteredConversations[0] ||
    conversations[0];

  const unreadTotal = conversations.reduce((sum, conversation) => sum + conversation.unreadCount, 0);

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

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendReply();
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] w-full">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-brand-700 dark:border-brand-900/50 dark:bg-brand-950/30 dark:text-brand-300">
            <MessageSquare size={14} />
            Admin Messages
          </div>
          <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
            Support Inbox
          </h1>
          <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
            Manage customer chats and email replies from one responsive inbox.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:min-w-[360px]">
          <StatCard label="Chats" value={conversations.length} icon={Inbox} />
          <StatCard label="Pending" value={unreadTotal} icon={Clock3} />
          <StatCard label="Replied" value={Math.max(contacts.length - unreadTotal, 0)} icon={MailCheck} />
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
          <AlertCircle size={17} />
          {error}
        </div>
      )}

      {conversations.length === 0 ? (
        <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[2rem] border border-slate-100 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-50 text-slate-400 dark:bg-slate-900 dark:text-slate-500">
            <Mail size={34} />
          </div>
          <h3 className="mt-5 text-xl font-black text-slate-950 dark:text-white">Inbox is empty</h3>
          <p className="mt-2 max-w-sm text-sm font-semibold text-slate-500 dark:text-slate-400">
            All caught up. New user chats and contact messages will appear here.
          </p>
        </div>
      ) : (
        <div className="grid min-h-[680px] grid-cols-1 gap-4 lg:grid-cols-[380px_minmax(0,1fr)]">
          <section
            className={`overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950 ${
              selectedKey ? "hidden lg:flex" : "flex"
            } flex-col`}
          >
            <div className="border-b border-slate-100 p-4 dark:border-slate-800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search conversations..."
                  className="w-full rounded-2xl border border-slate-100 bg-slate-50 py-3 pl-10 pr-4 text-sm font-bold text-slate-900 outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:bg-slate-950"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400">No conversations found.</p>
                </div>
              ) : (
                filteredConversations.map((conversation) => {
                  const active = selectedConversation?.key === conversation.key;
                  const latestText = conversation.latest?.message || conversation.latest?.reply || "";
                  const avatarStyle = getAvatarStyle(conversation.name);

                  return (
                    <button
                      key={conversation.key}
                      type="button"
                      onClick={() => setSelectedKey(conversation.key)}
                      className={`flex w-full items-start gap-3 border-b border-slate-100 p-4 text-left transition-all dark:border-slate-800/70 ${
                        active
                          ? "bg-brand-50/80 dark:bg-brand-950/20"
                          : "hover:bg-slate-50 dark:hover:bg-slate-900/60"
                      }`}
                    >
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-sm font-black ${avatarStyle}`}>
                        {initialsFor(conversation.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-slate-950 dark:text-white">{conversation.name}</p>
                            <p className="truncate text-xs font-semibold text-slate-500 dark:text-slate-400">{conversation.email}</p>
                          </div>
                          <span className="shrink-0 text-[10px] font-black text-slate-400">
                            {formatTime(conversation.latest?.createdAt)}
                          </span>
                        </div>
                        <p className="mt-2 line-clamp-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{latestText}</p>
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <TypeBadge isUserChat={conversation.isUserChat} />
                          {conversation.unreadCount > 0 && (
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1.5 text-[10px] font-black text-white">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </section>

          <section
            className={`overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950 ${
              selectedKey ? "flex" : "hidden lg:flex"
            } min-h-[680px] flex-col`}
          >
            {selectedConversation && (
              <>
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-950 sm:p-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedKey("")}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 lg:hidden"
                      aria-label="Back to conversations"
                    >
                      <ArrowLeft size={18} />
                    </button>
                    <div className={`hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl border text-sm font-black sm:flex ${getAvatarStyle(selectedConversation.name)}`}>
                      {initialsFor(selectedConversation.name)}
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-black uppercase tracking-tight text-slate-950 dark:text-white sm:text-lg">
                        {selectedConversation.name}
                      </h2>
                      <p className="truncate text-xs font-semibold text-slate-500 dark:text-slate-400">{selectedConversation.email}</p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <TypeBadge isUserChat={selectedConversation.isUserChat} />
                    <StatusBadge replied={Boolean(selectedConversation.latest?.reply)} />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-slate-50/70 p-4 dark:bg-slate-900/30 sm:p-6">
                  <div className="mx-auto flex max-w-4xl flex-col gap-5">
                    {selectedConversation.messages.map((message) => (
                      <div key={message._id} className="space-y-3">
                        <div className="flex justify-start">
                          <div className="max-w-[88%] rounded-3xl rounded-tl-md border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:max-w-[72%]">
                            <div className="mb-3 flex items-center gap-2">
                              <div className={`flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-black ${getAvatarStyle(selectedConversation.name)}`}>
                                {initialsFor(selectedConversation.name)}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-xs font-black text-slate-700 dark:text-slate-200">{selectedConversation.name}</p>
                                <p className="text-[10px] font-semibold text-slate-400">{formatDateTime(message.createdAt)}</p>
                              </div>
                            </div>
                            {message.subject && (
                              <p className="mb-2 text-xs font-black uppercase tracking-wider text-brand-600 dark:text-brand-300">
                                {message.subject}
                              </p>
                            )}
                            <p className="whitespace-pre-wrap text-sm font-semibold leading-relaxed text-slate-800 dark:text-slate-200">
                              {message.message}
                            </p>
                          </div>
                        </div>

                        {message.reply && (
                          <div className="flex justify-end">
                            <div className="max-w-[88%] rounded-3xl rounded-tr-md bg-brand-500 p-4 text-white shadow-lg shadow-brand-500/20 sm:max-w-[72%]">
                              <div className="mb-2 flex items-center justify-end gap-2 text-[10px] font-black uppercase tracking-wider text-brand-50">
                                <CheckCircle2 size={13} />
                                Admin reply
                              </div>
                              <p className="whitespace-pre-wrap text-sm font-semibold leading-relaxed">{message.reply}</p>
                              <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                                {message.replyDelivery === "email" && (
                                  <span className="rounded-full bg-white/15 px-2 py-1 text-[10px] font-black uppercase">
                                    Email: {getEmailStatusText(message)}
                                  </span>
                                )}
                                <span className="text-[10px] font-bold text-brand-50">
                                  {formatTime(message.repliedAt || message.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-950 sm:p-4">
                  <div className="flex items-end gap-2 rounded-3xl border border-slate-200 bg-slate-50 p-2 transition focus-within:border-brand-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-500/10 dark:border-slate-800 dark:bg-slate-900 dark:focus:bg-slate-950">
                    <textarea
                      placeholder={selectedConversation.isUserChat ? "Type reply in user chat..." : "Type reply to user's email..."}
                      value={replyText[selectedConversation.key] || ""}
                      onChange={(event) => setReplyText({ ...replyText, [selectedConversation.key]: event.target.value })}
                      onKeyDown={handleKeyDown}
                      rows={2}
                      className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-3 py-2 text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
                    />
                    <button
                      type="button"
                      disabled={sending || !replyText[selectedConversation.key]?.trim()}
                      onClick={sendReply}
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-lg shadow-brand-500/20 transition hover:bg-brand-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                      title="Send Reply"
                    >
                      <Send size={19} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/30 dark:text-brand-300">
          {icon && (() => {
            const Icon = icon;
            return <Icon size={16} />;
          })()}
        </span>
        <div>
          <p className="text-base font-black text-slate-950 dark:text-white">{value}</p>
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</p>
        </div>
      </div>
    </div>
  );
}

function TypeBadge({ isUserChat }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
      isUserChat
        ? "border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-300"
        : "border-violet-100 bg-violet-50 text-violet-700 dark:border-violet-900/40 dark:bg-violet-950/30 dark:text-violet-300"
    }`}>
      {isUserChat ? <MessageSquare size={12} /> : <Mail size={12} />}
      {isUserChat ? "Chat" : "Email"}
    </span>
  );
}

function StatusBadge({ replied }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
      replied
        ? "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300"
        : "border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300"
    }`}>
      {replied ? <CheckCircle2 size={12} /> : <Clock3 size={12} />}
      {replied ? "Replied" : "Pending"}
    </span>
  );
}
