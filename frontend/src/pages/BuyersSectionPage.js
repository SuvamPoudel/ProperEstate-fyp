import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../constants";
import EsewaPayment from "../components/EsewaPayment";
import "../BuyersSectionPage.css";

const BS_CATEGORIES = {
  "Land":       { icon:"🌿", subs:["Agricultural Land","Residential Land","Commercial Land"] },
  "House":      { icon:"🏠", subs:["Apartment / Flat","House / Villa","Bungalow"] },
  "Room":       { icon:"🚪", subs:["Room - Living","Room - Office","Room - Storage"] },
  "Commercial": { icon:"🏢", subs:["Shop / Showroom","Office Space","Warehouse"] },
};

const typeColor = { Land:"#2e7d5e", House:"#557373", Room:"#9a6c1a", Commercial:"#2164b4" };
const initials  = (name) => (name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
const timeAgo   = (date) => {
  const s = Math.floor((Date.now()-new Date(date))/1000);
  if (s<60) return "just now";
  if (s<3600) return Math.floor(s/60)+"m ago";
  if (s<86400) return Math.floor(s/3600)+"h ago";
  return Math.floor(s/86400)+"d ago";
};

/* ── Post Card ────────────────────────────────────────────────────── */
const PostCard = ({ post, user, onMessage, commentInputs, setCommentInputs, expandedComments, setExpandedComments, onComment, onLike }) => {
  const rawPosterId =
    post?.userInfo?._id ||
    (post?.userId && typeof post.userId === "object" ? (post.userId._id || post.userId.id) : post?.userId) ||
    post?.ownerId ||
    post?.postedBy ||
    null;
  const posterUser = rawPosterId
    ? { _id: rawPosterId, name: post.userName, avatar: post.userAvatar || null }
    : null;
  const isOwnById = rawPosterId && user?._id && rawPosterId.toString() === user._id.toString();
  const isOwnByName = user?.name && post?.userName && user.name === post.userName;
  const isOwn = isOwnById || isOwnByName;
  const color    = typeColor[post.propertyType] || "#557373";
  const icon     = BS_CATEGORIES[post.propertyType]?.icon || "🏘";
  const showAll  = expandedComments[post._id];
  const comments = post.comments || [];
  const visible  = showAll ? comments : comments.slice(-2);
  const liked    = user && (post.likes||[]).map(id=>id.toString()).includes(user._id?.toString());

  // Only show message button if: logged in, not own post, AND poster has a real account
  const showMsgBtn = user && !isOwn && !!rawPosterId;

  const handleMessage = () => {
    if (!user) return;
    onMessage?.(posterUser);
  };

  return (
    <div className="bs-post-card">
      {/* Header */}
      <div className="bs-post-header">
        <div className="bs-post-avatar" style={{background:color+"18",color}}>
          {initials(post.userName)}
        </div>
        <div className="bs-post-meta">
          <span className="bs-post-author">{post.userName}</span>
          <span className="bs-post-time">{timeAgo(post.createdAt)}</span>
        </div>
        <span className="bs-post-type-badge" style={{background:color+"15",color}}>
          {icon} {post.subCategory||post.propertyType}
        </span>
      </div>

      {/* Title */}
      <h3 className="bs-post-title">{post.title}</h3>
      {post.description && <p className="bs-post-desc">{post.description}</p>}

      {/* Info chips */}
      <div className="bs-post-chips">
        {post.location && (
          <span className="bs-chip-info">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {post.location}
          </span>
        )}
        {post.budget && (
          <span className="bs-chip-info bs-chip-budget">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            Rs. {parseInt(post.budget).toLocaleString()}/mo
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="bs-post-actions">
        {post.contactPhone && (
          <a href={`tel:${post.contactPhone}`} className="bs-action-btn bs-btn-call">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.06 6.06l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            Call
          </a>
        )}
        {post.contactEmail && (
          <a href={`mailto:${post.contactEmail}`} className="bs-action-btn bs-btn-email">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,12 2,6"/></svg>
            Email
          </a>
        )}
        {showMsgBtn && (
          <button className="bs-action-btn bs-btn-msg" onClick={handleMessage}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Send Message
          </button>
        )}
        {user && (
          <button className={`bs-action-btn bs-btn-like${liked?" liked":""}`} onClick={()=>onLike(post._id)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill={liked?"currentColor":"none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            {(post.likes||[]).length > 0 && <span>{(post.likes||[]).length}</span>}
          </button>
        )}
      </div>

      {/* Comments */}
      <div className="bs-comments">
        <div className="bs-comments-header">
          <span className="bs-comments-count">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            {comments.length} {comments.length===1?"comment":"comments"}
          </span>
          {comments.length>2 && (
            <button className="bs-show-more" onClick={()=>setExpandedComments(p=>({...p,[post._id]:!p[post._id]}))}>
              {showAll?`Show less`:`View all ${comments.length}`}
            </button>
          )}
        </div>

        {visible.map((c,ci)=>(
          <div key={ci} className="bs-comment">
            <div className="bs-comment-avatar">{initials(c.userName)}</div>
            <div className="bs-comment-body">
              <span className="bs-comment-author">{c.userName}</span>
              <span className="bs-comment-text">{c.text}</span>
              <span className="bs-comment-time">{timeAgo(c.createdAt)}</span>
            </div>
          </div>
        ))}

        {user && (
          <div className="bs-comment-input-row">
            <div className="bs-comment-avatar" style={{flexShrink:0}}>{initials(user.name)}</div>
            <div className="bs-comment-input-wrap">
              <input
                value={commentInputs[post._id]||""}
                onChange={e=>setCommentInputs(p=>({...p,[post._id]:e.target.value}))}
                onKeyDown={e=>e.key==="Enter"&&onComment(post._id)}
                placeholder="Write a comment…"
                className="bs-comment-input"
              />
              <button className="bs-comment-send" onClick={()=>onComment(post._id)} disabled={!(commentInputs[post._id]||"").trim()}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Main Page ────────────────────────────────────────────────────── */
const BuyersSectionPage = ({ user, chatRef }) => {
  const navigate = useNavigate();
  const [posts,       setPosts]       = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [showForm,    setShowForm]    = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [pendingPost, setPendingPost] = useState(null);
  const [commentInputs,    setCommentInputs]    = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [formData, setFormData] = useState({
    title:"", description:"", propertyType:"", subCategory:"",
    location:"", budget:"", contactPhone:"", contactEmail:""
  });

  const subCats = formData.propertyType ? BS_CATEGORIES[formData.propertyType]?.subs||[] : [];

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/buyer-posts?postType=section`);
      const data = await res.json();
      if (data.success) setPosts(data.posts);
    } catch {}
    setLoading(false);
  };

  useEffect(()=>{ fetchPosts(); },[]);

  const handleOpenMessage = (posterUser) => {
    if (!user) { navigate("/login"); return; }
    if (!posterUser?._id) return; // seeded/anonymous post — no account to chat with
    // Use inline chat popout if available, otherwise navigate to messages page
    if (chatRef?.current?.openWith) {
      chatRef.current.openWith(posterUser);
    } else {
      navigate("/messages", { state: { chatTarget: posterUser } });
    }
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!user) { navigate("/login"); return; }
    if (!formData.title||!formData.propertyType||!formData.location) { alert("Please fill required fields."); return; }
    // Save form data and show payment
    setPendingPost({ ...formData, userId:user._id, userName:user.name, userAvatar:user.avatar, postType:"section" });
    setShowPayment(true);
  };

  const handlePaymentSuccess = async () => {
    setShowPayment(false);
    if (!pendingPost) return;
    try {
      const res  = await fetch(`${API_URL}/buyer-posts`,{
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify(pendingPost)
      });
      const data = await res.json();
      if (data.success) {
        setShowForm(false);
        setPendingPost(null);
        setFormData({title:"",description:"",propertyType:"",subCategory:"",location:"",budget:"",contactPhone:"",contactEmail:""});
        fetchPosts();
      }
    } catch {}
  };

  const handleComment = async (postId) => {
    if (!user) { navigate("/login"); return; }
    const text = (commentInputs[postId]||"").trim();
    if (!text) return;
    try {
      await fetch(`${API_URL}/buyer-posts/${postId}/comment`,{
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({userId:user._id, userName:user.name, userAvatar:user.avatar, text})
      });
      setCommentInputs(p=>({...p,[postId]:""}));
      fetchPosts();
    } catch {}
  };

  const handleLike = async (postId) => {
    if (!user) { navigate("/login"); return; }
    try {
      await fetch(`${API_URL}/buyer-posts/${postId}/like`,{
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({userId:user._id})
      });
      fetchPosts();
    } catch {}
  };

  return (
    <div className="bs-page">
      {showPayment && (
        <EsewaPayment
          amount={200}
          description="Buyers Section Post Fee - ProperEstate"
          onSuccess={handlePaymentSuccess}
          onCancel={() => setShowPayment(false)}
        />
      )}

      {/* Hero */}
      <div className="bs-hero">
        <div className="bs-hero-inner">
          <h1>Buyers Section</h1>
          <p>Post what you're looking for. Sellers and agents will reach out directly.</p>
          {user ? (
            <button className="bs-post-btn" onClick={()=>setShowForm(v=>!v)}>
              {showForm ? "✕ Cancel" : "+ Post What You Need"}
            </button>
          ) : (
            <button className="bs-post-btn" onClick={()=>navigate("/login")}>Login to Post</button>
          )}
        </div>
      </div>

      <div className="bs-body">
        {/* Post form */}
        {showForm && (
          <div className="bs-form-card">
            <h3>What are you looking for?</h3>
            <form onSubmit={handlePost} className="bs-form">
              <div className="bs-form-grid">
                <div className="bs-field full">
                  <label>Post Title *</label>
                  <input value={formData.title} onChange={e=>setFormData({...formData,title:e.target.value})} placeholder="e.g. Looking for 2BHK flat in Kathmandu" required/>
                </div>
                <div className="bs-field full">
                  <label>Property Type *</label>
                  <div className="category-selector">
                    {Object.entries(BS_CATEGORIES).map(([cat,info])=>(
                      <button key={cat} type="button"
                        className={"cat-btn"+(formData.propertyType===cat?" selected":"")}
                        onClick={()=>setFormData({...formData,propertyType:cat,subCategory:""})}>
                        {info.icon} {cat}
                      </button>
                    ))}
                  </div>
                </div>
                {formData.propertyType && (
                  <div className="bs-field full">
                    <label>Sub-Category</label>
                    <div className="subcategory-selector">
                      {subCats.map(sc=>(
                        <button key={sc} type="button"
                          className={"subcat-btn"+(formData.subCategory===sc?" selected":"")}
                          onClick={()=>setFormData({...formData,subCategory:sc})}>
                          {sc}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="bs-field">
                  <label>Location *</label>
                  <input value={formData.location} onChange={e=>setFormData({...formData,location:e.target.value})} placeholder="e.g. Lalitpur, Kathmandu" required/>
                </div>
                <div className="bs-field">
                  <label>Budget (Rs./mo)</label>
                  <input type="number" value={formData.budget} onChange={e=>setFormData({...formData,budget:e.target.value})} placeholder="e.g. 15000"/>
                </div>
                <div className="bs-field">
                  <label>Contact Phone</label>
                  <input value={formData.contactPhone} onChange={e=>setFormData({...formData,contactPhone:e.target.value.replace(/\D/g,"").slice(0,10)})} placeholder="98XXXXXXXX" maxLength={10}/>
                </div>
                <div className="bs-field">
                  <label>Contact Email</label>
                  <input type="email" value={formData.contactEmail} onChange={e=>setFormData({...formData,contactEmail:e.target.value})} placeholder="your@email.com"/>
                </div>
                <div className="bs-field full">
                  <label>Description</label>
                  <textarea value={formData.description} onChange={e=>setFormData({...formData,description:e.target.value})} rows={3} placeholder="Any specific requirements, preferences, timeline…"/>
                </div>
              </div>
              <button type="submit" className="btn-primary full-width" style={{marginTop:16}}>
                📢 Post Request — Pay Rs. 200
              </button>
              <p style={{ marginTop: 10, fontSize: "0.85rem", color: "#6b7a7a" }}>
                A posting commission of <strong>Rs. 200</strong> will be charged via eSewa.
              </p>
            </form>
          </div>
        )}

        {/* Feed */}
        {loading ? (
          <div className="rp-loading"><div className="rp-spinner"/><p>Loading posts…</p></div>
        ) : posts.length===0 ? (
          <div className="rp-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <h3>No posts yet</h3>
            <p>Be the first to post what you're looking for!</p>
          </div>
        ) : (
          <div className="bs-feed">
            {posts.map(post=>(
              <PostCard
                key={post._id}
                post={post}
                user={user}
                onMessage={handleOpenMessage}
                commentInputs={commentInputs}
                setCommentInputs={setCommentInputs}
                expandedComments={expandedComments}
                setExpandedComments={setExpandedComments}
                onComment={handleComment}
                onLike={handleLike}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BuyersSectionPage;
