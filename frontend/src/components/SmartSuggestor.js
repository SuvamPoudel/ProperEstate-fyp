import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../constants";
import EsewaPayment from "./EsewaPayment";

// ─── Input normalizers ───────────────────────────────────────────────────────
const normalizePrice = (v) => {
  const s = v.toLowerCase().replace(/,/g, "").trim();
  const m = s.match(/^(\d+(?:\.\d+)?)\s*(k|thousand|lakh)?/);
  if (!m) return null;
  let n = parseFloat(m[1]);
  if (m[2] === "k" || m[2] === "thousand") n *= 1000;
  if (m[2] === "lakh") n *= 100000;
  return Math.round(n);
};

const normalizeProvince = (v) => {
  const map = { bagmati:"Bagmati", bagma:"Bagmati", gandaki:"Gandaki", lumbini:"Lumbini",
    koshi:"Koshi", madhesh:"Madhesh", karnali:"Karnali", sudurpashchim:"Sudurpashchim",
    sudur:"Sudurpashchim", province1:"Koshi", province2:"Madhesh", province3:"Bagmati",
    province4:"Gandaki", province5:"Lumbini", province6:"Karnali", province7:"Sudurpashchim" };
  return map[v.toLowerCase().trim()] || v.trim();
};

const normalizeLocation = (v) => {
  const map = { ktm:"Kathmandu", kathmandu:"Kathmandu", pkr:"Pokhara", pokhara:"Pokhara",
    brt:"Biratnagar", chitwan:"Chitwan", lalitpur:"Lalitpur", bhaktapur:"Bhaktapur",
    butwal:"Butwal", birgunj:"Birgunj", dharan:"Dharan", hetauda:"Hetauda" };
  return map[v.toLowerCase().trim()] || v.trim();
};

const normalizeCategory = (v) => {
  const s = v.toLowerCase().trim();
  if (/^house|villa|bungalow|flat|apartment|bhk|duplex|studio/.test(s)) return "House";
  if (/^room|kotha|pg/.test(s)) return "Room";
  if (/^land|khet|plot|agri/.test(s)) return "Land";
  if (/^commercial|office|shop|pasal/.test(s)) return "Commercial";
  return v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();
};

// ─── Flow definitions ────────────────────────────────────────────────────────
const FLOWS = {
  list_property: {
    intent: ["list my property","post property","add property","list a property","sell property",
             "rent out","list land","add listing","i want to rent","i have a property","i have land",
             "i have a house","i have a room","want to list"],
    fee: 500, feeDesc: "Property Listing Fee",
    apiPath: "/add-land", isFormData: true,
    successMsg: "🎉 Your property is now live and pending admin verification! You'll be notified once it's approved.",
    steps: [
      { key:"title",       prompt:"What's the title of your property?\n(e.g. *2BHK Flat in Thamel*, *Room in Mandikhatar*)" },
      { key:"location",    prompt:"Full address / area? (e.g. *Mandikhatar, Kathmandu*)" },
      { key:"province",    prompt:"Province? (e.g. *Bagmati*, *Gandaki*, *Lumbini*…)" },
      { key:"district",    prompt:"District? (e.g. *Kathmandu*, *Kaski*, *Chitwan*)" },
      { key:"city",        prompt:"City or municipality?" },
      { key:"mapUrl",      prompt:"Landmark or GPS coordinates for the map?\n(e.g. *Near Mandikhatar Chowk* or *27.7215, 85.3620*, or type *skip*)" },
      { key:"price",       prompt:"Monthly rent in Rs.? (e.g. *15000* or *15k*)",
        normalize: normalizePrice,
        validate: v => normalizePrice(v) === null ? "Please enter a valid amount (e.g. 15000 or 15k)" : null },
      { key:"mainCategory",prompt:"Category — *House*, *Land*, *Room*, or *Commercial*?",
        normalize: normalizeCategory },
      { key:"subCategory", prompt:"Sub-category?\n(e.g. *Apartment / Flat*, *Single Room*, *Agricultural Land*, *Office Space*)" },
      { key:"areaSize",    prompt:"Area size? (e.g. *850 sqft*, *4 aana*, or *skip*)" },
      { key:"description", prompt:"Brief description — what makes it special?" },
      { key:"ownerName",   prompt:"Your name as owner:" },
      { key:"ownerPhone",  prompt:"Your phone number (10 digits):",
        validate: v => !/^[0-9]{10}$/.test(v.replace(/\s/g,"")) ? "Please enter a valid 10-digit phone" : null },
      { key:"ownerEmail",  prompt:"Your email address:",
        validate: v => !/\S+@\S+\.\S+/.test(v) ? "Please enter a valid email" : null },
      { key:"__image__",   prompt:"📸 Add a photo of your property? Tap the 📎 button below to attach an image, or type *skip*", isImage: true },
    ],
  },
  rental_partner: {
    intent: ["find rental partner","rental partner","share rent","find flatmate","looking for flatmate",
             "post partner request","partner request","need a flatmate","want a flatmate"],
    fee: 200, feeDesc: "Rental Partner Listing Fee",
    apiPath: "/rental-partner", isFormData: false,
    successMsg: "🎉 Your rental partner request is now live! People will contact you directly.",
    steps: [
      { key:"name",            prompt:"Your full name:" },
      { key:"phone",           prompt:"Your phone number:",
        validate: v => !/^[0-9]{10}$/.test(v.replace(/\s/g,"")) ? "Please enter a valid 10-digit phone" : null },
      { key:"email",           prompt:"Your email address:",
        validate: v => !/\S+@\S+\.\S+/.test(v) ? "Please enter a valid email" : null },
      { key:"location",        prompt:"Preferred location? (e.g. *Thamel, Kathmandu*)" },
      { key:"budget",          prompt:"Monthly budget in Rs.? (e.g. *12000* or *12k*)",
        normalize: normalizePrice,
        validate: v => normalizePrice(v) === null ? "Please enter a valid amount" : null },
      { key:"propertyType",    prompt:"Looking for — *Land*, *House*, or *Room*?",
        normalize: normalizeCategory },
      { key:"subCategory",     prompt:"Sub-category? (e.g. *Apartment / Flat*, *Room - Living*, *House / Villa*)" },
      { key:"preferredGender", prompt:"Preferred partner gender? (*Male*, *Female*, *Any*, or *skip*)" },
      { key:"moveInDate",      prompt:"Preferred move-in date? (e.g. *2026-07-01*, or *skip*)" },
      { key:"description",     prompt:"Anything else about yourself or preferences? (or *skip*)" },
    ],
  },
  buyer_post: {
    intent: ["post what i need","buyer post","looking for property","need a flat","need a house",
             "need land","post my requirement","post requirement","buyers section","i need a property",
             "searching for property","want to rent"],
    fee: 200, feeDesc: "Buyers Section Post Fee",
    apiPath: "/buyer-posts", isFormData: false,
    successMsg: "🎉 Your buyer request is now live in the Buyers Section! Sellers will reach out to you.",
    steps: [
      { key:"title",        prompt:"Post title? (e.g. *Looking for 2BHK in Lalitpur*)" },
      { key:"propertyType", prompt:"Property type — *House*, *Land*, *Room*, or *Commercial*?",
        normalize: normalizeCategory },
      { key:"subCategory",  prompt:"Sub-category? (e.g. *Apartment / Flat*, *Agricultural Land*)" },
      { key:"location",     prompt:"Preferred location?" },
      { key:"budget",       prompt:"Monthly budget in Rs.?",
        normalize: normalizePrice,
        validate: v => normalizePrice(v) === null ? "Please enter a valid amount" : null },
      { key:"contactPhone", prompt:"Your contact phone:",
        validate: v => !/^[0-9]{10}$/.test(v.replace(/\s/g,"")) ? "Please enter a valid 10-digit phone" : null },
      { key:"contactEmail", prompt:"Your contact email:",
        validate: v => !/\S+@\S+\.\S+/.test(v) ? "Please enter a valid email" : null },
      { key:"description",  prompt:"Any specific requirements? (or *skip*)" },
    ],
  },
};

const detectIntent = (text) => {
  const lower = text.toLowerCase();
  for (const [key, flow] of Object.entries(FLOWS)) {
    if (flow.intent.some(kw => lower.includes(kw))) return key;
  }
  return null;
};

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap');

.pa-fab { position:fixed; bottom:28px; right:28px; height:48px; padding:0 20px; border-radius:99px; background:linear-gradient(135deg,#557373 0%,#3d5555 60%,#272401 100%); color:#F2EFEA; font-family:'DM Sans',sans-serif; font-size:0.85rem; font-weight:600; border:none; box-shadow:0 6px 24px rgba(85,115,115,0.45),0 2px 8px rgba(0,0,0,0.2); cursor:pointer; z-index:1300; display:flex; align-items:center; gap:9px; transition:all 0.22s cubic-bezier(0.34,1.56,0.64,1); letter-spacing:0.01em; }
.pa-fab:hover { transform:translateY(-3px) scale(1.03); box-shadow:0 10px 32px rgba(85,115,115,0.55); }
.pa-fab:active { transform:scale(0.97); }
.pa-fab-dot { width:7px; height:7px; background:#4ecca3; border-radius:50%; box-shadow:0 0 6px rgba(78,204,163,0.7); animation:pa-pulse 2s ease-in-out infinite; flex-shrink:0; }
@keyframes pa-pulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:0.5;transform:scale(0.75);} }

.pa-popup { position:fixed; bottom:90px; right:28px; width:400px; height:620px; background:#F2EFEA; border-radius:24px; box-shadow:0 24px 64px rgba(39,36,1,0.18),0 4px 16px rgba(39,36,1,0.1); display:flex; flex-direction:column; overflow:hidden; z-index:1400; animation:pa-slideUp 0.3s cubic-bezier(0.16,1,0.3,1); border:1px solid rgba(85,115,115,0.15); }
@keyframes pa-slideUp { from{opacity:0;transform:translateY(24px) scale(0.95);} to{opacity:1;transform:translateY(0) scale(1);} }

.pa-pop-head { background:linear-gradient(135deg,#557373 0%,#3d5555 50%,#272401 100%); padding:14px 16px; display:flex; align-items:center; justify-content:space-between; flex-shrink:0; position:relative; overflow:hidden; }
.pa-pop-head::before { content:''; position:absolute; inset:0; background:radial-gradient(ellipse 60% 80% at 90% 30%,rgba(223,229,243,0.12) 0%,transparent 60%); pointer-events:none; }
.pa-pop-head-left { display:flex; align-items:center; gap:10px; position:relative; }
.pa-pop-avatar { width:38px; height:38px; background:rgba(242,239,234,0.15); border:1.5px solid rgba(242,239,234,0.3); border-radius:50%; display:flex; align-items:center; justify-content:center; color:#F2EFEA; flex-shrink:0; }
.pa-pop-name { font-family:'DM Serif Display',Georgia,serif; font-size:0.95rem; font-weight:400; font-style:italic; color:#F2EFEA; display:block; line-height:1.2; }
.pa-pop-status { font-family:'DM Sans',sans-serif; font-size:0.65rem; color:rgba(242,239,234,0.7); display:flex; align-items:center; gap:5px; margin-top:1px; }
.pa-pop-online { width:6px; height:6px; background:#4ecca3; border-radius:50%; box-shadow:0 0 5px rgba(78,204,163,0.6); animation:pa-pulse 2s ease-in-out infinite; }
.pa-pop-actions { display:flex; gap:5px; position:relative; }
.pa-pop-btn { width:28px; height:28px; background:rgba(242,239,234,0.12); border:1px solid rgba(242,239,234,0.2); border-radius:50%; color:#F2EFEA; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:background 0.18s ease; }
.pa-pop-btn:hover { background:rgba(242,239,234,0.25); }
.pa-pop-btn.cancel-btn { background:rgba(240,96,112,0.2); border-color:rgba(240,96,112,0.4); }
.pa-pop-btn.cancel-btn:hover { background:rgba(240,96,112,0.35); }

.pa-flow-bar { padding:8px 14px 0; flex-shrink:0; }
.pa-flow-label { font-family:'DM Sans',sans-serif; font-size:0.58rem; font-weight:700; text-transform:uppercase; letter-spacing:0.14em; color:#557373; margin:0 0 5px; display:flex; justify-content:space-between; align-items:center; }
.pa-flow-label span { color:#a0aeae; font-weight:400; text-transform:none; letter-spacing:0; }
.pa-flow-progress { display:flex; gap:3px; }
.pa-flow-step { height:3px; flex:1; border-radius:99px; background:#e8e4de; transition:background 0.3s ease; }
.pa-flow-step.done { background:#557373; }
.pa-flow-step.active { background:linear-gradient(90deg,#557373,#3d5555); }

.pa-pop-msgs { flex:1; overflow-y:auto; padding:12px 12px 6px; display:flex; flex-direction:column; gap:3px; background:#F2EFEA; scroll-behavior:smooth; }
.pa-pop-msgs::-webkit-scrollbar { width:3px; }
.pa-pop-msgs::-webkit-scrollbar-thumb { background:rgba(85,115,115,0.2); border-radius:3px; }

.pa-pop-row { display:flex; align-items:flex-end; gap:7px; margin-bottom:2px; animation:pa-msgIn 0.2s ease; }
@keyframes pa-msgIn { from{opacity:0;transform:translateY(8px);} to{opacity:1;transform:translateY(0);} }
.pa-pop-row.user { flex-direction:row-reverse; }
.pa-pop-bot-icon { width:26px; height:26px; background:linear-gradient(135deg,#557373,#3d5555); border-radius:50%; display:flex; align-items:center; justify-content:center; color:#F2EFEA; flex-shrink:0; margin-bottom:2px; }

.pa-pop-bubble { max-width:82%; padding:9px 13px; border-radius:18px; font-family:'DM Sans',sans-serif; font-size:0.875rem; line-height:1.55; word-break:break-word; }
.pa-pop-bubble.bot { background:#fff; color:#272401; border-bottom-left-radius:5px; box-shadow:0 2px 8px rgba(39,36,1,0.07); }
.pa-pop-bubble.user { background:linear-gradient(135deg,#557373,#3d5555); color:#F2EFEA; border-bottom-right-radius:5px; }
.pa-pop-bubble-time { font-size:0.58rem; opacity:0.4; margin-top:3px; text-align:right; }

.pa-pop-typing { display:flex; align-items:center; gap:5px; padding:4px 2px; }
.pa-pop-dot { width:7px; height:7px; background:#a0aeae; border-radius:50%; animation:pa-bounce 1.2s infinite; }
.pa-pop-dot:nth-child(2){animation-delay:0.2s;} .pa-pop-dot:nth-child(3){animation-delay:0.4s;}
@keyframes pa-bounce { 0%,60%,100%{transform:translateY(0);} 30%{transform:translateY(-6px);} }

.pa-pop-quick { margin-top:8px; }
.pa-pop-quick-label { font-family:'DM Sans',sans-serif; font-size:0.6rem; font-weight:700; text-transform:uppercase; letter-spacing:0.12em; color:#a0aeae; margin:0 0 7px 2px; }
.pa-pop-quick-grid { display:flex; flex-direction:column; gap:5px; }
.pa-pop-quick-btn { background:#fff; border:1.5px solid rgba(85,115,115,0.2); border-radius:12px; padding:8px 13px; font-family:'DM Sans',sans-serif; font-size:0.82rem; color:#272401; cursor:pointer; text-align:left; display:flex; align-items:center; gap:9px; transition:all 0.18s cubic-bezier(0.34,1.56,0.64,1); font-weight:500; box-shadow:0 1px 4px rgba(39,36,1,0.05); }
.pa-pop-quick-btn:hover { background:rgba(85,115,115,0.07); border-color:#557373; color:#3d5555; transform:translateX(3px); }

.pa-confirm-card { background:#fff; border:1.5px solid rgba(85,115,115,0.2); border-radius:14px; padding:12px 14px; margin-top:8px; box-shadow:0 2px 10px rgba(39,36,1,0.07); }
.pa-confirm-title { font-family:'DM Serif Display',Georgia,serif; font-size:0.9rem; font-style:italic; color:#272401; margin:0 0 8px; }
.pa-confirm-row { display:flex; justify-content:space-between; align-items:flex-start; padding:3px 0; border-bottom:1px solid rgba(85,115,115,0.07); gap:8px; }
.pa-confirm-row:last-child { border-bottom:none; }
.pa-confirm-key { font-family:'DM Sans',sans-serif; font-size:0.68rem; color:#6b7a7a; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; flex-shrink:0; }
.pa-confirm-val { font-family:'DM Sans',sans-serif; font-size:0.8rem; color:#272401; font-weight:500; text-align:right; word-break:break-word; }
.pa-confirm-img { width:60px; height:44px; border-radius:7px; object-fit:cover; margin-top:4px; }

.pa-pay-btn { width:100%; margin-top:10px; padding:12px; border-radius:99px; background:linear-gradient(135deg,#557373,#3d5555); color:#F2EFEA; border:none; font-family:'DM Sans',sans-serif; font-size:0.88rem; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; transition:all 0.2s cubic-bezier(0.34,1.56,0.64,1); box-shadow:0 4px 18px rgba(85,115,115,0.4); position:relative; overflow:hidden; }
.pa-pay-btn::after { content:''; position:absolute; top:0; left:-60%; width:40%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent); transform:skewX(-20deg); }
.pa-pay-btn:hover { transform:translateY(-2px) scale(1.02); box-shadow:0 8px 28px rgba(85,115,115,0.5); }
.pa-pay-btn:hover::after { animation:pa-shine 0.5s ease forwards; }
@keyframes pa-shine { 0%{left:-60%;} 100%{left:120%;} }

.pa-success-card { background:#fff; border:1.5px solid rgba(78,204,163,0.3); border-radius:14px; padding:18px 14px; text-align:center; margin-top:8px; box-shadow:0 2px 10px rgba(39,36,1,0.07); }
.pa-success-emoji { font-size:2rem; margin-bottom:6px; }
.pa-success-title { font-family:'DM Serif Display',Georgia,serif; font-size:1rem; font-style:italic; color:#272401; margin:0 0 5px; }
.pa-success-sub { font-family:'DM Sans',sans-serif; font-size:0.8rem; color:#6b7a7a; line-height:1.6; margin:0; }

.pa-pop-props { display:flex; flex-direction:column; gap:6px; margin-top:8px; }
.pa-pop-prop-label { font-family:'DM Sans',sans-serif; font-size:0.62rem; font-weight:700; text-transform:uppercase; letter-spacing:0.1em; color:#557373; margin:0 0 3px 2px; }
.pa-pop-prop-card { display:flex; align-items:center; gap:9px; background:#fff; border:1.5px solid rgba(85,115,115,0.15); border-radius:11px; padding:7px 9px; cursor:pointer; transition:all 0.18s ease; box-shadow:0 1px 4px rgba(39,36,1,0.06); }
.pa-pop-prop-card:hover { border-color:#557373; background:rgba(85,115,115,0.05); transform:translateX(2px); }
.pa-pop-prop-card-alt { border-color:rgba(154,108,26,0.15); }
.pa-pop-prop-card-alt:hover { border-color:#9a6c1a; background:rgba(154,108,26,0.05); }
.pa-pop-prop-img { width:42px; height:42px; border-radius:7px; object-fit:cover; flex-shrink:0; background:#e8e4de; }
.pa-pop-prop-info { flex:1; min-width:0; }
.pa-pop-prop-name { font-family:'DM Sans',sans-serif; font-size:0.78rem; font-weight:600; color:#272401; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:block; }
.pa-pop-prop-loc  { font-size:0.66rem; color:#6b7a7a; display:block; margin-top:1px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.pa-pop-prop-price{ font-size:0.76rem; font-weight:700; color:#557373; display:block; margin-top:2px; }
.pa-pop-prop-arrow { color:#a0aeae; flex-shrink:0; }

/* Image preview in chat */
.pa-img-preview-bar { display:flex; align-items:center; gap:8px; padding:6px 12px; background:#fff; border-top:1px solid rgba(85,115,115,0.1); flex-shrink:0; }
.pa-img-preview-bar img { width:44px; height:44px; border-radius:8px; object-fit:cover; border:1px solid rgba(85,115,115,0.2); }
.pa-img-preview-bar button { width:22px; height:22px; border-radius:50%; background:rgba(240,96,112,0.1); border:1px solid rgba(240,96,112,0.3); color:#f06070; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.15s ease; }
.pa-img-preview-bar button:hover { background:rgba(240,96,112,0.2); }

.pa-pop-input-area { padding:8px 12px 12px; background:#fff; border-top:1px solid rgba(85,115,115,0.1); flex-shrink:0; }
.pa-pop-input-wrap { display:flex; align-items:center; background:#F2EFEA; border-radius:99px; padding:4px 4px 4px 14px; gap:5px; border:1.5px solid transparent; transition:border-color 0.18s ease,box-shadow 0.18s ease,background 0.18s ease; }
.pa-pop-input-wrap:focus-within { border-color:#557373; background:#fff; box-shadow:0 0 0 4px rgba(85,115,115,0.1); }
.pa-pop-attach { width:30px; height:30px; border-radius:50%; border:none; background:transparent; color:#a0aeae; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:color 0.15s ease; flex-shrink:0; }
.pa-pop-attach:hover { color:#557373; }
.pa-pop-input { flex:1; border:none; background:transparent; font-family:'DM Sans',sans-serif; font-size:0.88rem; outline:none; color:#272401; padding:6px 0; }
.pa-pop-input::placeholder { color:#a0aeae; }
.pa-pop-input:disabled { opacity:0.6; }
.pa-pop-send { width:34px; height:34px; border-radius:50%; border:none; background:#e8e4de; color:#a0aeae; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.2s cubic-bezier(0.34,1.56,0.64,1); flex-shrink:0; }
.pa-pop-send.ready { background:linear-gradient(135deg,#557373,#3d5555); color:#F2EFEA; box-shadow:0 3px 12px rgba(85,115,115,0.4); }
.pa-pop-send.ready:hover { transform:scale(1.1); }
.pa-pop-send:disabled { cursor:not-allowed; opacity:0.5; }
.pa-pop-footer { text-align:center; font-family:'DM Sans',sans-serif; font-size:0.6rem; color:#a0aeae; padding:4px 0 1px; letter-spacing:0.02em; }

@media (max-width:480px) {
  .pa-popup { width:calc(100vw - 16px); right:8px; bottom:82px; height:74vh; }
  .pa-fab { right:10px; bottom:20px; }
}
`;

const QUICK_ACTIONS = [
  { icon:"🏠", label:"Find a flat in Kathmandu under Rs.20,000" },
  { icon:"📋", label:"List my property" },
  { icon:"🤝", label:"Find rental partner" },
  { icon:"📢", label:"Post what I need" },
  { icon:"🌿", label:"Agricultural land in Chitwan" },
  { icon:"💰", label:"Cheapest rentals in Nepal" },
];

const WELCOME = "Namaste! 🙏 I'm **ProperAgent**, your AI-powered Nepal real estate assistant.\n\nI can help you **find properties**, **list your property**, **find a rental partner**, or **post what you're looking for** — all right here in this chat!\n\nWhat would you like to do?";

const fmt = () => new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });

const renderContent = (text) =>
  text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i}>{part.slice(2,-2)}</strong>
      : <span key={i} style={{ whiteSpace:"pre-wrap" }}>{part}</span>
  );

// ─── Component ───────────────────────────────────────────────────────────────
const SmartSuggestor = ({ user }) => {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [history, setHistory]   = useState([]);
  const [flow, setFlow]         = useState(null);
  const [stepIdx, setStepIdx]   = useState(0);
  const [collected, setCollected] = useState({});
  const [flowStage, setFlowStage] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [imageFile, setImageFile]   = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const bottomRef = useRef();
  const inputRef  = useRef();
  const fileRef   = useRef();
  const navigate  = useNavigate();

  const addMsg = (role, content, extra = {}) =>
    setMessages(prev => [...prev, { role, content, id: Date.now() + Math.random(), ...extra }]);

  useEffect(() => {
    if (open && messages.length === 0) addMsg("assistant", WELCOME);
  }, [open]); // eslint-disable-line

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, loading]);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 120); }, [open]);

  const resetAll = () => {
    setMessages([]); setHistory([]); setInput("");
    setFlow(null); setStepIdx(0); setCollected({});
    setFlowStage(null); setShowPayment(false);
    setImageFile(null); setImagePreview(null);
    setTimeout(() => addMsg("assistant", WELCOME), 50);
  };

  const cancelFlow = () => {
    setFlow(null); setStepIdx(0); setCollected({});
    setFlowStage(null); setImageFile(null); setImagePreview(null);
    addMsg("assistant", "No problem! Flow cancelled. What else can I help you with?");
  };

  // ── Start flow ─────────────────────────────────────────────────────────────
  const startFlow = (flowKey) => {
    const f = FLOWS[flowKey];
    setFlow(flowKey); setStepIdx(0); setCollected({}); setFlowStage("collecting");
    const intro = {
      list_property:  "Sure! Let me help you **list your property**. I'll collect the details and post it for you.\n\nA listing fee of **Rs. 500** will be charged via eSewa at the end.\n\n*(Type **cancel** anytime to stop)*",
      rental_partner: "Great! I'll help you **post a rental partner request**. Just answer a few quick questions.\n\nA fee of **Rs. 200** will be charged via eSewa at the end.\n\n*(Type **cancel** anytime to stop)*",
      buyer_post:     "Perfect! I'll help you **post your property requirement** in the Buyers Section.\n\nA fee of **Rs. 200** will be charged via eSewa at the end.\n\n*(Type **cancel** anytime to stop)*",
    }[flowKey];
    addMsg("assistant", intro);
    setTimeout(() => addMsg("assistant", f.steps[0].prompt), 500);
  };

  // ── Handle image pick ──────────────────────────────────────────────────────
  const handleImagePick = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = ev => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
    // If we're on the image step, auto-advance
    if (flowStage === "collecting" && flow) {
      const f = FLOWS[flow];
      const step = f.steps[stepIdx];
      if (step?.isImage) {
        const newCollected = { ...collected, __imageFile__: file };
        setCollected(newCollected);
        advanceStep(newCollected, stepIdx + 1, f);
      }
    }
  };

  const advanceStep = (newCollected, nextIdx, f) => {
    if (nextIdx < f.steps.length) {
      setStepIdx(nextIdx);
      setTimeout(() => addMsg("assistant", f.steps[nextIdx].prompt), 300);
    } else {
      setFlowStage("confirming");
      setTimeout(() => addMsg("assistant",
        "Here's a summary of what I'll post for you. Please review and confirm:",
        { flowConfirm: true, flowKey: flow, collected: newCollected }
      ), 300);
    }
  };

  // ── Handle step input ──────────────────────────────────────────────────────
  const handleFlowInput = (text) => {
    const f = FLOWS[flow];
    const step = f.steps[stepIdx];

    // Cancel check
    if (text.toLowerCase().trim() === "cancel") { cancelFlow(); return; }

    // Image step — if user types skip
    if (step.isImage) {
      const newCollected = { ...collected };
      if (text.toLowerCase().trim() !== "skip") {
        // They typed something instead of attaching — treat as skip
        addMsg("assistant", "No image attached — skipping. You can add photos later from the property page.");
      }
      advanceStep(newCollected, stepIdx + 1, f);
      return;
    }

    const raw = text.trim();
    const isSkip = raw.toLowerCase() === "skip" || raw === "";

    // Validate
    if (!isSkip && step.validate) {
      const err = step.validate(raw);
      if (err) { addMsg("assistant", `⚠️ ${err} Please try again.`); return; }
    }

    // Normalize
    let val = isSkip ? "" : raw;
    if (!isSkip && step.normalize) val = String(step.normalize(raw));

    // Special normalizations
    if (step.key === "province" && !isSkip) val = normalizeProvince(raw);
    if ((step.key === "district" || step.key === "city") && !isSkip) val = normalizeLocation(raw);

    const newCollected = { ...collected, [step.key]: val };
    setCollected(newCollected);
    advanceStep(newCollected, stepIdx + 1, f);
  };

  // ── Submit after payment ───────────────────────────────────────────────────
  const handlePaymentSuccess = async () => {
    setShowPayment(false);
    setFlowStage("done");
    const f = FLOWS[flow];
    const currentFlow = flow;
    addMsg("assistant", "⏳ Submitting your request…");

    try {
      let res;
      if (f.isFormData) {
        const fd = new FormData();
        Object.entries(collected).forEach(([k, v]) => {
          if (k === "__imageFile__" || k === "__image__") return;
          if (v) fd.append(k, v);
        });
        if (collected.__imageFile__) fd.append("media", collected.__imageFile__);
        if (user?._id) fd.append("ownerId", user._id);
        fd.append("status", "pending");
        fd.append("available", "true");
        fd.append("category", collected.mainCategory || "");
        res = await fetch(`${API_URL}${f.apiPath}`, { method:"POST", body:fd });
      } else {
        const body = {};
        Object.entries(collected).forEach(([k,v]) => { if (k !== "__imageFile__" && k !== "__image__") body[k] = v; });
        if (currentFlow === "buyer_post") {
          body.postType = "section";
          if (user?._id) { body.userId = user._id; body.userName = user.name || ""; body.userAvatar = user.avatar || null; }
        }
        if (currentFlow === "rental_partner") {
          if (user?._id) body.userId = user._id;
          body.paymentStatus = "paid";
          if (body.budget) body.budget = parseInt(body.budget);
        }
        res = await fetch(`${API_URL}${f.apiPath}`, {
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify(body),
        });
      }
      const data = await res.json();
      if (data.success || data.land || data.partner || data.post) {
        addMsg("assistant", f.successMsg, { flowSuccess: true });
      } else {
        console.error("Submission error:", data);
        addMsg("assistant", `⚠️ Submission failed: ${data.error || "Unknown error"}. Please try the full form on the page.`);
      }
    } catch (err) {
      addMsg("assistant", `⚠️ Network error: ${err.message}. Please check your connection.`);
    }
    setFlow(null); setFlowStage(null); setImageFile(null); setImagePreview(null);
  };

  // ── Main send ──────────────────────────────────────────────────────────────
  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput("");
    addMsg("user", msg);

    if (flowStage === "collecting") { handleFlowInput(msg); return; }

    const intent = detectIntent(msg);
    if (intent && !flowStage) { startFlow(intent); return; }

    setLoading(true);
    const newHistory = [...history, { role:"user", content:msg }];
    setHistory(newHistory);
    try {
      const res = await fetch(`${API_URL}/ai-advisor`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ messages: newHistory }),
      });
      const data = await res.json();
      const reply = data.reply || "Sorry, I couldn't process that. Please try again.";
      const props = data.properties?.length > 0 ? data.properties : null;
      const suggs = data.suggestions?.length > 0 ? data.suggestions : null;
      addMsg("assistant", reply, { properties: props, suggestions: suggs });
      setHistory(prev => [...prev, { role:"assistant", content:reply }]);
    } catch {
      addMsg("assistant", "Connection error. Please check your internet and try again.");
    }
    setLoading(false);
  };

  // ── Confirm card ───────────────────────────────────────────────────────────
  const renderConfirmCard = (msg) => {
    const f = FLOWS[msg.flowKey];
    const entries = f.steps
      .filter(s => !s.isImage && msg.collected[s.key])
      .map(s => ({
        label: s.key.replace(/([A-Z])/g," $1").replace(/^./,c=>c.toUpperCase()).replace("__",""),
        value: msg.collected[s.key],
      }));
    const hasImg = msg.collected.__imageFile__;
    return (
      <div className="pa-confirm-card">
        <p className="pa-confirm-title">Review your details</p>
        {entries.map((e,i) => (
          <div key={i} className="pa-confirm-row">
            <span className="pa-confirm-key">{e.label}</span>
            <span className="pa-confirm-val">{e.value}</span>
          </div>
        ))}
        {hasImg && imagePreview && (
          <div className="pa-confirm-row">
            <span className="pa-confirm-key">Photo</span>
            <img src={imagePreview} alt="property" className="pa-confirm-img" />
          </div>
        )}
        <button className="pa-pay-btn" onClick={() => { setFlowStage("paying"); setShowPayment(true); }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
          </svg>
          Pay Rs. {f.fee} via eSewa &amp; Submit
        </button>
      </div>
    );
  };

  const renderSuccessCard = () => (
    <div className="pa-success-card">
      <div className="pa-success-emoji">🎉</div>
      <p className="pa-success-title">All done!</p>
      <p className="pa-success-sub">Your submission was successful. Is there anything else I can help you with?</p>
    </div>
  );

  const renderProgress = () => {
    if (!flow || !flowStage || flowStage === "done") return null;
    const f = FLOWS[flow];
    const total = f.steps.length;
    const current = Math.min(stepIdx + 1, total);
    return (
      <div className="pa-flow-bar">
        <p className="pa-flow-label">
          {flow.replace(/_/g," ")}
          <span>Step {current} of {total}</span>
        </p>
        <div className="pa-flow-progress">
          {f.steps.map((_,i) => (
            <div key={i} className={`pa-flow-step ${i < stepIdx ? "done" : i === stepIdx ? "active" : ""}`} />
          ))}
        </div>
      </div>
    );
  };

  const PropCard = ({ p, alt }) => (
    <div className={`pa-pop-prop-card${alt?" pa-pop-prop-card-alt":""}`}
         onClick={() => { setOpen(false); navigate("/land/"+p._id); }}>
      <img src={p.image?(p.image.startsWith("http")?p.image:`${API_URL}/uploads/${p.image}`):"https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=48"} alt={p.title} className="pa-pop-prop-img" />
      <div className="pa-pop-prop-info">
        <span className="pa-pop-prop-name">{p.title}</span>
        <span className="pa-pop-prop-loc">{[p.city,p.district].filter(Boolean).join(", ")||p.location||"Nepal"}</span>
        <span className="pa-pop-prop-price">Rs. {parseInt(p.price||0).toLocaleString()}/mo</span>
      </div>
      <svg className="pa-pop-prop-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
    </div>
  );

  return (
    <>
      <style>{STYLES}</style>
      <input type="file" ref={fileRef} accept="image/*" style={{display:"none"}} onChange={handleImagePick} />

      {showPayment && flow && (
        <EsewaPayment
          amount={FLOWS[flow].fee}
          description={FLOWS[flow].feeDesc+" — ProperEstate"}
          onSuccess={handlePaymentSuccess}
          onCancel={() => {
            setShowPayment(false); setFlowStage("confirming");
            addMsg("assistant","Payment cancelled. Click the Pay button above whenever you're ready.");
          }}
        />
      )}

      <button className="pa-fab" onClick={() => setOpen(o=>!o)} title="ProperAgent AI">
        <span className="pa-fab-dot"/>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        ProperAgent
      </button>

      {open && (
        <div className="pa-popup">
          {/* Header */}
          <div className="pa-pop-head">
            <div className="pa-pop-head-left">
              <div className="pa-pop-avatar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <div>
                <span className="pa-pop-name">ProperAgent AI</span>
                <div className="pa-pop-status"><span className="pa-pop-online"/>Nepal Real Estate Expert</div>
              </div>
            </div>
            <div className="pa-pop-actions">
              {flowStage === "collecting" && (
                <button className="pa-pop-btn cancel-btn" onClick={cancelFlow} title="Cancel flow">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              )}
              <button className="pa-pop-btn" onClick={resetAll} title="New chat">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>
              </button>
              <button className="pa-pop-btn" onClick={() => navigate("/proper-agent")} title="Open full page">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </button>
              <button className="pa-pop-btn" onClick={() => setOpen(false)} title="Close">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>

          {renderProgress()}

          {/* Messages */}
          <div className="pa-pop-msgs">
            {messages.map((msg,i) => (
              <div key={msg.id||i} className={"pa-pop-row "+msg.role}>
                {msg.role === "assistant" && (
                  <div className="pa-pop-bot-icon">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                )}
                <div className={"pa-pop-bubble "+(msg.role==="assistant"?"bot":"user")}>
                  <div>{renderContent(msg.content)}</div>
                  {msg.flowConfirm && renderConfirmCard(msg)}
                  {msg.flowSuccess && renderSuccessCard()}
                  {msg.properties?.length > 0 && (
                    <div className="pa-pop-props">
                      <p className="pa-pop-prop-label">📍 {msg.properties.length} match{msg.properties.length!==1?"es":""} — tap to view:</p>
                      {msg.properties.map(p => <PropCard key={p._id} p={p} />)}
                    </div>
                  )}
                  {msg.suggestions?.length > 0 && (
                    <div className="pa-pop-props" style={{marginTop:msg.properties?.length>0?8:0}}>
                      <p className="pa-pop-prop-label" style={{color:"#9a6c1a"}}>🌍 Explore more in other cities:</p>
                      {msg.suggestions.map(p => <PropCard key={p._id} p={p} alt />)}
                    </div>
                  )}
                  <div className="pa-pop-bubble-time">{fmt()}</div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="pa-pop-row assistant">
                <div className="pa-pop-bot-icon">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                <div className="pa-pop-bubble bot">
                  <div className="pa-pop-typing"><span className="pa-pop-dot"/><span className="pa-pop-dot"/><span className="pa-pop-dot"/></div>
                </div>
              </div>
            )}

            {messages.length === 1 && !loading && !flowStage && (
              <div className="pa-pop-quick">
                <p className="pa-pop-quick-label">What can I help with?</p>
                <div className="pa-pop-quick-grid">
                  {QUICK_ACTIONS.map((a,i) => (
                    <button key={i} className="pa-pop-quick-btn" onClick={() => sendMessage(a.label)}>
                      <span>{a.icon}</span>{a.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Image preview bar */}
          {imagePreview && flowStage === "collecting" && (
            <div className="pa-img-preview-bar">
              <img src={imagePreview} alt="preview"/>
              <span style={{flex:1,fontFamily:"'DM Sans',sans-serif",fontSize:"0.78rem",color:"#557373",fontWeight:600}}>Photo attached ✓</span>
              <button onClick={() => { setImageFile(null); setImagePreview(null); }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          )}

          {/* Input */}
          <div className="pa-pop-input-area">
            <div className="pa-pop-input-wrap">
              <button className="pa-pop-attach" onClick={() => fileRef.current?.click()} title="Attach photo">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              </button>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key==="Enter" && !e.shiftKey && sendMessage()}
                placeholder={flowStage==="collecting" ? "Type your answer… (or 'skip' / 'cancel')" : "Ask anything about Nepal real estate…"}
                className="pa-pop-input"
                disabled={loading || flowStage==="paying"}
              />
              <button
                className={"pa-pop-send "+(input.trim()&&!loading?"ready":"")}
                onClick={() => sendMessage()}
                disabled={!input.trim()||loading||flowStage==="paying"}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
              </button>
            </div>
            <p className="pa-pop-footer">ProperAgent · AI-powered · Nepal Real Estate</p>
          </div>
        </div>
      )}
    </>
  );
};

export default SmartSuggestor;
