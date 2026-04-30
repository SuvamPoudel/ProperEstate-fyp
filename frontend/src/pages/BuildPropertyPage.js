import React, { useState, useEffect } from "react";
import { API_URL } from "../constants";
import "../BuildPropertyPage.css";

const NEPAL_PROVINCES = ["Koshi","Madhesh","Bagmati","Gandaki","Lumbini","Karnali","Sudurpashchim"];

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) => Number(n || 0).toLocaleString();
const statusColor = { open:"#4caf50", negotiating:"#ff9800", deal_done:"#2196f3",
  in_progress:"#9c27b0", completed:"#00bcd4", cancelled:"#e53935" };
const statusLabel = { open:"Open", negotiating:"Negotiating", deal_done:"Deal Done",
  in_progress:"In Progress", completed:"Completed", cancelled:"Cancelled" };
const buildTypeLabel = { house:"House", villa:"Villa", apartment:"Apartment",
  commercial:"Commercial Space", restaurant:"Restaurant", gym:"Gym",
  swimming_pool:"Swimming Pool", warehouse:"Warehouse", office:"Office",
  hotel:"Hotel", other:"Other" };
const purposeLabel = { personal_use:"Personal Use", business:"Business",
  lease_rent:"Lease / Rent Out", resale:"Resale", restaurant:"Restaurant",
  gym:"Gym", hotel:"Hotel", mixed_use:"Mixed Use", other:"Other" };
const landStatusLabel = { own_land:"I own land", need_land:"Need land",
  land_in_process:"Land acquisition in process" };

// ── Tab: Post a Project ───────────────────────────────────────────────────────
function PostProjectTab({ user }) {
  const [form, setForm] = useState({
    projectTitle:"", buildType:"house", purpose:"personal_use",
    landStatus:"own_land", landLocation:"", landArea:"", province:"", district:"", city:"",
    budgetMin:"", budgetMax:"", budgetFlexible:false,
    expectedStartDate:"", expectedDuration:"",
    description:"", floors:"1", rooms:"", specialRequirements:"", preferredMaterials:""
  });
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [myProjects, setMyProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [offers, setOffers] = useState([]);
  const [progress, setProgress] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentType, setCommentType] = useState("comment");
  const [activeUpdateId, setActiveUpdateId] = useState(null);
  const [negotiateModal, setNegotiateModal] = useState(null);
  const [negBudget, setNegBudget] = useState("");
  const [negDuration, setNegDuration] = useState("");
  const [negMessage, setNegMessage] = useState("");

  const fetchMyProjects = async () => {
    if (!user?._id) return;
    setLoadingProjects(true);
    try {
      const r = await fetch(`${API_URL}/build/projects?ownerId=${user._id}`);
      const d = await r.json();
      if (d.success) setMyProjects(d.projects || []);
    } catch {}
    setLoadingProjects(false);
  };

  useEffect(() => { fetchMyProjects(); }, [user?._id]); // eslint-disable-line

  const fetchProjectDetail = async (proj) => {
    setSelectedProject(proj);
    try {
      const [or, pr] = await Promise.all([
        fetch(`${API_URL}/build/offers/project/${proj._id}`).then(r=>r.json()),
        fetch(`${API_URL}/build/progress/${proj._id}`).then(r=>r.json())
      ]);
      if (or.success) setOffers(or.offers || []);
      if (pr.success) setProgress(pr.updates || []);
    } catch {}
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return alert("Please login first");
    setSubmitting(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k,v]) => fd.append(k, v));
    fd.append("ownerId", user._id);
    fd.append("ownerName", user.name || "");
    fd.append("ownerEmail", user.email || "");
    fd.append("ownerPhone", user.phone || "");
    images.forEach(f => fd.append("referenceImages", f));
    try {
      const r = await fetch(`${API_URL}/build/projects`, { method:"POST", body:fd });
      const d = await r.json();
      if (d.success) { setDone(true); fetchMyProjects(); }
      else alert(d.message || "Failed to post project");
    } catch { alert("Network error"); }
    setSubmitting(false);
  };

  const respondOffer = async (offerId, status, agreedBudget, agreedDuration) => {
    if (!window.confirm(`${status === "accepted" ? "Accept" : "Reject"} this offer?`)) return;
    await fetch(`${API_URL}/build/offers/${offerId}/respond`, {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ status, agreedBudget, agreedDuration, userId: user._id })
    });
    fetchProjectDetail(selectedProject);
    fetchMyProjects();
  };

  const submitNegotiation = async () => {
    if (!negBudget) return alert("Enter a budget");
    await fetch(`${API_URL}/build/offers/${negotiateModal._id}/negotiate`, {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ by:"client", userId:user._id,
        proposedBudget:negBudget, proposedDuration:negDuration, message:negMessage })
    });
    setNegotiateModal(null); setNegBudget(""); setNegDuration(""); setNegMessage("");
    fetchProjectDetail(selectedProject);
  };

  const submitComment = async (updateId) => {
    if (!commentText.trim()) return;
    await fetch(`${API_URL}/build/progress/${updateId}/comment`, {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ userId:user._id, userName:user.name, text:commentText, type:commentType })
    });
    setCommentText(""); setActiveUpdateId(null);
    fetchProjectDetail(selectedProject);
  };

  if (done) return (
    <div className="bp-success">
      <div className="bp-success-icon">🏗️</div>
      <h2>Project Posted!</h2>
      <p>Verified builders can now see your project and submit offers. You'll be notified when offers arrive.</p>
      <button className="bp-btn-primary" onClick={() => { setDone(false); fetchMyProjects(); }}>View My Projects</button>
    </div>
  );

  if (selectedProject) return (
    <ProjectDetailView
      project={selectedProject} offers={offers} progress={progress}
      user={user} onBack={() => setSelectedProject(null)}
      respondOffer={respondOffer}
      onNegotiate={(o) => { setNegotiateModal(o); setNegBudget(o.proposedBudget); setNegDuration(o.estimatedDuration); }}
      negotiateModal={negotiateModal} negBudget={negBudget} negDuration={negDuration} negMessage={negMessage}
      setNegBudget={setNegBudget} setNegDuration={setNegDuration} setNegMessage={setNegMessage}
      submitNegotiation={submitNegotiation} closeNegotiate={() => setNegotiateModal(null)}
      commentText={commentText} setCommentText={setCommentText}
      commentType={commentType} setCommentType={setCommentType}
      activeUpdateId={activeUpdateId} setActiveUpdateId={setActiveUpdateId}
      submitComment={submitComment}
    />
  );

  return (
    <div className="bp-tab-content">
      {/* My Projects */}
      {myProjects.length > 0 && (
        <div className="bp-my-projects">
          <h3 className="bp-section-title">My Projects</h3>
          <div className="bp-projects-grid">
            {myProjects.map(p => (
              <div key={p._id} className="bp-project-card" onClick={() => fetchProjectDetail(p)}>
                <div className="bp-project-card-header">
                  <span className="bp-build-type-badge">{buildTypeLabel[p.buildType] || p.buildType}</span>
                  <span className="bp-status-dot" style={{ background: statusColor[p.status] || "#888" }}>
                    {statusLabel[p.status] || p.status}
                  </span>
                </div>
                <h4>{p.projectTitle}</h4>
                <p className="bp-project-meta">
                  {purposeLabel[p.purpose]} · {landStatusLabel[p.landStatus]}
                </p>
                <p className="bp-project-budget">
                  Rs. {fmt(p.budgetMin)} – {fmt(p.budgetMax)}
                </p>
                <span className="bp-view-link">View Offers & Progress →</span>
              </div>
            ))}
          </div>
          <div className="bp-divider" />
        </div>
      )}
      {loadingProjects && <p className="bp-loading">Loading your projects…</p>}

      {/* Post New Project Form */}
      <h3 className="bp-section-title">Post a New Build Project</h3>
      <form className="bp-form" onSubmit={handleSubmit}>
        <div className="bp-form-grid">
          <div className="bp-field bp-field-full">
            <label>Project Title *</label>
            <input value={form.projectTitle} onChange={e=>set("projectTitle",e.target.value)}
              placeholder="e.g. 3-storey house in Kathmandu" required />
          </div>
          <div className="bp-field">
            <label>What to Build *</label>
            <select value={form.buildType} onChange={e=>set("buildType",e.target.value)}>
              {Object.entries(buildTypeLabel).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="bp-field">
            <label>Purpose *</label>
            <select value={form.purpose} onChange={e=>set("purpose",e.target.value)}>
              {Object.entries(purposeLabel).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="bp-field">
            <label>Land Status *</label>
            <select value={form.landStatus} onChange={e=>set("landStatus",e.target.value)}>
              {Object.entries(landStatusLabel).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="bp-field">
            <label>Land Area</label>
            <input value={form.landArea} onChange={e=>set("landArea",e.target.value)}
              placeholder="e.g. 5 ropani, 200 sq ft" />
          </div>
          <div className="bp-field">
            <label>Province</label>
            <select value={form.province} onChange={e=>set("province",e.target.value)}>
              <option value="">Select Province</option>
              {NEPAL_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="bp-field">
            <label>District</label>
            <input value={form.district} onChange={e=>set("district",e.target.value)} placeholder="District" />
          </div>
          <div className="bp-field">
            <label>City / Area</label>
            <input value={form.city} onChange={e=>set("city",e.target.value)} placeholder="City or area" />
          </div>
          <div className="bp-field bp-field-full">
            <label>Land / Site Location</label>
            <input value={form.landLocation} onChange={e=>set("landLocation",e.target.value)}
              placeholder="Specific address or landmark" />
          </div>
          <div className="bp-field">
            <label>Budget Min (Rs.) *</label>
            <input type="number" value={form.budgetMin} onChange={e=>set("budgetMin",e.target.value)}
              placeholder="e.g. 5000000" required />
          </div>
          <div className="bp-field">
            <label>Budget Max (Rs.) *</label>
            <input type="number" value={form.budgetMax} onChange={e=>set("budgetMax",e.target.value)}
              placeholder="e.g. 10000000" required />
          </div>
          <div className="bp-field">
            <label>Expected Start Date</label>
            <input type="date" value={form.expectedStartDate} onChange={e=>set("expectedStartDate",e.target.value)} />
          </div>
          <div className="bp-field">
            <label>Expected Duration</label>
            <input value={form.expectedDuration} onChange={e=>set("expectedDuration",e.target.value)}
              placeholder="e.g. 8 months, 1 year" />
          </div>
          <div className="bp-field">
            <label>Number of Floors</label>
            <input type="number" min="1" value={form.floors} onChange={e=>set("floors",e.target.value)} />
          </div>
          <div className="bp-field">
            <label>Number of Rooms</label>
            <input type="number" min="0" value={form.rooms} onChange={e=>set("rooms",e.target.value)} />
          </div>
          <div className="bp-field bp-field-full">
            <label>Project Description *</label>
            <textarea rows={4} value={form.description} onChange={e=>set("description",e.target.value)}
              placeholder="Describe your vision, style preferences, must-haves…" required />
          </div>
          <div className="bp-field bp-field-full">
            <label>Special Requirements</label>
            <textarea rows={2} value={form.specialRequirements} onChange={e=>set("specialRequirements",e.target.value)}
              placeholder="Earthquake-resistant, solar panels, basement, etc." />
          </div>
          <div className="bp-field bp-field-full">
            <label>Preferred Materials</label>
            <input value={form.preferredMaterials} onChange={e=>set("preferredMaterials",e.target.value)}
              placeholder="e.g. RCC frame, brick, steel, glass" />
          </div>
          <div className="bp-field bp-field-full">
            <label>Reference / Inspiration Images (optional)</label>
            <input type="file" multiple accept="image/*"
              onChange={e => setImages(Array.from(e.target.files))} />
            {images.length > 0 && <span className="bp-file-count">{images.length} file(s) selected</span>}
          </div>
          <div className="bp-field bp-field-full bp-checkbox-row">
            <input type="checkbox" id="budgetFlex" checked={form.budgetFlexible}
              onChange={e=>set("budgetFlexible",e.target.checked)} />
            <label htmlFor="budgetFlex">Budget is flexible — open to negotiation</label>
          </div>
        </div>
        <button type="submit" className="bp-btn-primary bp-submit-btn" disabled={submitting}>
          {submitting ? "Posting…" : "Post Project"}
        </button>
      </form>
    </div>
  );
}

// ── Project Detail View (offers + progress) ───────────────────────────────────
function ProjectDetailView({
  project, offers, progress, user, onBack,
  respondOffer, onNegotiate,
  negotiateModal, negBudget, negDuration, negMessage,
  setNegBudget, setNegDuration, setNegMessage,
  submitNegotiation, closeNegotiate,
  commentText, setCommentText, commentType, setCommentType,
  activeUpdateId, setActiveUpdateId, submitComment
}) {
  const [detailTab, setDetailTab] = useState("offers");

  return (
    <div className="bp-detail-view">
      <button className="bp-back-btn" onClick={onBack}>← Back to Projects</button>
      <div className="bp-detail-header">
        <div>
          <h2>{project.projectTitle}</h2>
          <p className="bp-detail-meta">
            {buildTypeLabel[project.buildType]} · {purposeLabel[project.purpose]} ·{" "}
            {project.city || project.district || project.province || "Location TBD"}
          </p>
        </div>
        <span className="bp-status-badge" style={{ background: statusColor[project.status] + "22", color: statusColor[project.status], border: `1px solid ${statusColor[project.status]}44` }}>
          {statusLabel[project.status]}
        </span>
      </div>
      <div className="bp-detail-info-row">
        <span>Budget: <strong>Rs. {fmt(project.budgetMin)} – {fmt(project.budgetMax)}</strong></span>
        <span>Duration: <strong>{project.expectedDuration || "TBD"}</strong></span>
        <span>Floors: <strong>{project.floors}</strong></span>
        <span>Land: <strong>{landStatusLabel[project.landStatus]}</strong></span>
      </div>
      {project.description && <p className="bp-detail-desc">{project.description}</p>}

      <div className="bp-detail-tabs">
        <button className={detailTab==="offers"?"active":""} onClick={()=>setDetailTab("offers")}>
          Offers ({offers.length})
        </button>
        <button className={detailTab==="progress"?"active":""} onClick={()=>setDetailTab("progress")}>
          Progress Updates ({progress.length})
        </button>
      </div>

      {detailTab === "offers" && (
        <div className="bp-offers-list">
          {offers.length === 0 && <div className="bp-empty">No offers yet. Builders will submit offers soon.</div>}
          {offers.map(o => (
            <div key={o._id} className={`bp-offer-card ${o.status}`}>
              <div className="bp-offer-header">
                <div className="bp-offer-builder">
                  <img src={o.builderUserId?.avatar
                    ? `${API_URL}/uploads/${o.builderUserId.avatar}`
                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(o.builderId?.companyName||"B")}&background=1a2744&color=E27D60&bold=true`}
                    alt="" className="bp-offer-avatar" />
                  <div>
                    <strong>{o.builderId?.companyName || "Builder"}</strong>
                    <span className="bp-offer-type">{o.builderId?.companyType}</span>
                  </div>
                </div>
                <span className={`bp-offer-status ${o.status}`}>{o.status.toUpperCase()}</span>
              </div>
              <div className="bp-offer-terms">
                <span>💰 Rs. {fmt(o.proposedBudget)}</span>
                <span>⏱ {o.estimatedDuration || "TBD"}</span>
                {o.builderId?.yearsOfExperience > 0 && <span>🏗 {o.builderId.yearsOfExperience} yrs exp</span>}
              </div>
              {o.coverLetter && <p className="bp-offer-letter">{o.coverLetter}</p>}
              {o.negotiations?.length > 0 && (
                <div className="bp-negotiations">
                  <strong>Negotiation History</strong>
                  {o.negotiations.map((n,i) => (
                    <div key={i} className={`bp-neg-item ${n.by}`}>
                      <span className="bp-neg-by">{n.by === "client" ? "You" : "Builder"}</span>
                      <span>Rs. {fmt(n.proposedBudget)} · {n.proposedDuration}</span>
                      {n.message && <p>{n.message}</p>}
                    </div>
                  ))}
                </div>
              )}
              {o.status === "pending" || o.status === "negotiating" ? (
                <div className="bp-offer-actions">
                  <button className="bp-btn-accept" onClick={() => respondOffer(o._id,"accepted",o.proposedBudget,o.estimatedDuration)}>Accept Deal</button>
                  <button className="bp-btn-negotiate" onClick={() => onNegotiate(o)}>Negotiate</button>
                  <button className="bp-btn-reject" onClick={() => respondOffer(o._id,"rejected")}>Reject</button>
                </div>
              ) : o.status === "accepted" ? (
                <div className="bp-offer-accepted-banner">✅ Deal accepted · Rs. {fmt(o.agreedBudget)} · {o.agreedDuration}</div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {detailTab === "progress" && (
        <div className="bp-progress-list">
          {progress.length === 0 && <div className="bp-empty">No progress updates yet. Builder will post updates once work begins.</div>}
          {progress.map(u => (
            <div key={u._id} className="bp-progress-card">
              <div className="bp-progress-header">
                <div className="bp-progress-title-row">
                  <h4>{u.title}</h4>
                  <span className="bp-progress-pct">{u.percentComplete}%</span>
                </div>
                <div className="bp-progress-bar"><div style={{ width:`${u.percentComplete}%` }} /></div>
                {u.milestone && <span className="bp-milestone-tag">📍 {u.milestone}</span>}
              </div>
              {u.description && <p className="bp-progress-desc">{u.description}</p>}
              {u.images?.length > 0 && (
                <div className="bp-progress-images">
                  {u.images.map((img,i) => (
                    <img key={i} src={`${API_URL}/uploads/${img}`} alt={`progress-${i}`} />
                  ))}
                </div>
              )}
              <div className="bp-progress-comments">
                {u.comments?.map((c,i) => (
                  <div key={i} className="bp-comment">
                    <span className="bp-comment-type">{c.type}</span>
                    <strong>{c.userName}</strong>: {c.text}
                    {c.reply && <div className="bp-comment-reply">🔧 Builder: {c.reply}</div>}
                  </div>
                ))}
                {activeUpdateId === u._id ? (
                  <div className="bp-comment-form">
                    <select value={commentType} onChange={e=>setCommentType(e.target.value)}>
                      <option value="comment">Comment</option>
                      <option value="question">Question</option>
                      <option value="request">Request</option>
                    </select>
                    <input value={commentText} onChange={e=>setCommentText(e.target.value)}
                      placeholder="Write your comment, question or request…" />
                    <button className="bp-btn-primary" onClick={()=>submitComment(u._id)}>Send</button>
                    <button className="bp-btn-ghost" onClick={()=>setActiveUpdateId(null)}>Cancel</button>
                  </div>
                ) : (
                  <button className="bp-btn-ghost" onClick={()=>setActiveUpdateId(u._id)}>+ Add Comment / Question</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {negotiateModal && (
        <div className="bp-modal-overlay" onClick={closeNegotiate}>
          <div className="bp-modal" onClick={e=>e.stopPropagation()}>
            <h3>Counter Offer</h3>
            <p>Current offer: Rs. {fmt(negotiateModal.proposedBudget)} · {negotiateModal.estimatedDuration}</p>
            <label>Your Budget (Rs.)</label>
            <input type="number" value={negBudget} onChange={e=>setNegBudget(e.target.value)} placeholder="Proposed budget" />
            <label>Your Timeline</label>
            <input value={negDuration} onChange={e=>setNegDuration(e.target.value)} placeholder="e.g. 6 months" />
            <label>Message (optional)</label>
            <textarea rows={3} value={negMessage} onChange={e=>setNegMessage(e.target.value)} placeholder="Explain your counter offer…" />
            <div className="bp-modal-actions">
              <button className="bp-btn-primary" onClick={submitNegotiation}>Send Counter Offer</button>
              <button className="bp-btn-ghost" onClick={closeNegotiate}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab: Register as Builder ──────────────────────────────────────────────────
function RegisterBuilderTab({ user }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    companyName:"", companyType:"company", registrationNumber:"",
    establishedYear:"", address:"", province:"", district:"", city:"",
    website:"", phone:"", email:"",
    description:"", yearsOfExperience:"", completedProjects:"",
    specializations:[], proofDocType:"company_registration"
  });
  const [workers, setWorkers] = useState([{ name:"", role:"", experience:"" }]);
  const [proofFiles, setProofFiles] = useState([]);
  const [portfolioFiles, setPortfolioFiles] = useState([]); // eslint-disable-line no-unused-vars
  const [submitting, setSubmitting] = useState(false);
  const [myOffers, setMyOffers] = useState([]);
  const [openProjects, setOpenProjects] = useState([]);
  const [offerModal, setOfferModal] = useState(null);
  const [offerForm, setOfferForm] = useState({ proposedBudget:"", estimatedDuration:"", coverLetter:"" });
  const [progressModal, setProgressModal] = useState(null);
  const [progressForm, setProgressForm] = useState({ title:"", description:"", percentComplete:"", milestone:"" });
  const [progressImages, setProgressImages] = useState([]);
  const [activeBuilderTab, setActiveBuilderTab] = useState("dashboard");

  const fetchProfile = async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const r = await fetch(`${API_URL}/build/builder-profile/me/${user._id}`);
      const d = await r.json();
      if (d.success && d.profile) setProfile(d.profile);
    } catch {}
    setLoading(false);
  };

  const fetchMyOffers = async () => {
    if (!user?._id) return;
    try {
      const r = await fetch(`${API_URL}/build/offers/builder/${user._id}`);
      const d = await r.json();
      if (d.success) setMyOffers(d.offers || []);
    } catch {}
  };

  const fetchOpenProjects = async () => {
    try {
      const r = await fetch(`${API_URL}/build/projects?status=open`);
      const d = await r.json();
      if (d.success) setOpenProjects(d.projects || []);
    } catch {}
  };

  useEffect(() => {
    fetchProfile();
    fetchMyOffers();
    fetchOpenProjects();
  }, [user?._id]); // eslint-disable-line

  const setF = (k,v) => setForm(f=>({...f,[k]:v}));
  const toggleSpec = (s) => setForm(f => ({
    ...f, specializations: f.specializations.includes(s)
      ? f.specializations.filter(x=>x!==s)
      : [...f.specializations, s]
  }));

  const addWorker = () => setWorkers(w => [...w, { name:"", role:"", experience:"" }]);
  const setWorker = (i,k,v) => setWorkers(w => w.map((x,j) => j===i ? {...x,[k]:v} : x));
  const removeWorker = (i) => setWorkers(w => w.filter((_,j)=>j!==i));

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!user) return alert("Please login first");
    setSubmitting(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k,v]) => {
      if (k === "specializations") fd.append(k, JSON.stringify(v));
      else fd.append(k, v);
    });
    fd.append("userId", user._id);
    fd.append("workers", JSON.stringify(workers));
    proofFiles.forEach(f => fd.append("proofDocuments", f));
    portfolioFiles.forEach(f => fd.append("portfolioImages", f));
    try {
      const r = await fetch(`${API_URL}/build/builder-profile`, { method:"POST", body:fd });
      const d = await r.json();
      if (d.success) { setProfile(d.profile); }
      else alert(d.message || "Failed to register");
    } catch { alert("Network error"); }
    setSubmitting(false);
  };

  const submitOffer = async () => {
    if (!offerForm.proposedBudget) return alert("Enter a budget");
    await fetch(`${API_URL}/build/offers`, {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        projectId: offerModal._id,
        builderId: profile._id,
        builderUserId: user._id,
        proposedBudget: offerForm.proposedBudget,
        estimatedDuration: offerForm.estimatedDuration,
        coverLetter: offerForm.coverLetter
      })
    });
    setOfferModal(null); setOfferForm({ proposedBudget:"", estimatedDuration:"", coverLetter:"" });
    fetchMyOffers(); fetchOpenProjects();
  };

  const submitProgress = async () => {
    if (!progressForm.title) return alert("Enter a title");
    const fd = new FormData();
    Object.entries(progressForm).forEach(([k,v]) => fd.append(k,v));
    fd.append("projectId", progressModal.projectId?._id || progressModal.projectId);
    fd.append("builderId", profile._id);
    fd.append("builderUserId", user._id);
    progressImages.forEach(f => fd.append("images", f));
    await fetch(`${API_URL}/build/progress`, { method:"POST", body:fd });
    setProgressModal(null); setProgressForm({ title:"", description:"", percentComplete:"", milestone:"" }); setProgressImages([]);
    fetchMyOffers();
  };

  if (loading) return <div className="bp-loading">Loading…</div>;

  // ── Pending / Rejected state ──────────────────────────────────────────────
  if (profile && profile.verificationStatus === "pending") return (
    <div className="bp-verification-pending">
      <div className="bp-pending-icon">⏳</div>
      <h2>Application Under Review</h2>
      <p>Your builder profile for <strong>{profile.companyName}</strong> has been submitted and is being reviewed by our admin team. You'll be able to submit offers once approved.</p>
      <div className="bp-pending-details">
        <span>Submitted: {new Date(profile.createdAt).toLocaleDateString()}</span>
        <span>Status: <strong style={{color:"#ff9800"}}>Pending Review</strong></span>
      </div>
    </div>
  );

  if (profile && profile.verificationStatus === "rejected") return (
    <div className="bp-verification-pending">
      <div className="bp-pending-icon">❌</div>
      <h2>Application Rejected</h2>
      <p>Your builder application was not approved.</p>
      {profile.adminNote && <p className="bp-admin-note">Admin note: {profile.adminNote}</p>}
      <button className="bp-btn-primary" onClick={() => setProfile(null)}>Re-apply</button>
    </div>
  );

  // ── Approved builder dashboard ────────────────────────────────────────────
  if (profile && profile.verificationStatus === "approved") return (
    <div className="bp-builder-dashboard">
      <div className="bp-builder-header">
        <div className="bp-builder-badge">✅ Verified Builder</div>
        <h2>{profile.companyName}</h2>
        <p>{profile.description}</p>
      </div>
      <div className="bp-builder-tabs">
        <button className={activeBuilderTab==="dashboard"?"active":""} onClick={()=>setActiveBuilderTab("dashboard")}>My Offers</button>
        <button className={activeBuilderTab==="browse"?"active":""} onClick={()=>setActiveBuilderTab("browse")}>Browse Projects</button>
        <button className={activeBuilderTab==="progress"?"active":""} onClick={()=>setActiveBuilderTab("progress")}>Post Progress</button>
      </div>

      {activeBuilderTab === "dashboard" && (
        <div className="bp-my-offers">
          {myOffers.length === 0 && <div className="bp-empty">You haven't submitted any offers yet. Browse open projects to get started.</div>}
          {myOffers.map(o => (
            <div key={o._id} className={`bp-offer-card ${o.status}`}>
              <div className="bp-offer-header">
                <div>
                  <strong>{o.projectId?.projectTitle || "Project"}</strong>
                  <span className="bp-offer-type">{buildTypeLabel[o.projectId?.buildType] || ""}</span>
                </div>
                <span className={`bp-offer-status ${o.status}`}>{o.status.toUpperCase()}</span>
              </div>
              <div className="bp-offer-terms">
                <span>💰 Rs. {fmt(o.proposedBudget)}</span>
                <span>⏱ {o.estimatedDuration || "TBD"}</span>
              </div>
              {o.status === "accepted" && (
                <div className="bp-offer-accepted-banner">
                  ✅ Deal accepted · Rs. {fmt(o.agreedBudget)} · {o.agreedDuration}
                  <button className="bp-btn-primary" style={{marginLeft:12,padding:"4px 12px",fontSize:"0.8rem"}}
                    onClick={() => setProgressModal(o)}>Post Progress Update</button>
                </div>
              )}
              {o.negotiations?.length > 0 && (
                <div className="bp-negotiations">
                  <strong>Negotiation History</strong>
                  {o.negotiations.map((n,i) => (
                    <div key={i} className={`bp-neg-item ${n.by}`}>
                      <span className="bp-neg-by">{n.by === "builder" ? "You" : "Client"}</span>
                      <span>Rs. {fmt(n.proposedBudget)} · {n.proposedDuration}</span>
                      {n.message && <p>{n.message}</p>}
                    </div>
                  ))}
                </div>
              )}
              {(o.status === "pending" || o.status === "negotiating") && (
                <div className="bp-offer-actions">
                  <button className="bp-btn-negotiate" onClick={() => {
                    setProgressModal({ ...o, isNegotiate: true });
                  }}>Counter Negotiate</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeBuilderTab === "browse" && (
        <div className="bp-open-projects">
          {openProjects.length === 0 && <div className="bp-empty">No open projects right now. Check back soon.</div>}
          {openProjects.map(p => (
            <div key={p._id} className="bp-project-card">
              <div className="bp-project-card-header">
                <span className="bp-build-type-badge">{buildTypeLabel[p.buildType]}</span>
                <span className="bp-status-dot" style={{background:statusColor[p.status]}}>{statusLabel[p.status]}</span>
              </div>
              <h4>{p.projectTitle}</h4>
              <p className="bp-project-meta">{purposeLabel[p.purpose]} · {p.city || p.district || p.province || "Nepal"}</p>
              <p className="bp-project-budget">Rs. {fmt(p.budgetMin)} – {fmt(p.budgetMax)}</p>
              {p.description && <p className="bp-project-desc-preview">{p.description.slice(0,120)}{p.description.length>120?"…":""}</p>}
              <div className="bp-project-tags">
                {p.floors > 1 && <span>{p.floors} floors</span>}
                {p.rooms > 0 && <span>{p.rooms} rooms</span>}
                {p.expectedDuration && <span>⏱ {p.expectedDuration}</span>}
                {p.budgetFlexible && <span>💬 Flexible budget</span>}
              </div>
              <button className="bp-btn-primary" onClick={() => { setOfferModal(p); setOfferForm({ proposedBudget:"", estimatedDuration:"", coverLetter:"" }); }}>
                Submit Offer
              </button>
            </div>
          ))}
        </div>
      )}

      {activeBuilderTab === "progress" && (
        <div className="bp-progress-tab">
          <p className="bp-progress-hint">Select an accepted offer from "My Offers" and click "Post Progress Update" to update your client.</p>
          <div className="bp-my-offers">
            {myOffers.filter(o=>o.status==="accepted").length === 0 && <div className="bp-empty">No accepted deals yet.</div>}
            {myOffers.filter(o=>o.status==="accepted").map(o => (
              <div key={o._id} className="bp-offer-card accepted">
                <strong>{o.projectId?.projectTitle}</strong>
                <span className="bp-offer-terms">Rs. {fmt(o.agreedBudget)} · {o.agreedDuration}</span>
                <button className="bp-btn-primary" onClick={() => setProgressModal(o)}>Post Progress Update</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Offer submission modal */}
      {offerModal && !offerModal.isNegotiate && (
        <div className="bp-modal-overlay" onClick={()=>setOfferModal(null)}>
          <div className="bp-modal" onClick={e=>e.stopPropagation()}>
            <h3>Submit Offer</h3>
            <p>Project: <strong>{offerModal.projectTitle}</strong></p>
            <p>Client budget: Rs. {fmt(offerModal.budgetMin)} – {fmt(offerModal.budgetMax)}</p>
            <label>Your Proposed Budget (Rs.) *</label>
            <input type="number" value={offerForm.proposedBudget} onChange={e=>setOfferForm(f=>({...f,proposedBudget:e.target.value}))} placeholder="Your price" />
            <label>Estimated Duration *</label>
            <input value={offerForm.estimatedDuration} onChange={e=>setOfferForm(f=>({...f,estimatedDuration:e.target.value}))} placeholder="e.g. 8 months" />
            <label>Cover Letter</label>
            <textarea rows={4} value={offerForm.coverLetter} onChange={e=>setOfferForm(f=>({...f,coverLetter:e.target.value}))} placeholder="Why should the client choose you? Describe your approach…" />
            <div className="bp-modal-actions">
              <button className="bp-btn-primary" onClick={submitOffer}>Submit Offer</button>
              <button className="bp-btn-ghost" onClick={()=>setOfferModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Progress update modal */}
      {progressModal && !progressModal.isNegotiate && (
        <div className="bp-modal-overlay" onClick={()=>setProgressModal(null)}>
          <div className="bp-modal" onClick={e=>e.stopPropagation()}>
            <h3>Post Progress Update</h3>
            <p>Project: <strong>{progressModal.projectId?.projectTitle || "Project"}</strong></p>
            <label>Update Title *</label>
            <input value={progressForm.title} onChange={e=>setProgressForm(f=>({...f,title:e.target.value}))} placeholder="e.g. Foundation complete" />
            <label>Description</label>
            <textarea rows={3} value={progressForm.description} onChange={e=>setProgressForm(f=>({...f,description:e.target.value}))} placeholder="Describe what was done…" />
            <label>Milestone</label>
            <input value={progressForm.milestone} onChange={e=>setProgressForm(f=>({...f,milestone:e.target.value}))} placeholder="e.g. Phase 1 complete" />
            <label>% Complete (0–100)</label>
            <input type="number" min="0" max="100" value={progressForm.percentComplete} onChange={e=>setProgressForm(f=>({...f,percentComplete:e.target.value}))} />
            <label>Photos</label>
            <input type="file" multiple accept="image/*" onChange={e=>setProgressImages(Array.from(e.target.files))} />
            <div className="bp-modal-actions">
              <button className="bp-btn-primary" onClick={submitProgress}>Post Update</button>
              <button className="bp-btn-ghost" onClick={()=>setProgressModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ── Registration form ─────────────────────────────────────────────────────
  return (
    <div className="bp-tab-content">
      <div className="bp-register-intro">
        <h3 className="bp-section-title">Register Your Construction Company / Team</h3>
        <p>Submit your company details and legitimacy proof. Our admin team will review and verify your profile before you can start submitting offers to clients.</p>
      </div>
      <form className="bp-form" onSubmit={handleRegister}>
        <div className="bp-form-grid">
          <div className="bp-field">
            <label>Company / Team Name *</label>
            <input value={form.companyName} onChange={e=>setF("companyName",e.target.value)} placeholder="Your company name" required />
          </div>
          <div className="bp-field">
            <label>Type</label>
            <select value={form.companyType} onChange={e=>setF("companyType",e.target.value)}>
              <option value="company">Registered Company</option>
              <option value="contractor">Contractor</option>
              <option value="freelance_team">Freelance Team</option>
              <option value="individual">Individual</option>
            </select>
          </div>
          <div className="bp-field">
            <label>Registration Number</label>
            <input value={form.registrationNumber} onChange={e=>setF("registrationNumber",e.target.value)} placeholder="Company reg. no." />
          </div>
          <div className="bp-field">
            <label>Established Year</label>
            <input type="number" value={form.establishedYear} onChange={e=>setF("establishedYear",e.target.value)} placeholder="e.g. 2010" />
          </div>
          <div className="bp-field">
            <label>Phone</label>
            <input value={form.phone} onChange={e=>setF("phone",e.target.value)} placeholder="Contact number" />
          </div>
          <div className="bp-field">
            <label>Email</label>
            <input type="email" value={form.email} onChange={e=>setF("email",e.target.value)} placeholder="Company email" />
          </div>
          <div className="bp-field">
            <label>Province</label>
            <select value={form.province} onChange={e=>setF("province",e.target.value)}>
              <option value="">Select Province</option>
              {NEPAL_PROVINCES.map(p=><option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="bp-field">
            <label>District</label>
            <input value={form.district} onChange={e=>setF("district",e.target.value)} placeholder="District" />
          </div>
          <div className="bp-field">
            <label>City</label>
            <input value={form.city} onChange={e=>setF("city",e.target.value)} placeholder="City" />
          </div>
          <div className="bp-field">
            <label>Website (optional)</label>
            <input value={form.website} onChange={e=>setF("website",e.target.value)} placeholder="https://yourcompany.com" />
          </div>
          <div className="bp-field">
            <label>Years of Experience</label>
            <input type="number" value={form.yearsOfExperience} onChange={e=>setF("yearsOfExperience",e.target.value)} placeholder="e.g. 10" />
          </div>
          <div className="bp-field">
            <label>Completed Projects</label>
            <input type="number" value={form.completedProjects} onChange={e=>setF("completedProjects",e.target.value)} placeholder="e.g. 45" />
          </div>
          <div className="bp-field bp-field-full">
            <label>Address</label>
            <input value={form.address} onChange={e=>setF("address",e.target.value)} placeholder="Full address" />
          </div>
          <div className="bp-field bp-field-full">
            <label>Company Description *</label>
            <textarea rows={3} value={form.description} onChange={e=>setF("description",e.target.value)}
              placeholder="Describe your company, expertise, past work…" required />
          </div>
          <div className="bp-field bp-field-full">
            <label>Specializations</label>
            <div className="bp-spec-chips">
              {Object.entries(buildTypeLabel).map(([v,l]) => (
                <button type="button" key={v}
                  className={`bp-chip ${form.specializations.includes(v)?"active":""}`}
                  onClick={()=>toggleSpec(v)}>{l}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Workers */}
        <div className="bp-workers-section">
          <div className="bp-workers-header">
            <h4>Team Members / Workers</h4>
            <button type="button" className="bp-btn-ghost" onClick={addWorker}>+ Add Member</button>
          </div>
          {workers.map((w,i) => (
            <div key={i} className="bp-worker-row">
              <input value={w.name} onChange={e=>setWorker(i,"name",e.target.value)} placeholder="Name" />
              <input value={w.role} onChange={e=>setWorker(i,"role",e.target.value)} placeholder="Role (e.g. Civil Engineer)" />
              <input value={w.experience} onChange={e=>setWorker(i,"experience",e.target.value)} placeholder="Experience (e.g. 5 years)" />
              {workers.length > 1 && <button type="button" className="bp-remove-worker" onClick={()=>removeWorker(i)}>✕</button>}
            </div>
          ))}
        </div>

        {/* Proof documents */}
        <div className="bp-proof-section">
          <h4>Legitimacy Proof Documents <span className="bp-confidential-tag">🔒 Confidential — Admin Only</span></h4>
          <p className="bp-proof-hint">Upload company registration certificate, PAN/VAT certificate, or other official documents. These are reviewed only by admin and never shown publicly.</p>
          <div className="bp-form-grid">
            <div className="bp-field">
              <label>Document Type</label>
              <select value={form.proofDocType} onChange={e=>setF("proofDocType",e.target.value)}>
                <option value="company_registration">Company Registration</option>
                <option value="pan_vat">PAN / VAT Certificate</option>
                <option value="trade_license">Trade License</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="bp-field">
              <label>Upload Documents *</label>
              <input type="file" multiple accept="image/*,.pdf"
                onChange={e=>setProofFiles(Array.from(e.target.files))} required />
              {proofFiles.length > 0 && <span className="bp-file-count">{proofFiles.length} file(s) selected</span>}
            </div>
          </div>
        </div>

        <button type="submit" className="bp-btn-primary bp-submit-btn" disabled={submitting}>
          {submitting ? "Submitting…" : "Submit for Admin Review"}
        </button>
      </form>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function BuildPropertyPage({ user, chatRef }) {
  const [tab, setTab] = useState("project");

  return (
    <div className="bp-page">
      <div className="bp-hero">
        <div className="bp-hero-content">
          <div className="bp-hero-eyebrow">Build Property</div>
          <h1 className="bp-hero-title">Turn Your Vision<br /><span>Into Reality</span></h1>
          <p className="bp-hero-sub">Post your construction project and connect directly with verified builders — no middlemen, transparent negotiations.</p>
        </div>
        <div className="bp-hero-stats">
          <div className="bp-hero-stat"><span>🏗️</span><strong>Direct</strong><small>Builder to Client</small></div>
          <div className="bp-hero-stat"><span>🔒</span><strong>Verified</strong><small>Admin-approved builders</small></div>
          <div className="bp-hero-stat"><span>💬</span><strong>Negotiate</strong><small>Budget & timeline</small></div>
          <div className="bp-hero-stat"><span>📊</span><strong>Track</strong><small>Live progress updates</small></div>
        </div>
      </div>

      <div className="bp-tabs-bar">
        <button className={`bp-tab-btn ${tab==="project"?"active":""}`} onClick={()=>setTab("project")}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
          I Want to Build
        </button>
        <button className={`bp-tab-btn ${tab==="builder"?"active":""}`} onClick={()=>setTab("builder")}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
          I'm a Builder / Company
        </button>
      </div>

      <div className="bp-content">
        {tab === "project" && <PostProjectTab user={user} />}
        {tab === "builder" && <RegisterBuilderTab user={user} chatRef={chatRef} />}
      </div>
    </div>
  );
}
