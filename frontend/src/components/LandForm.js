import React, { useState } from "react";
import { NEPAL_LOCATIONS, PROPERTY_CATEGORIES } from "../constants";
import MediaUploader from "./MediaUploader";
import "../LandForm.css";

const LandForm = ({ initialData = {}, onSubmit, submitLabel = "Submit Listing" }) => {
  const [province, setProvince]       = useState(initialData.province || "");
  const [district, setDistrict]       = useState(initialData.district || "");
  const [city, setCity]               = useState(initialData.city || "");
  const [mainCategory, setMainCategory] = useState(initialData.mainCategory || "");
  const [subCategory, setSubCategory]   = useState(initialData.subCategory || initialData.category || "");

  const provinces  = Object.keys(NEPAL_LOCATIONS);
  const districts  = province ? Object.keys(NEPAL_LOCATIONS[province] || {}) : [];
  const cities     = (province && district) ? (NEPAL_LOCATIONS[province]?.[district] || []) : [];
  const subCats    = mainCategory ? PROPERTY_CATEGORIES[mainCategory]?.subCategories || [] : [];

  return (
    <div className="list-property-page">

      {/* ── Hero header ── */}
      <div className="list-property-header">
        <div className="list-property-eyebrow">List a Property</div>
        <h1 className="list-property-title">Publish your space,<br />reach real buyers.</h1>
        <p className="list-property-subtitle">
          All listings are reviewed by our admin team before going live. Fill in accurate details to speed up verification.
        </p>
      </div>

      {/* ── Body wrapper ── */}
      <div className="lf-body">

      {/* ── Commission notice ── */}
      <div className="commission-notice">
        <span className="commission-notice-icon">💳</span>
        <p className="commission-notice-text">
          A one-time platform fee of <strong>Rs. 500</strong> is charged upon submission via eSewa. Your listing goes live after admin approval — no brokers, no recurring fees.
        </p>
      </div>

      {/* ── Main form card ── */}
      <div className="land-form-card">
        <form onSubmit={onSubmit} encType="multipart/form-data">

          {/* ── Basic Info ── */}
          <div className="form-section">
            <div className="form-section-label">Basic Information</div>
            <div className="form-grid">
              <div>
                <label className="field-label required">Property Title</label>
                <input name="title" placeholder="e.g. 3BHK Flat in Kathmandu" required defaultValue={initialData.title || ""} />
              </div>
              <div>
                <label className="field-label required">Monthly Rent (Rs.)</label>
                <input name="price" type="number" placeholder="e.g. 25000" required defaultValue={initialData.price || ""} />
              </div>
              <div>
                <label className="field-label required">Area Size</label>
                <input name="areaSize" placeholder="e.g. 5 aana, 200 sqft" required defaultValue={initialData.areaSize || ""} />
              </div>
            </div>
          </div>

          {/* ── Category ── */}
          <div className="form-section">
            <div className="form-section-label">Property Category</div>
            <div className="form-full">
              <label className="field-label required">Main Category</label>
              <div className="category-selector">
                {Object.entries(PROPERTY_CATEGORIES).map(([cat, info]) => (
                  <button
                    key={cat}
                    type="button"
                    className={"cat-btn" + (mainCategory === cat ? " selected" : "")}
                    onClick={() => { setMainCategory(cat); setSubCategory(""); }}
                  >
                    <span>{info.icon}</span> {cat}
                  </button>
                ))}
              </div>
              <input type="hidden" name="mainCategory" value={mainCategory} />
            </div>

            {mainCategory && (
              <div className="form-full" style={{ marginTop: 16 }}>
                <label className="field-label required">Sub-Category</label>
                <div className="subcategory-selector">
                  {subCats.map(sc => (
                    <button
                      key={sc}
                      type="button"
                      className={"subcat-btn" + (subCategory === sc ? " selected" : "")}
                      onClick={() => setSubCategory(sc)}
                    >
                      {sc}
                    </button>
                  ))}
                </div>
                <input type="hidden" name="subCategory" value={subCategory} />
                <input type="hidden" name="category" value={mainCategory} />
                {!subCategory && <p className="subcat-warning">Please select a sub-category to continue.</p>}
              </div>
            )}
          </div>

          {/* ── Category-specific fields ── */}
          {mainCategory === "Land" && (
            <div className="form-section">
              <div className="form-section-label">Land Details</div>
              <div className="form-grid">
                <div className="form-full">
                  <label className="field-label">Land Use / Zoning</label>
                  <select name="landUse" defaultValue={initialData.landUse || ""}>
                    <option value="">Select Land Use</option>
                    <option value="Farming">Farming / Cultivation</option>
                    <option value="Orchard">Orchard / Garden</option>
                    <option value="Pasture">Pasture / Grazing</option>
                    <option value="Residential Plot">Residential Plot</option>
                    <option value="Commercial Plot">Commercial Plot</option>
                    <option value="Industrial">Industrial Zone</option>
                  </select>
                </div>
                <div>
                  <label className="field-label">Road Access</label>
                  <input name="roadAccess" placeholder="e.g. 20ft black top" defaultValue={initialData.roadAccess || ""} />
                </div>
                <div>
                  <label className="field-label">Water Source</label>
                  <input name="waterSource" placeholder="e.g. municipal, well" defaultValue={initialData.waterSource || ""} />
                </div>
              </div>
            </div>
          )}

          {mainCategory === "House" && (
            <div className="form-section">
              <div className="form-section-label">House Details</div>
              <div className="form-grid">
                <div>
                  <label className="field-label">Bedrooms</label>
                  <input name="bedrooms" type="number" placeholder="Number of bedrooms" min="0" defaultValue={initialData.bedrooms || ""} />
                </div>
                <div>
                  <label className="field-label">Bathrooms</label>
                  <input name="bathrooms" type="number" placeholder="Number of bathrooms" min="0" defaultValue={initialData.bathrooms || ""} />
                </div>
                <div>
                  <label className="field-label">Furnishing Status</label>
                  <select name="furnishing" defaultValue={initialData.furnishing || ""}>
                    <option value="">Select Furnishing</option>
                    <option value="Unfurnished">Unfurnished</option>
                    <option value="Semi-Furnished">Semi-Furnished</option>
                    <option value="Fully Furnished">Fully Furnished</option>
                  </select>
                </div>
                <div>
                  <label className="field-label">Floor</label>
                  <select name="floor" defaultValue={initialData.floor || ""}>
                    <option value="">Select Floor</option>
                    <option value="Ground">Ground Floor</option>
                    <option value="1st">1st Floor</option>
                    <option value="2nd">2nd Floor</option>
                    <option value="3rd">3rd Floor</option>
                    <option value="4th+">4th Floor or Above</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {mainCategory === "Room" && (
            <div className="form-section">
              <div className="form-section-label">Room Details</div>
              <div className="form-grid">
                <div>
                  <label className="field-label">Furnishing Status</label>
                  <select name="furnishing" defaultValue={initialData.furnishing || ""}>
                    <option value="">Select Furnishing</option>
                    <option value="Unfurnished">Unfurnished</option>
                    <option value="Semi-Furnished">Semi-Furnished</option>
                    <option value="Fully Furnished">Fully Furnished</option>
                  </select>
                </div>
                <div>
                  <label className="field-label">Bathroom</label>
                  <select name="attachedBathroom" defaultValue={initialData.attachedBathroom || ""}>
                    <option value="">Select Bathroom Type</option>
                    <option value="Attached">Attached Bathroom</option>
                    <option value="Shared">Shared Bathroom</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ── Location ── */}
          <div className="form-section">
            <div className="form-section-label">Location</div>
            <div className="form-grid">
              <div>
                <label className="field-label required">Province</label>
                <select name="province" required value={province} onChange={e => { setProvince(e.target.value); setDistrict(""); setCity(""); }}>
                  <option value="">Select Province</option>
                  {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="field-label required">District</label>
                <select name="district" required value={district} onChange={e => { setDistrict(e.target.value); setCity(""); }} disabled={!province}>
                  <option value="">Select District</option>
                  {districts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="field-label required">City / Municipality / VDC</label>
                {cities.length > 0 ? (
                  <select name="city" required value={city} onChange={e => setCity(e.target.value)} disabled={!district}>
                    <option value="">Select City / Area</option>
                    {cities.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                ) : (
                  <input
                    name="city"
                    placeholder="e.g. Thamel, Ward-3"
                    required
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    disabled={!district}
                  />
                )}
              </div>
              <div>
                <label className="field-label required">Specific Location / Landmark</label>
                <input name="location" placeholder="e.g. Near Pashupatinath, Ring Road" required defaultValue={initialData.location || ""} />
              </div>
              <div className="form-full">
                <label className="field-label">Google Maps Link or Coordinates</label>
                <p className="map-hint">Paste a Google Maps link, city name, or Lat/Lng coordinates (e.g. 27.7172, 85.3240)</p>
                <input name="mapUrl" placeholder="e.g. https://maps.google.com/... or 27.7172, 85.3240" defaultValue={initialData.mapUrl || ""} />
              </div>
              {(mainCategory === "Land" || mainCategory === "House") && (
                <div className="form-full">
                  <label className="field-label">Google MyMaps Link <span style={{fontWeight:400,color:"#a0aeae",fontSize:"0.8rem"}}>(recommended for Land &amp; House)</span></label>
                  <p className="map-hint">
                    For precise property boundaries, create a custom map at{" "}
                    <a href="https://mymaps.google.com" target="_blank" rel="noopener noreferrer" style={{color:"#557373",fontWeight:600}}>mymaps.google.com</a>
                    {" "}→ draw your plot → Share → copy the link and paste it here.
                  </p>
                  <input name="myMapsUrl" placeholder="e.g. https://www.google.com/maps/d/viewer?mid=..." defaultValue={initialData.myMapsUrl || ""} />
                </div>
              )}
            </div>
          </div>

          {/* ── Contact ── */}
          <div className="form-section">
            <div className="form-section-label">Contact Information</div>
            <div className="form-grid">
              <div>
                <label className="field-label required">Owner Name</label>
                <input name="ownerName" placeholder="Full name" required defaultValue={initialData.ownerName || ""} />
              </div>
              <div>
                <label className="field-label required">Contact Phone</label>
                <input name="ownerPhone" placeholder="10-digit phone number" required pattern="[0-9]{10}" title="Enter a valid 10-digit phone number" defaultValue={initialData.ownerPhone || ""} />
              </div>
              <div className="form-full">
                <label className="field-label required">Owner Email</label>
                <input name="ownerEmail" type="email" placeholder="email@example.com" required defaultValue={initialData.ownerEmail || ""} />
              </div>
            </div>
          </div>

          {/* ── Description ── */}
          <div className="form-section">
            <div className="form-section-label">Description</div>
            <label className="field-label">Detailed Description</label>
            <textarea name="description" placeholder="Describe the property — nearby facilities, special features, access, etc." rows="5" defaultValue={initialData.description || ""}></textarea>
          </div>

          {/* ── Media ── */}
          <div className="form-section">
            <div className="form-section-label">Property Media</div>
            <MediaUploader initialMedia={initialData.mediaFiles || (initialData.image ? [initialData.image] : [])} />
          </div>

          {/* ── Ownership Document ── */}
          {!initialData._id && (
            <div className="form-section">
              <div className="form-section-label">Ownership Document</div>
              <div className="lalpurja-upload">
                <div className="lalpurja-label">
                  <span>📄</span> Lalpurja / Ownership Proof (Admin Only) *
                </div>
                <input type="file" name="lalpurja" accept="image/*,.pdf" required />
              </div>
            </div>
          )}

          {/* ── Submit ── */}
          <div className="form-submit-section">
            <div className="form-submit-info">
              By submitting, you agree to our platform terms.<br />
              <strong>Rs. 500</strong> listing fee via eSewa will be charged.
            </div>
            <button
              className="form-submit-btn"
              type="submit"
              disabled={mainCategory && !subCategory}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              {submitLabel}
            </button>
          </div>

        </form>
      </div>

      </div>{/* end lf-body */}
    </div>
  );
};

export default LandForm;
