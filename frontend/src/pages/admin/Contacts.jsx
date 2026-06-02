import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Mail, MessageSquare, Send } from "lucide-react";
import API from "../../api/axios";
import { getToken } from "../../utils/getToken";

function getEmailStatusText(message) {
  if (message.emailReplyStatus === "sent") return "Email sent";

  const error = String(message.emailReplyError || "");
  if (
    error.includes("Email settings missing") ||
    error.includes("SMTP settings missing") ||
    error.includes("Email setup missing")
  ) {
    return "Email setup missing on backend";
  }

  if (error.includes("Invalid login") || error.includes("Password not accepted")) {
    return "Email login failed";
  }

  return message.emailReplyStatus === "failed" ? "Email failed" : "Email pending";
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
                <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                  {selectedConversation.isUserChat ? "Chat" : "Email"}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 space-y-5">
                {selectedConversation.messages.map((message) => (
                  <div key={message._id} className="space-y-3">
                    <div className="flex justify-start">
                      <div className="max-w-[92%] sm:max-w-[78%] rounded-2xl rounded-tl-sm border border-slate-200 bg-white p-4 shadow-sm">
                        {message.subject && (
                          <p className="text-xs font-bold text-slate-500 mb-1">{message.subject}</p>
                        )}
                        <p className="text-sm text-slate-800 leading-relaxed">{message.message}</p>
                        <p className="text-[11px] text-slate-400 mt-2">
                          {new Date(message.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {message.reply && (
                      <div className="flex justify-end">
                        <div className="max-w-[92%] sm:max-w-[78%] rounded-2xl rounded-tr-sm bg-emerald-500 p-4 text-white shadow-sm">
                          <div className="flex items-center justify-end gap-2 mb-1">
                            <span className="text-xs font-bold text-emerald-50">Admin Reply</span>
                            <MessageSquare className="w-4 h-4" />
                          </div>
                          <p className="text-sm leading-relaxed">{message.reply}</p>
                          {message.replyDelivery === "email" && (
                            <p
                              className={`text-[11px] font-semibold mt-2 ${
                                message.emailReplyStatus === "sent"
                                  ? "text-emerald-50"
                                  : "text-amber-100"
                              }`}
                            >
                              {getEmailStatusText(message)}
                            </p>
                          )}
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
