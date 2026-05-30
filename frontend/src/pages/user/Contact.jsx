import { useEffect, useState, useRef } from "react";
import { getToken } from "../../utils/getToken";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => { loadMyContacts(); }, []);
  
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [contacts]);

  const loadMyContacts = async () => {
    const token = await getToken();
    if (!token) return;
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/contact/my`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setContacts(Array.isArray(data) ? data : []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const token = await getToken();
    if (!token) return alert("Login required");

    await fetch(`${import.meta.env.VITE_API_URL}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(form)
    });

    setForm({ ...form, message: "" });
    await loadMyContacts();
    setLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto w-full animate-fade-in pb-10 flex flex-col lg:flex-row gap-8">
      
      {/* Form Side */}
      <div className="flex-1">
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <span className="text-4xl">💬</span> Support
          </h2>
          <p className="text-slate-500 mt-2 text-lg">We're here to help. Send us a message.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="space-y-5">
            <div>
              <label className="text-sm font-bold text-slate-700 mb-2 block">Name</label>
              <input required name="name" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none" placeholder="Your Name" />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700 mb-2 block">Email</label>
              <input type="email" required name="email" value={form.email} onChange={e=>setForm({...form, email: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none" placeholder="Your Email" />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700 mb-2 block">Message</label>
              <textarea required name="message" value={form.message} onChange={e=>setForm({...form, message: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none h-32 resize-none" placeholder="How can we help?" />
            </div>
            <button disabled={loading} className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-95 flex items-center justify-center gap-2">
              {loading ? "Sending..." : "Send Message"}
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </div>
        </form>
      </div>

      {/* Chat Interface Side */}
      <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col h-[600px]">
        <div className="bg-slate-50 border-b border-slate-100 p-6">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            Live Inbox
          </h3>
        </div>
        
        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-50/50">
          {contacts.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 font-medium">No messages yet.</div>
          ) : (
            contacts.map(c => (
              <div key={c._id} className="flex flex-col gap-4">
                {/* User Message (Right) */}
                <div className="flex justify-end">
                  <div className="bg-blue-500 text-white p-4 rounded-2xl rounded-tr-sm max-w-[80%] shadow-md">
                    <p className="text-sm leading-relaxed">{c.message}</p>
                    <p className="text-[10px] text-blue-100 text-right mt-1">{new Date(c.createdAt || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                  </div>
                </div>

                {/* Admin Reply (Left) */}
                <div className="flex justify-start">
                  {c.reply ? (
                    <div className="bg-white border border-slate-200 text-slate-800 p-4 rounded-2xl rounded-tl-sm max-w-[80%] shadow-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">B</div>
                        <span className="text-xs font-bold text-slate-500">ByteBite Support</span>
                      </div>
                      <p className="text-sm leading-relaxed mt-2">{c.reply}</p>
                    </div>
                  ) : (
                     <div className="bg-white border border-slate-100 text-slate-400 p-3 rounded-2xl rounded-tl-sm shadow-sm text-xs italic flex items-center gap-2">
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
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