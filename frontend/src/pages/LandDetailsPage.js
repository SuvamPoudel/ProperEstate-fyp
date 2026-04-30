import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_URL } from "../constants";
import EsewaPayment from "../components/EsewaPayment";
import MediaGallery from "../components/MediaGallery";
import "../LandDetailsPage.css";

const LandDetailsPage = ({ user, toggleSave, onChatWith }) => {
  const { id } = useParams();
  const [land, setLand] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [owner, setOwner] = useState(null);
  const [rentDuration, setRentDuration] = useState("");
  const [rentMonths, setRentMonths] = useState(1);
  const [negotiatePrice, setNegotiatePrice] = useState("");
  const [showNegotiate, setShowNegotiate] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_URL}/land/` + id).then(res => res.json()).then(async data => {
      setLand(data.land);
      if (data.land?.ownerId) {
        const ur = await fetch(`${API_URL}/user/` + data.land.ownerId);
        const ud = await ur.json();
        if (ud.success) setOwner(ud.user);
      }
    });
  }, [id]);

  const handleBookingRequest = async () => {
    if (!rentDuration) { alert("Please specify the rental duration."); return; }
    setShowPayment(false);
    const body = {
      landId: land._id,
      buyerId: user._id,
      sellerId: land.ownerId,
      paymentAmount: 200,
      rentDuration,
      rentDurationMonths: rentMonths,
      negotiatedPrice: negotiatePrice ? parseInt(negotiatePrice) : null,
    };
    const res = await fetch(`${API_URL}/book-land`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if ((await res.json()).success) alert("Booking Request Sent! The owner will be notified via email.");
  };

  const handleRequestClick = () => {
    if (!user) return navigate("/login");
    if (user._id === land.ownerId) return alert("You are the owner of this property.");
    if (!rentDuration) { alert("Please enter the rental duration before requesting."); return; }
    setShowPayment(true);
  };

  if (!land) return <div className="loading">Loading details...</div>;

  return (
    <div className="details-page">
      {showPayment && (<EsewaPayment amount={200} description={"Booking Request for: " + land.title} onSuccess={handleBookingRequest} onCancel={() => setShowPayment(false)} />)}

      <div className="details-inner">
        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>

        <div className="details-grid">
          {/* ── LEFT: media + description + map ── */}
          <div className="details-left">
            <MediaGallery
              mediaFiles={land.mediaFiles?.length > 0 ? land.mediaFiles : (land.image ? [land.image] : [])}
              title={land.title}
            />
            <div className="details-desc">
              <span className="details-section-label">About</span>
              <p>{land.description || "No description provided."}</p>
            </div>
            {land.mapUrl && (
              <div className="details-map-section">
                <span className="details-section-label">Location on Map</span>
                <iframe
                  title="Property Location Map"
                  width="100%"
                  height="300"
                  style={{ border: 0, borderRadius: 10, display: "block" }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={(() => {
                    const url = land.mapUrl.trim();
                    if (url.includes("google.com/maps/d/")) {
                      return url.replace("/edit","").replace("/viewer","").replace("/u/0/viewer","").replace("/u/1/viewer","") + (url.includes("?") ? "&" : "?") + "output=embed";
                    }
                    if (url.includes("output=embed")) return url;
                    if (url.startsWith("http")) return url + (url.includes("?") ? "&output=embed" : "?output=embed");
                    return `https://maps.google.com/maps?q=${encodeURIComponent(url)}&output=embed&z=15`;
                  })()}
                />
              </div>
            )}
            {land.myMapsUrl && (land.mainCategory === "Land" || land.mainCategory === "House" || land.category === "Land" || land.category === "House") && (
              <div className="details-map-section">
                <span className="details-section-label">Property Boundary (MyMaps)</span>
                <iframe
                  title="Property Boundary MyMaps"
                  width="100%"
                  height="320"
                  style={{ border: 0, borderRadius: 10, display: "block" }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={(() => {
                    const url = land.myMapsUrl.trim();
                    if (url.includes("google.com/maps/d/")) {
                      const base = url.split("?")[0].replace("/edit","").replace("/viewer","").replace("/u/0/viewer","").replace("/u/1/viewer","");
                      const mid = url.match(/mid=([^&]+)/)?.[1];
                      return `${base}/embed${mid ? "?mid=" + mid : ""}`;
                    }
                    return url;
                  })()}
                />
                <p style={{fontSize:"0.7rem",color:"#a0aeae",marginTop:6,lineHeight:1.5}}>
                  📍 Custom property boundary map — created by the owner on Google MyMaps
                </p>
              </div>
            )}
          </div>

          {/* ── RIGHT: info panel ── */}
          <div className="details-right">
            <div className="info-box sticky-box">

              {/* Header */}
              <div className="info-header">
                <h1 className="info-title">{land.title}</h1>
                <div className="info-price">
                  Rs. {parseInt(land.price).toLocaleString()}
                  <span>/mo</span>
                </div>
                <span className="info-category">{land.category}</span>
              </div>

              {/* Meta */}
              <div className="info-section">
                <span className="info-label">Details</span>
                <div className="meta-grid">
                  <div className="meta-item"><span>Province</span><strong>{land.province || "—"}</strong></div>
                  <div className="meta-item"><span>District</span><strong>{land.district || "—"}</strong></div>
                  <div className="meta-item"><span>City</span><strong>{land.city || "—"}</strong></div>
                  <div className="meta-item"><span>Location</span><strong>{land.location || "—"}</strong></div>
                  {land.areaSize && <div className="meta-item"><span>Area</span><strong>{land.areaSize}</strong></div>}
                </div>
              </div>

              {/* Owner */}
              <div className="info-section">
                <span className="info-label">Owner</span>
                <div className="owner-box">
                  <p><strong>{land.ownerName}</strong></p>
                  {land.ownerPhone && <p>{land.ownerPhone}</p>}
                  {land.ownerEmail && <p>{land.ownerEmail}</p>}
                </div>
              </div>

              {/* Rent duration */}
              <div className="info-section">
                <span className="info-label">Rental Duration</span>
                <div className="rent-dur-row">
                  <input
                    type="number" min="1" max="120"
                    value={rentMonths}
                    onChange={e => { setRentMonths(parseInt(e.target.value) || 1); setRentDuration(e.target.value + " months"); }}
                    className="rent-dur-input"
                    placeholder="6"
                  />
                  <select className="rent-dur-select" onChange={e => setRentDuration(rentMonths + " " + e.target.value)}>
                    <option value="months">Months</option>
                    <option value="years">Years</option>
                  </select>
                </div>
                {rentDuration && <p className="rent-dur-preview">{rentDuration}</p>}
              </div>

              {/* Negotiate */}
              <div className="info-section">
                <button className="negotiate-toggle" onClick={() => setShowNegotiate(v => !v)}>
                  Negotiate Price {showNegotiate ? "▲" : "▼"}
                </button>
                {showNegotiate && (
                  <div className="negotiate-body">
                    <p className="negotiate-hint">Listed at <strong>Rs. {parseInt(land.price).toLocaleString()}/mo</strong></p>
                    <div className="negotiate-row">
                      <span className="negotiate-prefix">Rs.</span>
                      <input type="number" className="negotiate-input" placeholder={land.price} value={negotiatePrice} min="1" onChange={e => setNegotiatePrice(e.target.value)} />
                      <span className="negotiate-suffix">/mo</span>
                    </div>
                    {negotiatePrice && parseInt(negotiatePrice) !== land.price && (
                      <p className="negotiate-diff" style={{ color: parseInt(negotiatePrice) < land.price ? "#00c97a" : "#ff4444" }}>
                        {parseInt(negotiatePrice) < land.price
                          ? `↓ Rs. ${(land.price - parseInt(negotiatePrice)).toLocaleString()} below listed`
                          : `↑ Rs. ${(parseInt(negotiatePrice) - land.price).toLocaleString()} above listed`}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="action-row-vertical">
                <button className="btn-primary full-width" onClick={handleRequestClick}>Request to Rent</button>
                {user && user._id !== land.ownerId && owner && (
                  <button className="btn-secondary full-width" onClick={() => onChatWith(owner)}>Chat with Owner</button>
                )}
                <button className="btn-secondary full-width" onClick={() => toggleSave(land._id)}>
                  {user?.savedLands?.includes(land._id) ? "Remove from Wishlist" : "Save to Wishlist"}
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandDetailsPage;
