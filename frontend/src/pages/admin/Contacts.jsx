import { useEffect, useState } from "react";
import { Mail } from "lucide-react";
import API from "../../api/axios";
import { getToken } from "../../utils/getToken";

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
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

  const sendReply = async (id) => {
    try {
      const reply = (replyText[id] || "").trim();
      if (!reply) return;

      setError("");
      const token = await getToken();
      await API.post(
        `/api/admin/contacts/${id}/reply`,
        { reply },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReplyText((prev) => ({ ...prev, [id]: "" }));
      loadContacts();
    } catch (err) {
      console.log(err);
      setError(err.response?.data?.message || "Failed to send reply");
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 px-4 py-10">
      <div className="fixed top-0 left-0 w-72 h-72 bg-emerald-300 opacity-20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-teal-400 opacity-20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div className="relative max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
            <Mail className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">User Contacts</h1>
            <p className="text-sm text-gray-500 mt-0.5">View and reply to user messages</p>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {error}
          </div>
        )}

        {contacts.length === 0 && (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/60 px-8 py-12 text-center shadow-xl shadow-emerald-100">
            <p className="text-gray-400 font-medium">No contact messages found</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {contacts.map((contact) => {
            const isUserChat = contact.source === "user" || Boolean(contact.uid);
            const replyMode = isUserChat ? "User chat reply" : "Email reply";

            return (
              <div
                key={contact._id}
                className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg shadow-emerald-100 border border-white/60 p-6 space-y-4"
              >
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <p className="font-bold text-gray-800">{contact.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{contact.email}</p>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mt-1">
                      {replyMode}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-lg shrink-0">
                    {new Date(contact.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Message</p>
                  {contact.subject && (
                    <p className="text-xs font-bold text-gray-500 mb-1">{contact.subject}</p>
                  )}
                  <p className="text-sm text-gray-700 leading-relaxed">{contact.message}</p>
                </div>

                {contact.reply ? (
                  <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                    <p className="text-xs font-semibold text-emerald-500 uppercase tracking-wider mb-1.5">
                      Admin Reply
                    </p>
                    <p className="text-sm text-emerald-700 leading-relaxed">{contact.reply}</p>
                    {contact.replyDelivery === "email" && (
                      <p
                        className={`text-[11px] font-semibold mt-2 ${
                          contact.emailReplyStatus === "sent"
                            ? "text-emerald-600"
                            : "text-amber-600"
                        }`}
                      >
                        Email status: {contact.emailReplyStatus || "sent"}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <textarea
                      placeholder={isUserChat ? "Reply in user chat..." : "Reply to user's email..."}
                      value={replyText[contact._id] || ""}
                      onChange={(event) =>
                        setReplyText({ ...replyText, [contact._id]: event.target.value })
                      }
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none"
                    />
                    <button
                      disabled={!replyText[contact._id]?.trim()}
                      onClick={() => sendReply(contact._id)}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Send Reply - {isUserChat ? "Chat" : "Email"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
