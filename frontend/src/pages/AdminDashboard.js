import React, { useState, useEffect } from "react";
import { API_URL } from "../constants";

/* ── Fonts ─────────────────────────────────────────────────────── */
if (!document.getElementById("admin-fonts")) {
  const l = document.createElement("link");
  l.id = "admin-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap";
  document.head.appendChild(l);
}

/* ── Palette ───────────────────────────────────────────────────── */
const P = {
  bg:"#F2EFEA", surface:"#FFFFFF",
  teal:"#557373", tealDark:"#3d5555", tealLight:"rgba(85,115,115,0.1)",
  olive:"#272401", muted:"#6b7a7a", border:"rgba(85,115,115,0.15)",
  danger:"#c0392b", dangerBg:"rgba(192,57,43,0.08)",
  success:"#2e7d5e", successBg:"rgba(46,125,94,0.09)",
  warn:"#9a6c1a", warnBg:"rgba(154,108,26,0.09)",
  sidebar:"#181c18",
  serif:"'DM Serif Display',Georgia,serif",
  sans:"'DM Sans','Inter',system-ui,sans-serif",
};

/* ── Atoms ─────────────────────────────────────────────────────── */
const Badge = ({ c, bg, children }) => (
  <span style={{ display:"inline-flex", alignItems:"center", padding:"3px 10px", borderRadius:99,
    fontSize:"0.62rem", fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase",
    background: bg || (c||P.teal)+"18", color: c||P.teal, fontFamily:P.sans, whiteSpace:"nowrap" }}>
    {children}
  </span>
);

const Btn = ({ children, onClick, v="primary", sm, danger, ghost, warn }) => {
  const cfg = danger
    ? { bg:P.dangerBg, color:P.danger, border:`1px solid ${P.danger}30` }
    : ghost
    ? { bg:"transparent", color:P.teal, border:`1px solid ${P.teal}40` }
    : warn
    ? { bg:P.warnBg, color:P.warn, border:`1px solid ${P.warn}30` }
    : { bg:P.teal, color:"#fff", border:"none", boxShadow:`0 3px 12px ${P.teal}40` };
  return (
    <button onClick={onClick} style={{
      display:"inline-flex", alignItems:"center", justifyContent:"center", gap:5,
      padding: sm ? "6px 14px" : "9px 20px",
      borderRadius:99, cursor:"pointer", fontFamily:P.sans,
      fontSize: sm ? "0.74rem" : "0.82rem", fontWeight:600,
      transition:"all 0.18s cubic-bezier(0.34,1.56,0.64,1)",
      ...cfg,
    }}
      onMouseEnter={e=>{ e.currentTarget.style.transform="translateY(-1px) scale(1.03)"; e.currentTarget.style.filter="brightness(1.08)"; }}
      onMouseLeave={e=>{ e.currentTarget.style.transform="none"; e.currentTarget.style.filter="none"; }}
    >{children}</button>
  );
};

const Divider = () => <div style={{ height:1, background:P.border, margin:"12px 0" }} />;

const InfoRow = ({ label, value }) => (
  <div style={{ display:"flex", gap:8, alignItems:"baseline", marginBottom:3 }}>
    <span style={{ fontSize:"0.65rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:P.muted, minWidth:72, fontFamily:P.sans }}>{label}</span>
    <span style={{ fontSize:"0.82rem", color:P.olive, fontFamily:P.sans, fontWeight:500 }}>{value||"—"}</span>
  </div>
);

const Empty = ({ icon, text }) => (
  <div style={{ textAlign:"center", padding:"80px 24px", color:P.muted, fontFamily:P.sans }}>
    <div style={{ fontSize:"3rem", marginBottom:14, opacity:0.3 }}>{icon}</div>
    <p style={{ fontSize:"0.9rem", margin:0, fontWeight:500 }}>{text}</p>
  </div>
);

const NAV = [
  { id:"pending",       icon:"⏳", label:"Pending Lands"    },
  { id:"sellers",       icon:"🪪", label:"Seller Requests"  },
  { id:"builders",      icon:"🏗️", label:"Builder Verify"   },
  { id:"buildprojects", icon:"📋", label:"Build Projects"   },
  { id:"biddings",      icon:"🔨", label:"Bid Listings"     },
  { id:"active_bids",   icon:"🔴", label:"Active Auctions"  },
  { id:"houses",        icon:"🏠", label:"Houses & Flats"   },
  { id:"rooms",         icon:"🚪", label:"Rooms"            },
  { id:"lands_tab",     icon:"🌿", label:"Land Listings"    },
  { id:"commercial",    icon:"🏢", label:"Commercial"       },
  { id:"rental_partners",icon:"🤝",label:"Rental Partners"  },
  { id:"buyer_posts",   icon:"📢", label:"Buyer Posts"      },
  { id:"forum_posts",   icon:"💬", label:"Forum Posts"      },
  { id:"users",         icon:"👥", label:"Users"            },
];

/* ── Land Admin Card ───────────────────────────────────────────── */
const LandAdminCard = ({ land, onApprove, onReject, onDelete, showActions=true, onMessage }) => {
  const img = land.image
    ? (land.image.startsWith("http") ? land.image : `${API_URL}/uploads/${land.image}`)
    : "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400";
  const statusColor = land.status==="approved"?P.success:land.status==="rejected"?P.danger:P.warn;
  return (
    <div style={{ background:P.surface, borderRadius:18, overflow:"hidden",
      boxShadow:"0 2px 8px rgba(39,36,1,0.06),0 6px 28px rgba(39,36,1,0.08)",
      transition:"transform 0.2s ease,box-shadow 0.2s ease", fontFamily:P.sans }}
      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 4px 14px rgba(39,36,1,0.09),0 12px 36px rgba(39,36,1,0.12)";}}
      onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="0 2px 8px rgba(39,36,1,0.06),0 6px 28px rgba(39,36,1,0.08)";}}>
      {/* Image */}
      <div style={{ position:"relative", height:160, overflow:"hidden", background:"#e8e4de" }}>
        <img src={img} alt={land.title} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(39,36,1,0.55) 0%, transparent 55%)" }} />
        <div style={{ position:"absolute", top:10, left:10 }}>
          <Badge c={statusColor}>{land.status||"pending"}</Badge>
        </div>
        {land.mainCategory && (
          <div style={{ position:"absolute", top:10, right:10 }}>
            <Badge c="#fff" bg="rgba(39,36,1,0.55)">{land.mainCategory}</Badge>
          </div>
        )}
        <div style={{ position:"absolute", bottom:10, left:12, right:12 }}>
          <p style={{ margin:0, fontSize:"0.88rem", fontWeight:700, color:"#F2EFEA", lineHeight:1.3,
            textShadow:"0 1px 4px rgba(0,0,0,0.5)", fontFamily:P.serif, fontStyle:"italic" }}>
            {land.title}
          </p>
        </div>
      </div>
      {/* Body */}
      <div style={{ padding:"14px 16px 16px" }}>
        <InfoRow label="Location" value={[land.city,land.district,land.province].filter(Boolean).join(", ")||land.location} />
        <InfoRow label="Price" value={land.price ? `Rs. ${parseInt(land.price).toLocaleString()}/mo` : null} />
        <InfoRow label="Owner" value={land.ownerName} />
        {land.ownerEmail && <InfoRow label="Email" value={land.ownerEmail} />}
        {land.areaSize && <InfoRow label="Area" value={land.areaSize} />}
        {showActions && (
          <>
            <Divider />
            <div style={{ display:"flex", gap:7, flexWrap:"wrap", alignItems:"center" }}>
              {land.lalpurjaImage && (
                <a href={`${API_URL}/uploads/${land.lalpurjaImage}`} target="_blank" rel="noreferrer"
                  style={{ fontSize:"0.72rem", color:P.teal, fontWeight:600, textDecoration:"none",
                    padding:"5px 12px", borderRadius:99, background:P.tealLight, fontFamily:P.sans }}>
                  🔍 Lalpurja
                </a>
              )}
              {land.status==="pending" && onApprove && <Btn sm onClick={()=>onApprove(land._id,"approved")}>✓ Approve</Btn>}
              {land.status==="pending" && onReject  && <Btn sm danger onClick={()=>onReject(land._id,"rejected")}>✕ Reject</Btn>}
              {land.status==="approved" && onReject  && <Btn sm warn onClick={()=>onReject(land._id,"rejected")}>Revoke</Btn>}
              {onMessage && land.ownerId && <Btn sm ghost onClick={()=>onMessage({ _id:land.ownerId, name:land.ownerName })}>💬 Message Owner</Btn>}
              {onDelete && <Btn sm danger onClick={()=>onDelete(land._id)}>🗑 Delete</Btn>}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/* ── User Admin Card ───────────────────────────────────────────── */
const UserAdminCard = ({ u, onMakeSeller, onRevokeSeller, onDelete, onSetRole, onMessage }) => {
  const avatar = u.avatar
    ? `${API_URL}/uploads/${u.avatar}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=DFE5F3&color=557373&bold=true&size=64`;
  const acColor = u.accountType==="seller"?P.success:u.accountType==="seller_pending"?P.warn:P.muted;
  return (
    <div style={{ background:P.surface, borderRadius:18, padding:"18px 20px",
      boxShadow:"0 2px 8px rgba(39,36,1,0.06),0 4px 20px rgba(39,36,1,0.07)",
      fontFamily:P.sans, display:"flex", gap:14, alignItems:"flex-start" }}>
      <img src={avatar} alt={u.name} style={{ width:48, height:48, borderRadius:"50%", objectFit:"cover", flexShrink:0, border:`2px solid ${P.border}` }} />
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
          <span style={{ fontWeight:700, color:P.olive, fontSize:"0.95rem" }}>{u.name}</span>
          <Badge c={acColor}>{u.accountType||"buyer"}</Badge>
          {u.role==="admin" && <Badge c="#7c3aed">Admin</Badge>}
        </div>
        <p style={{ margin:"0 0 2px", fontSize:"0.78rem", color:P.muted }}>{u.email}</p>
        {u.phone && <p style={{ margin:"0 0 8px", fontSize:"0.78rem", color:P.muted }}>{u.phone}</p>}
        {u.sellerDocType && <Badge c={P.teal}>{u.sellerDocType}</Badge>}
        <Divider />
        <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
          {u.sellerDoc && (
            <a href={`${API_URL}/uploads/${u.sellerDoc}`} target="_blank" rel="noreferrer"
              style={{ fontSize:"0.72rem", color:P.teal, fontWeight:600, textDecoration:"none",
                padding:"5px 12px", borderRadius:99, background:P.tealLight, fontFamily:P.sans }}>
              📄 Doc
            </a>
          )}
          {u.accountType!=="seller" && u.role!=="admin" && <Btn sm onClick={()=>onMakeSeller(u._id)}>Make Seller</Btn>}
          {u.accountType==="seller" && <Btn sm ghost onClick={()=>onRevokeSeller(u._id)}>Revoke Seller</Btn>}
          {u.role!=="admin" && onSetRole && <Btn sm warn onClick={()=>onSetRole(u._id,"admin")}>Make Admin</Btn>}
          {u.role==="admin" && onSetRole && <Btn sm ghost onClick={()=>onSetRole(u._id,"user")}>Revoke Admin</Btn>}
          {onMessage && <Btn sm ghost onClick={()=>onMessage(u)}>💬 Message</Btn>}
          <Btn sm danger onClick={()=>onDelete(u._id)}>🚫 Ban</Btn>
        </div>
      </div>
    </div>
  );
};

/* ── Bid Admin Card ────────────────────────────────────────────── */
const BidAdminCard = ({ b, onApprove, onReject }) => {
  const img = b.image
    ? (b.image.startsWith("http") ? b.image : `${API_URL}/uploads/${b.image}`)
    : "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400";
  return (
    <div style={{ background:P.surface, borderRadius:18, overflow:"hidden",
      boxShadow:"0 2px 8px rgba(39,36,1,0.06),0 6px 28px rgba(39,36,1,0.08)", fontFamily:P.sans }}>
      <div style={{ position:"relative", height:140, overflow:"hidden", background:"#e8e4de" }}>
        <img src={img} alt={b.title} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(39,36,1,0.6) 0%, transparent 50%)" }} />
        <div style={{ position:"absolute", top:10, left:10 }}><Badge c={P.warn}>Pending</Badge></div>
        {b.mainCategory && <div style={{ position:"absolute", top:10, right:10 }}><Badge c="#fff" bg="rgba(39,36,1,0.55)">{b.mainCategory}</Badge></div>}
        <p style={{ position:"absolute", bottom:10, left:12, right:12, margin:0,
          fontSize:"0.88rem", fontWeight:700, color:"#F2EFEA", fontFamily:P.serif, fontStyle:"italic",
          textShadow:"0 1px 4px rgba(0,0,0,0.5)", lineHeight:1.3 }}>{b.title}</p>
      </div>
      <div style={{ padding:"14px 16px 16px" }}>
        <InfoRow label="Location" value={[b.city,b.district,b.province].filter(Boolean).join(", ")||b.location} />
        <InfoRow label="Starting" value={`Rs. ${parseInt(b.startingPrice||0).toLocaleString()}`} />
        <InfoRow label="Increment" value={`Rs. ${parseInt(b.minIncrement||1000).toLocaleString()}`} />
        <InfoRow label="Auction" value={`${new Date(b.auctionStart).toLocaleDateString()} → ${new Date(b.auctionEnd).toLocaleDateString()}`} />
        <InfoRow label="Seller" value={b.sellerName} />
        {b.sellerEmail && <InfoRow label="Email" value={b.sellerEmail} />}
        {b.description && <p style={{ margin:"8px 0 0", fontSize:"0.78rem", color:P.muted, lineHeight:1.6 }}>{b.description.slice(0,120)}{b.description.length>120?"…":""}</p>}
        <Divider />
        <div style={{ display:"flex", gap:7 }}>
          <Btn sm onClick={()=>onApprove(b._id)}>✓ Approve &amp; Go Live</Btn>
          <Btn sm danger onClick={()=>onReject(b._id)}>✕ Reject</Btn>
        </div>
      </div>
    </div>
  );
};

/* ── Builder Admin Card ────────────────────────────────────────── */
const BuilderAdminCard = ({ b, onApprove, onReject, onDelete, onMessage }) => {
  const vs = b.verificationStatus;
  const vsColor = vs==="approved"?P.success:vs==="rejected"?P.danger:P.warn;
  return (
    <div style={{ background:P.surface, borderRadius:18, padding:"18px 20px",
      boxShadow:"0 2px 8px rgba(39,36,1,0.06),0 4px 20px rgba(39,36,1,0.07)", fontFamily:P.sans }}>
      <div style={{ display:"flex", gap:12, alignItems:"flex-start", marginBottom:12 }}>
        <div style={{ width:46, height:46, borderRadius:14, background:P.tealLight,
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.4rem", flexShrink:0 }}>🏢</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:3 }}>
            <span style={{ fontWeight:700, color:P.olive, fontSize:"0.98rem" }}>{b.companyName}</span>
            <Badge c={vsColor}>{vs}</Badge>
          </div>
          <p style={{ margin:0, fontSize:"0.78rem", color:P.muted }}>{b.companyType} · {b.userId?.email}</p>
        </div>
      </div>
      <InfoRow label="Location" value={[b.city,b.district,b.province].filter(Boolean).join(", ")} />
      <InfoRow label="Experience" value={b.yearsOfExperience ? `${b.yearsOfExperience} years` : null} />
      <InfoRow label="Projects" value={b.completedProjects ? `${b.completedProjects} completed` : null} />
      {b.description && <p style={{ margin:"8px 0 0", fontSize:"0.78rem", color:P.muted, lineHeight:1.6 }}>{b.description.slice(0,140)}{b.description.length>140?"…":""}</p>}
      {b.workers?.length>0 && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginTop:10 }}>
          {b.workers.map((w,i)=>(
            <span key={i} style={{ fontSize:"0.7rem", padding:"3px 9px", borderRadius:99,
              background:"#F2EFEA", color:P.olive, fontWeight:500 }}>{w.name} · {w.role}</span>
          ))}
        </div>
      )}
      <Divider />
      <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
        {b.proofDocuments?.map((doc,i)=>(
          <a key={i} href={`${API_URL}/uploads/${doc}`} target="_blank" rel="noreferrer"
            style={{ fontSize:"0.72rem", color:P.teal, fontWeight:600, textDecoration:"none",
              padding:"5px 12px", borderRadius:99, background:P.tealLight, fontFamily:P.sans }}>
            🔒 Proof {i+1}
          </a>
        ))}
        {vs!=="approved" && <Btn sm onClick={()=>onApprove(b._id,"approved")}>✓ Approve</Btn>}
        {vs!=="rejected" && <Btn sm danger onClick={()=>onReject(b._id,"rejected")}>✕ Reject</Btn>}
        {vs==="approved" && <Btn sm warn onClick={()=>onReject(b._id,"rejected")}>Revoke</Btn>}
        {onMessage && b.userId && <Btn sm ghost onClick={()=>onMessage({ _id: b.userId._id || b.userId, name: b.companyName })}>💬 Message</Btn>}
        {onDelete && <Btn sm danger onClick={()=>onDelete(b._id)}>🗑 Delete Profile</Btn>}
      </div>
    </div>
  );
};

/* ── Project Admin Card ────────────────────────────────────────── */
const ProjectAdminCard = ({ p, onDelete, onMessage }) => {
  const sc = { open:P.success, negotiating:P.warn, deal_done:P.teal, in_progress:"#7c3aed", completed:P.teal, cancelled:P.danger };
  return (
    <div style={{ background:P.surface, borderRadius:18, padding:"18px 20px",
      boxShadow:"0 2px 8px rgba(39,36,1,0.06),0 4px 20px rgba(39,36,1,0.07)", fontFamily:P.sans }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10, flexWrap:"wrap" }}>
        <span style={{ fontWeight:700, color:P.olive, fontSize:"0.98rem", flex:1 }}>{p.projectTitle}</span>
        <Badge c={sc[p.status]||P.muted}>{p.status}</Badge>
      </div>
      <InfoRow label="Type" value={`${p.buildType||"—"} · ${p.purpose||"—"}`} />
      <InfoRow label="Owner" value={p.ownerId?.name || p.ownerName} />
      <InfoRow label="Email" value={p.ownerId?.email || p.ownerEmail} />
      <InfoRow label="Budget" value={`Rs. ${Number(p.budgetMin||0).toLocaleString()} – ${Number(p.budgetMax||0).toLocaleString()}`} />
      <InfoRow label="Location" value={[p.city,p.district,p.province].filter(Boolean).join(", ")||p.landLocation||"Nepal"} />
      <InfoRow label="Duration" value={p.expectedDuration} />
      {p.description && <p style={{ margin:"8px 0 0", fontSize:"0.78rem", color:P.muted, lineHeight:1.6 }}>{p.description.slice(0,140)}{p.description.length>140?"…":""}</p>}
      <Divider />
      <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
        {onMessage && p.ownerId && <Btn sm ghost onClick={()=>onMessage({ _id: p.ownerId._id || p.ownerId, name: p.ownerId.name || p.ownerName })}>💬 Message Owner</Btn>}
        {onDelete && <Btn sm danger onClick={()=>onDelete(p._id)}>🗑 Delete Project</Btn>}
      </div>
    </div>
  );
};

/* ── Seller Request Card ───────────────────────────────────────── */
const SellerCard = ({ u, onApprove, onReject }) => {
  const avatar = u.avatar
    ? `${API_URL}/uploads/${u.avatar}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=EBF2F2&color=557373&bold=true&size=64`;
  return (
    <div style={{ background:P.surface, borderRadius:18, padding:"18px 20px",
      boxShadow:"0 2px 8px rgba(39,36,1,0.06),0 4px 20px rgba(39,36,1,0.07)", fontFamily:P.sans }}>
      <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:12 }}>
        <img src={avatar} alt={u.name} style={{ width:48, height:48, borderRadius:"50%", objectFit:"cover", flexShrink:0 }} />
        <div>
          <div style={{ fontWeight:700, color:P.olive, fontSize:"0.95rem", marginBottom:2 }}>{u.name}</div>
          <div style={{ fontSize:"0.78rem", color:P.muted }}>{u.email}</div>
          {u.phone && <div style={{ fontSize:"0.78rem", color:P.muted }}>{u.phone}</div>}
        </div>
        <div style={{ marginLeft:"auto" }}><Badge c={P.warn}>Pending</Badge></div>
      </div>
      {u.sellerDocType && <InfoRow label="Doc Type" value={u.sellerDocType} />}
      <Divider />
      <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
        {u.sellerDoc && (
          <a href={`${API_URL}/uploads/${u.sellerDoc}`} target="_blank" rel="noreferrer"
            style={{ fontSize:"0.72rem", color:P.teal, fontWeight:600, textDecoration:"none",
              padding:"5px 12px", borderRadius:99, background:P.tealLight, fontFamily:P.sans }}>
            📄 View Document
          </a>
        )}
        <Btn sm onClick={()=>onApprove(u._id,"approved")}>✓ Approve</Btn>
        <Btn sm danger onClick={()=>onReject(u._id,"rejected")}>✕ Reject</Btn>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════ */
const AdminDashboard = ({ user, chatRef }) => {
  const [users,         setUsers]         = useState([]);
  const [lands,         setLands]         = useState([]);
  const [view,          setView]          = useState("pending");
  const [builders,      setBuilders]      = useState([]);
  const [buildProjects, setBuildProjects] = useState([]);
  const [bidListings,   setBidListings]   = useState([]);
  const [activeBids,    setActiveBids]    = useState([]);
  const [rentalPartners,setRentalPartners]= useState([]);
  const [buyerPosts,    setBuyerPosts]    = useState([]);
  const [forumPosts,    setForumPosts]    = useState([]);

  const fetch_ = (url, cb) => fetch(url).then(r=>r.json()).then(cb).catch(()=>{});

  const load = () => {
    fetch_(`${API_URL}/admin/users`,           d => setUsers(d.users||[]));
    fetch_(`${API_URL}/admin/all-lands`,       d => setLands(d.lands||[]));
    fetch_(`${API_URL}/build/admin/builders`,  d => d.success && setBuilders(d.builders||[]));
    fetch_(`${API_URL}/build/admin/projects`,  d => d.success && setBuildProjects(d.projects||[]));
    fetch_(`${API_URL}/bid-listings?status=pending`, d => d.success && setBidListings(d.listings||[]));
    fetch_(`${API_URL}/admin/bid-listings?status=active`, d => d.success && setActiveBids(d.listings||[]));
    fetch_(`${API_URL}/rental-partners`,       d => d.success && setRentalPartners(d.partners||[]));
    fetch_(`${API_URL}/buyer-posts?postType=section`, d => d.success && setBuyerPosts(d.posts||[]));
    fetch_(`${API_URL}/buyer-posts?postType=forum`,   d => d.success && setForumPosts(d.posts||[]));
  };
  useEffect(()=>{ load(); }, []); // eslint-disable-line

  const confirm_ = (msg, fn) => { if (window.confirm(msg)) fn(); };

  const post = (url, body={}) => fetch(url, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) }).then(()=>load());
  const del  = (url)          => fetch(url, { method:"DELETE" }).then(()=>load());

  const approveLand   = (id) => confirm_("Approve this listing?",   ()=>post(`${API_URL}/admin/verify-land/${id}`,    {status:"approved"}));
  const rejectLand    = (id) => confirm_("Reject this listing?",    ()=>post(`${API_URL}/admin/verify-land/${id}`,    {status:"rejected"}));
  const deleteLand    = (id) => confirm_("Permanently delete this property?", ()=>del(`${API_URL}/admin/delete-land/${id}`));
  const approveSeller = (id) => confirm_("Approve seller account?", ()=>post(`${API_URL}/admin/verify-seller/${id}`, {status:"approved"}));
  const rejectSeller  = (id) => confirm_("Reject seller request?",  ()=>post(`${API_URL}/admin/verify-seller/${id}`, {status:"rejected"}));
  const makeSeller    = (id) => confirm_("Grant seller access?",    ()=>post(`${API_URL}/admin/set-account-type/${id}`, {accountType:"seller"}));
  const revokeSeller  = (id) => confirm_("Revoke seller access?",   ()=>post(`${API_URL}/admin/set-account-type/${id}`, {accountType:""}));
  const banUser       = (id) => confirm_("Ban and delete this user?",()=>del(`${API_URL}/admin/delete-user/${id}`));
  const setRole       = (id, role) => confirm_(`Set role to ${role}?`, ()=>post(`${API_URL}/admin/set-account-type/${id}`, {role}));
  const approveBuilder= (id) => confirm_("Approve builder?",        ()=>post(`${API_URL}/build/admin/builders/${id}/verify`, {status:"approved"}));
  const rejectBuilder = (id) => confirm_("Reject builder?",         ()=>post(`${API_URL}/build/admin/builders/${id}/verify`, {status:"rejected"}));
  const approveBid    = (id) => confirm_("Approve bid listing?",    ()=>post(`${API_URL}/bid-listings/${id}/approve`));
  const rejectBid     = (id) => confirm_("Reject bid listing?",     ()=>post(`${API_URL}/bid-listings/${id}/reject`));
  const cancelBid     = (id) => confirm_("Cancel this active auction?", ()=>post(`${API_URL}/bid-listings/${id}/cancel`));
  const deleteBid     = (id) => confirm_("Permanently delete this auction?", ()=>del(`${API_URL}/bid-listings/${id}`));
  const revokeLand    = (id) => confirm_("Revoke (unpublish) this listing?", ()=>post(`${API_URL}/admin/verify-land/${id}`, {status:"rejected"}));
  const deleteRentalPartner = (id) => confirm_("Delete this rental partner post?", ()=>del(`${API_URL}/admin/rental-partner/${id}`));
  const deleteBuyerPost     = (id) => confirm_("Delete this buyer post?",          ()=>del(`${API_URL}/admin/buyer-post/${id}`));
  const deleteForumPost     = (id) => confirm_("Delete this forum post?",          ()=>del(`${API_URL}/admin/buyer-post/${id}`));
  const deleteBuilder       = (id) => confirm_("Permanently delete this builder profile?", ()=>del(`${API_URL}/build/admin/builders/${id}`));
  const deleteBuildProject  = (id) => confirm_("Permanently delete this build project?", ()=>del(`${API_URL}/build/projects/${id}`));

  // Message any user directly from admin panel
  const msgUser = (targetUser) => {
    if (!targetUser?._id) return;
    if (chatRef?.current?.openWith) chatRef.current.openWith(targetUser);
  };

  const pendingSellers  = users.filter(u=>u.accountType==="seller_pending");
  const pendingBuilders = builders.filter(b=>b.verificationStatus==="pending");
  const pendingLands    = lands.filter(l=>l.status==="pending");
  const pendingBids     = bidListings;

  // Category splits (approved only)
  const houseLands = lands.filter(l=>l.status==="approved" && (l.mainCategory==="House" || /house|flat|apartment|bhk|villa|bungalow|duplex|studio/i.test(l.mainCategory||l.category||"")));
  const roomLands  = lands.filter(l=>l.status==="approved" && (l.mainCategory==="Room"  || /^room/i.test(l.mainCategory||l.category||"")));
  const landLands  = lands.filter(l=>l.status==="approved" && (l.mainCategory==="Land"  || /^land|khet|plot|agri/i.test(l.mainCategory||l.category||"")));
  const commLands  = lands.filter(l=>l.status==="approved" && (l.mainCategory==="Commercial" || /commercial|office|shop/i.test(l.mainCategory||l.category||"")));

  const stats = [
    { label:"Pending Lands",   value:pendingLands.length,    color:P.warn    },
    { label:"Seller Requests", value:pendingSellers.length,  color:P.teal    },
    { label:"Builder Reviews", value:pendingBuilders.length, color:P.olive   },
    { label:"Bid Approvals",   value:pendingBids.length,     color:"#7c3aed" },
    { label:"Active Auctions", value:activeBids.length,      color:P.danger  },
    { label:"Total Users",     value:users.length,           color:P.muted   },
  ];

  const titles = {
    pending:"Pending Lands", sellers:"Seller Requests", builders:"Builder Verification",
    buildprojects:"Build Projects", biddings:"Bid Listing Approvals",
    active_bids:"Active Auctions", houses:"Houses & Flats",
    rooms:"Rooms", lands_tab:"Land Listings", commercial:"Commercial",
    rental_partners:"Rental Partner Posts", buyer_posts:"Buyer Section Posts",
    forum_posts:"Buyers Forum Posts", users:"Manage Users",
  };

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:P.bg,
      fontFamily:P.sans, color:P.olive, colorScheme:"light" }}>

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside style={{ width:240, flexShrink:0, background:P.sidebar,
        padding:"32px 12px 24px", display:"flex", flexDirection:"column", gap:2,
        position:"sticky", top:0, height:"100vh", overflowY:"auto" }}>

        <div style={{ padding:"0 8px 24px" }}>
          <div style={{ fontSize:"0.55rem", fontWeight:700, letterSpacing:"0.22em",
            textTransform:"uppercase", color:"rgba(242,239,234,0.28)", marginBottom:6, fontFamily:P.sans }}>
            ProperEstate
          </div>
          <div style={{ fontSize:"1.3rem", fontWeight:400, color:"#F2EFEA",
            fontFamily:P.serif, fontStyle:"italic", lineHeight:1.2 }}>
            Admin Panel
          </div>
        </div>

        {NAV.map(n => {
          const badge = n.id==="sellers"?pendingSellers.length:n.id==="builders"?pendingBuilders.length:n.id==="pending"?pendingLands.length:n.id==="biddings"?pendingBids.length:n.id==="active_bids"?activeBids.length:0;
          const active = view===n.id;
          return (
            <button key={n.id} onClick={()=>setView(n.id)} style={{
              display:"flex", alignItems:"center", gap:9,
              padding:"10px 12px", borderRadius:12, border:"none", cursor:"pointer",
              background: active ? "rgba(85,115,115,0.32)" : "transparent",
              color: active ? "#F2EFEA" : "rgba(242,239,234,0.55)",
              fontSize:"0.83rem", fontWeight: active ? 600 : 400,
              textAlign:"left", transition:"all 0.15s ease",
              borderLeft: active ? `3px solid ${P.teal}` : "3px solid transparent",
              fontFamily:P.sans,
            }}
              onMouseEnter={e=>{ if(!active){e.currentTarget.style.background="rgba(242,239,234,0.08)";e.currentTarget.style.color="rgba(242,239,234,0.88)";}}}
              onMouseLeave={e=>{ if(!active){e.currentTarget.style.background="transparent";e.currentTarget.style.color="rgba(242,239,234,0.55)";}}}
            >
              <span style={{ fontSize:"0.95rem", width:20, textAlign:"center", flexShrink:0 }}>{n.icon}</span>
              <span style={{ flex:1 }}>{n.label}</span>
              {badge>0 && (
                <span style={{ background:P.teal, color:"#fff", fontSize:"0.6rem", fontWeight:700,
                  padding:"2px 7px", borderRadius:99, minWidth:18, textAlign:"center" }}>{badge}</span>
              )}
            </button>
          );
        })}
      </aside>

      {/* ── Main ────────────────────────────────────────────────── */}
      <main style={{ flex:1, padding:"40px 36px", overflowY:"auto", background:P.bg, color:P.olive }}>

        {/* Header */}
        <div style={{ marginBottom:32 }}>
          <h1 style={{ fontSize:"1.9rem", fontWeight:400, color:P.olive, margin:"0 0 5px",
            fontFamily:P.serif, fontStyle:"italic", letterSpacing:"-0.01em" }}>
            {titles[view]}
          </h1>
          <p style={{ fontSize:"0.78rem", color:P.muted, margin:0, fontFamily:P.sans }}>
            {new Date().toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}
          </p>
        </div>

        {/* Stats — overview only */}
        {view==="pending" && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:12, marginBottom:32 }}>
            {stats.map(s=>(
              <div key={s.label} style={{ background:P.surface, borderRadius:16, padding:"18px 20px",
                boxShadow:"0 1px 3px rgba(39,36,1,0.05),0 4px 18px rgba(39,36,1,0.07)" }}>
                <div style={{ fontSize:"1.8rem", fontWeight:700, color:s.color, lineHeight:1, fontFamily:P.sans }}>{s.value}</div>
                <div style={{ fontSize:"0.72rem", color:P.muted, marginTop:6, fontWeight:500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Pending Lands ─────────────────────────────────────── */}
        {view==="pending" && (
          pendingLands.length===0
            ? <Empty icon="✅" text="No pending land verifications" />
            : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:18 }}>
                {pendingLands.map(l=><LandAdminCard key={l._id} land={l} onApprove={approveLand} onReject={rejectLand} onDelete={deleteLand} onMessage={msgUser} />)}
              </div>
        )}

        {/* ── Seller Requests ───────────────────────────────────── */}
        {view==="sellers" && (
          pendingSellers.length===0
            ? <Empty icon="🪪" text="No pending seller requests" />
            : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:16 }}>
                {pendingSellers.map(u=><SellerCard key={u._id} u={u} onApprove={approveSeller} onReject={rejectSeller} />)}
              </div>
        )}

        {/* ── Builder Verification ──────────────────────────────── */}
        {view==="builders" && (
          builders.length===0
            ? <Empty icon="🏗️" text="No builder applications yet" />
            : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:16 }}>
                {builders.map(b=><BuilderAdminCard key={b._id} b={b} onApprove={approveBuilder} onReject={rejectBuilder} onDelete={deleteBuilder} onMessage={msgUser} />)}
              </div>
        )}

        {/* ── Build Projects ────────────────────────────────────── */}
        {view==="buildprojects" && (
          buildProjects.length===0
            ? <Empty icon="📋" text="No build projects posted yet" />
            : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:16 }}>
                {buildProjects.map(p=><ProjectAdminCard key={p._id} p={p} onDelete={deleteBuildProject} onMessage={msgUser} />)}
              </div>
        )}

        {/* ── Bid Listing Approvals ─────────────────────────────── */}
        {view==="biddings" && (
          pendingBids.length===0
            ? <Empty icon="🔨" text="No pending bid listing approvals" />
            : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:18 }}>
                {pendingBids.map(b=><BidAdminCard key={b._id} b={b} onApprove={approveBid} onReject={rejectBid} />)}
              </div>
        )}

        {/* ── Active Auctions ───────────────────────────────────── */}
        {view==="active_bids" && (
          activeBids.length===0
            ? <Empty icon="🔴" text="No active auctions right now" />
            : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:18 }}>
                {activeBids.map(b=>{
                  const img = b.image?(b.image.startsWith("http")?b.image:`${API_URL}/uploads/${b.image}`):"https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400";
                  const now = Date.now();
                  const end = new Date(b.auctionEnd);
                  const diff = end - now;
                  const timeLeft = diff<=0?"Ended":diff<3600000?`${Math.floor(diff/60000)}m left`:diff<86400000?`${Math.floor(diff/3600000)}h left`:`${Math.floor(diff/86400000)}d left`;
                  return (
                    <div key={b._id} style={{ background:P.surface, borderRadius:18, overflow:"hidden",
                      boxShadow:"0 2px 8px rgba(39,36,1,0.06),0 6px 28px rgba(39,36,1,0.08)", fontFamily:P.sans }}>
                      <div style={{ position:"relative", height:140, overflow:"hidden", background:"#e8e4de" }}>
                        <img src={img} alt={b.title} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
                        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(39,36,1,0.6) 0%, transparent 50%)" }} />
                        <div style={{ position:"absolute", top:10, left:10 }}>
                          <Badge c={P.success} bg={P.successBg}>🔴 Live</Badge>
                        </div>
                        <div style={{ position:"absolute", top:10, right:10 }}>
                          <Badge c={diff<3600000?P.danger:P.warn}>{timeLeft}</Badge>
                        </div>
                        <p style={{ position:"absolute", bottom:10, left:12, right:12, margin:0,
                          fontSize:"0.88rem", fontWeight:700, color:"#F2EFEA", fontFamily:P.serif, fontStyle:"italic",
                          textShadow:"0 1px 4px rgba(0,0,0,0.5)", lineHeight:1.3 }}>{b.title}</p>
                      </div>
                      <div style={{ padding:"14px 16px 16px" }}>
                        <InfoRow label="Current Bid" value={`Rs. ${parseInt(b.currentBid||b.startingPrice||0).toLocaleString()}`} />
                        <InfoRow label="Bids" value={`${b.bids?.length||0} bids placed`} />
                        <InfoRow label="Winner" value={b.currentBidderName||"No bids yet"} />
                        <InfoRow label="Seller" value={b.sellerName} />
                        <InfoRow label="Ends" value={end.toLocaleString()} />
                        <Divider />
                        <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
                          <Btn sm warn onClick={()=>cancelBid(b._id)}>⏹ End Auction</Btn>
                          <Btn sm danger onClick={()=>deleteBid(b._id)}>🗑 Delete</Btn>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
        )}

        {/* ── Houses & Flats ────────────────────────────────────── */}
        {view==="houses" && (
          houseLands.length===0
            ? <Empty icon="🏠" text="No house or flat listings" />
            : <>
                <p style={{ fontSize:"0.82rem", color:P.muted, marginBottom:16, fontFamily:P.sans }}>
                  {houseLands.length} approved listing{houseLands.length!==1?"s":""}
                </p>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:18 }}>
                  {houseLands.map(l=><LandAdminCard key={l._id} land={l} onApprove={approveLand} onReject={revokeLand} onDelete={deleteLand} onMessage={msgUser} />)}
                </div>
              </>
        )}

        {/* ── Rooms ─────────────────────────────────────────────── */}
        {view==="rooms" && (
          roomLands.length===0
            ? <Empty icon="🚪" text="No room listings" />
            : <>
                <p style={{ fontSize:"0.82rem", color:P.muted, marginBottom:16, fontFamily:P.sans }}>
                  {roomLands.length} approved listing{roomLands.length!==1?"s":""}
                </p>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:18 }}>
                  {roomLands.map(l=><LandAdminCard key={l._id} land={l} onApprove={approveLand} onReject={revokeLand} onDelete={deleteLand} onMessage={msgUser} />)}
                </div>
              </>
        )}

        {/* ── Land Listings ─────────────────────────────────────── */}
        {view==="lands_tab" && (
          landLands.length===0
            ? <Empty icon="🌿" text="No land listings" />
            : <>
                <p style={{ fontSize:"0.82rem", color:P.muted, marginBottom:16, fontFamily:P.sans }}>
                  {landLands.length} approved listing{landLands.length!==1?"s":""}
                </p>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:18 }}>
                  {landLands.map(l=><LandAdminCard key={l._id} land={l} onApprove={approveLand} onReject={revokeLand} onDelete={deleteLand} onMessage={msgUser} />)}
                </div>
              </>
        )}

        {/* ── Commercial ────────────────────────────────────────── */}
        {view==="commercial" && (
          commLands.length===0
            ? <Empty icon="🏢" text="No commercial listings" />
            : <>
                <p style={{ fontSize:"0.82rem", color:P.muted, marginBottom:16, fontFamily:P.sans }}>
                  {commLands.length} approved listing{commLands.length!==1?"s":""}
                </p>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:18 }}>
                  {commLands.map(l=><LandAdminCard key={l._id} land={l} onApprove={approveLand} onReject={revokeLand} onDelete={deleteLand} onMessage={msgUser} />)}
                </div>
              </>
        )}

        {/* ── Rental Partners ───────────────────────────────────── */}
        {view==="rental_partners" && (
          rentalPartners.length===0
            ? <Empty icon="🤝" text="No rental partner posts" />
            : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:16 }}>
                {rentalPartners.map(p=>(
                  <div key={p._id} style={{ background:P.surface, borderRadius:18, padding:"18px 20px",
                    boxShadow:"0 2px 8px rgba(39,36,1,0.06),0 4px 20px rgba(39,36,1,0.07)", fontFamily:P.sans }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                      <div style={{ width:42, height:42, borderRadius:12, background:P.tealLight,
                        display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.2rem", flexShrink:0 }}>🤝</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:700, color:P.olive, fontSize:"0.95rem" }}>{p.name}</div>
                        <div style={{ fontSize:"0.75rem", color:P.muted }}>{p.email} · {p.phone}</div>
                      </div>
                      <Badge c={P.teal}>{p.propertyType}</Badge>
                    </div>
                    <InfoRow label="Location" value={p.location} />
                    <InfoRow label="Budget" value={p.budget ? `Rs. ${parseInt(p.budget).toLocaleString()}/mo` : null} />
                    <InfoRow label="Sub-cat" value={p.subCategory} />
                    {p.description && <p style={{ margin:"8px 0 0", fontSize:"0.78rem", color:P.muted, lineHeight:1.6 }}>{p.description.slice(0,120)}{p.description.length>120?"…":""}</p>}
                    <Divider />
                    <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
                      {p.userId && <Btn sm ghost onClick={()=>msgUser({ _id:p.userId, name:p.name })}>💬 Message</Btn>}
                      <Btn sm danger onClick={()=>deleteRentalPartner(p._id)}>🗑 Delete</Btn>
                    </div>
                  </div>
                ))}
              </div>
        )}

        {/* ── Buyer Posts ───────────────────────────────────────── */}
        {view==="buyer_posts" && (
          buyerPosts.length===0
            ? <Empty icon="📢" text="No buyer section posts" />
            : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:16 }}>
                {buyerPosts.map(p=>(
                  <div key={p._id} style={{ background:P.surface, borderRadius:18, padding:"18px 20px",
                    boxShadow:"0 2px 8px rgba(39,36,1,0.06),0 4px 20px rgba(39,36,1,0.07)", fontFamily:P.sans }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                      <div style={{ width:42, height:42, borderRadius:12, background:"rgba(154,108,26,0.1)",
                        display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.2rem", flexShrink:0 }}>📢</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:700, color:P.olive, fontSize:"0.92rem", lineHeight:1.3 }}>{p.title}</div>
                        <div style={{ fontSize:"0.75rem", color:P.muted }}>{p.userName}</div>
                      </div>
                      {p.propertyType && <Badge c={P.warn}>{p.propertyType}</Badge>}
                    </div>
                    <InfoRow label="Location" value={p.location} />
                    <InfoRow label="Budget" value={p.budget ? `Rs. ${parseInt(p.budget).toLocaleString()}/mo` : null} />
                    <InfoRow label="Phone" value={p.contactPhone} />
                    <InfoRow label="Likes" value={`${p.likes?.length||0} likes · ${p.comments?.length||0} comments`} />
                    {p.description && <p style={{ margin:"8px 0 0", fontSize:"0.78rem", color:P.muted, lineHeight:1.6 }}>{p.description.slice(0,120)}{p.description.length>120?"…":""}</p>}
                    <Divider />
                    <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
                      {p.userId && <Btn sm ghost onClick={()=>msgUser({ _id:p.userId, name:p.userName })}>💬 Message</Btn>}
                      <Btn sm danger onClick={()=>deleteBuyerPost(p._id)}>🗑 Delete</Btn>
                    </div>
                  </div>
                ))}
              </div>
        )}

        {/* ── Forum Posts ───────────────────────────────────────── */}
        {view==="forum_posts" && (
          forumPosts.length===0
            ? <Empty icon="💬" text="No forum posts" />
            : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:16 }}>
                {forumPosts.map(p=>(
                  <div key={p._id} style={{ background:P.surface, borderRadius:18, padding:"18px 20px",
                    boxShadow:"0 2px 8px rgba(39,36,1,0.06),0 4px 20px rgba(39,36,1,0.07)", fontFamily:P.sans }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                      <div style={{ width:42, height:42, borderRadius:12, background:"rgba(102,126,234,0.1)",
                        display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.2rem", flexShrink:0 }}>💬</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:700, color:P.olive, fontSize:"0.92rem", lineHeight:1.3 }}>{p.title}</div>
                        <div style={{ fontSize:"0.75rem", color:P.muted }}>{p.userName}</div>
                      </div>
                      {p.propertyType && <Badge c="#6366f1">{p.propertyType}</Badge>}
                    </div>
                    <InfoRow label="Location" value={p.location} />
                    <InfoRow label="Budget" value={p.budget ? `Rs. ${parseInt(p.budget).toLocaleString()}/mo` : null} />
                    <InfoRow label="Activity" value={`${p.likes?.length||0} likes · ${p.comments?.length||0} comments`} />
                    {p.description && <p style={{ margin:"8px 0 0", fontSize:"0.78rem", color:P.muted, lineHeight:1.6 }}>{p.description.slice(0,120)}{p.description.length>120?"…":""}</p>}
                    <Divider />
                    <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
                      {p.userId && <Btn sm ghost onClick={()=>msgUser({ _id:p.userId, name:p.userName })}>💬 Message</Btn>}
                      <Btn sm danger onClick={()=>deleteForumPost(p._id)}>🗑 Delete</Btn>
                    </div>
                  </div>
                ))}
              </div>
        )}

        {/* ── Users ─────────────────────────────────────────────── */}
        {view==="users" && (
          users.length===0
            ? <Empty icon="👥" text="No users found" />
            : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:16 }}>
                {users.map(u=><UserAdminCard key={u._id} u={u} onMakeSeller={makeSeller} onRevokeSeller={revokeSeller} onDelete={banUser} onSetRole={setRole} onMessage={msgUser} />)}
              </div>
        )}

      </main>
    </div>
  );
};

export default AdminDashboard;
