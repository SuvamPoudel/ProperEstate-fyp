import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../constants";
import EsewaPayment from "../components/EsewaPayment";
import "../RentalPartnerPage.css";

const PARTNER_CATEGORIES = {
  "Land":  { icon: "🌿", subs: ["Agricultural Land", "Residential Land", "Commercial Land"] },
  "House": { icon: "🏠", subs: ["Apartment / Flat", "House / Villa", "Bungalow"] },
  "Room":  { icon: "🚪", subs: ["Room - Living", "Room - Office", "Room - Storage"] },
};

const typeColor = { Land:"#2e7d5e", House:"#557373", Room:"#9a6c1a" };

const initials = (name) => (name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();

/* ── Partner Card ─────────────────────────────────────────────────── */
const PartnerCard = ({ p, onChat, currentUserId }) => {
  const rawPosterId =
    p?.userInfo?._id ||
    (p?.userId && typeof p.userId === "object" ? (p.userId._id || p.userId.id) : p?.userId) ||
    p?.ownerId ||
    null;
  const posterUser = rawPosterId
    ? { _id: rawPosterId, name: p.name, avatar: p.userAvatar || null }
    : null;
  const isOwnById = rawPosterId && currentUserId && rawPosterId.toString() === currentUserId.toString();
  const isOwnByEmail = p?.email && p.email === p?.viewerEmail;
  const isOwn = isOwnById || isOwnByEmail;
  // Only show message button if poster has a real account (not seeded/anonymous)
  const canMessage = onChat && !isOwn && !!rawPosterId;
  const budgetFmt = p.budget ? `Rs. ${parseInt(p.budget).toLocaleString()}/mo` : "—";
  const dateStr = p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-US",{month:"short",day:"numeric"}) : "";
  const color = typeColor[p.propertyType] || "#557373";
  const icon = PARTNER_CATEGORIES[p.propertyType]?.icon || "🏘";
  const moveIn = p.moveInDate ? new Date(p.moveInDate).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) : null;

  return (
    <div className="pcard">
      {/* Header */}
      <div className="pcard-header">
        <div className="pcard-avatar-wrap">
          <div className="pcard-avatar" style={{ background: color+"18", color }}>
            {initials(p.name)}
          </div>
        </div>
        <div className="pcard-header-info">
          <span className="pcard-name">{p.name}</span>
          <span className="pcard-date">{dateStr}</span>
        </div>
        <span className="pcard-type-pill" style={{ background: color+"15", color }}>
          {icon} {p.propertyType}
        </span>
      </div>

      {/* Sub-category */}
      <div className="pcard-subcat">{p.subCategory}</div>

      {/* Key info row */}
      <div className="pcard-info-grid">
        <div className="pcard-info-item">
          <span className="pcard-info-icon">📍</span>
          <span>{p.location}</span>
        </div>
        <div className="pcard-info-item">
          <span className="pcard-info-icon">💰</span>
          <span className="pcard-budget">{budgetFmt}</span>
        </div>
        {moveIn && (
          <div className="pcard-info-item">
            <span className="pcard-info-icon">📅</span>
            <span>Move-in {moveIn}</span>
          </div>
        )}
      </div>

      {/* Preference chips */}
      {(p.preferredGender || p.preferredAge) && (
        <div className="pcard-prefs">
          {p.preferredGender && p.preferredGender !== "No Preference" && (
            <span className="pcard-pref-chip">👤 {p.preferredGender}</span>
          )}
          {p.preferredAge && p.preferredAge !== "No Preference" && (
            <span className="pcard-pref-chip">🎂 {p.preferredAge} yrs</span>
          )}
        </div>
      )}

      {/* Description */}
      {p.description && <p className="pcard-desc">{p.description}</p>}

      {/* Actions */}
      <div className="pcard-actions">
        <a href={`tel:${p.phone}`} className="pcard-btn pcard-btn-call">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.06 6.06l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          Call
        </a>
        <a href={`mailto:${p.email}`} className="pcard-btn pcard-btn-email">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,12 2,6"/></svg>
          Email
        </a>
        {canMessage && (
          <button className="pcard-btn pcard-btn-msg" onClick={() => onChat(posterUser)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Send Message
          </button>
        )}
      </div>
    </div>
  );
};

/* ── Main Page ────────────────────────────────────────────────────── */
const RentalPartnerPage = ({ user, chatRef }) => {
  const navigate = useNavigate();
  const [tab, setTab]               = useState("browse");
  const [partners, setPartners]     = useState([]);
  const [loading, setLoading]       = useState(false);
  const [searchLoc, setSearchLoc]   = useState("");
  const [searchType, setSearchType] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [postStep, setPostStep]     = useState("form");
  const [formData, setFormData]     = useState({
    name: user?.name||"", phone:"", email: user?.email||"",
    location:"", budget:"", propertyType:"", subCategory:"",
    preferredGender:"", preferredAge:"", moveInDate:"", description:"",
  });
  const [errors, setErrors] = useState({});

  const subCats = formData.propertyType ? PARTNER_CATEGORIES[formData.propertyType]?.subs||[] : [];

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/rental-partners`);
      const data = await res.json();
      if (data.success) setPartners(data.partners);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchPartners(); }, []);

  const filtered = partners.filter(p => {
    const locMatch  = !searchLoc  || (p.location||"").toLowerCase().includes(searchLoc.toLowerCase());
    const typeMatch = !searchType || p.propertyType === searchType;
    return locMatch && typeMatch;
  });

  const handleChat = (posterUser) => {
    if (!user) return;
    if (!posterUser?._id) return; // seeded/anonymous — no account to chat with
    // Use inline chat popout if available, otherwise navigate to messages page
    if (chatRef?.current?.openWith) {
      chatRef.current.openWith(posterUser);
    } else {
      navigate("/messages", { state: { chatTarget: posterUser } });
    }
  };

  const validate = () => {
    const e = {};
    if (!formData.name.trim())                              e.name = "Name is required";
    if (!formData.phone || !/^[0-9]{10}$/.test(formData.phone)) e.phone = "Valid 10-digit phone required";
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) e.email = "Valid email required";
    if (!formData.location.trim())                          e.location = "Location is required";
    if (!formData.budget)                                   e.budget = "Budget is required";
    if (!formData.propertyType)                             e.propertyType = "Property type is required";
    if (!formData.subCategory)                              e.subCategory = "Sub-category is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => { e.preventDefault(); if (!validate()) return; setShowPayment(true); };

  const handlePaymentSuccess = async () => {
    setShowPayment(false);
    try {
      await fetch(`${API_URL}/rental-partner`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ ...formData, userId: user?._id })
      });
    } catch {}
    setPostStep("success");
    fetchPartners();
  };

  return (
    <div className="rp-page">
      {showPayment && (
        <EsewaPayment amount={100} description="Rental Partner Listing Fee - ProperEstate"
          onSuccess={handlePaymentSuccess} onCancel={() => setShowPayment(false)} />
      )}

      {/* Hero */}
      <div className="rp-hero">
        <div className="rp-hero-inner">
          <h1>Find a Rental Partner</h1>
          <p>Connect with people looking to share rent across Nepal. Browse requests or post your own.</p>
          <div className="rp-hero-stats">
            <span><strong>{partners.length}</strong> active requests</span>
            <span className="rp-hero-dot">·</span>
            <span>Rs. 200 to post</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="rp-tabs-bar">
        <div className="rp-tabs">
          <button className={"rp-tab"+(tab==="browse"?" active":"")} onClick={()=>setTab("browse")}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Browse Requests
            {partners.length>0 && <span className="rp-tab-count">{partners.length}</span>}
          </button>
          <button className={"rp-tab"+(tab==="post"?" active":"")} onClick={()=>setTab("post")}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Post a Request
          </button>
        </div>
      </div>

      <div className="rp-body">
        {/* ── Browse tab ── */}
        {tab==="browse" && (
          <div>
            {/* Search */}
            <div className="rp-search-bar">
              <div className="rp-search-loc">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7a7a" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <input placeholder="Search by location…" value={searchLoc} onChange={e=>setSearchLoc(e.target.value)} onKeyDown={e=>e.key==="Enter"&&fetchPartners()} />
              </div>
              <div className="rp-search-divider"/>
              <div className="rp-search-type">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7a7a" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                <select value={searchType} onChange={e=>setSearchType(e.target.value)}>
                  <option value="">All Types</option>
                  {Object.keys(PARTNER_CATEGORIES).map(k=>(
                    <option key={k} value={k}>{PARTNER_CATEGORIES[k].icon} {k}</option>
                  ))}
                </select>
              </div>
              <button className="rp-search-btn" onClick={fetchPartners}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                Search
              </button>
            </div>

            {/* Filter chips */}
            {(searchLoc||searchType) && (
              <div className="rp-filter-chips">
                {searchLoc  && <span className="rp-chip">📍 {searchLoc}  <button onClick={()=>setSearchLoc("")}>✕</button></span>}
                {searchType && <span className="rp-chip">{PARTNER_CATEGORIES[searchType]?.icon} {searchType} <button onClick={()=>setSearchType("")}>✕</button></span>}
                <span className="rp-chip-count">{filtered.length} result{filtered.length!==1?"s":""}</span>
              </div>
            )}

            {loading ? (
              <div className="rp-loading"><div className="rp-spinner"/><p>Loading partner requests…</p></div>
            ) : filtered.length===0 ? (
              <div className="rp-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                <h3>No requests found</h3>
                <p>{partners.length===0?"Be the first to post a rental partner request!":"Try adjusting your search filters."}</p>
                <button className="btn-primary full-width" style={{maxWidth:220,margin:"16px auto 0"}} onClick={()=>setTab("post")}>Post a Request</button>
              </div>
            ) : (
              <div className="pcard-grid">
                {filtered.map((p,i)=>(
                  <PartnerCard
                    key={p._id||i}
                    p={{ ...p, viewerEmail: user?.email || "" }}
                    onChat={user?handleChat:null}
                    currentUserId={user?._id}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Post tab ── */}
        {tab==="post" && (
          <div className="rp-post-wrap">
            {postStep==="success" ? (
              <div className="rp-success-box">
                <div style={{fontSize:"3rem",marginBottom:12}}>🎉</div>
                <h2>Request Posted!</h2>
                <p>Your rental partner listing is now live. People will contact you directly via phone or email.</p>
                <div style={{display:"flex",gap:12,justifyContent:"center",marginTop:24,flexWrap:"wrap"}}>
                  <button className="btn-primary full-width" style={{maxWidth:220}} onClick={()=>{setPostStep("form");setTab("browse");}}>Browse All Requests</button>
                  <button className="btn-outline" onClick={()=>{setPostStep("form");setFormData({name:user?.name||"",phone:"",email:user?.email||"",location:"",budget:"",propertyType:"",subCategory:"",preferredGender:"",preferredAge:"",moveInDate:"",description:""});}}>Post Another</button>
                </div>
              </div>
            ) : (
              <>
                <div className="rp-post-header">
                  <h3>Post Your Partner Request</h3>
                  <p>Fill in your details and pay <strong>Rs. 200</strong> via eSewa to go live.</p>
                </div>
                <form onSubmit={handleSubmit} className="rp-form">
                  <div className="rp-section">
                    <h4>Your Details</h4>
                    <div className="rp-grid">
                      <div className="rp-field">
                        <label>Full Name *</label>
                        <input value={formData.name} onChange={e=>setFormData({...formData,name:e.target.value})} placeholder="Your full name"/>
                        {errors.name && <span className="rp-error">{errors.name}</span>}
                      </div>
                      <div className="rp-field">
                        <label>Phone Number *</label>
                        <input value={formData.phone} onChange={e=>setFormData({...formData,phone:e.target.value.replace(/\D/g,"").slice(0,10)})} placeholder="10-digit phone" maxLength={10}/>
                        {errors.phone && <span className="rp-error">{errors.phone}</span>}
                      </div>
                      <div className="rp-field">
                        <label>Email *</label>
                        <input type="email" value={formData.email} onChange={e=>setFormData({...formData,email:e.target.value})} placeholder="your@email.com"/>
                        {errors.email && <span className="rp-error">{errors.email}</span>}
                      </div>
                      <div className="rp-field">
                        <label>Preferred Location *</label>
                        <input value={formData.location} onChange={e=>setFormData({...formData,location:e.target.value})} placeholder="e.g. Kathmandu, Lalitpur"/>
                        {errors.location && <span className="rp-error">{errors.location}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="rp-section">
                    <h4>What You're Looking For</h4>
                    <div className="rp-field">
                      <label>Property Type *</label>
                      <div className="category-selector">
                        {Object.entries(PARTNER_CATEGORIES).map(([cat,info])=>(
                          <button key={cat} type="button"
                            className={"cat-btn"+(formData.propertyType===cat?" selected":"")}
                            onClick={()=>setFormData({...formData,propertyType:cat,subCategory:""})}>
                            {info.icon} {cat}
                          </button>
                        ))}
                      </div>
                      {errors.propertyType && <span className="rp-error">{errors.propertyType}</span>}
                    </div>
                    {formData.propertyType && (
                      <div className="rp-field" style={{marginTop:12}}>
                        <label>Sub-Category *</label>
                        <div className="subcategory-selector">
                          {subCats.map(sc=>(
                            <button key={sc} type="button"
                              className={"subcat-btn"+(formData.subCategory===sc?" selected":"")}
                              onClick={()=>setFormData({...formData,subCategory:sc})}>
                              {sc}
                            </button>
                          ))}
                        </div>
                        {errors.subCategory && <span className="rp-error">{errors.subCategory}</span>}
                      </div>
                    )}
                    <div className="rp-grid" style={{marginTop:14}}>
                      <div className="rp-field">
                        <label>Monthly Budget (Rs.) *</label>
                        <input type="number" value={formData.budget} onChange={e=>setFormData({...formData,budget:e.target.value})} placeholder="e.g. 8000" min="0"/>
                        {errors.budget && <span className="rp-error">{errors.budget}</span>}
                      </div>
                      <div className="rp-field">
                        <label>Move-in Date (Optional)</label>
                        <input type="date" value={formData.moveInDate} onChange={e=>setFormData({...formData,moveInDate:e.target.value})}/>
                      </div>
                    </div>
                  </div>

                  <div className="rp-section">
                    <h4>Partner Preferences <span style={{fontWeight:400,color:"#a0aeae",fontSize:"0.8rem"}}>(Optional)</span></h4>
                    <div className="rp-grid">
                      <div className="rp-field">
                        <label>Preferred Partner Gender</label>
                        <select value={formData.preferredGender} onChange={e=>setFormData({...formData,preferredGender:e.target.value})}>
                          <option value="">No Preference</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Any">Any</option>
                        </select>
                      </div>
                      <div className="rp-field">
                        <label>Preferred Partner Age Range</label>
                        <select value={formData.preferredAge} onChange={e=>setFormData({...formData,preferredAge:e.target.value})}>
                          <option value="">No Preference</option>
                          <option value="18-25">18–25</option>
                          <option value="25-35">25–35</option>
                          <option value="35-50">35–50</option>
                          <option value="50+">50+</option>
                        </select>
                      </div>
                    </div>
                    <div className="rp-field" style={{marginTop:14}}>
                      <label>Additional Details</label>
                      <textarea value={formData.description} onChange={e=>setFormData({...formData,description:e.target.value})} rows={3} placeholder="Lifestyle, occupation, preferences…"/>
                    </div>
                  </div>

                  <div className="rp-submit-area">
                    <p className="rp-fee-note">💳 A listing fee of <strong>Rs. 200</strong> will be charged via eSewa to publish your request.</p>
                    <button type="submit" className="btn-primary full-width" style={{marginTop:14}}>
                      Post Partner Request — Pay Rs. 200
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RentalPartnerPage;
