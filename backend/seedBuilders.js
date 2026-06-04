const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const BuilderProfile = require("./models/BuilderProfile");
const BuildProject = require("./models/BuildProject");

const BUILDERS = [
  {
    email: "classic.builders@properestate.com",
    password: "builder123",
    name: "Sagar KC (Classic Builders)",
    phone: "9840112233",
    profile: {
      companyName: "Classic Builders & Construction Pvt. Ltd.",
      companyType: "company",
      registrationNumber: "CB-54910-NP",
      establishedYear: 2012,
      address: "Naxal, Kathmandu",
      province: "Bagmati",
      district: "Kathmandu",
      city: "Naxal",
      website: "www.classicbuilders.com.np",
      phone: "9840112233",
      email: "classic.builders@properestate.com",
      description: "A premier construction company specialized in building luxury villas, residential homes, and commercial apartments in Nepal. Over 10 years of experience ensuring solid foundations and magnificent structures.",
      specializations: ["house", "villa", "apartment", "office"],
      yearsOfExperience: 14,
      completedProjects: 38,
      workers: [
        { name: "Er. Sagar KC", role: "Chief Structural Engineer", experience: "12 Years" },
        { name: "Er. Alina Thapa", role: "Interior Architect", experience: "8 Years" },
        { name: "Hari Prasad Shrestha", role: "Construction Site Manager", experience: "15 Years" }
      ],
      verificationStatus: "approved",
      averageRating: 4.8,
      totalRatings: 12
    }
  },
  {
    email: "apex.construct@properestate.com",
    password: "builder123",
    name: "Ram Kumar (Apex Construction)",
    phone: "9810445566",
    profile: {
      companyName: "Apex Construction & Contractors",
      companyType: "contractor",
      registrationNumber: "AC-11029-NP",
      establishedYear: 2018,
      address: "Patan, Lalitpur",
      province: "Bagmati",
      district: "Lalitpur",
      city: "Patan",
      website: "www.apexconstruction.com",
      phone: "9810445566",
      email: "apex.construct@properestate.com",
      description: "Apex Construction delivers top-quality structural engineering, residential construction, and home remodeling. Known for delivering projects on budget and on schedule.",
      specializations: ["house", "restaurant", "gym", "swimming_pool"],
      yearsOfExperience: 8,
      completedProjects: 15,
      workers: [
        { name: "Ram Kumar", role: "Project Director", experience: "10 Years" },
        { name: "Er. Devendra Giri", role: "Civil Engineer", experience: "6 Years" }
      ],
      verificationStatus: "approved",
      averageRating: 4.5,
      totalRatings: 6
    }
  },
  {
    email: "elite.resorts@properestate.com",
    password: "builder123",
    name: "Kabir Gurung (Elite Build)",
    phone: "9820778899",
    profile: {
      companyName: "Elite Resort & Commercial Builders",
      companyType: "company",
      registrationNumber: "ER-90184-NP",
      establishedYear: 2015,
      address: "Lakeside, Pokhara",
      province: "Gandaki",
      district: "Kaski",
      city: "Lakeside",
      website: "www.elitebuilders.com.np",
      phone: "9820778899",
      email: "elite.resorts@properestate.com",
      description: "Specialized in large-scale luxury hospitality projects, resort construction, gyms, commercial hubs, and design-build hotel infrastructure across Pokhara and Gandaki province.",
      specializations: ["hotel", "restaurant", "warehouse", "gym", "other"],
      yearsOfExperience: 11,
      completedProjects: 22,
      workers: [
        { name: "Kabir Gurung", role: "Founder & Lead Developer", experience: "15 Years" },
        { name: "Er. Nischal Rai", role: "Project Engineer", experience: "9 Years" }
      ],
      verificationStatus: "approved",
      averageRating: 4.7,
      totalRatings: 9
    }
  }
];

const PROJECTS = [
  {
    projectTitle: "Modern 3-Storey Residential House in Lalitpur",
    buildType: "house",
    purpose: "personal_use",
    landStatus: "own_land",
    landLocation: "Imadol, Lalitpur",
    landArea: "4 Aana",
    province: "Bagmati",
    district: "Lalitpur",
    city: "Imadol",
    budgetMin: 18000000,
    budgetMax: 25000000,
    budgetFlexible: true,
    expectedStartDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // in 30 days
    expectedDuration: "8 Months",
    description: "Looking for a construction company to build a modern 3-storey residential house in Imadol, Lalitpur. We want high-quality concrete and earthquake-resistant structure with modern sanitary designs.",
    floors: 3,
    rooms: 8,
    specialRequirements: "Earthquake resistant design, rooftop terrace, rain-water harvesting setup.",
    preferredMaterials: "Panchakanya Steel, OPC Cement, high-quality brick tiles"
  },
  {
    projectTitle: "Luxury 5-Bedroom Villa in Pokhara Lakeside",
    buildType: "villa",
    purpose: "mixed_use",
    landStatus: "own_land",
    landLocation: "Lakeside, Pokhara",
    landArea: "8 Aana",
    province: "Gandaki",
    district: "Kaski",
    city: "Pokhara",
    budgetMin: 35000000,
    budgetMax: 45000000,
    budgetFlexible: false,
    expectedStartDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    expectedDuration: "12 Months",
    description: "We are building a premium 5-bedroom vacation villa overlooking Phewa Lake. The construction needs premium finishes, stone wall detailing, and beautiful wooden ceilings.",
    floors: 2,
    rooms: 10,
    specialRequirements: "Lakeside orientation, swimming pool integration, floor-to-ceiling glass windows.",
    preferredMaterials: "Natural wood and stone facades, high-grade UPVC window profiles"
  },
  {
    projectTitle: "Elegant 3-Storey Apartment Complex in Kathmandu",
    buildType: "apartment",
    purpose: "lease_rent",
    landStatus: "own_land",
    landLocation: "Baneshwor, Kathmandu",
    landArea: "10 Aana",
    province: "Bagmati",
    district: "Kathmandu",
    city: "Baneshwor",
    budgetMin: 50000000,
    budgetMax: 80000000,
    budgetFlexible: true,
    expectedStartDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    expectedDuration: "18 Months",
    description: "Multi-family residential apartment building in New Baneshwor. The building will have 6 flat units (2 flats per floor). Ground floor will serve as a secure underground parking space.",
    floors: 4,
    rooms: 16,
    specialRequirements: "Underground parking, elevator system, central reserve water tank.",
    preferredMaterials: "Standard reinforcement, modern vitrified tiles, soundproof glass paneling"
  },
  {
    projectTitle: "Premium Commercial Building in Pokhara",
    buildType: "commercial",
    purpose: "business",
    landStatus: "own_land",
    landLocation: "Srijanachowk, Pokhara",
    landArea: "6 Aana",
    province: "Gandaki",
    district: "Kaski",
    city: "Pokhara",
    budgetMin: 40000000,
    budgetMax: 60000000,
    expectedStartDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    expectedDuration: "14 Months",
    description: "Looking to construct a commercial property to lease to banks and brand outlets in Pokhara. High road access is already available.",
    floors: 3,
    rooms: 6,
    specialRequirements: "Clear column design for flexible shop partitioning, full glass facade front.",
    preferredMaterials: "Premium grade ready-mix concrete, standard architectural fittings"
  }
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 30000 });
  console.log("✅ Database connected successfully!");

  // 1. Create/Find Ramesh Customer Account
  let ramesh = await User.findOne({ email: "ramesh@properestate.com" });
  if (!ramesh) {
    const hashed = await bcrypt.hash("ramesh123", 10);
    ramesh = await User.create({
      name: "Ramesh Bhandari",
      email: "ramesh@properestate.com",
      phone: "9851000000",
      password: hashed,
      role: "user",
      accountType: ""
    });
    console.log("👤 Created Ramesh Customer Account:", ramesh.email);
  } else {
    console.log("👤 Ramesh Customer Account already exists:", ramesh.email);
  }

  // Clean old projects of Ramesh to avoid clutter
  await BuildProject.deleteMany({ ownerId: ramesh._id });
  console.log("🧹 Cleaned old build projects of Ramesh.");

  // Seed Projects
  for (const p of PROJECTS) {
    await BuildProject.create({
      ...p,
      ownerId: ramesh._id,
      ownerName: ramesh.name,
      ownerEmail: ramesh.email,
      ownerPhone: ramesh.phone,
      status: "open"
    });
    console.log(`🏗️ Seeded project request: "${p.projectTitle}"`);
  }

  // 2. Create/Find and Seed Builders
  for (const b of BUILDERS) {
    let user = await User.findOne({ email: b.email });
    if (!user) {
      const hashed = await bcrypt.hash(b.password, 10);
      user = await User.create({
        name: b.name,
        email: b.email,
        phone: b.phone,
        password: hashed,
        role: "user",
        accountType: "seller" // Mark as verified seller/builder
      });
      console.log(`👷 Created User account for Builder: ${user.email}`);
    } else {
      await User.findByIdAndUpdate(user._id, { accountType: "seller" });
      console.log(`👷 User already exists for: ${user.email}`);
    }

    // Clean old profile if exists
    await BuilderProfile.deleteMany({ userId: user._id });

    // Seed profile details
    await BuilderProfile.create({
      ...b.profile,
      userId: user._id,
      phone: b.phone,
      email: b.email
    });
    console.log(`💼 Seeded profile for builder company: "${b.profile.companyName}"`);
  }

  await mongoose.disconnect();
  console.log("🔌 Disconnected. Seeding Completed!");
}

seed().catch(err => {
  console.error("❌ Seeding Error:", err);
  process.exit(1);
});
