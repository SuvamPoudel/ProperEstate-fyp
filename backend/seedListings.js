require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Land = require("./models/Land");
const User = require("./models/User");

// ── Nepal property images (public URLs — houses, flats, land, rooms) ──────────
const IMAGES = {
  house: [
    "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
    "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
    "https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800",
  ],
  flat: [
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
    "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
  ],
  room: [
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800",
    "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800",
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800",
  ],
  land: [
    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800",
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800",
    "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800",
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
  ],
  commercial: [
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800",
    "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800",
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800",
  ],
  lalpurja: [
    "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400",
    "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400",
    "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400",
  ],
};

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const phones = () => `98${rnd(10,99)}${rnd(100000,999999)}`;

// ── 35 listings across all categories, provinces, districts ──────────────────
const LISTINGS = [
  // ── BAGMATI / KATHMANDU ──────────────────────────────────────────────────
  { title:"2 BHK Flat in Thamel", mainCategory:"House", subCategory:"2 BHK", province:"Bagmati", district:"Kathmandu", city:"Thamel", location:"Near Thamel Chowk, Kathmandu", price:25000, areaSize:"850 sqft", bedrooms:2, bathrooms:2, furnishing:"Semi-Furnished", floor:"2nd", description:"Bright 2BHK flat in the heart of Thamel. Close to restaurants, shops and tourist area. 24hr water supply.", mapUrl:"27.7172, 85.3096", imgType:"flat" },
  { title:"3 BHK House in Baneshwor", mainCategory:"House", subCategory:"3 BHK", province:"Bagmati", district:"Kathmandu", city:"Baneshwor", location:"New Baneshwor, near Kathmandu Mall", price:45000, areaSize:"1400 sqft", bedrooms:3, bathrooms:3, furnishing:"Fully Furnished", floor:"1st", description:"Spacious 3BHK house with parking, garden and rooftop access. Quiet residential area.", mapUrl:"27.6939, 85.3358", imgType:"house" },
  { title:"Single Room in Kapan", mainCategory:"Room", subCategory:"Single Room", province:"Bagmati", district:"Kathmandu", city:"Kapan", location:"Kapan, near Bouddha", price:7500, areaSize:"120 sqft", furnishing:"Unfurnished", description:"Clean single room with shared kitchen. 5 min walk to Bouddha Stupa. Ideal for students.", mapUrl:"27.7215, 85.3620", imgType:"room" },
  { title:"Residential Land in Naxal", mainCategory:"Land", subCategory:"Residential Land / Plot", province:"Bagmati", district:"Kathmandu", city:"Naxal", location:"Naxal, near Rani Pokhari", price:80000, areaSize:"4 aana", description:"Prime residential plot in Naxal. 20ft road access, all utilities available.", mapUrl:"27.7106, 85.3176", imgType:"land" },
  { title:"Office Space in Lazimpat", mainCategory:"Commercial", subCategory:"Office Space", province:"Bagmati", district:"Kathmandu", city:"Lazimpat", location:"Lazimpat, near Embassy area", price:55000, areaSize:"600 sqft", description:"Professional office space in Lazimpat diplomatic zone. Ideal for NGOs, consultancies.", mapUrl:"27.7226, 85.3176", imgType:"commercial" },

  // ── BAGMATI / LALITPUR ───────────────────────────────────────────────────
  { title:"Studio Apartment in Patan", mainCategory:"House", subCategory:"Studio Apartment", province:"Bagmati", district:"Lalitpur", city:"Patan", location:"Mangalbazar, Patan Durbar Square area", price:18000, areaSize:"400 sqft", furnishing:"Fully Furnished", floor:"3rd", description:"Cozy studio apartment with heritage view. Walking distance to Patan Durbar Square.", mapUrl:"27.6727, 85.3249", imgType:"flat" },
  { title:"4 BHK Villa in Jhamsikhel", mainCategory:"House", subCategory:"House / Villa", province:"Bagmati", district:"Lalitpur", city:"Jhamsikhel", location:"Jhamsikhel, near Sanepa", price:90000, areaSize:"2200 sqft", bedrooms:4, bathrooms:4, furnishing:"Fully Furnished", floor:"Ground", description:"Luxurious villa with garden, parking for 3 cars, solar power. Premium locality.", mapUrl:"27.6820, 85.3176", imgType:"house" },
  { title:"Duplex House in Imadol", mainCategory:"House", subCategory:"Duplex", province:"Bagmati", district:"Lalitpur", city:"Imadol", location:"Imadol, Lalitpur near Krishna Mandir", price:65000, areaSize:"1500 sqft", bedrooms:3, bathrooms:3, furnishing:"Semi-Furnished", floor:"Ground", description:"Beautiful 3 BHK duplex house in Imadol with spacious bedrooms, modern kitchen, and car parking.", mapUrl:"27.6644, 85.3498", imgType:"house" },
  { title:"Shop Space in Lagankhel", mainCategory:"Commercial", subCategory:"Shop / Showroom", province:"Bagmati", district:"Lalitpur", city:"Lagankhel", location:"Lagankhel Bus Park area", price:35000, areaSize:"300 sqft", description:"Ground floor shop near Lagankhel bus park. High footfall area, ideal for retail.", mapUrl:"27.6636, 85.3176", imgType:"commercial" },

  // ── BAGMATI / BHAKTAPUR ──────────────────────────────────────────────────
  { title:"Traditional House in Bhaktapur", mainCategory:"House", subCategory:"House / Villa", province:"Bagmati", district:"Bhaktapur", city:"Bhaktapur", location:"Near Bhaktapur Durbar Square", price:30000, areaSize:"1100 sqft", bedrooms:3, bathrooms:2, furnishing:"Unfurnished", description:"Traditional Newari-style house near Bhaktapur Durbar Square. Heritage area.", mapUrl:"27.6710, 85.4298", imgType:"house" },
  { title:"Agricultural Land in Nagarkot", mainCategory:"Land", subCategory:"Agricultural Land", province:"Bagmati", district:"Bhaktapur", city:"Nagarkot", location:"Nagarkot Hill, Bhaktapur", price:15000, areaSize:"8 ropani", description:"Fertile agricultural land with mountain views. Suitable for organic farming.", mapUrl:"27.7167, 85.5167", imgType:"land" },

  // ── BAGMATI / CHITWAN ────────────────────────────────────────────────────
  { title:"2 BHK Flat in Bharatpur", mainCategory:"House", subCategory:"2 BHK", province:"Bagmati", district:"Chitwan", city:"Bharatpur", location:"Bharatpur-10, near Chitwan Hospital", price:18000, areaSize:"750 sqft", bedrooms:2, bathrooms:2, furnishing:"Semi-Furnished", description:"Modern 2BHK in Bharatpur city. Close to hospital, schools and market.", mapUrl:"27.6833, 84.4333", imgType:"flat" },
  { title:"Room near Sauraha", mainCategory:"Room", subCategory:"Room with Attached Bath", province:"Bagmati", district:"Chitwan", city:"Sauraha", location:"Sauraha, near Chitwan National Park", price:8000, areaSize:"150 sqft", furnishing:"Semi-Furnished", description:"Comfortable room near Chitwan National Park. Perfect for nature lovers.", mapUrl:"27.5667, 84.5000", imgType:"room" },

  // ── GANDAKI / KASKI (POKHARA) ────────────────────────────────────────────
  { title:"Lakeside Apartment in Pokhara", mainCategory:"House", subCategory:"Apartment / Flat", province:"Gandaki", district:"Kaski", city:"Lakeside", location:"Lakeside, Pokhara near Phewa Lake", price:28000, areaSize:"900 sqft", bedrooms:2, bathrooms:2, furnishing:"Fully Furnished", floor:"2nd", description:"Beautiful apartment with lake view. Walking distance to Phewa Lake and restaurants.", mapUrl:"28.2096, 83.9556", imgType:"flat" },
  { title:"Bungalow in Pokhara", mainCategory:"House", subCategory:"Bungalow", province:"Gandaki", district:"Kaski", city:"Pokhara", location:"Prithvichowk, Pokhara", price:55000, areaSize:"1800 sqft", bedrooms:4, bathrooms:3, furnishing:"Semi-Furnished", description:"Spacious bungalow with mountain views. Large garden, parking, quiet area.", mapUrl:"28.2096, 83.9856", imgType:"house" },
  { title:"Commercial Land in Birauta", mainCategory:"Land", subCategory:"Commercial Land", province:"Gandaki", district:"Kaski", city:"Birauta", location:"Birauta, Pokhara highway side", price:120000, areaSize:"6 aana", description:"Highway-facing commercial land in Birauta. Ideal for hotel, showroom or petrol pump.", mapUrl:"28.2500, 83.9833", imgType:"land" },
  { title:"Restaurant Space in Lakeside", mainCategory:"Commercial", subCategory:"Restaurant Space", province:"Gandaki", district:"Kaski", city:"Lakeside", location:"Lakeside-6, tourist zone", price:65000, areaSize:"800 sqft", description:"Prime restaurant space in Lakeside tourist zone. Fully fitted kitchen, outdoor seating.", mapUrl:"28.2096, 83.9556", imgType:"commercial" },

  // ── LUMBINI / RUPANDEHI (BUTWAL/BHAIRAHAWA) ──────────────────────────────
  { title:"1 BHK Flat in Butwal", mainCategory:"House", subCategory:"1 BHK", province:"Lumbini", district:"Rupandehi", city:"Butwal", location:"Butwal-10, Traffic Chowk area", price:12000, areaSize:"500 sqft", bedrooms:1, bathrooms:1, furnishing:"Unfurnished", description:"Affordable 1BHK flat in Butwal city center. Close to market and transport.", mapUrl:"27.7006, 83.4532", imgType:"flat" },
  { title:"House in Bhairahawa", mainCategory:"House", subCategory:"House / Villa", province:"Lumbini", district:"Rupandehi", city:"Bhairahawa", location:"Bhairahawa, near airport", price:35000, areaSize:"1200 sqft", bedrooms:3, bathrooms:2, furnishing:"Semi-Furnished", description:"3BHK house near Gautam Buddha International Airport. Good connectivity.", mapUrl:"27.5050, 83.4500", imgType:"house" },
  { title:"Agricultural Land in Rupandehi", mainCategory:"Land", subCategory:"Agricultural Land", province:"Lumbini", district:"Rupandehi", city:"Sainamaina", location:"Sainamaina, Rupandehi", price:20000, areaSize:"1 bigha", description:"Fertile agricultural land near Lumbini. Suitable for rice, wheat cultivation.", mapUrl:"27.6167, 83.4500", imgType:"land" },
  { title:"Warehouse in Butwal", mainCategory:"Commercial", subCategory:"Warehouse / Godown", province:"Lumbini", district:"Rupandehi", city:"Butwal", location:"Industrial area, Butwal", price:40000, areaSize:"2000 sqft", description:"Large warehouse with loading dock. Ideal for distribution, storage business.", mapUrl:"27.7006, 83.4532", imgType:"commercial" },

  // ── KOSHI / MORANG (BIRATNAGAR) ──────────────────────────────────────────
  { title:"2 BHK Apartment in Biratnagar", mainCategory:"House", subCategory:"2 BHK", province:"Koshi", district:"Morang", city:"Biratnagar", location:"Biratnagar-5, Main Road", price:20000, areaSize:"800 sqft", bedrooms:2, bathrooms:2, furnishing:"Semi-Furnished", description:"Modern 2BHK in Biratnagar city. Close to schools, hospitals and market.", mapUrl:"26.4525, 87.2718", imgType:"flat" },
  { title:"Room in Biratnagar", mainCategory:"Room", subCategory:"Double Room", province:"Koshi", district:"Morang", city:"Biratnagar", location:"Biratnagar-3, near college", price:6000, areaSize:"130 sqft", furnishing:"Unfurnished", description:"Double room near Biratnagar campus. Shared bathroom, kitchen access.", mapUrl:"26.4525, 87.2718", imgType:"room" },
  { title:"Commercial Land in Urlabari", mainCategory:"Land", subCategory:"Commercial Land", province:"Koshi", district:"Morang", city:"Urlabari", location:"Urlabari, East-West Highway", price:75000, areaSize:"5 aana", description:"Highway-facing commercial plot in Urlabari. High traffic area.", mapUrl:"26.6333, 87.4167", imgType:"land" },

  // ── KOSHI / SUNSARI (DHARAN/ITAHARI) ────────────────────────────────────
  { title:"3 BHK House in Dharan", mainCategory:"House", subCategory:"3 BHK", province:"Koshi", district:"Sunsari", city:"Dharan", location:"Dharan-8, BP Chowk area", price:30000, areaSize:"1300 sqft", bedrooms:3, bathrooms:2, furnishing:"Semi-Furnished", description:"Spacious 3BHK in Dharan. Near BP Koirala Institute of Health Sciences.", mapUrl:"26.8065, 87.2846", imgType:"house" },
  { title:"Office Space in Itahari", mainCategory:"Commercial", subCategory:"Office Space", province:"Koshi", district:"Sunsari", city:"Itahari", location:"Itahari Chowk, main road", price:25000, areaSize:"400 sqft", description:"Ground floor office space in Itahari commercial hub. Ideal for bank, clinic.", mapUrl:"26.6667, 87.2833", imgType:"commercial" },

  // ── KOSHI / JHAPA (BIRTAMODE/DAMAK) ─────────────────────────────────────
  { title:"House in Damak", mainCategory:"House", subCategory:"House / Villa", province:"Koshi", district:"Jhapa", city:"Damak", location:"Damak-5, near Damak Chowk", price:22000, areaSize:"1000 sqft", bedrooms:3, bathrooms:2, furnishing:"Unfurnished", description:"Well-built house in Damak. Close to market, schools and transport hub.", mapUrl:"26.6667, 87.7000", imgType:"house" },
  { title:"Agricultural Land in Jhapa", mainCategory:"Land", subCategory:"Agricultural Land", province:"Koshi", district:"Jhapa", city:"Birtamode", location:"Birtamode, Jhapa", price:18000, areaSize:"2 bigha", description:"Fertile tea-garden adjacent land in Jhapa. Ideal for farming or plantation.", mapUrl:"26.6500, 87.9833", imgType:"land" },

  // ── MADHESH / PARSA (BIRGUNJ) ────────────────────────────────────────────
  { title:"2 BHK Flat in Birgunj", mainCategory:"House", subCategory:"2 BHK", province:"Madhesh", district:"Parsa", city:"Birgunj", location:"Birgunj, Ghantaghar area", price:16000, areaSize:"700 sqft", bedrooms:2, bathrooms:1, furnishing:"Unfurnished", description:"Affordable 2BHK flat in Birgunj. Close to border trade area and market.", mapUrl:"27.0104, 84.8777", imgType:"flat" },
  { title:"Shop in Birgunj", mainCategory:"Commercial", subCategory:"Shop / Showroom", province:"Madhesh", district:"Parsa", city:"Birgunj", location:"Birgunj main bazaar", price:30000, areaSize:"250 sqft", description:"Prime shop space in Birgunj main bazaar. High footfall, ideal for retail.", mapUrl:"27.0104, 84.8777", imgType:"commercial" },

  // ── MADHESH / DHANUSHA (JANAKPUR) ────────────────────────────────────────
  { title:"House in Janakpur", mainCategory:"House", subCategory:"House / Villa", province:"Madhesh", district:"Dhanusha", city:"Janakpur", location:"Janakpur, near Janaki Temple", price:20000, areaSize:"1100 sqft", bedrooms:3, bathrooms:2, furnishing:"Semi-Furnished", description:"Traditional house near Janaki Temple. Cultural heritage area, peaceful locality.", mapUrl:"26.7288, 85.9266", imgType:"house" },

  // ── SUDURPASHCHIM / KAILALI (DHANGADHI) ─────────────────────────────────
  { title:"2 BHK Flat in Dhangadhi", mainCategory:"House", subCategory:"2 BHK", province:"Sudurpashchim", district:"Kailali", city:"Dhangadhi", location:"Dhangadhi-5, main road", price:14000, areaSize:"650 sqft", bedrooms:2, bathrooms:1, furnishing:"Unfurnished", description:"Affordable 2BHK in Dhangadhi. Close to market and transport.", mapUrl:"28.6833, 80.6000", imgType:"flat" },
  { title:"Agricultural Land in Kailali", mainCategory:"Land", subCategory:"Agricultural Land", province:"Sudurpashchim", district:"Kailali", city:"Tikapur", location:"Tikapur, Kailali", price:12000, areaSize:"3 bigha", description:"Fertile agricultural land in Tikapur. Suitable for sugarcane, paddy cultivation.", mapUrl:"28.5167, 81.1167", imgType:"land" },

  // ── KARNALI / SURKHET (BIRENDRANAGAR) ───────────────────────────────────
  { title:"House in Birendranagar", mainCategory:"House", subCategory:"House / Villa", province:"Karnali", district:"Surkhet", city:"Birendranagar", location:"Birendranagar-5, Surkhet", price:18000, areaSize:"1000 sqft", bedrooms:3, bathrooms:2, furnishing:"Unfurnished", description:"Comfortable house in Birendranagar. Peaceful locality with mountain views.", mapUrl:"28.6000, 81.6333", imgType:"house" },
  { title:"Room in Birendranagar", mainCategory:"Room", subCategory:"Single Room", province:"Karnali", district:"Surkhet", city:"Birendranagar", location:"Birendranagar, near campus", price:5000, areaSize:"100 sqft", furnishing:"Unfurnished", description:"Affordable single room near Surkhet campus. Shared facilities.", mapUrl:"28.6000, 81.6333", imgType:"room" },

  // ── GANDAKI / SYANGJA ────────────────────────────────────────────────────
  { title:"Residential Land in Waling", mainCategory:"Land", subCategory:"Residential Land / Plot", province:"Gandaki", district:"Syangja", city:"Waling", location:"Waling Bazaar, Syangja", price:22000, areaSize:"5 aana", description:"Residential plot in Waling bazaar. Road access, electricity and water available.", mapUrl:"27.9833, 83.7833", imgType:"land" },

  // ── LUMBINI / DANG ───────────────────────────────────────────────────────
  { title:"House in Tulsipur", mainCategory:"House", subCategory:"House / Villa", province:"Lumbini", district:"Dang", city:"Tulsipur", location:"Tulsipur-5, Dang", price:16000, areaSize:"900 sqft", bedrooms:2, bathrooms:2, furnishing:"Semi-Furnished", description:"Well-maintained house in Tulsipur. Close to market and schools.", mapUrl:"28.1333, 82.3000", imgType:"house" },
];

// ── Owner names pool ──────────────────────────────────────────────────────────
const OWNERS = [
  { name:"Ramesh Sharma",    email:"ramesh.sharma@gmail.com",   phone:"9841234567" },
  { name:"Ramesh Thapa",     email:"ramesh.thapa@gmail.com",    phone:"9851234567" },
  { name:"Ramesh Karki",     email:"ramesh.karki@gmail.com",    phone:"9861234567" },
  { name:"Ramesh Adhikari",  email:"ramesh.adhikari@gmail.com", phone:"9871234567" },
  { name:"Ramesh Poudel",    email:"ramesh.poudel@gmail.com",   phone:"9811234567" },
  { name:"Ramesh Gurung",    email:"ramesh.gurung@gmail.com",   phone:"9821234567" },
  { name:"Ramesh Rai",       email:"ramesh.rai@gmail.com",      phone:"9831234567" },
];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Connected to MongoDB");

  // ── 1. Create / find Ramesh seller account ──────────────────────────────
  let ramesh = await User.findOne({ email: "ramesh.sharma@gmail.com" });
  if (!ramesh) {
    const hashed = await bcrypt.hash("Ramesh@123", 10);
    ramesh = await User.create({
      name: "Ramesh Sharma",
      email: "ramesh.sharma@gmail.com",
      phone: "9841234567",
      password: hashed,
      role: "user",
      accountType: "seller",
    });
    console.log("✅ Created Ramesh account:", ramesh._id);
  } else {
    // Make sure he's a seller
    await User.findByIdAndUpdate(ramesh._id, { accountType: "seller" });
    console.log("✅ Ramesh already exists:", ramesh._id);
  }

  // ── 2. Fix all existing listings with empty categories/locations ─────────
  const existing = await Land.find({});
  let fixed = 0;
  for (const land of existing) {
    const updates = {};

    // Fix mainCategory
    if (!land.mainCategory) {
      const cat = land.category || "";
      if (/house|residential|bungalow/i.test(cat) || /house|flat|bhk|apartment/i.test(land.title)) {
        updates.mainCategory = "House";
        if (!land.subCategory) updates.subCategory = /flat|apartment|bhk/i.test(land.title) ? "Apartment / Flat" : "House / Villa";
      } else if (/commercial/i.test(cat) || /shop|office|commercial/i.test(land.title)) {
        updates.mainCategory = "Commercial";
        if (!land.subCategory) updates.subCategory = /shop/i.test(land.title) ? "Shop / Showroom" : "Office Space";
      } else if (/agricultural|farm/i.test(cat) || /farm|khet|agri/i.test(land.title)) {
        updates.mainCategory = "Land";
        if (!land.subCategory) updates.subCategory = "Agricultural Land";
      } else if (/land|plot/i.test(land.title)) {
        updates.mainCategory = "Land";
        if (!land.subCategory) updates.subCategory = "Residential Land / Plot";
      } else if (/room|kotha/i.test(land.title)) {
        updates.mainCategory = "Room";
        if (!land.subCategory) updates.subCategory = "Single Room";
      } else {
        updates.mainCategory = "Land";
        if (!land.subCategory) updates.subCategory = "Residential Land / Plot";
      }
    }

    // Fix subCategory if still empty
    if (!land.subCategory && !updates.subCategory) {
      const mc = updates.mainCategory || land.mainCategory;
      if (mc === "House") updates.subCategory = "House / Villa";
      else if (mc === "Land") updates.subCategory = "Residential Land / Plot";
      else if (mc === "Room") updates.subCategory = "Single Room";
      else if (mc === "Commercial") updates.subCategory = "Office Space";
    }

    // Fix province/district/city from location string
    if (!land.province || !land.district) {
      const loc = (land.location + " " + land.title).toLowerCase();
      if (/kathmandu|ktm|thamel|naxal|kapan|mandikhatar|sukedhara|baneshwor|lazimpat/.test(loc)) {
        updates.province = "Bagmati"; updates.district = "Kathmandu";
        if (!land.city) updates.city = /thamel/.test(loc) ? "Thamel" : /naxal/.test(loc) ? "Naxal" : /kapan/.test(loc) ? "Kapan" : /mandikhatar/.test(loc) ? "Mandikhatar" : /sukedhara/.test(loc) ? "Sukedhara" : "Kathmandu";
      } else if (/lalitpur|patan|jhamsikhel/.test(loc)) {
        updates.province = "Bagmati"; updates.district = "Lalitpur";
        if (!land.city) updates.city = "Patan";
      } else if (/bhaktapur|nagarkot/.test(loc)) {
        updates.province = "Bagmati"; updates.district = "Bhaktapur";
        if (!land.city) updates.city = /nagarkot/.test(loc) ? "Nagarkot" : "Bhaktapur";
      } else if (/chitwan|bharatpur|narayanghat/.test(loc)) {
        updates.province = "Bagmati"; updates.district = "Chitwan";
        if (!land.city) updates.city = "Bharatpur";
      } else if (/pokhara|lakeside|birauta/.test(loc)) {
        updates.province = "Gandaki"; updates.district = "Kaski";
        if (!land.city) updates.city = /lakeside/.test(loc) ? "Lakeside" : "Pokhara";
      } else if (/butwal|bhairahawa/.test(loc)) {
        updates.province = "Lumbini"; updates.district = "Rupandehi";
        if (!land.city) updates.city = /bhairahawa/.test(loc) ? "Bhairahawa" : "Butwal";
      } else if (/biratnagar/.test(loc)) {
        updates.province = "Koshi"; updates.district = "Morang";
        if (!land.city) updates.city = "Biratnagar";
      } else if (/birgunj/.test(loc)) {
        updates.province = "Madhesh"; updates.district = "Parsa";
        if (!land.city) updates.city = "Birgunj";
      } else if (/birtamode|jhapa/.test(loc)) {
        updates.province = "Koshi"; updates.district = "Jhapa";
        if (!land.city) updates.city = "Birtamode";
      } else if (/ekata|ekatabhasti/.test(loc)) {
        updates.province = "Bagmati"; updates.district = "Kathmandu";
        if (!land.city) updates.city = "Kathmandu";
      }
    }

    if (Object.keys(updates).length > 0) {
      await Land.findByIdAndUpdate(land._id, updates);
      fixed++;
    }
  }
  console.log(`✅ Fixed ${fixed} existing listings`);

  // ── 3. Insert new listings ────────────────────────────────────────────────
  let inserted = 0;
  for (const l of LISTINGS) {
    // Skip if a very similar title already exists
    const exists = await Land.findOne({ title: l.title });
    if (exists) { console.log(`  ⏭  Skip (exists): ${l.title}`); continue; }

    const owner = pick(OWNERS);
    const imgArr = IMAGES[l.imgType] || IMAGES.house;
    const imgUrl = pick(imgArr);
    const lalpurjaUrl = pick(IMAGES.lalpurja);

    await Land.create({
      title:        l.title,
      description:  l.description || "",
      location:     l.location,
      province:     l.province,
      district:     l.district,
      city:         l.city,
      price:        l.price,
      areaSize:     l.areaSize,
      mainCategory: l.mainCategory,
      subCategory:  l.subCategory,
      category:     l.mainCategory,
      bedrooms:     l.bedrooms || "",
      bathrooms:    l.bathrooms || "",
      furnishing:   l.furnishing || "",
      floor:        l.floor || "",
      mapUrl:       l.mapUrl || "",
      ownerName:    owner.name,
      ownerPhone:   owner.phone,
      ownerEmail:   owner.email,
      ownerId:      ramesh._id.toString(),
      // Store image as external URL — frontend will render it directly
      image:        imgUrl,
      lalpurjaImage: lalpurjaUrl,
      mediaFiles:   [imgUrl],
      status:       "approved",
      available:    true,
      featured:     Math.random() > 0.75,
    });
    inserted++;
    console.log(`  ✅ Added: ${l.title}`);
  }
  console.log(`\n✅ Inserted ${inserted} new listings`);

  // ── 4. Approve all pending listings ──────────────────────────────────────
  const pendingResult = await Land.updateMany({ status: "pending" }, { status: "approved" });
  console.log(`✅ Approved ${pendingResult.modifiedCount} pending listings`);

  // ── 5. Summary ────────────────────────────────────────────────────────────
  const total = await Land.countDocuments({ status: "approved" });
  const byCategory = await Land.aggregate([
    { $match: { status: "approved" } },
    { $group: { _id: "$mainCategory", count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  console.log(`\n📊 Total approved listings: ${total}`);
  byCategory.forEach(b => console.log(`   ${b._id || "(uncategorised)"}: ${b.count}`));

  await mongoose.disconnect();
  console.log("\n✅ Done. Disconnected.");
}

run().catch(err => { console.error("❌ Seed error:", err.message); process.exit(1); });
