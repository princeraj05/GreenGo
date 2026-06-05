import { useEffect, useRef, useState } from "react";
import { MessageCircle, RefreshCw, Send } from "lucide-react";
import { getToken } from "../../utils/getToken";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  async function loadUserProfile() {
    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const user = await res.json();

      setForm((prev) => ({
        ...prev,
        name: prev.name || user?.name || "",
        email: prev.email || user?.email || "",
      }));
    } catch (err) {
      console.error("Failed to load user profile", err);
    }
  }

  async function loadMyContacts() {
    try {
      const token = await getToken();
      if (!token) return;

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/contact/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setContacts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load messages", err);
    }
  }

  useEffect(() => {
    loadUserProfile();
    loadMyContacts();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [contacts]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    const token = await getToken();
    if (!token) {
      setLoading(false);
      return alert("Login required");
    }

    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      setForm({ ...form, message: "" });
      await loadMyContacts();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto w-full animate-fade-in pb-10 flex flex-col lg:flex-row gap-8 bg-transparent">
      <div className="flex-1">
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <MessageCircle className="w-9 h-9 text-indigo-500" />
            Support
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">We're here to help. Send us a message.</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-950 rounded-3xl p-6 md:p-8 border border-slate-100 dark:border-slate-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-colors"
        >
          <div className="space-y-5">
            <div>
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">Name</label>
              <input
                required
                name="name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-950 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                placeholder="Your Name"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">Email</label>
              <input
                type="email"
                required
                name="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-950 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                placeholder="Your Email"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">Message</label>
              <textarea
                required
                name="message"
                value={form.message}
                onChange={(event) => setForm({ ...form, message: event.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-950 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none h-32 resize-none"
                placeholder="How can we help?"
              />
            </div>
            <button
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send Message"}
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>

      <div className="flex-1 bg-white dark:bg-slate-950 rounded-3xl border border-slate-100 dark:border-slate-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col h-[600px] transition-colors">
        <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/60 p-6 transition-colors">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            Live Inbox
          </h3>
        </div>

        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-50/50 dark:bg-slate-900/30">
          {contacts.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500 font-medium">
              No messages yet.
            </div>
          ) : (
            contacts.map((contact) => (
              <div key={contact._id} className="flex flex-col gap-4">
                <div className="flex justify-end">
                  <div className="bg-blue-500 text-white p-4 rounded-2xl rounded-tr-sm max-w-[80%] shadow-md">
                    <p className="text-sm leading-relaxed">{contact.message}</p>
                    <p className="text-[10px] text-blue-100 text-right mt-1">
                      {new Date(contact.createdAt || Date.now()).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex justify-start">
                  {contact.reply ? (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 p-4 rounded-2xl rounded-tl-sm max-w-[80%] shadow-sm transition-colors">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                          B
                        </div>
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">ByteBite Support</span>
                      </div>
                      <p className="text-sm leading-relaxed mt-2">{contact.reply}</p>
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 p-3 rounded-2xl rounded-tl-sm shadow-sm text-xs italic flex items-center gap-2 transition-colors">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Admin is typing...
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
