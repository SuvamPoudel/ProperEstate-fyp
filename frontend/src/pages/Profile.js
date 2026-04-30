import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { API_URL } from "../constants";
import "../ProfilePage.css";

/* ── SVG icons ───────────────────────────────────────────────────── */
const Icon = {
  user:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  phone:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  mail:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  camera: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  check:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  shield: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  clock:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
};

/* ── Become Seller section ───────────────────────────────────────── */
const BecomeSellerSection = ({ user, setUser }) => {
  const [open, setOpen]     = useState(false);
  const [docType, setDocType] = useState("citizenship");
  const [file, setFile]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone]     = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { alert("Please upload your document."); return; }
    setLoading(true);
    const fd = new FormData();
    fd.append("userId", user._id);
    fd.append("sellerDocType", docType);
    fd.append("sellerDoc", file);
    const res  = await fetch(`${API_URL}/become-seller`, { method:"POST", body:fd });
    const data = await res.json();
    if (data.success) {
      setUser(data.user);
      localStorage.setItem("properEstateUser", JSON.stringify(data.user));
      setDone(true);
    } else alert(data.message || "Failed");
    setLoading(false);
  };

  if (user.accountType === "seller") return (
    <div className="pp-seller-status approved">
      <div className="pp-seller-icon">✓</div>
      <div>
        <h3>Verified Seller</h3>
        <p>You can list properties on ProperEstate.</p>
      </div>
    </div>
  );

  if (user.accountType === "seller_pending" || done) return (
    <div className="pp-seller-status pending">
      <div className="pp-seller-icon">⏳</div>
      <div>
        <h3>Verification Pending</h3>
        <p>Admin reviews within 24–48 hours.</p>
      </div>
    </div>
  );

  return (
    <div>
      <button
        className={"pp-accordion-toggle " + (open ? "open" : "")}
        onClick={() => setOpen(o => !o)}
        type="button"
      >
        <span className="pp-accordion-label">Become a Seller</span>
        <span className="pp-accordion-chevron">▾</span>
      </button>

      {open && (
        <div className="pp-accordion-body">
          <p>Upload a valid government ID to start listing properties for rent.</p>
          <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div className="pp-field">
              <label>Document Type</label>
              <select className="pp-select" value={docType} onChange={e => setDocType(e.target.value)}>
                <option value="citizenship">Citizenship Certificate</option>
                <option value="nid">National ID (NID)</option>
                <option value="passport">Passport</option>
              </select>
            </div>
            <div className="pp-field">
              <label>Upload Document</label>
              <div className="pp-file-input-wrap">
                <input type="file" accept="image/*,.pdf" onChange={e => setFile(e.target.files[0])} required />
              </div>
            </div>
            <button className="pp-btn pp-btn-primary pp-btn-full" type="submit" disabled={loading}>
              {loading ? "Uploading…" : "Submit for Verification"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

/* ── Main Profile Page ───────────────────────────────────────────── */
function ProfilePage({ user, setUser }) {
  const [formData, setFormData] = useState({ name: user?.name || "", phone: user?.phone || "" });
  const [file, setFile]         = useState(null);
  const [phoneError, setPhoneError] = useState("");
  const [saved, setSaved]       = useState(false);

  const validatePhone = (val) => {
    if (val && !/^[0-9]{10}$/.test(val)) setPhoneError("Phone must be exactly 10 digits");
    else setPhoneError("");
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (formData.phone && !/^[0-9]{10}$/.test(formData.phone)) { setPhoneError("Phone must be exactly 10 digits"); return; }
    const data = new FormData();
    data.append("userId", user._id);
    data.append("name",   formData.name);
    data.append("phone",  formData.phone);
    if (file) data.append("avatar", file);
    const res    = await fetch(`${API_URL}/update-profile`, { method:"POST", body:data });
    const result = await res.json();
    if (result.success) {
      setUser(result.user);
      localStorage.setItem("properEstateUser", JSON.stringify(result.user));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  if (!user) return <Navigate to="/login" />;

  const avatarSrc = file
    ? URL.createObjectURL(file)
    : (user.avatar ? `${API_URL}/uploads/${user.avatar}` : null);

  const roleLabel =
    user.role === "admin"                   ? "Admin"
    : user.accountType === "seller"         ? "Verified Seller"
    : user.accountType === "seller_pending" ? "Pending Review"
    : "Buyer";

  const roleBadgeClass =
    user.role === "admin"                   ? "olive"
    : user.accountType === "seller"         ? "success"
    : user.accountType === "seller_pending" ? "warn"
    : "teal";

  const memberSince = user.createdAt ? new Date(user.createdAt).getFullYear() : "—";

  return (
    <div className="profile-page-wrapper">

      {/* ── Cover ── */}
      <div className="pp-cover" />

      {/* ── Main container ── */}
      <div className="pp-container">

        {/* ── Avatar row ── */}
        <div className="pp-avatar-row">
          <div className="pp-avatar-wrap">
            <div className="pp-avatar-ring">
              {avatarSrc
                ? <img src={avatarSrc} alt="avatar" className="pp-avatar-img" />
                : <div className="pp-avatar-placeholder">{user.name?.[0]?.toUpperCase() || "U"}</div>
              }
            </div>
            <input type="file" id="ppAvatarInput" hidden accept="image/*" onChange={e => setFile(e.target.files[0])} />
            <label htmlFor="ppAvatarInput" className="pp-camera-btn" title="Change photo">
              {Icon.camera}
            </label>
          </div>

          <div className="pp-header-actions">
            <span className={`pp-badge ${roleBadgeClass}`}>
              {user.role === "admin" ? Icon.shield : user.accountType === "seller" ? Icon.check : Icon.clock}
              {roleLabel}
            </span>
          </div>
        </div>

        {/* ── Identity ── */}
        <div className="pp-identity">
          <h1 className="pp-name">{user.name}</h1>
          <p className="pp-email">{user.email}</p>
          <div className="pp-badges">
            <span className="pp-badge mist">Member since {memberSince}</span>
            {user.phone && <span className="pp-badge teal">{user.phone}</span>}
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="pp-stats">
          <div className="pp-stat-card">
            <div className="pp-stat-value">{user.listings || 0}</div>
            <div className="pp-stat-label">Listings</div>
          </div>
          <div className="pp-stat-card">
            <div className="pp-stat-value">{(user.savedLands || []).length}</div>
            <div className="pp-stat-label">Saved</div>
          </div>
          <div className="pp-stat-card">
            <div className="pp-stat-value">{memberSince}</div>
            <div className="pp-stat-label">Since</div>
          </div>
        </div>

        {/* ── Edit profile section ── */}
        <div className="pp-section">
          <h2 className="pp-section-title">Edit Profile</h2>
          <form onSubmit={handleUpdate} style={{ display:"flex", flexDirection:"column", gap:0 }}>
            <div className="pp-field">
              <label>Full Name</label>
              <div className="pp-input-wrap">
                <span className="pp-input-icon">{Icon.user}</span>
                <input
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your full name"
                  required
                />
              </div>
            </div>

            <div className="pp-field">
              <label>Phone</label>
              <div className="pp-input-wrap">
                <span className="pp-input-icon">{Icon.phone}</span>
                <input
                  value={formData.phone}
                  onChange={e => {
                    const v = e.target.value.replace(/\D/g,"").slice(0,10);
                    setFormData({ ...formData, phone: v });
                    validatePhone(v);
                  }}
                  placeholder="10-digit number"
                  maxLength={10}
                  inputMode="numeric"
                />
              </div>
              {phoneError && <p className="pp-field-error">⚠ {phoneError}</p>}
              {formData.phone && !phoneError && formData.phone.length === 10 && (
                <p className="pp-field-ok">✓ Valid number</p>
              )}
            </div>

            <div className="pp-field readonly">
              <label>Email address</label>
              <div className="pp-input-wrap">
                <span className="pp-input-icon">{Icon.mail}</span>
                <input value={user.email} disabled />
              </div>
            </div>

            <button
              className={`pp-btn pp-btn-primary pp-btn-full ${saved ? "saved" : ""}`}
              type="submit"
            >
              {saved ? "Changes Saved" : "Save Changes"}
            </button>
          </form>
        </div>

        {/* ── Seller section ── */}
        <div className="pp-section">
          <h2 className="pp-section-title">Seller Account</h2>
          <BecomeSellerSection user={user} setUser={setUser} />
        </div>

      </div>
    </div>
  );
}

export default ProfilePage;
