// ================= FRONTEND =================
// ✅ src/pages/user/Contact.jsx (RESPONSIVE + MODERN UI)

import { useEffect, useState } from "react";
import { getToken } from "../../utils/getToken";

export default function Contact() {

  const [form,setForm] = useState({
    name:"",
    email:"",
    message:""
  });

  const [msg,setMsg] = useState("");
  const [contacts,setContacts] = useState([]);
  const [hoverId,setHoverId] = useState(null);

  useEffect(()=>{
    loadMyContacts();
  },[]);

  const loadMyContacts = async()=>{

    const token = await getToken();
    if(!token) return;

    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/contact/my`,{
      headers:{Authorization:`Bearer ${token}`}
    });

    const data = await res.json();
    setContacts(data);

  };

  const handleChange = (e)=>{
    setForm({...form,[e.target.name]:e.target.value});
  };

  const handleSubmit = async(e)=>{
    e.preventDefault();

    const token = await getToken();
    if(!token) return alert("Login required");

    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/contact`,{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        Authorization:`Bearer ${token}`
      },
      body:JSON.stringify(form)
    });

    const data = await res.json();

    setMsg(data.message);

    if(data.success){
      setForm({name:"",email:"",message:""});
      loadMyContacts();
    }

  };

  return(

    <div style={page}>

      <h2 style={title}>📩 Contact Support</h2>
      <p style={subtitle}>Send your message and track admin reply</p>

      {msg && <p style={success}>{msg}</p>}

      {/* FORM */}

      <form onSubmit={handleSubmit} style={card}>

        <input
        style={input}
        placeholder="Your Name"
        name="name"
        value={form.name}
        onChange={handleChange}
        required
        />

        <input
        style={input}
        placeholder="Your Email"
        name="email"
        value={form.email}
        onChange={handleChange}
        required
        />

        <textarea
        style={{...input,height:120}}
        placeholder="Your Message"
        name="message"
        value={form.message}
        onChange={handleChange}
        required
        />

        <button style={btn}>Send Message</button>

      </form>

      {/* USER MESSAGES */}

      <h3 style={sectionTitle}>📨 Your Messages</h3>

      {contacts.map(c=>(

        <div
        key={c._id}
        style={{
          ...msgCard,
          transform:hoverId===c._id ? "translateY(-4px)" : "none"
        }}
        onMouseEnter={()=>setHoverId(c._id)}
        onMouseLeave={()=>setHoverId(null)}
        >

          <p style={userMsg}>
            <b>You:</b> {c.message}
          </p>

          {c.reply ? (

            <div style={replyBox}>
              <p style={replyLabel}>Admin Reply</p>
              <p style={replyText}>{c.reply}</p>
            </div>

          ) : (

            <p style={pending}>⏳ Waiting for admin reply</p>

          )}

        </div>

      ))}

    </div>

  );

}

/* ================= STYLES ================= */

const page={
maxWidth:900,
margin:"auto",
padding:"30px 20px"
};

const title={
fontSize:24,
fontWeight:800,
color:"#0f172a"
};

const subtitle={
marginBottom:20,
color:"#64748b"
};

const success={
color:"#16a34a",
fontWeight:600
};

const card={
marginTop:20,
padding:24,
background:"#ffffff",
borderRadius:18,
boxShadow:"0 10px 25px rgba(0,0,0,0.08)"
};

const input={
width:"100%",
padding:12,
marginBottom:14,
borderRadius:10,
border:"1px solid #e2e8f0",
fontSize:14
};

const btn={
width:"100%",
padding:14,
borderRadius:12,
border:"none",
background:"linear-gradient(135deg,#22c55e,#16a34a)",
color:"#fff",
fontWeight:700,
cursor:"pointer"
};

const sectionTitle={
marginTop:30,
fontSize:18,
fontWeight:700
};

const msgCard={
marginTop:14,
padding:16,
background:"#ffffff",
borderRadius:14,
boxShadow:"0 8px 20px rgba(0,0,0,0.08)",
transition:"0.3s"
};

const userMsg={
fontSize:14
};

const replyBox={
marginTop:10,
padding:12,
borderRadius:10,
background:"#ecfdf5"
};

const replyLabel={
fontSize:12,
fontWeight:700,
color:"#166534"
};

const replyText={
fontSize:14,
color:"#065f46"
};

const pending={
marginTop:8,
color:"#94a3b8",
fontSize:13
};