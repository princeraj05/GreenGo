import { useEffect, useState } from "react";
import { getToken } from "../../utils/getToken";

export default function UserDashboard(){

const [orders,setOrders] = useState([]);
const [loading,setLoading] = useState(true);

useEffect(()=>{
loadOrders();
},[]);

const loadOrders = async()=>{

try{

const token = await getToken();
if(!token) return;

const res = await fetch(
`${import.meta.env.VITE_API_URL}/api/orders/my`,
{
headers:{Authorization:`Bearer ${token}`}
}
);

const data = await res.json();
setOrders(Array.isArray(data)?data:[]);

}catch{
setOrders([]);
}finally{
setLoading(false);
}

};

const totalOrders = orders.length;
const pendingOrders = orders.filter(o=>o.status==="Pending").length;
const deliveredOrders = orders.filter(o=>o.status==="Delivered").length;
const recentOrders = orders.slice(0,5);

if(loading) return <p style={{padding:40}}>Loading dashboard...</p>;

return(

<div style={page}>

<h1 style={title}>📊 My Dashboard</h1>
<p style={subtitle}>Quick overview of your orders</p>

{/* STATS */}

<div style={statsGrid}>

<StatCard title="Total Orders" value={totalOrders} color="#38bdf8"/>
<StatCard title="Pending" value={pendingOrders} color="#facc15"/>
<StatCard title="Delivered" value={deliveredOrders} color="#4ade80"/>

</div>

{/* RECENT ORDERS */}

<div style={card}>

<h3 style={{marginBottom:16}}>🧾 Recent Orders</h3>

{recentOrders.length===0?

<p style={{color:"#64748b"}}>No orders yet</p>

:

<div style={tableWrapper}>

<table style={table}>

<thead>
<tr>
<th style={th}>Order</th>
<th style={th}>Items</th>
<th style={th}>Status</th>
<th style={th}>Amount</th>
</tr>
</thead>

<tbody>

{recentOrders.map(order=>(

<tr key={order._id} style={row}>

<td style={td}>#{order._id.slice(-6)}</td>

<td style={td}>
{order.items.map(i=>i.name).join(", ")}
</td>

<td style={{
...td,
fontWeight:700,
color:order.status==="Delivered"
?"#16a34a"
:"#f97316"
}}>
{order.status}
</td>

<td style={{...td,fontWeight:700}}>
₹{order.total}
</td>

</tr>

))}

</tbody>

</table>

</div>

}

</div>

</div>

);

}

/* STAT CARD */

function StatCard({title,value,color}){

return(

<div style={{
...statCard,
borderLeft:`5px solid ${color}`
}}>

<p style={statTitle}>{title}</p>
<h2 style={statValue}>{value}</h2>

</div>

);

}

/* STYLES */

const page={
width:"100%",
padding:"16px"
};

const title={
marginBottom:6,
color:"#0f172a"
};

const subtitle={
marginBottom:20,
color:"#64748b"
};

const statsGrid={
display:"grid",
gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",
gap:16,
marginBottom:24
};

const statCard={
background:"#fff",
padding:20,
borderRadius:16,
boxShadow:"0 8px 20px rgba(0,0,0,0.08)"
};

const statTitle={
color:"#64748b",
marginBottom:6,
fontWeight:600
};

const statValue={
fontSize:24,
color:"#0f172a"
};

const card={
maxWidth:700,
margin:"auto",
background:"#fff",
padding:"20px",
borderRadius:18,
boxShadow:"0 8px 20px rgba(0,0,0,0.08)"
};

const tableWrapper={
width:"100%",
overflowX:"auto"
};

const table={
width:"100%",
borderCollapse:"collapse"
};

const th={
padding:"10px",
textAlign:"left",
fontWeight:700,
color:"#334155"
};

const td={
padding:"10px",
borderBottom:"1px solid #f1f5f9",
boxSizing:"border-box"
};

const row={
transition:"0.2s"
};