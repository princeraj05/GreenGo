import { useEffect, useRef, useState } from "react";

function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

function Section({ children, delay = 0, className = "" }) {
  const [ref, visible] = useReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      setSent(true);
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      console.error("Failed to send message", err);
    }
  }

  const channels = [
    { icon: "📧", title: "Email Support", value: "hello@bytebite.com", sub: "Reply within 2 hours" },
    { icon: "📞", title: "Phone Support", value: "+91 98765 43210", sub: "Mon–Sat, 9 AM – 9 PM" },
    { icon: "📍", title: "Office", value: "Punjab, India", sub: "Serving Nationwide" },
    { icon: "💬", title: "Live Chat", value: "Chat with us", sub: "Available in the app 24/7" },
  ];

  const faqs = [
    { q: "How fast is the delivery?", a: "We deliver in 30 minutes or less in most areas. You'll get live tracking after placing your order." },
    { q: "Can I cancel my order?", a: "Yes, you can cancel within 5 minutes of placing the order via the app. After that, please call support." },
    { q: "Is there a minimum order amount?", a: "Minimum order value is ₹99. Free delivery on orders above ₹299." },
    { q: "How do I track my order?", a: "After ordering, you'll receive a tracking link. Live GPS tracking is available directly in your dashboard." },
  ];

  return (
    <div className="w-full flex flex-col bg-white overflow-hidden">

      {/* ── Hero Section ── */}
      <section className="relative w-full min-h-[400px] flex items-center justify-center px-4 py-20 bg-gray-50 overflow-hidden">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <Section>
            <span className="inline-block bg-orange-100 text-orange-600 font-bold px-4 py-2 rounded-full text-sm mb-6 border border-orange-200">
              📞 Get In Touch
            </span>
            <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight leading-tight mb-6">
              We're Here to <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">Help</span>
            </h1>
            <p className="text-lg text-gray-500 mb-0 leading-relaxed font-medium">
              Have a question, feedback, or need assistance? Reach out to our team — we respond lightning fast.
            </p>
          </Section>
        </div>
      </section>

      {/* ── Contact Channels ── */}
      <section className="w-full py-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {channels.map((c, i) => (
              <Section delay={i * 100} key={c.title}>
                <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center h-full">
                  <div className="w-16 h-16 mx-auto bg-orange-50 rounded-full flex items-center justify-center text-3xl mb-6 shadow-inner">
                    {c.icon}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{c.title}</h3>
                  <p className="text-orange-600 font-bold mb-2">{c.value}</p>
                  <p className="text-gray-400 font-medium text-sm">{c.sub}</p>
                </div>
              </Section>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact Form & Map ── */}
      <section className="w-full py-24 bg-gray-50 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          
          {/* Form */}
          <Section>
            <div className="bg-white rounded-3xl p-8 md:p-10 shadow-lg border border-gray-100">
              <h2 className="text-3xl font-black text-gray-900 mb-2">Send a Message</h2>
              <p className="text-gray-500 font-medium mb-8">Fill in the form and we'll get back to you within 2 hours.</p>

              {sent ? (
                <div className="py-12 text-center flex flex-col items-center">
                  <span className="text-6xl mb-6">✅</span>
                  <h3 className="text-2xl font-black text-gray-900 mb-4">Message Sent Successfully!</h3>
                  <p className="text-gray-500 font-medium mb-8">Thank you for reaching out. A member of our support team will contact you shortly.</p>
                  <button 
                    onClick={() => setSent(false)}
                    className="px-8 py-3 rounded-full bg-gray-100 text-gray-900 font-bold hover:bg-gray-200 transition-colors"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Your Name *</label>
                      <input 
                        required name="name" value={form.name} onChange={handleChange} 
                        placeholder="John Doe"
                        className="w-full px-5 py-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Email Address *</label>
                      <input 
                        required type="email" name="email" value={form.email} onChange={handleChange} 
                        placeholder="john@example.com"
                        className="w-full px-5 py-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Subject</label>
                    <input 
                      name="subject" value={form.subject} onChange={handleChange} 
                      placeholder="How can we help you?"
                      className="w-full px-5 py-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Message *</label>
                    <textarea 
                      required name="message" value={form.message} onChange={handleChange} 
                      placeholder="Write your message here..." rows={4}
                      className="w-full px-5 py-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium resize-none"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white font-black text-lg shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:-translate-y-1 transition-all duration-300 mt-2"
                  >
                    Send Message →
                  </button>
                </form>
              )}
            </div>
          </Section>

          {/* FAQs */}
          <Section delay={150}>
            <div className="flex flex-col h-full justify-center">
              <h2 className="text-3xl font-black text-gray-900 mb-2">Frequently Asked Questions</h2>
              <p className="text-gray-500 font-medium mb-10">Quick answers to the questions we hear most often.</p>

              <div className="flex flex-col gap-6">
                {faqs.map((faq, i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 border-l-4 border-l-orange-500 shadow-sm">
                    <h4 className="text-lg font-bold text-gray-900 mb-3">Q: {faq.q}</h4>
                    <p className="text-gray-600 font-medium leading-relaxed">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </Section>

        </div>
      </section>
      
    </div>
  );
}