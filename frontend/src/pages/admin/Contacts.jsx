import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Mail, MessageSquare, Send } from "lucide-react";
import API from "../../api/axios";
import { getToken } from "../../utils/getToken";

function getEmailStatusText(message) {
  if (message.emailReplyStatus === "sent") return "Sent";
  if (message.emailReplyStatus === "failed") return "Failed";
  return "Pending";
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
      const isUserChat = contact.source === "user" || Boolean(contact.uid);
      const key = isUserChat
        ? `user:${contact.uid || contact.email}`
        : `email:${String(contact.email || "").toLowerCase()}`;

      if (!acc[key]) {
        acc[key] = {
          key,
          isUserChat,
          name: contact.name,
          email: contact.email,
          messages: [],
        };
      }

      acc[key].messages.push(contact);
      return acc;
    }, {});

    return Object.values(grouped)
      .map((conversation) => {
        const messages = [...conversation.messages].sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
        const latest = messages[messages.length - 1];
        const unreadCount = messages.filter((message) => !message.reply).length;

        return {
          ...conversation,
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

  return (
    <div className="min-h-screen w-full bg-slate-50 px-4 py-10">
      <div className="relative max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
            <Mail className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">User Contacts</h1>
            <p className="text-sm text-gray-500 mt-0.5">Open a user chat to view messages and reply</p>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {error}
          </div>
        )}

        {conversations.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 px-8 py-12 text-center shadow-sm">
            <p className="text-gray-400 font-medium">No contact messages found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5 lg:h-[calc(100vh-220px)] lg:min-h-[620px]">
            <div
              className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-col lg:flex ${
                selectedKey ? "hidden" : "flex"
              }`}
            >
              <div className="px-5 py-4 border-b border-slate-100">
                <p className="font-bold text-slate-900">Conversations</p>
                <p className="text-xs text-slate-400 mt-1">{conversations.length} active chats</p>
              </div>

              <div className="flex-1 overflow-y-auto">
                {conversations.map((conversation) => {
                  const active = selectedConversation?.key === conversation.key;
                  const latestText = conversation.latest?.message || conversation.latest?.reply || "";

                  return (
                    <button
                      key={conversation.key}
                      onClick={() => setSelectedKey(conversation.key)}
                      className={`w-full text-left px-5 py-4 border-b border-slate-100 transition-colors ${
                        active ? "bg-emerald-50" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 truncate">{conversation.name}</p>
                          <p className="text-xs text-slate-500 truncate mt-0.5">{conversation.email}</p>
                        </div>
                        {conversation.unreadCount > 0 && (
                          <span className="shrink-0 rounded-full bg-orange-500 px-2 py-0.5 text-[11px] font-bold text-white">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-2">
                        {conversation.isUserChat ? "User chat reply" : "Email reply"}
                      </p>
                      <p className="text-sm text-slate-500 truncate mt-2">{latestText}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-col min-h-[620px] lg:flex ${
                selectedKey ? "flex" : "hidden"
              }`}
            >
              <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
                <div className="min-w-0 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedKey("")}
                    className="lg:hidden shrink-0 rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-sm"
                    aria-label="Back to conversations"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="min-w-0">
                    <p className="font-extrabold text-slate-900 truncate">{selectedConversation.name}</p>
                    <p className="text-sm text-slate-500 truncate">{selectedConversation.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                    {selectedConversation.isUserChat ? "Chat" : "Email"}
                  </span>
                  <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider border ${
                    selectedConversation.latest?.reply
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                      : "bg-amber-50 text-amber-700 border-amber-100"
                  }`}>
                    {selectedConversation.latest?.reply ? "Replied" : "Pending"}
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 space-y-5">
                {selectedConversation.messages.map((message) => (
                  <div key={message._id} className="space-y-4">
                    {/* User Message Bubble */}
                    <div className="flex justify-start">
                      <div className="max-w-[85%] sm:max-w-[70%] rounded-2xl rounded-tl-none border border-slate-200 bg-white p-4.5 shadow-sm">
                        {message.subject && (
                          <p className="text-xs font-bold text-brand-600 mb-2 uppercase tracking-wide">{message.subject}</p>
                        )}
                        <p className="text-[14px] text-slate-800 leading-relaxed font-medium">{message.message}</p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-2.5 flex items-center gap-1.5">
                          <span>📅</span>
                          {new Date(message.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Admin Reply Bubble */}
                    {message.reply && (
                      <div className="flex justify-end">
                        <div className="max-w-[85%] sm:max-w-[70%] rounded-2xl rounded-tr-none bg-gradient-to-br from-emerald-500 to-teal-600 p-4.5 text-white shadow-md shadow-emerald-500/10">
                          <div className="flex items-center justify-between gap-4 mb-2 border-b border-white/10 pb-1.5">
                            <span className="text-xs font-black uppercase tracking-wider text-emerald-50">Admin Reply</span>
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-100" />
                          </div>
                          <p className="text-[14px] leading-relaxed font-medium">{message.reply}</p>
                          
                          {/* Email Status Indicator */}
                          {message.replyDelivery === "email" && (
                            <div className="flex items-center gap-1.5 mt-3 justify-end bg-black/10 px-2 py-1 rounded-lg w-fit ml-auto border border-white/5">
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                message.emailReplyStatus === "sent" 
                                  ? "bg-emerald-300" 
                                  : message.emailReplyStatus === "failed" 
                                  ? "bg-red-400 animate-pulse" 
                                  : "bg-amber-300 animate-pulse"
                              }`} />
                              <span className="text-[10px] font-black uppercase tracking-wider text-white/95">
                                Email: {getEmailStatusText(message)}
                              </span>
                            </div>
                          )}
                          
                          <p className="text-[10px] text-emerald-100/80 font-bold mt-2.5 text-right">
                            {message.repliedAt ? new Date(message.repliedAt).toLocaleString() : ""}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-100 bg-white p-4">
                <div className="flex flex-col md:flex-row gap-3">
                  <textarea
                    placeholder={
                      selectedConversation.isUserChat
                        ? "Reply in user chat..."
                        : "Reply to user's email..."
                    }
                    value={replyText[selectedConversation.key] || ""}
                    onChange={(event) =>
                      setReplyText({ ...replyText, [selectedConversation.key]: event.target.value })
                    }
                    rows={2}
                    className="min-h-[56px] flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                  />
                  <button
                    disabled={!replyText[selectedConversation.key]?.trim()}
                    onClick={sendReply}
                    className="md:w-44 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Send Reply
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
