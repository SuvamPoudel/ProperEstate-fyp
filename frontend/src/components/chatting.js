import { useState, useEffect, useRef, useCallback } from "react";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

const Avatar = ({ name, avatar, size = 36 }) => {
  const src = avatar
    ? `${API}/uploads/${avatar}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "U")}&background=1a2744&color=00d4ff&bold=true&size=128`;
  return <img src={src} alt={name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />;
};

// Countdown timer for 1-minute delete rule
const DeleteCountdown = ({ deleteAt }) => {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((new Date(deleteAt) - Date.now()) / 1000));
      setSecs(remaining);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [deleteAt]);
  if (!deleteAt || secs <= 0) return null;
  return (
    <span className="cw-delete-timer" title="Message deletes after 1 minute of being read">
      🕐 {secs}s
    </span>
  );
};

// ─── Notifications Panel ──────────────────────────────────────────────────────
export function NotificationsPanel({ user, bookingCount, dashData, respondToBooking, onClose }) {
  const bookings = (dashData?.bookings || []).filter(b => b.status === "pending");
  return (
    <div className="npanel">
      <div className="npanel-header">
        <span className="npanel-title">Notifications</span>
        {bookingCount > 0 && <span className="npanel-badge">{bookingCount}</span>}
        <button className="npanel-close" onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div className="npanel-body">
        {bookings.length === 0 ? (
          <div className="npanel-empty">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            <p>No pending requests</p>
          </div>
        ) : (
          bookings.map(b => (
            <div key={b._id} className="npanel-item">
              <div className="npanel-item-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
              </div>
              <div className="npanel-item-body">
                <p className="npanel-item-title">{b.buyerId?.name || "Someone"} wants to rent</p>
                <p className="npanel-item-sub">{b.landId?.title} · {b.rentDuration}</p>
                <p className="npanel-item-price">Rs. {parseInt(b.paymentAmount || 0).toLocaleString()}</p>
              </div>
              <div className="npanel-item-actions">
                <button className="npanel-accept" onClick={() => respondToBooking(b._id, "accepted")}>Accept</button>
                <button className="npanel-reject" onClick={() => respondToBooking(b._id, "rejected")}>Reject</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Chat App ─────────────────────────────────────────────────────────────────
export default function ChatApp({ user, initialOther = null, openRef = null, onUnreadChange = null, forceOpen = false }) {
  const [conversations, setConversations] = useState([]);
  const [activeOther, setActiveOther] = useState(initialOther);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(!!initialOther || forceOpen);
  const [view, setView] = useState(initialOther ? "chat" : "list");
  const [sending, setSending] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const pollRef = useRef(null);
  const bottomRef = useRef();
  const inputRef = useRef();
  const fileRef = useRef();

  useEffect(() => {
    if (openRef) {
      openRef.current = {
        toggle: () => setOpen(o => { if (!o) { setView("list"); fetchConversations(); } return !o; }),
        open: () => { setOpen(true); setView("list"); fetchConversations(); },
        openWith: (other) => { setActiveOther(other); setView("chat"); setMessages([]); setOpen(true); },
      };
    }
  });

  useEffect(() => { if (onUnreadChange) onUnreadChange(unread); }, [unread, onUnreadChange]);

  const fetchConversations = useCallback(async () => {
    if (!user?._id) return;
    try {
      const res = await fetch(`${API}/chat/conversations/${user._id}`);
      const data = await res.json();
      if (data.success) {
        // Backend returns partnerName/partnerAvatar — normalize to {user: {name, avatar, _id}}
        const normalized = data.conversations.map(c => ({
          user: {
            _id: c.partnerId || c._id,
            name: c.partnerName || c.user?.name || "Unknown",
            avatar: c.partnerAvatar || c.user?.avatar || null,
          },
          lastMessage: c.lastMessage || "",
          unread: c.unreadCount || c.unread || 0,
        }));
        setConversations(normalized);
      }
    } catch {}
  }, [user]);

  const fetchUnread = useCallback(async () => {
    if (!user?._id) return;
    try {
      const res = await fetch(`${API}/chat/unread/${user._id}`);
      const data = await res.json();
      if (data.success) setUnread(data.count);
    } catch {}
  }, [user]);

  const fetchMessages = useCallback(async () => {
    if (!user?._id || !activeOther?._id) return;
    try {
      const res = await fetch(`${API}/chat/messages/${user._id}/${activeOther._id}`);
      const data = await res.json();
      if (data.success) setMessages(data.messages);
    } catch {}
  }, [user, activeOther]);

  useEffect(() => {
    if (open && activeOther) { fetchMessages(); pollRef.current = setInterval(fetchMessages, 2000); }
    else clearInterval(pollRef.current);
    return () => clearInterval(pollRef.current);
  }, [open, activeOther, fetchMessages]);

  useEffect(() => {
    if (!user?._id) return;
    fetchUnread();
    const t = setInterval(fetchUnread, 5000);
    return () => clearInterval(t);
  }, [fetchUnread]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (open && view === "list") fetchConversations(); }, [open, view, fetchConversations]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => {
    if (initialOther?._id) {
      setActiveOther(initialOther);
      setView("chat");
      setOpen(true);
      return;
    }
    if (forceOpen) {
      setView("list");
      setOpen(true);
    }
  }, [initialOther?._id, forceOpen]); // eslint-disable-line
  useEffect(() => { if (open && view === "chat") setTimeout(() => inputRef.current?.focus(), 100); }, [open, view]);

  const sendMessage = async () => {
    const text = input.trim();
    if ((!text && !imageFile) || !activeOther || sending) return;
    setSending(true);
    setInput("");
    const tempId = `temp_${Date.now()}`;
    setMessages(prev => [...prev, { _id: tempId, senderId: user._id, text, image: imagePreview ? "preview" : null, createdAt: new Date().toISOString(), optimistic: true }]);
    setImagePreview(null);
    try {
      const fd = new FormData();
      fd.append("senderId", user._id);
      fd.append("receiverId", activeOther._id);
      if (text) fd.append("text", text);
      if (imageFile) fd.append("image", imageFile);
      setImageFile(null);
      await fetch(`${API}/chat/send`, { method: "POST", body: fd });
      await fetchMessages();
    } catch {}
    setSending(false);
  };

  const handleImagePick = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = ev => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const openChat = (other) => { setActiveOther(other); setView("chat"); setMessages([]); };
  const fmt = (iso) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const fmtDate = (iso) => {
    const d = new Date(iso), t = new Date(), y = new Date(t); y.setDate(y.getDate() - 1);
    if (d.toDateString() === t.toDateString()) return "Today";
    if (d.toDateString() === y.toDateString()) return "Yesterday";
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const grouped = messages.reduce((g, m) => {
    const k = fmtDate(m.createdAt);
    if (!g[k]) g[k] = [];
    g[k].push(m);
    return g;
  }, {});

  if (!user) return null;

  return (
    <>
      <style>{STYLES}</style>
      {open && (
        <div className="cw">
          {/* Header */}
          <div className="cw-head">
            {view === "chat" && activeOther ? (
              <div className="cw-head-inner">
                <button className="cw-back" onClick={() => { setView("list"); fetchConversations(); }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <div style={{ position: "relative" }}>
                  <Avatar name={activeOther.name} avatar={activeOther.avatar} size={34} />
                  <span className="cw-online" />
                </div>
                <div className="cw-head-info">
                  <span className="cw-head-name">{activeOther.name}</span>
                  <span className="cw-head-status">Active now</span>
                </div>
              </div>
            ) : (
              <div className="cw-head-inner">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <span className="cw-head-title">Messages</span>
                {unread > 0 && <span className="cw-head-badge">{unread}</span>}
              </div>
            )}
            <button className="cw-close" onClick={() => setOpen(false)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          {/* Conversation list */}
          {view === "list" && (
            <div className="cw-list">
              {conversations.length === 0 ? (
                <div className="cw-empty">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  <p>No conversations yet</p>
                  <span>Start from a property listing</span>
                </div>
              ) : conversations.map((c, i) => (
                <div key={i} className="cw-convo" onClick={() => openChat(c.user)}>
                  <div style={{ position: "relative" }}>
                    <Avatar name={c.user?.name} avatar={c.user?.avatar} size={44} />
                    <span className="cw-convo-dot" />
                  </div>
                  <div className="cw-convo-info">
                    <div className="cw-convo-row">
                      <span className="cw-convo-name">{c.user?.name}</span>
                      <span className="cw-convo-time">{c.lastMessage ? "now" : ""}</span>
                    </div>
                    <div className="cw-convo-row">
                      <span className="cw-convo-last">{c.lastMessage || "Say hello"}</span>
                      {c.unread > 0 && <span className="cw-unread">{c.unread}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Chat view */}
          {view === "chat" && (
            <>
              <div className="cw-msgs">
                {Object.entries(grouped).map(([date, msgs]) => (
                  <div key={date}>
                    <div className="cw-date"><span>{date}</span></div>
                    {msgs.map((m, i) => {
                      const mine = m.senderId === user._id || m.senderId?.toString() === user._id?.toString();
                      const last = i === msgs.length - 1 || msgs[i + 1]?.senderId?.toString() !== m.senderId?.toString();
                      const showAv = !mine && (i === 0 || msgs[i - 1]?.senderId?.toString() !== m.senderId?.toString());
                      return (
                        <div key={m._id || i} className={`cw-row ${mine ? "mine" : "theirs"}`}>
                          {!mine && <div className="cw-av-slot">{showAv && <Avatar name={activeOther?.name} avatar={activeOther?.avatar} size={26} />}</div>}
                          <div className={`cw-bwrap ${mine ? "mine" : "theirs"}`}>
                            {m.image && m.image !== "preview" && (
                              <img src={`${API}/uploads/${m.image}`} alt="attachment" className={`cw-img-msg ${mine ? "mine" : "theirs"}`} />
                            )}
                            {m.image === "preview" && imagePreview && (
                              <img src={imagePreview} alt="sending" className={`cw-img-msg ${mine ? "mine" : "theirs"}`} style={{ opacity: 0.6 }} />
                            )}
                            {m.text && (
                              <div className={`cw-bubble ${mine ? "mine" : "theirs"} ${m.optimistic ? "sending" : ""} ${last ? "last" : ""}`}>
                                {m.text}
                              </div>
                            )}
                            {last && (
                              <div className={`cw-meta ${mine ? "mine" : ""}`}>
                                <span className="cw-time">{fmt(m.createdAt)}</span>
                                {/* 1-min delete countdown — shown on received messages that have deleteAt */}
                                {!mine && m.deleteAt && <DeleteCountdown deleteAt={m.deleteAt} />}
                                {mine && !m.optimistic && (
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={m.read ? "#4fc3f7" : "currentColor"} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Image preview bar */}
              {imagePreview && (
                <div className="cw-img-preview">
                  <img src={imagePreview} alt="preview" />
                  <button onClick={() => { setImagePreview(null); setImageFile(null); }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              )}

              {/* Input */}
              <div className="cw-input-area">
                <input type="file" ref={fileRef} accept="image/*" style={{ display: "none" }} onChange={handleImagePick} />
                <button className="cw-attach" onClick={() => fileRef.current?.click()} title="Attach image">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                </button>
                <input
                  ref={inputRef}
                  className="cw-input"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder="Message..."
                  maxLength={1000}
                />
                <button className={`cw-send ${(input.trim() || imageFile) ? "active" : ""}`} onClick={sendMessage} disabled={(!input.trim() && !imageFile) || sending}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');

/* ── Ultra-Premium Social Chat Theme ───────────────────── */
.cw,
.npanel {
  --pm-bg: #0a0d14;
  --pm-bg-soft: #0e1220;
  --pm-bg-card: #131826;
  --pm-bg-hover: #181f30;
  --pm-border: rgba(255,255,255,0.09);
  --pm-border-soft: rgba(255,255,255,0.06);
  --pm-border-accent: rgba(200,169,110,0.22);
  --pm-text: #eef2ff;
  --pm-text-2: #c8d0e8;
  --pm-muted: #6b7a99;
  --pm-accent: #c8a96e;
  --pm-accent-2: #dfc08a;
  --pm-accent-glow: rgba(200,169,110,0.18);
  --pm-danger: #f06070;
  --pm-danger-soft: rgba(240,96,112,0.12);
  --pm-success: #4ecca3;
  --pm-success-soft: rgba(78,204,163,0.12);
  --pm-mine-from: #b8924a;
  --pm-mine-to: #d4a85e;
  --pm-shadow: 0 24px 64px rgba(0,0,0,0.7), 0 8px 24px rgba(0,0,0,0.4);
  --pm-shadow-sm: 0 4px 16px rgba(0,0,0,0.4);
  font-family: "DM Sans", "Inter", system-ui, -apple-system, sans-serif;
}

.cw {
  position: fixed;
  top: 72px;
  right: 16px;
  width: 368px;
  height: 560px;
  background: linear-gradient(175deg, rgba(13,17,28,0.97) 0%, rgba(10,13,20,0.98) 100%);
  border: 1px solid var(--pm-border);
  border-top: 1px solid rgba(255,255,255,0.13);
  border-radius: 22px;
  box-shadow: var(--pm-shadow), 0 0 0 1px rgba(200,169,110,0.05) inset, 0 1px 0 rgba(255,255,255,0.07) inset;
  backdrop-filter: blur(28px) saturate(1.4);
  -webkit-backdrop-filter: blur(28px) saturate(1.4);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1400;
  animation: cwIn 0.28s cubic-bezier(0.16,1,0.3,1);
}
@keyframes cwIn {
  from { opacity:0; transform:translateY(-14px) scale(0.96); }
  to   { opacity:1; transform:translateY(0) scale(1); }
}

.cw-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--pm-border-soft);
  background: linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%);
  flex-shrink: 0;
  position: relative;
}
.cw-head::after {
  content: "";
  position: absolute;
  bottom: 0; left: 16px; right: 16px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(200,169,110,0.2), transparent);
}
.cw-head-inner { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; color: var(--pm-text); }
.cw-head-title {
  font-weight: 700;
  font-size: 15px;
  color: var(--pm-text);
  letter-spacing: -0.01em;
  font-family: "DM Sans", "Inter", sans-serif;
}
.cw-head-badge {
  background: linear-gradient(135deg, #f05070, #e8405a);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  min-width: 19px;
  height: 19px;
  border-radius: 999px;
  padding: 0 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 14px rgba(240,80,112,0.5), 0 0 0 2px rgba(240,80,112,0.15);
  letter-spacing: 0;
}
.cw-head-name {
  font-weight: 600;
  font-size: 14px;
  color: var(--pm-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: -0.01em;
}
.cw-head-status {
  font-size: 11px;
  color: var(--pm-success);
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
}
.cw-head-status::before {
  content: "";
  width: 6px; height: 6px;
  background: var(--pm-success);
  border-radius: 50%;
  box-shadow: 0 0 6px var(--pm-success);
  animation: pulse-dot 2s ease-in-out infinite;
}
@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(0.85); }
}
.cw-head-info { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.cw-online {
  position: absolute;
  bottom: 1px;
  right: 1px;
  width: 10px;
  height: 10px;
  background: var(--pm-success);
  border-radius: 50%;
  border: 2px solid var(--pm-bg);
  box-shadow: 0 0 8px rgba(78,204,163,0.6);
}
.cw-back, .cw-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.07);
  color: var(--pm-muted);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
  flex-shrink: 0;
}
.cw-back:hover, .cw-close:hover {
  background: var(--pm-accent-glow);
  border-color: var(--pm-border-accent);
  color: var(--pm-accent-2);
  transform: scale(1.05);
}

.cw-list { flex: 1; overflow-y: auto; padding: 6px 0; }
.cw-list::-webkit-scrollbar { width: 3px; }
.cw-list::-webkit-scrollbar-track { background: transparent; }
.cw-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 3px; }
.cw-convo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  cursor: pointer;
  transition: background 0.18s ease;
  position: relative;
}
.cw-convo::before {
  content: "";
  position: absolute;
  left: 0; top: 50%; transform: translateY(-50%);
  width: 3px; height: 0;
  background: linear-gradient(180deg, var(--pm-accent), var(--pm-accent-2));
  border-radius: 0 3px 3px 0;
  transition: height 0.2s ease;
}
.cw-convo:hover { background: rgba(255,255,255,0.04); }
.cw-convo:hover::before { height: 60%; }
.cw-convo-dot {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 10px;
  height: 10px;
  background: var(--pm-success);
  border-radius: 50%;
  border: 2px solid var(--pm-bg);
  box-shadow: 0 0 6px rgba(78,204,163,0.5);
}
.cw-convo-info { flex: 1; min-width: 0; }
.cw-convo-row { display: flex; justify-content: space-between; align-items: center; }
.cw-convo-name { font-weight: 600; font-size: 13.5px; color: var(--pm-text); letter-spacing: -0.01em; }
.cw-convo-time { font-size: 10.5px; color: var(--pm-muted); font-weight: 400; }
.cw-convo-last {
  font-size: 12px;
  color: var(--pm-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 170px;
  margin-top: 2px;
  font-weight: 400;
}
.cw-unread {
  background: linear-gradient(135deg, var(--pm-accent), var(--pm-accent-2));
  color: #1a1200;
  font-size: 10px;
  font-weight: 700;
  min-width: 18px;
  height: 18px;
  border-radius: 999px;
  padding: 0 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(200,169,110,0.4);
}
.cw-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 12px;
  color: var(--pm-muted);
  padding: 40px 20px;
  text-align: center;
}
.cw-empty svg { opacity: 0.3; }
.cw-empty p { font-weight: 600; font-size: 14px; color: var(--pm-text-2); margin: 0; }
.cw-empty span { font-size: 12px; color: var(--pm-muted); }

.cw-msgs {
  flex: 1;
  overflow-y: auto;
  padding: 14px 14px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  background:
    radial-gradient(ellipse 60% 30% at 50% 0%, rgba(200,169,110,0.06) 0%, transparent 70%),
    var(--pm-bg-soft);
}
.cw-msgs::-webkit-scrollbar { width: 3px; }
.cw-msgs::-webkit-scrollbar-track { background: transparent; }
.cw-msgs::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
.cw-date {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 10px 0 6px;
  font-size: 10.5px;
  color: var(--pm-muted);
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.cw-date::before, .cw-date::after {
  content: "";
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
}
.cw-row { display: flex; align-items: flex-end; gap: 7px; margin-bottom: 2px; }
.cw-row.mine { flex-direction: row-reverse; }
.cw-av-slot { width: 26px; flex-shrink: 0; }
.cw-bwrap { display: flex; flex-direction: column; max-width: 76%; }
.cw-bwrap.mine { align-items: flex-end; }
.cw-bwrap.theirs { align-items: flex-start; }
.cw-bubble {
  padding: 9px 14px;
  border-radius: 18px;
  font-size: 13.5px;
  line-height: 1.5;
  word-break: break-word;
  font-weight: 400;
  transition: opacity 0.2s;
}
.cw-bubble.mine {
  background: linear-gradient(135deg, var(--pm-mine-from), var(--pm-mine-to));
  color: #1a1000;
  border-bottom-right-radius: 5px;
  box-shadow: 0 4px 16px rgba(200,169,110,0.22);
  font-weight: 500;
}
.cw-bubble.mine.last { border-bottom-right-radius: 18px; }
.cw-bubble.theirs {
  background: rgba(255,255,255,0.07);
  color: var(--pm-text);
  border: 1px solid rgba(255,255,255,0.1);
  border-bottom-left-radius: 5px;
  backdrop-filter: blur(4px);
}
.cw-bubble.theirs.last { border-bottom-left-radius: 18px; }
.cw-bubble.sending { opacity: 0.5; }
.cw-img-msg {
  max-width: 210px;
  max-height: 170px;
  border-radius: 14px;
  object-fit: cover;
  margin-bottom: 3px;
  display: block;
  box-shadow: 0 8px 24px rgba(0,0,0,0.35);
}
.cw-img-msg.mine { border-bottom-right-radius: 5px; }
.cw-img-msg.theirs { border-bottom-left-radius: 5px; }
.cw-meta { display: flex; align-items: center; gap: 4px; margin-top: 3px; padding: 0 4px; }
.cw-meta.mine { flex-direction: row-reverse; }
.cw-time { font-size: 10px; color: var(--pm-muted); font-weight: 400; }
.cw-delete-timer {
  font-size: 9.5px;
  color: var(--pm-danger);
  font-weight: 600;
  letter-spacing: 0.02em;
  margin-left: 2px;
}

.cw-img-preview {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  background: rgba(255,255,255,0.03);
  border-top: 1px solid var(--pm-border-soft);
  flex-shrink: 0;
}
.cw-img-preview img {
  width: 50px;
  height: 50px;
  border-radius: 10px;
  object-fit: cover;
  border: 1px solid var(--pm-border);
}
.cw-img-preview button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.1);
  color: var(--pm-muted);
  cursor: pointer;
  transition: all 0.16s ease;
}
.cw-img-preview button:hover { background: var(--pm-danger-soft); color: var(--pm-danger); border-color: rgba(240,96,112,0.3); }

.cw-input-area {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px 13px;
  background: linear-gradient(0deg, rgba(10,13,20,0.95), rgba(10,13,20,0.7));
  border-top: 1px solid var(--pm-border-soft);
  flex-shrink: 0;
}
.cw-attach {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  color: var(--pm-muted);
  cursor: pointer;
  transition: all 0.18s cubic-bezier(0.4,0,0.2,1);
  flex-shrink: 0;
}
.cw-attach:hover {
  background: var(--pm-accent-glow);
  color: var(--pm-accent-2);
  border-color: var(--pm-border-accent);
  transform: scale(1.06);
}
.cw-input {
  flex: 1;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 999px;
  padding: 8.5px 16px;
  font-size: 13.5px;
  background: rgba(255,255,255,0.05);
  color: var(--pm-text);
  outline: none;
  transition: border-color 0.18s, background 0.18s, box-shadow 0.18s;
  font-family: "DM Sans", "Inter", sans-serif;
}
.cw-input:focus {
  border-color: rgba(200,169,110,0.4);
  background: rgba(255,255,255,0.08);
  box-shadow: 0 0 0 3px rgba(200,169,110,0.08);
}
.cw-input::placeholder { color: var(--pm-muted); }
.cw-send {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.06);
  color: var(--pm-muted);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1);
  flex-shrink: 0;
}
.cw-send.active {
  border-color: transparent;
  background: linear-gradient(135deg, var(--pm-mine-from), var(--pm-mine-to));
  color: #1a1000;
  box-shadow: 0 4px 16px rgba(200,169,110,0.3);
}
.cw-send.active:hover {
  transform: scale(1.1) translateY(-1px);
  box-shadow: 0 8px 24px rgba(200,169,110,0.4);
}
.cw-send:disabled { cursor: not-allowed; opacity: 0.5; }

.npanel {
  position: fixed;
  top: 72px;
  right: 16px;
  width: 354px;
  max-height: 500px;
  background: linear-gradient(175deg, rgba(13,17,28,0.97) 0%, rgba(10,13,20,0.98) 100%);
  border: 1px solid var(--pm-border);
  border-top: 1px solid rgba(255,255,255,0.13);
  border-radius: 22px;
  box-shadow: var(--pm-shadow), 0 0 0 1px rgba(200,169,110,0.05) inset, 0 1px 0 rgba(255,255,255,0.07) inset;
  backdrop-filter: blur(28px) saturate(1.4);
  -webkit-backdrop-filter: blur(28px) saturate(1.4);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1400;
  animation: cwIn 0.28s cubic-bezier(0.16,1,0.3,1);
}
.npanel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--pm-border-soft);
  background: linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%);
  flex-shrink: 0;
  position: relative;
}
.npanel-header::after {
  content: "";
  position: absolute;
  bottom: 0; left: 16px; right: 16px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(200,169,110,0.2), transparent);
}
.npanel-title {
  font-weight: 700;
  font-size: 15px;
  color: var(--pm-text);
  flex: 1;
  letter-spacing: -0.01em;
  font-family: "DM Sans", "Inter", sans-serif;
}
.npanel-badge {
  background: linear-gradient(135deg, #f05070, #e8405a);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  min-width: 19px;
  height: 19px;
  border-radius: 999px;
  padding: 0 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 14px rgba(240,80,112,0.5), 0 0 0 2px rgba(240,80,112,0.15);
}
.npanel-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 9px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.07);
  color: var(--pm-muted);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
}
.npanel-close:hover {
  background: var(--pm-accent-glow);
  border-color: var(--pm-border-accent);
  color: var(--pm-accent-2);
  transform: scale(1.05);
}
.npanel-body { flex: 1; overflow-y: auto; padding: 6px 0; }
.npanel-body::-webkit-scrollbar { width: 3px; }
.npanel-body::-webkit-scrollbar-track { background: transparent; }
.npanel-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 3px; }
.npanel-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 44px 20px;
  gap: 12px;
  color: var(--pm-muted);
}
.npanel-empty svg { opacity: 0.25; }
.npanel-empty p { font-size: 13.5px; color: var(--pm-text-2); margin: 0; font-weight: 600; }
.npanel-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  transition: background 0.16s ease;
  position: relative;
}
.npanel-item::before {
  content: "";
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 3px;
  background: linear-gradient(180deg, var(--pm-accent), var(--pm-accent-2));
  border-radius: 0 2px 2px 0;
  opacity: 0;
  transition: opacity 0.18s;
}
.npanel-item:hover { background: rgba(255,255,255,0.03); }
.npanel-item:hover::before { opacity: 1; }
.npanel-item-icon {
  width: 36px;
  height: 36px;
  border-radius: 11px;
  background: linear-gradient(135deg, rgba(200,169,110,0.15), rgba(200,169,110,0.08));
  color: var(--pm-accent-2);
  border: 1px solid rgba(200,169,110,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
  box-shadow: 0 4px 12px rgba(200,169,110,0.1);
}
.npanel-item-body { flex: 1; min-width: 0; }
.npanel-item-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--pm-text);
  margin: 0 0 2px;
  letter-spacing: -0.01em;
}
.npanel-item-sub {
  font-size: 11.5px;
  color: var(--pm-muted);
  margin: 0 0 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.npanel-item-price {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--pm-accent-2);
  margin: 0;
  letter-spacing: -0.01em;
}
.npanel-item-actions { display: flex; flex-direction: column; gap: 6px; flex-shrink: 0; }
.npanel-accept, .npanel-reject {
  height: 30px;
  padding: 0 14px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1);
  letter-spacing: 0.01em;
  font-family: "DM Sans", "Inter", sans-serif;
}
.npanel-accept {
  background: linear-gradient(135deg, #3db87a, #4ecca3);
  color: #051a10;
  box-shadow: 0 4px 14px rgba(78,204,163,0.25);
}
.npanel-reject {
  background: var(--pm-danger-soft);
  color: #f08090;
  border-color: rgba(240,96,112,0.3);
}
.npanel-accept:hover {
  transform: translateY(-2px) scale(1.03);
  box-shadow: 0 8px 20px rgba(78,204,163,0.35);
}
.npanel-reject:hover {
  background: rgba(240,96,112,0.2);
  transform: translateY(-2px) scale(1.03);
  box-shadow: 0 8px 20px rgba(240,96,112,0.2);
}

@media (max-width: 480px) {
  .cw, .npanel { width: calc(100vw - 20px); right: 10px; top: 66px; }
  .cw { height: 74vh; }
  .npanel { max-height: 70vh; }
}
`;
