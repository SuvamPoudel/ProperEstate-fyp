import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { API_URL } from "../constants";
import EsewaPayment from "../components/EsewaPayment";
import "../BiddingPage.css";

const CATEGORIES = ["House","Land","Room","Commercial"];
const SORT_OPTIONS = [
  { value:"createdAt", label:"Newest First" },
  { value:"ending_soon", label:"Ending Soon" },
  { value:"highest_bid", label:"Highest Bid" },
  { value:"lowest_start", label:"Lowest Starting Price" },
];

// ── Countdown hook ────────────────────────────────────────────────
const useCountdown = (endDate) => {
  const [timeLeft, setTimeLeft] = useState("");
  const [urgent, setUrgent] = useState(false);
  useEffect(() => {
    const tick = () => {
      const diff = new Date(endDate) - Date.now();
      if (diff <= 0) { setTimeLeft("Ended"); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setUrgent(diff < 3600000); // < 1 hour
      if (d > 0) setTimeLeft(`${d}d ${h}h ${m}m`);
      else if (h > 0) setTimeLeft(`${h}h ${m}m ${s}s`);
      else setTimeLeft(`${m}m ${s}s`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [endDate]);
  return { timeLeft, urgent };
};

// ── Countdown display ─────────────────────────────────────────────
const Countdown = ({ endDate, startDate }) => {
  const now = Date.now();
  const start = new Date(startDate);
  const end = new Date(endDate);
  const { timeLeft, urgent } = useCountdown(now < start ? startDate : endDate);
  if (now < start) return (
    <span className="bp-countdown">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      Starts {new Date(startDate).toLocaleDateString()}
    </span>
  );
  if (now > end) return <span className="bp-countdown">Auction ended</span>;
  return (
    <span className={`bp-countdown${urgent?" urgent":""}`}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      {timeLeft} left
    </span>
  );
};

// ── Bid Card ──────────────────────────────────────────────────────
const BidCard = ({ listing, onClick }) => {
  const img = listing.image
    ? (listing.image.startsWith("http") ? listing.image : `${API_URL}/uploads/${listing.image}`)
    : "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600";
  const statusLabel = { active:"Live", ended:"Ended", sold:"Sold", pending:"Pending" }[listing.status] || listing.status;
  return (
    <div className="bp-card" onClick={() => onClick(listing)}>
      <div className="bp-card-img-wrap">
        <img src={img} alt={listing.title} className="bp-card-img" />
      </div>
      <div className="bp-card-body">
        <div className="bp-card-status-row">
          <span className={`bp-status-badge ${listing.status}`}>{statusLabel}</span>
          <span style={{fontSize:"0.7rem",color:"#a0aeae",fontFamily:"'DM Sans',sans-serif"}}>{listing.bids?.length||0} bid{listing.bids?.length!==1?"s":""}</span>
        </div>
        <h3 className="bp-card-title">{listing.title}</h3>
        <p className="bp-card-loc">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          {[listing.city, listing.district].filter(Boolean).join(", ") || listing.location || "Nepal"}
        </p>
        <div className="bp-card-bids">
          <div className="bp-bid-stat">
            <span className="bp-bid-stat-label">Starting</span>
            <span className="bp-bid-stat-val">Rs. {parseInt(listing.startingPrice||0).toLocaleString()}</span>
          </div>
          <div className="bp-bid-stat">
            <span className="bp-bid-stat-label">Current Bid</span>
            <span className="bp-bid-stat-val highlight">Rs. {parseInt(listing.currentBid||listing.startingPrice||0).toLocaleString()}</span>
          </div>
        </div>
        <Countdown endDate={listing.auctionEnd} startDate={listing.auctionStart} />
      </div>
    </div>
  );
};

// ── Detail Modal ──────────────────────────────────────────────────
const DetailModal = ({ listing: initialListing, user, onClose }) => {
  const [listing, setListing] = useState(initialListing);
  const [bidAmount, setBidAmount] = useState("");
  const [bidding, setBidding] = useState(false);
  const [bidMsg, setBidMsg] = useState(null);
  const socketRef = useRef(null);
  const { timeLeft, urgent } = useCountdown(listing.auctionEnd);

  const now = Date.now();
  const isLive = listing.status === "active" && now >= new Date(listing.auctionStart) && now <= new Date(listing.auctionEnd);
  const minBid = (listing.currentBid || listing.startingPrice) + (listing.minIncrement || 1000);
  const img = listing.image
    ? (listing.image.startsWith("http") ? listing.image : `${API_URL}/uploads/${listing.image}`)
    : "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800";

  // Socket.io live updates
  useEffect(() => {
    if (!isLive) return;
    const socket = io(API_URL.replace("/api","").replace(":5000","").includes("localhost") ? "http://localhost:5000" : API_URL);
    socketRef.current = socket;
    socket.emit("join_bid", listing._id);
    socket.on("new_bid", (data) => {
      if (data.listingId === listing._id) {
        setListing(prev => ({
          ...prev,
          currentBid: data.amount,
          currentBidderName: data.bidderName,
          bids: [...(prev.bids||[]), { bidderName: data.bidderName, amount: data.amount, createdAt: data.timestamp }],
        }));
      }
    });
    return () => { socket.emit("leave_bid", listing._id); socket.disconnect(); };
  }, [listing._id, isLive]); // eslint-disable-line

  const handleBid = async () => {
    if (!user) { setBidMsg({ type:"error", text:"Please log in to place a bid." }); return; }
    const amt = parseInt(bidAmount);
    if (!amt || amt < minBid) { setBidMsg({ type:"error", text:`Minimum bid is Rs. ${minBid.toLocaleString()}` }); return; }
    setBidding(true); setBidMsg(null);
    try {
      const res = await fetch(`${API_URL}/bid-listings/${listing._id}/bid`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ bidderId: user._id, bidderName: user.name, amount: amt }),
      });
      const data = await res.json();
      if (data.success) {
        setBidMsg({ type:"success", text:`🎉 Bid of Rs. ${amt.toLocaleString()} placed!` });
        setBidAmount("");
        setListing(prev => ({ ...prev, currentBid: data.currentBid }));
      } else {
        setBidMsg({ type:"error", text: data.error || "Bid failed." });
      }
    } catch { setBidMsg({ type:"error", text:"Network error. Please try again." }); }
    setBidding(false);
  };

  const sortedBids = [...(listing.bids||[])].sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt));

  return (
    <div className="bp-modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="bp-modal">
        <button className="bp-modal-close" onClick={onClose}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <img src={img} alt={listing.title} className="bp-detail-img" />
        <div className="bp-detail-body">
          <div className="bp-detail-header">
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
              <span className={`bp-status-badge ${listing.status}`}>{listing.status==="active"?"Live Auction":listing.status}</span>
              {isLive && <span className={`bp-countdown${urgent?" urgent":""}`}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>{timeLeft} left</span>}
            </div>
            <h2 className="bp-detail-title">{listing.title}</h2>
            <p className="bp-detail-loc"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>{[listing.city,listing.district,listing.province].filter(Boolean).join(", ")||listing.location||"Nepal"}</p>
          </div>
          <div className="bp-detail-stats">
            <div className="bp-detail-stat"><span className="bp-detail-stat-label">Starting Price</span><span className="bp-detail-stat-val">Rs. {parseInt(listing.startingPrice||0).toLocaleString()}</span></div>
            <div className="bp-detail-stat"><span className="bp-detail-stat-label">Current Bid</span><span className="bp-detail-stat-val teal">Rs. {parseInt(listing.currentBid||listing.startingPrice||0).toLocaleString()}</span></div>
            <div className="bp-detail-stat"><span className="bp-detail-stat-label">Total Bids</span><span className="bp-detail-stat-val">{listing.bids?.length||0}</span></div>
          </div>
          {listing.description && <p className="bp-detail-desc">{listing.description}</p>}
          {listing.areaSize && <p style={{fontSize:"0.82rem",color:"#6b7a7a",marginBottom:16}}>📐 Area: {listing.areaSize} &nbsp;·&nbsp; 🏷️ {listing.subCategory||listing.mainCategory}</p>}

          {/* Google MyMaps embed */}
          {listing.mapUrl && (
            <div style={{marginBottom:18}}>
              <p style={{fontSize:"0.62rem",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.12em",color:"#557373",marginBottom:8}}>📍 Location on Map</p>
              <div style={{borderRadius:14,overflow:"hidden",border:"1.5px solid rgba(85,115,115,0.15)",boxShadow:"0 2px 8px rgba(39,36,1,0.07)"}}>
                <iframe
                  title="Property Location"
                  width="100%"
                  height="240"
                  style={{border:0,display:"block"}}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={(() => {
                    const url = listing.mapUrl.trim();
                    // Google MyMaps share link: https://www.google.com/maps/d/u/0/viewer?mid=...
                    if (url.includes("google.com/maps/d/")) {
                      return url
                        .replace("/edit", "/embed")
                        .replace("/viewer", "/embed")
                        .replace("/u/0/viewer", "/embed")
                        .replace("/u/1/viewer", "/embed");
                    }
                    // Already an embed URL
                    if (url.includes("output=embed")) return url;
                    // Standard google maps URL
                    if (url.startsWith("https://maps.google.com") || url.startsWith("https://www.google.com/maps")) {
                      return url + (url.includes("?") ? "&output=embed" : "?output=embed");
                    }
                    // Coordinates or place name — build embed
                    return `https://maps.google.com/maps?q=${encodeURIComponent(url)}&output=embed&z=15`;
                  })()}
                />
              </div>
              <p style={{fontSize:"0.68rem",color:"#a0aeae",marginTop:5,lineHeight:1.5}}>
                💡 For precise property boundaries, use <strong style={{color:"#557373"}}>Google MyMaps</strong> — create a custom map at mymaps.google.com and paste the share link when listing.
              </p>
            </div>
          )}

          {/* Live bidding */}
          {isLive && (
            <div className="bp-live-section">
              <div className="bp-live-header">
                <span className="bp-live-title"><span className="bp-live-dot"/>Live Bidding</span>
                <span style={{fontSize:"0.72rem",color:"#6b7a7a"}}>Min increment: Rs. {(listing.minIncrement||1000).toLocaleString()}</span>
              </div>
              <p className="bp-bid-hint">Current highest: <strong>Rs. {parseInt(listing.currentBid||listing.startingPrice||0).toLocaleString()}</strong> · Next min bid: <strong>Rs. {minBid.toLocaleString()}</strong></p>
              {user && user._id !== listing.sellerId?.toString() && user._id !== listing.sellerId ? (
                <>
                  <div className="bp-bid-input-row">
                    <input className="bp-bid-input" type="number" value={bidAmount} onChange={e=>setBidAmount(e.target.value)} placeholder={`Rs. ${minBid.toLocaleString()} or more`} onKeyDown={e=>e.key==="Enter"&&handleBid()} />
                    <button className="bp-bid-submit" onClick={handleBid} disabled={bidding}>{bidding?"Placing…":"Place Bid"}</button>
                  </div>
                  {bidMsg && <p style={{fontSize:"0.8rem",color:bidMsg.type==="success"?"#2e7d5e":"#c0392b",margin:"0 0 10px",fontWeight:600}}>{bidMsg.text}</p>}
                </>
              ) : !user ? (
                <p style={{fontSize:"0.82rem",color:"#6b7a7a"}}>Please <strong>log in</strong> to place a bid.</p>
              ) : (
                <p style={{fontSize:"0.82rem",color:"#6b7a7a"}}>You cannot bid on your own listing.</p>
              )}
              {sortedBids.length > 0 && (
                <div className="bp-bid-history">
                  {sortedBids.slice(0,10).map((b,i) => (
                    <div key={i} className={`bp-bid-item${i===0?" top":""}`}>
                      <div><span className="bp-bid-item-name">{b.bidderName}</span><br/><span className="bp-bid-item-time">{new Date(b.createdAt).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</span></div>
                      <span className="bp-bid-item-amount">Rs. {parseInt(b.amount).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {listing.status==="ended" && listing.currentBidder && (
            <div style={{background:"rgba(85,115,115,0.08)",borderRadius:14,padding:"14px 16px",marginBottom:16}}>
              <p style={{margin:0,fontSize:"0.88rem",color:"#272401",fontWeight:600}}>🏆 Auction ended — Won by <strong>{listing.currentBidderName}</strong> at <strong>Rs. {parseInt(listing.currentBid).toLocaleString()}</strong></p>
            </div>
          )}

          <div style={{fontSize:"0.78rem",color:"#a0aeae",borderTop:"1px solid rgba(85,115,115,0.1)",paddingTop:12,marginTop:4}}>
            Listed by <strong style={{color:"#272401"}}>{listing.sellerName}</strong> · {listing.sellerPhone} · {listing.sellerEmail}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Post Form ─────────────────────────────────────────────────────
const PostForm = ({ user, onSuccess, onCancel }) => {
  const [form, setForm] = useState({
    title:"", description:"", location:"", province:"", district:"", city:"", mapUrl:"",
    areaSize:"", mainCategory:"", subCategory:"",
    startingPrice:"", reservePrice:"", minIncrement:"1000",
    auctionStart:"", auctionEnd:"",
  });
  const [errors, setErrors] = useState({});
  const [showPayment, setShowPayment] = useState(false);
  const [mediaFiles, setMediaFiles] = useState([]);
  const fileRef = useRef();

  const set = (k,v) => setForm(p=>({...p,[k]:v}));

  const validate = () => {
    const e = {};
    if (!form.title.trim())         e.title = "Required";
    if (!form.location.trim())      e.location = "Required";
    if (!form.mainCategory)         e.mainCategory = "Required";
    if (!form.startingPrice || isNaN(parseInt(form.startingPrice))) e.startingPrice = "Valid amount required";
    if (!form.auctionStart)         e.auctionStart = "Required";
    if (!form.auctionEnd)           e.auctionEnd = "Required";
    if (form.auctionStart && form.auctionEnd && new Date(form.auctionEnd) <= new Date(form.auctionStart)) e.auctionEnd = "End must be after start";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => { e.preventDefault(); if (validate()) setShowPayment(true); };

  const handlePaymentSuccess = async () => {
    setShowPayment(false);
    const fd = new FormData();
    Object.entries(form).forEach(([k,v]) => { if (v) fd.append(k, v); });
    fd.append("sellerId", user._id);
    mediaFiles.forEach(f => fd.append("media", f));
    try {
      const res = await fetch(`${API_URL}/bid-listings`, { method:"POST", body:fd });
      const data = await res.json();
      if (data.success) onSuccess();
      else alert("Error: " + (data.error || "Unknown error"));
    } catch { alert("Network error. Please try again."); }
  };

  return (
    <>
      {showPayment && <EsewaPayment amount={500} description="Bid Listing Fee — ProperEstate" onSuccess={handlePaymentSuccess} onCancel={()=>setShowPayment(false)} />}
      <div className="bp-form-wrap">
        <div className="bp-form-header">
          <h3>List Your Property for Auction</h3>
          <p>Fill in the details below. A listing fee of <strong>Rs. 500</strong> will be charged via eSewa. Your listing will go live after admin approval.</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="bp-section">
            <h4>Property Details</h4>
            <div className="bp-grid-2">
              <div className="bp-field full"><label>Title *</label><input value={form.title} onChange={e=>set("title",e.target.value)} placeholder="e.g. 4 Aana Land in Naxal, Kathmandu"/>{errors.title&&<span className="bp-error">{errors.title}</span>}</div>
              <div className="bp-field"><label>Category *</label><select value={form.mainCategory} onChange={e=>set("mainCategory",e.target.value)}><option value="">Select…</option>{CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</select>{errors.mainCategory&&<span className="bp-error">{errors.mainCategory}</span>}</div>
              <div className="bp-field"><label>Sub-Category</label><input value={form.subCategory} onChange={e=>set("subCategory",e.target.value)} placeholder="e.g. Residential Land"/></div>
              <div className="bp-field"><label>Area Size</label><input value={form.areaSize} onChange={e=>set("areaSize",e.target.value)} placeholder="e.g. 4 aana, 850 sqft"/></div>
              <div className="bp-field full"><label>Location / Address *</label><input value={form.location} onChange={e=>set("location",e.target.value)} placeholder="Full address"/>{errors.location&&<span className="bp-error">{errors.location}</span>}</div>
              <div className="bp-field"><label>Province</label><input value={form.province} onChange={e=>set("province",e.target.value)} placeholder="e.g. Bagmati"/></div>
              <div className="bp-field"><label>District</label><input value={form.district} onChange={e=>set("district",e.target.value)} placeholder="e.g. Kathmandu"/></div>
              <div className="bp-field"><label>City</label><input value={form.city} onChange={e=>set("city",e.target.value)} placeholder="e.g. Naxal"/></div>
              <div className="bp-field"><label>Google MyMaps Link</label><input value={form.mapUrl} onChange={e=>set("mapUrl",e.target.value)} placeholder="Paste your Google MyMaps share link here"/><span style={{fontSize:"0.68rem",color:"#a0aeae",marginTop:2}}>💡 Go to <strong>mymaps.google.com</strong> → create a map → Share → copy the link</span></div>
              <div className="bp-field full"><label>Description</label><textarea value={form.description} onChange={e=>set("description",e.target.value)} rows={3} placeholder="Describe the property…"/></div>
              <div className="bp-field full">
                <label>Photos</label>
                <input type="file" ref={fileRef} accept="image/*" multiple style={{display:"none"}} onChange={e=>setMediaFiles(Array.from(e.target.files))}/>
                <button type="button" onClick={()=>fileRef.current?.click()} style={{height:40,padding:"0 16px",background:"#F2EFEA",border:"1.5px solid rgba(85,115,115,0.2)",borderRadius:10,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"0.85rem",color:"#557373",fontWeight:600,display:"flex",alignItems:"center",gap:7,width:"fit-content"}}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  {mediaFiles.length > 0 ? `${mediaFiles.length} photo(s) selected` : "Attach Photos"}
                </button>
              </div>
            </div>
          </div>

          <div className="bp-section">
            <h4>Auction Settings</h4>
            <div className="bp-grid-2">
              <div className="bp-field"><label>Starting Price (Rs.) *</label><input type="number" value={form.startingPrice} onChange={e=>set("startingPrice",e.target.value)} placeholder="e.g. 5000000"/>{errors.startingPrice&&<span className="bp-error">{errors.startingPrice}</span>}</div>
              <div className="bp-field"><label>Reserve Price (Rs.) <span style={{fontWeight:400,color:"#a0aeae",fontSize:"0.8rem"}}>(optional)</span></label><input type="number" value={form.reservePrice} onChange={e=>set("reservePrice",e.target.value)} placeholder="Minimum to sell"/></div>
              <div className="bp-field"><label>Min Bid Increment (Rs.)</label><input type="number" value={form.minIncrement} onChange={e=>set("minIncrement",e.target.value)} placeholder="1000"/></div>
              <div className="bp-field"><label>Auction Start *</label><input type="datetime-local" value={form.auctionStart} onChange={e=>set("auctionStart",e.target.value)}/>{errors.auctionStart&&<span className="bp-error">{errors.auctionStart}</span>}</div>
              <div className="bp-field"><label>Auction End *</label><input type="datetime-local" value={form.auctionEnd} onChange={e=>set("auctionEnd",e.target.value)}/>{errors.auctionEnd&&<span className="bp-error">{errors.auctionEnd}</span>}</div>
            </div>
          </div>

          <div className="bp-submit-area">
            <p className="bp-fee-note">💳 A listing fee of <strong>Rs. 500</strong> will be charged via eSewa. Your listing will be reviewed by admin before going live.</p>
            <button type="submit" className="bp-submit-btn">List for Auction — Pay Rs. 500</button>
            <button type="button" onClick={onCancel} style={{display:"block",margin:"12px auto 0",background:"none",border:"none",color:"#6b7a7a",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"0.82rem"}}>Cancel</button>
          </div>
        </form>
      </div>
    </>
  );
};

// ── History View ──────────────────────────────────────────────────
const HistoryView = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/bid-listings?status=sold`)
      .then(r=>r.json())
      .then(d=>{ if(d.success) setHistory(d.listings); })
      .catch(()=>{})
      .finally(()=>setLoading(false));
  }, []);

  if (loading) return <div className="bp-grid"><div className="bp-empty"><div className="bp-spinner"/><p>Loading history…</p></div></div>;
  if (history.length === 0) return (
    <div className="bp-grid">
      <div className="bp-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <h3>No completed auctions yet</h3>
        <p>Completed auctions will appear here once bidding closes.</p>
      </div>
    </div>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {history.map(l => {
        const img = l.image ? (l.image.startsWith("http") ? l.image : `${API_URL}/uploads/${l.image}`) : "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400";
        const sortedBids = [...(l.bids||[])].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
        return (
          <div key={l._id} style={{background:"#fff",borderRadius:20,overflow:"hidden",boxShadow:"0 2px 8px rgba(39,36,1,0.05),0 6px 28px rgba(39,36,1,0.08)",display:"flex",gap:0}}>
            <img src={img} alt={l.title} style={{width:160,objectFit:"cover",flexShrink:0,background:"#e8e4de"}} />
            <div style={{padding:"18px 22px",flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                <span className="bp-status-badge sold">🏆 Sold</span>
                <span style={{fontSize:"0.72rem",color:"#a0aeae"}}>{new Date(l.auctionEnd).toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"})}</span>
              </div>
              <h3 style={{fontFamily:"'DM Serif Display',Georgia,serif",fontSize:"1.05rem",fontWeight:400,color:"#272401",margin:"0 0 4px",lineHeight:1.3}}>{l.title}</h3>
              <p style={{fontSize:"0.78rem",color:"#6b7a7a",margin:"0 0 12px",display:"flex",alignItems:"center",gap:4}}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {[l.city,l.district].filter(Boolean).join(", ")||l.location||"Nepal"}
              </p>
              <div style={{display:"flex",gap:20,marginBottom:12,flexWrap:"wrap"}}>
                <div><span style={{fontSize:"0.6rem",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",color:"#a0aeae",display:"block",marginBottom:2}}>Starting Price</span><span style={{fontFamily:"'DM Serif Display',Georgia,serif",fontSize:"0.95rem",color:"#272401"}}>Rs. {parseInt(l.startingPrice||0).toLocaleString()}</span></div>
                <div><span style={{fontSize:"0.6rem",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",color:"#a0aeae",display:"block",marginBottom:2}}>Final Sale Price</span><span style={{fontFamily:"'DM Serif Display',Georgia,serif",fontSize:"0.95rem",color:"#557373",fontWeight:400}}>Rs. {parseInt(l.currentBid||0).toLocaleString()}</span></div>
                <div><span style={{fontSize:"0.6rem",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",color:"#a0aeae",display:"block",marginBottom:2}}>Winner</span><span style={{fontSize:"0.88rem",color:"#272401",fontWeight:600}}>{l.currentBidderName||"—"}</span></div>
                <div><span style={{fontSize:"0.6rem",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",color:"#a0aeae",display:"block",marginBottom:2}}>Total Bids</span><span style={{fontSize:"0.88rem",color:"#272401",fontWeight:600}}>{l.bids?.length||0}</span></div>
              </div>
              {sortedBids.length > 0 && (
                <div style={{borderTop:"1px solid rgba(85,115,115,0.1)",paddingTop:10}}>
                  <p style={{fontSize:"0.62rem",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",color:"#a0aeae",margin:"0 0 7px"}}>Bid History</p>
                  <div style={{display:"flex",flexDirection:"column",gap:4}}>
                    {sortedBids.slice(0,5).map((b,i)=>(
                      <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderBottom:"1px solid rgba(85,115,115,0.06)"}}>
                        <span style={{fontSize:"0.8rem",color:"#272401",fontWeight:i===0?700:400}}>{i===0?"🏆 ":""}{b.bidderName}</span>
                        <span style={{fontSize:"0.8rem",color:i===0?"#557373":"#6b7a7a",fontWeight:i===0?700:400}}>Rs. {parseInt(b.amount).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────
const BiddingPage = ({ user }) => {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [view, setView]         = useState("browse"); // "browse" | "post" | "history"
  const [selected, setSelected] = useState(null);
  const [search, setSearch]     = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort]         = useState("createdAt");
  const [postSuccess, setPostSuccess] = useState(false);

  const isSeller = user && (user.accountType === "seller" || user.role === "admin");

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      if (sort)     params.set("sort", sort);
      if (search)   params.set("search", search);
      const res  = await fetch(`${API_URL}/bid-listings?${params}`);
      const data = await res.json();
      if (data.success) setListings(data.listings);
    } catch {}
    setLoading(false);
  }, [category, sort, search]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const liveCount = listings.filter(l => l.status === "active").length;

  return (
    <div className="bp-page">
      {selected && <DetailModal listing={selected} user={user} onClose={() => setSelected(null)} />}

      {/* Hero */}
      <div className="bp-hero">
        <div className="bp-hero-inner">
          <h1>Property Auctions</h1>
          <p>Buy and sell real estate through transparent live bidding. No brokers, no hidden fees — just fair market price.</p>
          <div className="bp-hero-stats">
            <span><strong>{listings.length}</strong> listings</span>
            <span className="bp-hero-dot">·</span>
            <span><strong>{liveCount}</strong> live now</span>
            <span className="bp-hero-dot">·</span>
            <span>Rs. 500 to list</span>
          </div>
        </div>
      </div>

      <div className="bp-body">
        {/* Back button */}
        <button className="bp-back-btn" onClick={() => view !== "browse" ? setView("browse") : navigate(-1)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          {view === "post" ? "Back to Auctions" : view === "history" ? "Back to Auctions" : "Back"}
        </button>
        {view === "post" ? (
          isSeller ? (
            postSuccess ? (
              <div className="bp-seller-gate">
                <h3>🎉 Listing Submitted!</h3>
                <p>Your auction listing is pending admin approval. You'll be notified once it goes live.</p>
                <button className="bp-seller-gate-btn" onClick={() => { setView("browse"); setPostSuccess(false); fetchListings(); }}>Browse Auctions</button>
              </div>
            ) : (
              <PostForm user={user} onSuccess={() => setPostSuccess(true)} onCancel={() => setView("browse")} />
            )
          ) : (
            <div className="bp-seller-gate">
              <h3>Seller Account Required</h3>
              <p>You need a verified Seller account to list a property for auction. Go to your Profile to apply for a Seller account.</p>
              <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
                <button className="bp-seller-gate-btn" onClick={() => navigate("/profile")}>Go to Profile</button>
                <button onClick={() => setView("browse")} style={{padding:"11px 22px",borderRadius:99,background:"transparent",border:"1.5px solid rgba(85,115,115,0.3)",color:"#557373",fontFamily:"'DM Sans',sans-serif",fontSize:"0.88rem",fontWeight:600,cursor:"pointer"}}>Browse Auctions</button>
              </div>
            </div>
          )
        ) : (
        <>
            {/* Tab bar */}
            <div style={{display:"flex",gap:0,borderBottom:"1px solid rgba(85,115,115,0.15)",marginBottom:24}}>
              {[{key:"browse",label:"Live Auctions"},{key:"history",label:"Bidding History"}].map(t=>(
                <button key={t.key} onClick={()=>setView(t.key)} style={{
                  height:44,padding:"0 22px",background:"transparent",border:"none",
                  borderBottom:`2px solid ${view===t.key?"#557373":"transparent"}`,
                  color:view===t.key?"#557373":"#6b7a7a",
                  fontFamily:"'DM Sans',sans-serif",fontSize:"0.88rem",fontWeight:view===t.key?600:500,
                  cursor:"pointer",transition:"all 0.18s ease",marginBottom:-1,
                }}>
                  {t.label}
                  {t.key==="browse" && liveCount>0 && (
                    <span style={{marginLeft:7,background:"rgba(78,204,163,0.15)",color:"#2e7d5e",borderRadius:99,padding:"1px 7px",fontSize:"0.68rem",fontWeight:700}}>{liveCount} live</span>
                  )}
                </button>
              ))}
            </div>

            {view === "history" ? (
              <HistoryView />
            ) : (
              <>
            {/* Toolbar */}
            <div className="bp-toolbar">
              <div className="bp-search-wrap">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input placeholder="Search auctions…" value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==="Enter"&&fetchListings()} />
              </div>
              <select className="bp-filter-select" value={category} onChange={e=>setCategory(e.target.value)}>
                <option value="">All Categories</option>
                {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
              <select className="bp-filter-select" value={sort} onChange={e=>setSort(e.target.value)}>
                {SORT_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              {user && (
                <button className="bp-post-btn" onClick={() => setView("post")}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  List for Auction
                </button>
              )}
            </div>

            {/* Grid */}
            {loading ? (
              <div className="bp-grid"><div className="bp-empty"><div className="bp-spinner"/><p>Loading auctions…</p></div></div>
            ) : listings.length === 0 ? (
              <div className="bp-grid">
                <div className="bp-empty">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                  <h3>No auctions yet</h3>
                  <p>{user ? "Be the first to list a property for auction!" : "Check back soon for live property auctions."}</p>
                </div>
              </div>
            ) : (
              <div className="bp-grid">
                {listings.map(l => <BidCard key={l._id} listing={l} onClick={setSelected} />)}
              </div>
            )}
            </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BiddingPage;
