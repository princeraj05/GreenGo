// ================= FRONTEND =================
// ✅ src/pages/user/Orders.jsx (RESPONSIVE + MODERN UI)

import { useEffect, useState } from "react";
import { getToken } from "../../utils/getToken";

export default function Orders() {

  const [orders,setOrders] = useState([]);

  useEffect(()=>{
    loadOrders();
    const t = setInterval(loadOrders,1000);
    return ()=>clearInterval(t);
  },[]);

  const loadOrders = async()=>{

    const token = await getToken();

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/orders/my`,
      {
        headers:{Authorization:`Bearer ${token}`}
      }
    );

    setOrders(await res.json());

  };

  const remaining = (o)=>{

    if(o.status==="Delivered") return "Delivered";

    if(!o.etaMinutes || !o.etaSetAt) return "Not Set";

    const diff =
      o.etaMinutes*60000 -
      (Date.now() - new Date(o.etaSetAt).getTime());

    if(diff<=0) return "Arriving";

    const m = Math.floor(diff/60000);
    const s = Math.floor((diff%60000)/1000);

    return `${m}m ${s}s`;

  };

  const badgeColor = (status)=>(
    {
      Delivered:"#16a34a",
      Pending:"#f97316",
      Preparing:"#2563eb"
    }[status]
  );

  return(

    <div style={page}>

      <h1 style={title}>📦 My Orders</h1>

      {orders.length===0 && (
        <p style={empty}>No orders yet</p>
      )}

      {orders.map(o=>(

        <div key={o._id} style={card}>

          {/* HEADER */}

          <div style={top}>

            <h3 style={orderId}>
              Order #{o._id.slice(-6)}
            </h3>

            <span
            style={{
              ...badge,
              background:badgeColor(o.status)
            }}
            >
              {o.status}
            </span>

          </div>

          <p style={eta}>
            ⏱ ETA: <b>{remaining(o)}</b>
          </p>

          {/* ITEMS */}

          <div style={itemsBox}>

            {o.items.map((i,idx)=>(

              <div key={idx} style={row}>

                <img
                src={i.image?.startsWith('http') ? i.image : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/uploads/${i.image}`}
                alt={i.name}
                style={img}
                onError={(e)=>e.target.style.display="none"}
                />

                <span style={itemName}>
                  {i.name} × {i.qty}
                </span>

                <b>₹{i.price*i.qty}</b>

              </div>

            ))}

          </div>

          <h3 style={total}>
            Total ₹{o.total}
          </h3>

        </div>

      ))}

    </div>

  );

}

/* ================= STYLES ================= */

const page={
padding:"30px 20px",
background:"#f8fafc",
minHeight:"100vh",
maxWidth:1000,
margin:"auto"
};

const title={
marginBottom:30,
color:"#0f172a"
};

const empty={
color:"#64748b"
};

const card={
background:"#ffffff",
padding:22,
borderRadius:18,
marginBottom:22,
boxShadow:"0 10px 25px rgba(0,0,0,0.08)"
};

const top={
display:"flex",
justifyContent:"space-between",
alignItems:"center",
flexWrap:"wrap",
gap:10
};

const orderId={
margin:0
};

const badge={
padding:"6px 14px",
borderRadius:20,
color:"#fff",
fontWeight:600,
fontSize:13
};

const eta={
margin:"10px 0 14px",
color:"#334155"
};

const itemsBox={
marginTop:10
};

const row={
display:"flex",
alignItems:"center",
gap:12,
marginBottom:10,
flexWrap:"wrap"
};

const img={
width:54,
height:54,
borderRadius:10,
objectFit:"cover"
};

const itemName={
flex:1
};

const total={
marginTop:10,
textAlign:"right",
color:"#166534"
};