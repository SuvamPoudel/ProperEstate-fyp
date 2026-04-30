const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Land = require("../models/Land");
const User = require("../models/User");

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

const OWNERS = [
  { name:"Ramesh Sharma",   phone:"9841234567", email:"ramesh.sharma@gmail.com" },
  { name:"Ramesh Thapa",    phone:"9851234567", email:"ramesh.thapa@gmail.com" },
  { name:"Ramesh Karki",    phone:"9861234567", email:"ramesh.karki@gmail.com" },
  { name:"Ramesh Adhikari", phone:"9871234567", email:"ramesh.adhikari@gmail.com" },
  { name:"Ramesh Poudel",   phone:"9811234567", email:"ramesh.poudel@gmail.com" },
  { name:"Ramesh Gurung",   phone:"9821234567", email:"ramesh.gurung@gmail.com" },
  { name:"Ramesh Rai",      phone:"9831234567", email:"ramesh.rai@gmail.com" },
];

const LISTINGS = [
  { title:"2 BHK Flat in Thamel", mainCategory:"House", subCategory:"2 BHK", province:"Bagmati", district:"Kathmandu", city:"Thamel", location:"Near Thamel Chowk, Kathmandu", price:25000, areaSize:"850 sqft", bedrooms:2, bathrooms:2, furnishing:"Semi-Furnished", floor:"2nd", description:"Bright 2BHK flat in the heart of Thamel. Close to restaurants, shops and tourist area. 24hr water supply.", mapUrl:"27.7172, 85.3096", imgType:"flat" },
  { title:"3 BHK House in Baneshwor", mainCategory:"House", subCategory:"3 BHK", province:"Bagmati", district:"Kathmandu", city:"Baneshwor", location:"New Baneshwor, near Kathmandu Mall", price:45000, areaSize:"1400 sqft", bedrooms:3, bathrooms:3, furnishing:"Fully Furnished", floor:"1st", description:"Spacious 3BHK house with parking, garden and rooftop access. Quiet residential area.", mapUrl:"27.6939, 85.3358", imgType:"house" },
  { title:"Single Room in Kapan", mainCategory:"Room", subCategory:"Single Room", province:"Bagmati", district:"Kathmandu", city:"Kapan", location:"Kapan, near Bouddha", price:7500, areaSize:"120 sqft", furnishing:"Unfurnished", description:"Clean single room with shared kitchen. 5 min walk to Bouddha Stupa. Ideal for students.", mapUrl:"27.7215, 85.3620", imgType:"room" },
  { title:"Residential Land in Naxal", mainCategory:"Land", subCategory:"Residential Land / Plot", province:"Bagmati", district:"Kathmandu", city:"Naxal", location:"Naxal, near Rani Pokhari", price:80000, areaSize:"4 aana", description:"Prime residential plot in Naxal. 20ft road access, all utilities available.", mapUrl:"27.7106, 85.3176", imgType:"land" },
  { title:"Office Space in Lazimpat", mainCategory:"Commercial", subCategory:"Office Space", province:"Bagmati", district:"Kathmandu", city:"Lazimpat", location:"Lazimpat, near Embassy area", price:55000, areaSize:"600 sqft", description:"Professional office space in Lazimpat diplomatic zone. Ideal for NGOs, consultancies.", mapUrl:"27.7226, 85.3176", imgType:"commercial" },
  { title:"Studio Apartment in Patan", mainCategory:"House", subCategory:"Studio Apartment", province:"Bagmati", district:"Lalitpur", city:"Patan", location:"Mangalbazar, Patan Durbar Square area", price:18000, areaSize:"400 sqft", furnishing:"Fully Furnished", floor:"3rd", description:"Cozy studio apartment with heritage view. Walking distance to Patan Durbar Square.", mapUrl:"27.6727, 85.3249", imgType:"flat" },
  { title:"4 BHK Villa in Jhamsikhel", mainCategory:"House", subCategory:"House / Villa", province:"Bagmati", district:"Lalitpur", city:"Jhamsikhel", location:"Jhamsikhel, near Sanepa", price:90000, areaSize:"2200 sqft", bedrooms:4, bathrooms:4, furnishing:"Fully Furnished", floor:"Ground", description:"Luxurious villa with garden, parking for 3 cars, solar power. Premium locality.", mapUrl:"27.6820, 85.3176", imgType:"house" },
  { title:"Duplex House in Imadol", mainCategory:"House", subCategory:"Duplex", province:"Bagmati", district:"Lalitpur", city:"Imadol", location:"Imadol, Lalitpur near Krishna Mandir", price:65000, areaSize:"1500 sqft", bedrooms:3, bathrooms:3, furnishing:"Semi-Furnished", floor:"Ground", description:"Beautiful 3 BHK duplex house in Imadol with spacious bedrooms, modern kitchen, and car parking.", mapUrl:"27.6644, 85.3498", imgType:"house" },
  { title:"Shop Space in Lagankhel", mainCategory:"Commercial", subCategory:"Shop / Showroom", province:"Bagmati", district:"Lalitpur", city:"Lagankhel", location:"Lagankhel Bus Park area", price:35000, areaSize:"300 sqft", description:"Ground floor shop near Lagankhel bus park. High footfall area, ideal for retail.", mapUrl:"27.6636, 85.3176", imgType:"commercial" },
  { title:"Traditional House in Bhaktapur", mainCategory:"House", subCategory:"House / Villa", province:"Bagmati", district:"Bhaktapur", city:"Bhaktapur", location:"Near Bhaktapur Durbar Square", price:30000, areaSize:"1100 sqft", bedrooms:3, bathrooms:2, furnishing:"Unfurnished", description:"Traditional Newari-style house near Bhaktapur Durbar Square. Heritage area.", mapUrl:"27.6710, 85.4298", imgType:"house" },
  { title:"Agricultural Land in Nagarkot", mainCategory:"Land", subCategory:"Agricultural Land", province:"Bagmati", district:"Bhaktapur", city:"Nagarkot", location:"Nagarkot Hill, Bhaktapur", price:15000, areaSize:"8 ropani", description:"Fertile agricultural land with mountain views. Suitable for organic farming.", mapUrl:"27.7167, 85.5167", imgType:"land" },
  { title:"2 BHK Flat in Bharatpur", mainCategory:"House", subCategory:"2 BHK", province:"Bagmati", district:"Chitwan", city:"Bharatpur", location:"Bharatpur-10, near Chitwan Hospital", price:18000, areaSize:"750 sqft", bedrooms:2, bathrooms:2, furnishing:"Semi-Furnished", description:"Modern 2BHK in Bharatpur city. Close to hospital, schools and market.", mapUrl:"27.6833, 84.4333", imgType:"flat" },
  { title:"Room near Sauraha", mainCategory:"Room", subCategory:"Room with Attached Bath", province:"Bagmati", district:"Chitwan", city:"Sauraha", location:"Sauraha, near Chitwan National Park", price:8000, areaSize:"150 sqft", furnishing:"Semi-Furnished", description:"Comfortable room near Chitwan National Park. Perfect for nature lovers.", mapUrl:"27.5667, 84.5000", imgType:"room" },
  { title:"Lakeside Apartment in Pokhara", mainCategory:"House", subCategory:"Apartment / Flat", province:"Gandaki", district:"Kaski", city:"Lakeside", location:"Lakeside, Pokhara near Phewa Lake", price:28000, areaSize:"900 sqft", bedrooms:2, bathrooms:2, furnishing:"Fully Furnished", floor:"2nd", description:"Beautiful apartment with lake view. Walking distance to Phewa Lake and restaurants.", mapUrl:"28.2096, 83.9556", imgType:"flat" },
  { title:"Bungalow in Pokhara", mainCategory:"House", subCategory:"Bungalow", province:"Gandaki", district:"Kaski", city:"Pokhara", location:"Prithvichowk, Pokhara", price:55000, areaSize:"1800 sqft", bedrooms:4, bathrooms:3, furnishing:"Semi-Furnished", description:"Spacious bungalow with mountain views. Large garden, parking, quiet area.", mapUrl:"28.2096, 83.9856", imgType:"house" },
  { title:"Commercial Land in Birauta", mainCategory:"Land", subCategory:"Commercial Land", province:"Gandaki", district:"Kaski", city:"Birauta", location:"Birauta, Pokhara highway side", price:120000, areaSize:"6 aana", description:"Highway-facing commercial land in Birauta. Ideal for hotel, showroom or petrol pump.", mapUrl:"28.2500, 83.9833", imgType:"land" },
  { title:"Restaurant Space in Lakeside", mainCategory:"Commercial", subCategory:"Restaurant Space", province:"Gandaki", district:"Kaski", city:"Lakeside", location:"Lakeside-6, tourist zone", price:65000, areaSize:"800 sqft", description:"Prime restaurant space in Lakeside tourist zone. Fully fitted kitchen, outdoor seating.", mapUrl:"28.2096, 83.9556", imgType:"commercial" },
  { title:"1 BHK Flat in Butwal", mainCategory:"House", subCategory:"1 BHK", province:"Lumbini", district:"Rupandehi", city:"Butwal", location:"Butwal-10, Traffic Chowk area", price:12000, areaSize:"500 sqft", bedrooms:1, bathrooms:1, furnishing:"Unfurnished", description:"Affordable 1BHK flat in Butwal city center. Close to market and transport.", mapUrl:"27.7006, 83.4532", imgType:"flat" },
  { title:"House in Bhairahawa", mainCategory:"House", subCategory:"House / Villa", province:"Lumbini", district:"Rupandehi", city:"Bhairahawa", location:"Bhairahawa, near airport", price:35000, areaSize:"1200 sqft", bedrooms:3, bathrooms:2, furnishing:"Semi-Furnished", description:"3BHK house near Gautam Buddha International Airport. Good connectivity.", mapUrl:"27.5050, 83.4500", imgType:"house" },
  { title:"Agricultural Land in Rupandehi", mainCategory:"Land", subCategory:"Agricultural Land", province:"Lumbini", district:"Rupandehi", city:"Sainamaina", location:"Sainamaina, Rupandehi", price:20000, areaSize:"1 bigha", description:"Fertile agricultural land near Lumbini. Suitable for rice, wheat cultivation.", mapUrl:"27.6167, 83.4500", imgType:"land" },
  { title:"Warehouse in Butwal", mainCategory:"Commercial", subCategory:"Warehouse / Godown", province:"Lumbini", district:"Rupandehi", city:"Butwal", location:"Industrial area, Butwal", price:40000, areaSize:"2000 sqft", description:"Large warehouse with loading dock. Ideal for distribution, storage business.", mapUrl:"27.7006, 83.4532", imgType:"commercial" },
  { title:"2 BHK Apartment in Biratnagar", mainCategory:"House", subCategory:"2 BHK", province:"Koshi", district:"Morang", city:"Biratnagar", location:"Biratnagar-5, Main Road", price:20000, areaSize:"800 sqft", bedrooms:2, bathrooms:2, furnishing:"Semi-Furnished", description:"Modern 2BHK in Biratnagar city. Close to schools, hospitals and market.", mapUrl:"26.4525, 87.2718", imgType:"flat" },
  { title:"Room in Biratnagar", mainCategory:"Room", subCategory:"Double Room", province:"Koshi", district:"Morang", city:"Biratnagar", location:"Biratnagar-3, near college", price:6000, areaSize:"130 sqft", furnishing:"Unfurnished", description:"Double room near Biratnagar campus. Shared bathroom, kitchen access.", mapUrl:"26.4525, 87.2718", imgType:"room" },
  { title:"Commercial Land in Urlabari", mainCategory:"Land", subCategory:"Commercial Land", province:"Koshi", district:"Morang", city:"Urlabari", location:"Urlabari, East-West Highway", price:75000, areaSize:"5 aana", description:"Highway-facing commercial plot in Urlabari. High traffic area.", mapUrl:"26.6333, 87.4167", imgType:"land" },
  { title:"3 BHK House in Dharan", mainCategory:"House", subCategory:"3 BHK", province:"Koshi", district:"Sunsari", city:"Dharan", location:"Dharan-8, BP Chowk area", price:30000, areaSize:"1300 sqft", bedrooms:3, bathrooms:2, furnishing:"Semi-Furnished", description:"Spacious 3BHK in Dharan. Near BP Koirala Institute of Health Sciences.", mapUrl:"26.8065, 87.2846", imgType:"house" },
  { title:"Office Space in Itahari", mainCategory:"Commercial", subCategory:"Office Space", province:"Koshi", district:"Sunsari", city:"Itahari", location:"Itahari Chowk, main road", price:25000, areaSize:"400 sqft", description:"Ground floor office space in Itahari commercial hub. Ideal for bank, clinic.", mapUrl:"26.6667, 87.2833", imgType:"commercial" },
  { title:"House in Damak", mainCategory:"House", subCategory:"House / Villa", province:"Koshi", district:"Jhapa", city:"Damak", location:"Damak-5, near Damak Chowk", price:22000, areaSize:"1000 sqft", bedrooms:3, bathrooms:2, furnishing:"Unfurnished", description:"Well-built house in Damak. Close to market, schools and transport hub.", mapUrl:"26.6667, 87.7000", imgType:"house" },
  { title:"Agricultural Land in Jhapa", mainCategory:"Land", subCategory:"Agricultural Land", province:"Koshi", district:"Jhapa", city:"Birtamode", location:"Birtamode, Jhapa", price:18000, areaSize:"2 bigha", description:"Fertile tea-garden adjacent land in Jhapa. Ideal for farming or plantation.", mapUrl:"26.6500, 87.9833", imgType:"land" },
  { title:"2 BHK Flat in Birgunj", mainCategory:"House", subCategory:"2 BHK", province:"Madhesh", district:"Parsa", city:"Birgunj", location:"Birgunj, Ghantaghar area", price:16000, areaSize:"700 sqft", bedrooms:2, bathrooms:1, furnishing:"Unfurnished", description:"Affordable 2BHK flat in Birgunj. Close to border trade area and market.", mapUrl:"27.0104, 84.8777", imgType:"flat" },
  { title:"Shop in Birgunj", mainCategory:"Commercial", subCategory:"Shop / Showroom", province:"Madhesh", district:"Parsa", city:"Birgunj", location:"Birgunj main bazaar", price:30000, areaSize:"250 sqft", description:"Prime shop space in Birgunj main bazaar. High footfall, ideal for retail.", mapUrl:"27.0104, 84.8777", imgType:"commercial" },
  { title:"House in Janakpur", mainCategory:"House", subCategory:"House / Villa", province:"Madhesh", district:"Dhanusha", city:"Janakpur", location:"Janakpur, near Janaki Temple", price:20000, areaSize:"1100 sqft", bedrooms:3, bathrooms:2, furnishing:"Semi-Furnished", description:"Traditional house near Janaki Temple. Cultural heritage area, peaceful locality.", mapUrl:"26.7288, 85.9266", imgType:"house" },
  { title:"2 BHK Flat in Dhangadhi", mainCategory:"House", subCategory:"2 BHK", province:"Sudurpashchim", district:"Kailali", city:"Dhangadhi", location:"Dhangadhi-5, main road", price:14000, areaSize:"650 sqft", bedrooms:2, bathrooms:1, furnishing:"Unfurnished", description:"Affordable 2BHK in Dhangadhi. Close to market and transport.", mapUrl:"28.6833, 80.6000", imgType:"flat" },
  { title:"Agricultural Land in Kailali", mainCategory:"Land", subCategory:"Agricultural Land", province:"Sudurpashchim", district:"Kailali", city:"Tikapur", location:"Tikapur, Kailali", price:12000, areaSize:"3 bigha", description:"Fertile agricultural land in Tikapur. Suitable for sugarcane, paddy cultivation.", mapUrl:"28.5167, 81.1167", imgType:"land" },
  { title:"House in Birendranagar", mainCategory:"House", subCategory:"House / Villa", province:"Karnali", district:"Surkhet", city:"Birendranagar", location:"Birendranagar-5, Surkhet", price:18000, areaSize:"1000 sqft", bedrooms:3, bathrooms:2, furnishing:"Unfurnished", description:"Comfortable house in Birendranagar. Peaceful locality with mountain views.", mapUrl:"28.6000, 81.6333", imgType:"house" },
  { title:"Room in Birendranagar", mainCategory:"Room", subCategory:"Single Room", province:"Karnali", district:"Surkhet", city:"Birendranagar", location:"Birendranagar, near campus", price:5000, areaSize:"100 sqft", furnishing:"Unfurnished", description:"Affordable single room near Surkhet campus. Shared facilities.", mapUrl:"28.6000, 81.6333", imgType:"room" },
  { title:"Residential Land in Waling", mainCategory:"Land", subCategory:"Residential Land / Plot", province:"Gandaki", district:"Syangja", city:"Waling", location:"Waling Bazaar, Syangja", price:22000, areaSize:"5 aana", description:"Residential plot in Waling bazaar. Road access, electricity and water available.", mapUrl:"27.9833, 83.7833", imgType:"land" },
  { title:"House in Tulsipur", mainCategory:"House", subCategory:"House / Villa", province:"Lumbini", district:"Dang", city:"Tulsipur", location:"Tulsipur-5, Dang", price:16000, areaSize:"900 sqft", bedrooms:2, bathrooms:2, furnishing:"Semi-Furnished", description:"Well-maintained house in Tulsipur. Close to market and schools.", mapUrl:"28.1333, 82.3000", imgType:"house" },
  { title:"PG Room in Koteshwor", mainCategory:"Room", subCategory:"PG / Paying Guest", province:"Bagmati", district:"Kathmandu", city:"Koteshwor", location:"Koteshwor, near Ring Road", price:9000, areaSize:"140 sqft", furnishing:"Semi-Furnished", description:"PG room with meals available. Close to Ring Road, easy transport.", mapUrl:"27.6833, 85.3500", imgType:"room" },
  { title:"Co-working Space in Thamel", mainCategory:"Commercial", subCategory:"Co-working Space", province:"Bagmati", district:"Kathmandu", city:"Thamel", location:"Thamel, near Kathmandu Guest House", price:20000, areaSize:"350 sqft", description:"Modern co-working space in Thamel. High-speed internet, meeting rooms, 24hr access.", mapUrl:"27.7172, 85.3096", imgType:"commercial" },
  { title:"Hill Land in Nagarkot", mainCategory:"Land", subCategory:"Hill / Mountain Land", province:"Bagmati", district:"Bhaktapur", city:"Nagarkot", location:"Nagarkot viewpoint area", price:35000, areaSize:"10 ropani", description:"Scenic hill land with Himalayan views. Ideal for resort, homestay or eco-tourism.", mapUrl:"27.7167, 85.5167", imgType:"land" },
  { title:"Duplex House in Godawari", mainCategory:"House", subCategory:"Duplex", province:"Bagmati", district:"Lalitpur", city:"Godawari", location:"Godawari, near Botanical Garden", price:60000, areaSize:"1600 sqft", bedrooms:4, bathrooms:3, furnishing:"Semi-Furnished", description:"Beautiful duplex near Godawari Botanical Garden. Peaceful, green surroundings.", mapUrl:"27.5833, 85.3833", imgType:"house" },
];

router.post("/seed-listings", async (req, res) => {
  const log = [];
  try {
    // 1. Create Ramesh account
    let ramesh = await User.findOne({ email: "ramesh.sharma@gmail.com" });
    if (!ramesh) {
      const hashed = await bcrypt.hash("Ramesh@123", 10);
      ramesh = await User.create({ name:"Ramesh Sharma", email:"ramesh.sharma@gmail.com", phone:"9841234567", password:hashed, role:"user", accountType:"seller" });
      log.push("✅ Created Ramesh account: " + ramesh._id);
    } else {
      await User.findByIdAndUpdate(ramesh._id, { accountType:"seller" });
      log.push("✅ Ramesh exists: " + ramesh._id);
    }

    // 2. Fix existing listings
    const existing = await Land.find({});
    let fixed = 0;
    for (const land of existing) {
      const u = {};
      if (!land.mainCategory) {
        const cat = (land.category || "").toLowerCase();
        const title = (land.title || "").toLowerCase();
        if (/house|bungalow/.test(cat) || /house|villa|bungalow/.test(title)) { u.mainCategory="House"; if(!land.subCategory) u.subCategory="House / Villa"; }
        else if (/flat|apartment|bhk/.test(title)) { u.mainCategory="House"; u.subCategory="Apartment / Flat"; }
        else if (/commercial/.test(cat) || /shop|office|commercial/.test(title)) { u.mainCategory="Commercial"; if(!land.subCategory) u.subCategory=/shop/.test(title)?"Shop / Showroom":"Office Space"; }
        else if (/agricultural|farm/.test(cat) || /farm|khet|agri/.test(title)) { u.mainCategory="Land"; if(!land.subCategory) u.subCategory="Agricultural Land"; }
        else if (/land|plot/.test(title)) { u.mainCategory="Land"; if(!land.subCategory) u.subCategory="Residential Land / Plot"; }
        else if (/room|kotha/.test(title)) { u.mainCategory="Room"; if(!land.subCategory) u.subCategory="Single Room"; }
        else { u.mainCategory="Land"; if(!land.subCategory) u.subCategory="Residential Land / Plot"; }
      }
      if (!land.subCategory && !u.subCategory) {
        const mc = u.mainCategory || land.mainCategory;
        if (mc==="House") u.subCategory="House / Villa";
        else if (mc==="Land") u.subCategory="Residential Land / Plot";
        else if (mc==="Room") u.subCategory="Single Room";
        else if (mc==="Commercial") u.subCategory="Office Space";
      }
      if (!land.province || !land.district) {
        const loc = ((land.location||"")+" "+(land.title||"")).toLowerCase();
        if (/thamel|naxal|kapan|mandikhatar|sukedhara|baneshwor|lazimpat|koteshwor|kathmandu|ktm/.test(loc)) {
          u.province="Bagmati"; u.district="Kathmandu";
          if (!land.city) u.city=/thamel/.test(loc)?"Thamel":/naxal/.test(loc)?"Naxal":/kapan/.test(loc)?"Kapan":/mandikhatar/.test(loc)?"Mandikhatar":/sukedhara/.test(loc)?"Sukedhara":/koteshwor/.test(loc)?"Koteshwor":"Kathmandu";
        } else if (/lalitpur|patan|jhamsikhel/.test(loc)) { u.province="Bagmati"; u.district="Lalitpur"; if(!land.city) u.city="Patan"; }
        else if (/bhaktapur|nagarkot/.test(loc)) { u.province="Bagmati"; u.district="Bhaktapur"; if(!land.city) u.city=/nagarkot/.test(loc)?"Nagarkot":"Bhaktapur"; }
        else if (/chitwan|bharatpur|narayanghat/.test(loc)) { u.province="Bagmati"; u.district="Chitwan"; if(!land.city) u.city="Bharatpur"; }
        else if (/pokhara|lakeside|birauta/.test(loc)) { u.province="Gandaki"; u.district="Kaski"; if(!land.city) u.city=/lakeside/.test(loc)?"Lakeside":"Pokhara"; }
        else if (/butwal|bhairahawa/.test(loc)) { u.province="Lumbini"; u.district="Rupandehi"; if(!land.city) u.city=/bhairahawa/.test(loc)?"Bhairahawa":"Butwal"; }
        else if (/biratnagar/.test(loc)) { u.province="Koshi"; u.district="Morang"; if(!land.city) u.city="Biratnagar"; }
        else if (/birgunj/.test(loc)) { u.province="Madhesh"; u.district="Parsa"; if(!land.city) u.city="Birgunj"; }
        else if (/birtamode|jhapa/.test(loc)) { u.province="Koshi"; u.district="Jhapa"; if(!land.city) u.city="Birtamode"; }
        else if (/ekata/.test(loc)) { u.province="Bagmati"; u.district="Kathmandu"; if(!land.city) u.city="Kathmandu"; }
      }
      if (Object.keys(u).length > 0) { await Land.findByIdAndUpdate(land._id, u); fixed++; }
    }
    log.push(`✅ Fixed ${fixed} existing listings`);

    // 3. Insert new listings
    let inserted = 0;
    for (const l of LISTINGS) {
      const exists = await Land.findOne({ title: l.title });
      if (exists) { log.push(`⏭ Skip: ${l.title}`); continue; }
      const owner = OWNERS[Math.floor(Math.random() * OWNERS.length)];
      const imgArr = IMAGES[l.imgType] || IMAGES.house;
      const imgUrl = imgArr[Math.floor(Math.random() * imgArr.length)];
      const lalpurjaUrl = IMAGES.lalpurja[Math.floor(Math.random() * IMAGES.lalpurja.length)];
      await Land.create({
        title:l.title, description:l.description||"", location:l.location,
        province:l.province, district:l.district, city:l.city,
        price:l.price, areaSize:l.areaSize,
        mainCategory:l.mainCategory, subCategory:l.subCategory, category:l.mainCategory,
        bedrooms:l.bedrooms||"", bathrooms:l.bathrooms||"",
        furnishing:l.furnishing||"", floor:l.floor||"", mapUrl:l.mapUrl||"",
        ownerName:owner.name, ownerPhone:owner.phone, ownerEmail:owner.email,
        ownerId:ramesh._id.toString(),
        image:imgUrl, lalpurjaImage:lalpurjaUrl, mediaFiles:[imgUrl],
        status:"approved", available:true, featured:Math.random()>0.75,
      });
      inserted++;
      log.push(`✅ Added: ${l.title}`);
    }
    log.push(`✅ Inserted ${inserted} new listings`);

    // 4. Approve all pending
    const pending = await Land.updateMany({ status:"pending" }, { status:"approved" });
    log.push(`✅ Approved ${pending.modifiedCount} pending listings`);

    // 5. Summary
    const total = await Land.countDocuments({ status:"approved" });
    const byCat = await Land.aggregate([{ $match:{status:"approved"} },{ $group:{_id:"$mainCategory",count:{$sum:1}} },{ $sort:{count:-1} }]);
    log.push(`📊 Total approved: ${total}`);
    byCat.forEach(b => log.push(`   ${b._id||"(none)"}: ${b.count}`));

    res.json({ success:true, log });
  } catch (err) {
    res.status(500).json({ success:false, error:err.message, log });
  }
});

/* ── Community seed ─────────────────────────────────────────────── */
router.post("/seed-community", async (req, res) => {
  const mongoose = require("mongoose");
  let RentalPartner, BuyerPost;
  const rpSchema = new mongoose.Schema({ userId:{type:mongoose.Schema.Types.ObjectId,ref:"User",default:null}, name:String, phone:String, email:String, location:String, budget:Number, propertyType:String, subCategory:String, preferredGender:String, preferredAge:String, moveInDate:String, description:String, paymentStatus:{type:String,default:"paid"}, createdAt:{type:Date,default:Date.now} });
  const bpSchema = new mongoose.Schema({ userId:{type:mongoose.Schema.Types.ObjectId,ref:"User",default:null}, userName:String, userAvatar:String, title:String, postType:String, description:String, propertyType:String, subCategory:String, location:String, budget:Number, contactPhone:String, contactEmail:String, media:[String], likes:[{type:mongoose.Schema.Types.ObjectId,ref:"User"}], comments:[{userId:{type:mongoose.Schema.Types.ObjectId,ref:"User"},userName:String,userAvatar:String,text:String,createdAt:{type:Date,default:Date.now}}], createdAt:{type:Date,default:Date.now} });
  try { RentalPartner = mongoose.model("RentalPartner"); } catch { RentalPartner = mongoose.model("RentalPartner", rpSchema); }
  try { BuyerPost = mongoose.model("BuyerPost"); } catch { BuyerPost = mongoose.model("BuyerPost", bpSchema); }

  const RENTAL_PARTNERS = [
    { name:"Aarav Sharma",    phone:"9841234567", email:"aarav.sharma@gmail.com",    location:"Thamel, Kathmandu",         budget:12000, propertyType:"Room",  subCategory:"Room - Living",    preferredGender:"Male",   preferredAge:"18-25", moveInDate:"2026-06-01", description:"Software engineer, non-smoker, clean habits. Looking for a quiet flatmate near Thamel." },
    { name:"Priya Thapa",     phone:"9852345678", email:"priya.thapa@gmail.com",     location:"Lalitpur, Patan",           budget:18000, propertyType:"House", subCategory:"Apartment / Flat", preferredGender:"Female", preferredAge:"25-35", moveInDate:"2026-06-15", description:"Working professional, prefer female flatmate. Near Patan Dhoka area." },
    { name:"Bikash Gurung",   phone:"9863456789", email:"bikash.gurung@gmail.com",   location:"Pokhara, Lakeside",         budget:9000,  propertyType:"Room",  subCategory:"Room - Living",    preferredGender:"Any",    preferredAge:"18-25", moveInDate:"2026-07-01", description:"Tourism student at Pokhara University. Looking for budget room near Lakeside." },
    { name:"Sunita Rai",      phone:"9874567890", email:"sunita.rai@gmail.com",      location:"Biratnagar, Morang",        budget:7500,  propertyType:"Room",  subCategory:"Room - Office",    preferredGender:"Female", preferredAge:"25-35", moveInDate:"2026-06-01", description:"Bank employee. Need a clean room close to Biratnagar main road." },
    { name:"Rohan Adhikari",  phone:"9885678901", email:"rohan.adhikari@gmail.com",  location:"Bhaktapur, Suryabinayak",  budget:15000, propertyType:"House", subCategory:"House / Villa",    preferredGender:"Any",    preferredAge:"25-35", moveInDate:"2026-07-15", description:"Family of 3 looking for a 2BHK house in Bhaktapur. Prefer ground floor." },
    { name:"Manisha Koirala", phone:"9896789012", email:"manisha.koirala@gmail.com", location:"Butwal, Rupandehi",         budget:8000,  propertyType:"Room",  subCategory:"Room - Living",    preferredGender:"Female", preferredAge:"18-25", moveInDate:"2026-06-10", description:"College student at Butwal campus. Looking for a safe room near college." },
    { name:"Dipesh Magar",    phone:"9807890123", email:"dipesh.magar@gmail.com",    location:"Chitwan, Bharatpur",        budget:20000, propertyType:"House", subCategory:"Apartment / Flat", preferredGender:"Any",    preferredAge:"25-35", moveInDate:"2026-08-01", description:"Doctor at Bharatpur Hospital. Need a furnished flat close to hospital." },
    { name:"Kabita Limbu",    phone:"9818901234", email:"kabita.limbu@gmail.com",    location:"Dharan, Sunsari",           budget:6500,  propertyType:"Room",  subCategory:"Room - Living",    preferredGender:"Female", preferredAge:"18-25", moveInDate:"2026-06-20", description:"Nursing student. Looking for a room with attached bathroom in Dharan." },
    { name:"Sanjay Pandey",   phone:"9829012345", email:"sanjay.pandey@gmail.com",   location:"Hetauda, Makwanpur",        budget:11000, propertyType:"House", subCategory:"Bungalow",         preferredGender:"Any",    preferredAge:"35-50", moveInDate:"2026-07-01", description:"Business owner. Need a bungalow with parking space in Hetauda." },
    { name:"Anita Shrestha",  phone:"9840123456", email:"anita.shrestha@gmail.com",  location:"Kirtipur, Kathmandu",       budget:13500, propertyType:"House", subCategory:"Apartment / Flat", preferredGender:"Female", preferredAge:"25-35", moveInDate:"2026-06-01", description:"Teacher at TU. Looking for a 1BHK flat near Kirtipur campus." },
    { name:"Nabin Tamang",    phone:"9851234567", email:"nabin.tamang@gmail.com",    location:"Damak, Jhapa",              budget:5500,  propertyType:"Room",  subCategory:"Room - Storage",   preferredGender:"Male",   preferredAge:"18-25", moveInDate:"2026-07-10", description:"Tea garden worker. Need a basic room in Damak town area." },
    { name:"Puja Karki",      phone:"9862345678", email:"puja.karki@gmail.com",      location:"Nepalgunj, Banke",          budget:9500,  propertyType:"Room",  subCategory:"Room - Living",    preferredGender:"Female", preferredAge:"25-35", moveInDate:"2026-06-15", description:"Nurse at Nepalgunj Medical College. Prefer female flatmate, non-smoker." },
    { name:"Suresh Basnet",   phone:"9873456789", email:"suresh.basnet@gmail.com",   location:"Birgunj, Parsa",            budget:16000, propertyType:"House", subCategory:"House / Villa",    preferredGender:"Any",    preferredAge:"35-50", moveInDate:"2026-08-01", description:"Import-export businessman. Need a spacious house near Birgunj customs." },
    { name:"Nisha Bhandari",  phone:"9884567890", email:"nisha.bhandari@gmail.com",  location:"Gorkha, Gandaki",           budget:7000,  propertyType:"Room",  subCategory:"Room - Living",    preferredGender:"Female", preferredAge:"18-25", moveInDate:"2026-07-01", description:"Tourism guide. Looking for a cozy room in Gorkha bazaar area." },
    { name:"Anil Joshi",      phone:"9895678901", email:"anil.joshi@gmail.com",      location:"Dhulikhel, Kavrepalanchok", budget:14000, propertyType:"House", subCategory:"Apartment / Flat", preferredGender:"Any",    preferredAge:"25-35", moveInDate:"2026-06-01", description:"IT professional working remotely. Need a quiet flat with good internet in Dhulikhel." },
  ];
  const BUYER_POSTS = [
    { userName:"Rajan Maharjan",  location:"Kathmandu, Baneshwor",     propertyType:"House", subCategory:"Apartment / Flat",  budget:25000, contactPhone:"9841111222", contactEmail:"rajan.maharjan@gmail.com",  title:"Looking for 2BHK apartment in Baneshwor",           description:"Need a furnished 2BHK apartment near Baneshwor Chowk. Prefer 2nd floor or above with parking. Family of 4.", postType:"section" },
    { userName:"Sita Devi Yadav", location:"Janakpur, Dhanusha",       propertyType:"Land",  subCategory:"Residential Land",  budget:50000, contactPhone:"9852222333", contactEmail:"sita.yadav@gmail.com",      title:"Residential land needed in Janakpur",               description:"Looking for 3-5 aana residential land near Janakpur main road. Ready to pay advance.", postType:"section" },
    { userName:"Prakash Oli",     location:"Pokhara, Newroad",         propertyType:"Room",  subCategory:"Room - Office",     budget:8000,  contactPhone:"9863333444", contactEmail:"prakash.oli@gmail.com",     title:"Office room needed near Pokhara Newroad",           description:"Small office space needed for a travel agency. Ground floor preferred, 200-400 sqft.", postType:"section" },
    { userName:"Kamala Thapa",    location:"Lalitpur, Jawalakhel",     propertyType:"House", subCategory:"House / Villa",     budget:35000, contactPhone:"9874444555", contactEmail:"kamala.thapa@gmail.com",    title:"3BHK house wanted in Jawalakhel area",              description:"Looking for a 3BHK house with garden. Prefer quiet neighborhood. Ready to sign 2-year lease.", postType:"section" },
    { userName:"Binod Chaudhary", location:"Dhangadhi, Kailali",       propertyType:"Land",  subCategory:"Commercial Land",   budget:80000, contactPhone:"9885555666", contactEmail:"binod.chaudhary@gmail.com", title:"Commercial land for business in Dhangadhi",         description:"Need 5-10 aana commercial land on main road in Dhangadhi for a supermarket project.", postType:"section" },
    { userName:"Gita Rana",       location:"Biratnagar, Morang",       propertyType:"House", subCategory:"Apartment / Flat",  budget:18000, contactPhone:"9896666777", contactEmail:"gita.rana@gmail.com",       title:"1BHK flat needed in Biratnagar",                    description:"Single working woman. Need a safe 1BHK flat near Biratnagar hospital. Prefer female landlord.", postType:"section" },
    { userName:"Ramesh Poudel",   location:"Chitwan, Narayanghat",     propertyType:"Land",  subCategory:"Agricultural Land", budget:30000, contactPhone:"9807777888", contactEmail:"ramesh.poudel@gmail.com",   title:"Agricultural land for lease in Chitwan",            description:"Looking for 10+ ropani agricultural land for vegetable farming near Narayanghat.", postType:"section" },
    { userName:"Sarita Gurung",   location:"Butwal, Rupandehi",        propertyType:"Room",  subCategory:"Room - Living",     budget:6000,  contactPhone:"9818888999", contactEmail:"sarita.gurung@gmail.com",   title:"Affordable room needed in Butwal",                  description:"College student. Need a clean room with attached bathroom near Butwal campus. Budget is strict.", postType:"section" },
    { userName:"Deepak Shrestha", location:"Hetauda, Makwanpur",       propertyType:"House", subCategory:"Bungalow",          budget:45000, contactPhone:"9829999000", contactEmail:"deepak.shrestha@gmail.com", title:"Bungalow for rent in Hetauda",                      description:"Company executive. Need a furnished bungalow with 3+ bedrooms and parking for 2 cars.", postType:"section" },
    { userName:"Anupama Karki",   location:"Bhaktapur, Thimi",         propertyType:"House", subCategory:"Apartment / Flat",  budget:22000, contactPhone:"9840000111", contactEmail:"anupama.karki@gmail.com",   title:"2BHK apartment in Thimi, Bhaktapur",                description:"Young couple. Looking for a modern 2BHK apartment in Thimi. Need good ventilation and sunlight.", postType:"section" },
    { userName:"Sunil Tamang",    location:"Dharan, Sunsari",          propertyType:"Land",  subCategory:"Residential Land",  budget:40000, contactPhone:"9851111222", contactEmail:"sunil.tamang@gmail.com",    title:"Land plot needed in Dharan for house construction", description:"Planning to build a house. Need 4-6 aana land in Dharan-10 or nearby. Road access required.", postType:"section" },
    { userName:"Mina Limbu",      location:"Ilam, Eastern Nepal",      propertyType:"Room",  subCategory:"Room - Living",     budget:5500,  contactPhone:"9862222333", contactEmail:"mina.limbu@gmail.com",      title:"Room needed in Ilam town",                          description:"Tea estate worker. Need a basic room in Ilam bazaar. Prefer with kitchen access.", postType:"section" },
    { userName:"Kiran Adhikari",  location:"Nepalgunj, Banke",         propertyType:"House", subCategory:"House / Villa",     budget:28000, contactPhone:"9873333444", contactEmail:"kiran.adhikari@gmail.com",  title:"House for rent in Nepalgunj",                       description:"Government officer. Need a 3BHK house in Nepalgunj. Prefer near main road with stable electricity.", postType:"section" },
    { userName:"Poonam Basnet",   location:"Gorkha, Gandaki",          propertyType:"Land",  subCategory:"Agricultural Land", budget:15000, contactPhone:"9884444555", contactEmail:"poonam.basnet@gmail.com",   title:"Small farm land for lease in Gorkha",               description:"Organic farming enthusiast. Looking for 5-8 ropani land near water source in Gorkha district.", postType:"section" },
    { userName:"Naresh Joshi",    location:"Dhulikhel, Kavrepalanchok",propertyType:"House", subCategory:"Apartment / Flat",  budget:20000, contactPhone:"9895555666", contactEmail:"naresh.joshi@gmail.com",    title:"Flat needed in Dhulikhel for remote work",          description:"Freelance developer. Need a quiet 1-2BHK flat with reliable internet. Mountain view preferred.", postType:"section" },
  ];

  await RentalPartner.deleteMany({});
  await BuyerPost.deleteMany({ postType:"section" });

  // Find Ramesh to attach userId so message buttons work
  const rameshUser = await User.findOne({ email: "ramesh.sharma@gmail.com" });
  const seedUserId = rameshUser?._id || null;

  const rpWithUser = RENTAL_PARTNERS.map(p => ({ ...p, userId: seedUserId }));
  const bpWithUser = BUYER_POSTS.map(p => ({ ...p, userId: seedUserId }));

  const rp = await RentalPartner.insertMany(rpWithUser);
  const bp = await BuyerPost.insertMany(bpWithUser);
  res.json({ success:true, rentalPartners:rp.length, buyerPosts:bp.length, linkedUserId: seedUserId });
});

/* ── Patch null userIds on existing community records ───────────── */
router.get("/patch-userids", async (req, res) => {
  try {
    const db = require("mongoose").connection.db;
    const ramesh = await db.collection("users").findOne({ email: "ramesh.sharma@gmail.com" });
    if (!ramesh) return res.json({ success: false, error: "Ramesh account not found — run /seed-listings first" });

    const rpRes = await db.collection("rentalpartners").updateMany(
      { userId: null },
      { $set: { userId: ramesh._id } }
    );
    const bpRes = await db.collection("buyerposts").updateMany(
      { userId: null },
      { $set: { userId: ramesh._id } }
    );

    res.json({
      success: true,
      rameshId: ramesh._id,
      rentalPartners_patched: rpRes.modifiedCount,
      buyerPosts_patched: bpRes.modifiedCount,
      message: "All seeded records now linked to Ramesh account. Send Message buttons will work."
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ── Seed bid listings ──────────────────────────────────────────── */
router.get("/seed-biddings", async (req, res) => {
  const bcrypt = require("bcryptjs");
  const mongoose = require("mongoose");
  const BidListing = require("../models/BidListing");

  const SELLER_EMAIL = "ramesh.sharma@gmail.com";
  const BIDDER_EMAILS = [
    { name:"Priya Thapa",    email:"priya.thapa.bid@gmail.com",    phone:"9852345678" },
    { name:"Bikash Gurung",  email:"bikash.gurung.bid@gmail.com",  phone:"9863456789" },
    { name:"Sunita Rai",     email:"sunita.rai.bid@gmail.com",     phone:"9874567890" },
    { name:"Rohan Adhikari", email:"rohan.adhikari.bid@gmail.com", phone:"9885678901" },
    { name:"Kabita Limbu",   email:"kabita.limbu.bid@gmail.com",   phone:"9818901234" },
    { name:"Dipesh Magar",   email:"dipesh.magar.bid@gmail.com",   phone:"9807890123" },
    { name:"Anita Shrestha", email:"anita.shrestha.bid@gmail.com", phone:"9840123456" },
  ];

  const MAPS = {
    thamel:    "https://maps.google.com/maps?q=Thamel,Kathmandu,Nepal&output=embed&z=15",
    naxal:     "https://maps.google.com/maps?q=Naxal,Kathmandu,Nepal&output=embed&z=15",
    patan:     "https://maps.google.com/maps?q=Patan+Durbar+Square,Lalitpur,Nepal&output=embed&z=15",
    pokhara:   "https://maps.google.com/maps?q=Lakeside,Pokhara,Nepal&output=embed&z=15",
    chitwan:   "https://maps.google.com/maps?q=Bharatpur,Chitwan,Nepal&output=embed&z=15",
    bhaktapur: "https://maps.google.com/maps?q=Bhaktapur+Durbar+Square,Nepal&output=embed&z=15",
    biratnagar:"https://maps.google.com/maps?q=Biratnagar,Morang,Nepal&output=embed&z=15",
    butwal:    "https://maps.google.com/maps?q=Butwal,Rupandehi,Nepal&output=embed&z=15",
    lazimpat:  "https://maps.google.com/maps?q=Lazimpat,Kathmandu,Nepal&output=embed&z=15",
    jhamsikhel:"https://maps.google.com/maps?q=Jhamsikhel,Lalitpur,Nepal&output=embed&z=15",
  };

  const now = new Date();
  const future = (d) => new Date(now.getTime() + d*86400000);
  const past   = (d) => new Date(now.getTime() - d*86400000);

  try {
    const log = [];

    // Get seller
    let seller = await User.findOne({ email: SELLER_EMAIL });
    if (!seller) return res.json({ success:false, error:"Run /seed-listings first to create Ramesh account" });
    await User.findByIdAndUpdate(seller._id, { accountType:"seller" });
    log.push("Seller: " + seller._id);

    // Get/create bidders
    const bidderMap = {};
    for (const b of BIDDER_EMAILS) {
      let u = await User.findOne({ email: b.email });
      if (!u) {
        const hashed = await bcrypt.hash("Bidder@123", 10);
        u = await User.create({ name:b.name, email:b.email, phone:b.phone, password:hashed, role:"user", accountType:"" });
        log.push("Created bidder: " + u.name);
      }
      bidderMap[b.name] = u._id;
    }

    // Clear old
    await BidListing.deleteMany({});
    log.push("Cleared old bid listings");

    const makeBids = (bidsData) => bidsData.map(b => ({
      bidderId: bidderMap[b.bidderName] || seller._id,
      bidderName: b.bidderName, amount: b.amount, createdAt: b.createdAt,
    }));

    const ACTIVE = [
      { title:"4 Aana Residential Land in Naxal", description:"Prime residential plot in Naxal, one of Kathmandu's most sought-after localities. 20ft road access, all utilities available. Ideal for building a luxury home or investment.", location:"Naxal, near Rani Pokhari, Kathmandu", province:"Bagmati", district:"Kathmandu", city:"Naxal", mapUrl:MAPS.naxal, areaSize:"4 aana", mainCategory:"Land", subCategory:"Residential Land", image:"https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800", startingPrice:8000000, minIncrement:100000, auctionStart:past(1), auctionEnd:future(3), bids:[{bidderName:"Priya Thapa",amount:8100000,createdAt:past(0.9)},{bidderName:"Bikash Gurung",amount:8300000,createdAt:past(0.7)},{bidderName:"Sunita Rai",amount:8600000,createdAt:past(0.5)},{bidderName:"Rohan Adhikari",amount:9000000,createdAt:past(0.2)}] },
      { title:"3 BHK House in Thamel — Heritage Area", description:"Stunning 3-bedroom house in the heart of Thamel. Fully furnished, rooftop terrace with city views, parking for 2 cars. Perfect for residential or commercial use.", location:"Thamel, near Kathmandu Guest House", province:"Bagmati", district:"Kathmandu", city:"Thamel", mapUrl:MAPS.thamel, areaSize:"1200 sqft", mainCategory:"House", subCategory:"House / Villa", image:"https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800", startingPrice:15000000, minIncrement:200000, auctionStart:past(2), auctionEnd:future(5), bids:[{bidderName:"Kabita Limbu",amount:15200000,createdAt:past(1.8)},{bidderName:"Dipesh Magar",amount:15500000,createdAt:past(1.5)},{bidderName:"Anita Shrestha",amount:16000000,createdAt:past(1.0)},{bidderName:"Priya Thapa",amount:16500000,createdAt:past(0.5)},{bidderName:"Bikash Gurung",amount:17000000,createdAt:past(0.1)}] },
      { title:"Lakeside Apartment in Pokhara — Mountain View", description:"Luxurious 2BHK apartment with direct Phewa Lake and Annapurna range views. Fully furnished, 24hr security, swimming pool access. Rare opportunity in Lakeside.", location:"Lakeside-6, near Phewa Lake, Pokhara", province:"Gandaki", district:"Kaski", city:"Lakeside", mapUrl:MAPS.pokhara, areaSize:"950 sqft", mainCategory:"House", subCategory:"Apartment / Flat", image:"https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800", startingPrice:12000000, minIncrement:150000, auctionStart:past(0.5), auctionEnd:future(4), bids:[{bidderName:"Sunita Rai",amount:12150000,createdAt:past(0.4)},{bidderName:"Rohan Adhikari",amount:12400000,createdAt:past(0.3)},{bidderName:"Anita Shrestha",amount:12700000,createdAt:past(0.1)}] },
      { title:"Commercial Land in Lazimpat — Diplomatic Zone", description:"6 aana commercial plot in Lazimpat, Kathmandu's prestigious diplomatic zone. Ideal for embassy, hotel, or high-end commercial development. Road access from two sides.", location:"Lazimpat, near Embassy area, Kathmandu", province:"Bagmati", district:"Kathmandu", city:"Lazimpat", mapUrl:MAPS.lazimpat, areaSize:"6 aana", mainCategory:"Land", subCategory:"Commercial Land", image:"https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800", startingPrice:25000000, minIncrement:500000, auctionStart:past(3), auctionEnd:future(2), bids:[{bidderName:"Dipesh Magar",amount:25500000,createdAt:past(2.8)},{bidderName:"Kabita Limbu",amount:26500000,createdAt:past(2.0)},{bidderName:"Bikash Gurung",amount:28000000,createdAt:past(1.0)},{bidderName:"Priya Thapa",amount:29500000,createdAt:past(0.3)}] },
      { title:"Bungalow in Jhamsikhel — Lalitpur", description:"Elegant 4-bedroom bungalow in Jhamsikhel, one of Lalitpur's most premium localities. Large garden, 3-car parking, solar power, backup generator. Walking distance to international schools.", location:"Jhamsikhel, near Sanepa, Lalitpur", province:"Bagmati", district:"Lalitpur", city:"Jhamsikhel", mapUrl:MAPS.jhamsikhel, areaSize:"2400 sqft", mainCategory:"House", subCategory:"Bungalow", image:"https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800", startingPrice:35000000, minIncrement:500000, auctionStart:past(1), auctionEnd:future(6), bids:[{bidderName:"Rohan Adhikari",amount:35500000,createdAt:past(0.9)},{bidderName:"Sunita Rai",amount:36500000,createdAt:past(0.6)},{bidderName:"Anita Shrestha",amount:38000000,createdAt:past(0.2)}] },
      { title:"Agricultural Land in Chitwan — Fertile Farmland", description:"12 ropani fertile agricultural land near Narayanghat, Chitwan. Irrigated, road access, suitable for commercial farming, resort, or eco-tourism development.", location:"Narayanghat, Chitwan", province:"Bagmati", district:"Chitwan", city:"Bharatpur", mapUrl:MAPS.chitwan, areaSize:"12 ropani", mainCategory:"Land", subCategory:"Agricultural Land", image:"https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800", startingPrice:5000000, minIncrement:100000, auctionStart:past(2), auctionEnd:future(1), bids:[{bidderName:"Bikash Gurung",amount:5100000,createdAt:past(1.9)},{bidderName:"Kabita Limbu",amount:5300000,createdAt:past(1.5)},{bidderName:"Dipesh Magar",amount:5600000,createdAt:past(0.8)},{bidderName:"Priya Thapa",amount:6000000,createdAt:past(0.2)}] },
      { title:"Heritage House in Bhaktapur Durbar Area", description:"Rare traditional Newari-style house adjacent to Bhaktapur Durbar Square. 3 floors, courtyard, original woodwork. UNESCO heritage zone — exceptional investment opportunity.", location:"Near Bhaktapur Durbar Square, Bhaktapur", province:"Bagmati", district:"Bhaktapur", city:"Bhaktapur", mapUrl:MAPS.bhaktapur, areaSize:"1100 sqft", mainCategory:"House", subCategory:"House / Villa", image:"https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800", startingPrice:20000000, minIncrement:300000, auctionStart:past(0.5), auctionEnd:future(7), bids:[{bidderName:"Anita Shrestha",amount:20300000,createdAt:past(0.4)},{bidderName:"Rohan Adhikari",amount:20700000,createdAt:past(0.2)}] },
    ];

    const SOLD = [
      { title:"2 BHK Flat in Patan — Heritage View", description:"Cozy 2BHK apartment with direct view of Patan Durbar Square. Fully furnished, 3rd floor, elevator access.", location:"Mangalbazar, Patan, Lalitpur", province:"Bagmati", district:"Lalitpur", city:"Patan", mapUrl:MAPS.patan, areaSize:"800 sqft", mainCategory:"House", subCategory:"Apartment / Flat", image:"https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800", startingPrice:7000000, minIncrement:100000, auctionStart:past(10), auctionEnd:past(3), bids:[{bidderName:"Priya Thapa",amount:7100000,createdAt:past(9)},{bidderName:"Bikash Gurung",amount:7300000,createdAt:past(8)},{bidderName:"Sunita Rai",amount:7600000,createdAt:past(7)},{bidderName:"Kabita Limbu",amount:8000000,createdAt:past(6)},{bidderName:"Dipesh Magar",amount:8400000,createdAt:past(5)},{bidderName:"Anita Shrestha",amount:8900000,createdAt:past(4)},{bidderName:"Rohan Adhikari",amount:9500000,createdAt:past(3.1)}], status:"sold" },
      { title:"Commercial Plot in Biratnagar — Highway Frontage", description:"5 aana commercial land on the East-West Highway in Biratnagar. High traffic, ideal for showroom, hotel, or petrol pump.", location:"Biratnagar, Morang", province:"Koshi", district:"Morang", city:"Biratnagar", mapUrl:MAPS.biratnagar, areaSize:"5 aana", mainCategory:"Land", subCategory:"Commercial Land", image:"https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800", startingPrice:10000000, minIncrement:200000, auctionStart:past(15), auctionEnd:past(5), bids:[{bidderName:"Bikash Gurung",amount:10200000,createdAt:past(14)},{bidderName:"Sunita Rai",amount:10600000,createdAt:past(12)},{bidderName:"Priya Thapa",amount:11200000,createdAt:past(10)},{bidderName:"Dipesh Magar",amount:12000000,createdAt:past(7)},{bidderName:"Kabita Limbu",amount:13000000,createdAt:past(5.2)}], status:"sold" },
      { title:"Villa in Butwal — Rupandehi", description:"Spacious 4BHK villa near Butwal airport. Large garden, 3-car parking, solar power. Quiet residential area with excellent connectivity.", location:"Butwal, Rupandehi", province:"Lumbini", district:"Rupandehi", city:"Butwal", mapUrl:MAPS.butwal, areaSize:"1800 sqft", mainCategory:"House", subCategory:"House / Villa", image:"https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800", startingPrice:18000000, minIncrement:300000, auctionStart:past(20), auctionEnd:past(8), bids:[{bidderName:"Rohan Adhikari",amount:18300000,createdAt:past(19)},{bidderName:"Anita Shrestha",amount:19000000,createdAt:past(17)},{bidderName:"Priya Thapa",amount:20000000,createdAt:past(14)},{bidderName:"Bikash Gurung",amount:21500000,createdAt:past(10)},{bidderName:"Sunita Rai",amount:23000000,createdAt:past(8.2)}], status:"sold" },
    ];

    for (const l of ACTIVE) {
      const bids = makeBids(l.bids);
      const top = bids[bids.length-1];
      await BidListing.create({ ...l, sellerId:seller._id, sellerName:seller.name, sellerPhone:seller.phone||"", sellerEmail:seller.email||"", bids, currentBid:top.amount, currentBidder:top.bidderId, currentBidderName:top.bidderName, status:"active", listingFeePaid:true });
      log.push("Active: " + l.title);
    }

    for (const l of SOLD) {
      const bids = makeBids(l.bids);
      const top = bids[bids.length-1];
      await BidListing.create({ ...l, sellerId:seller._id, sellerName:seller.name, sellerPhone:seller.phone||"", sellerEmail:seller.email||"", bids, currentBid:top.amount, currentBidder:top.bidderId, currentBidderName:top.bidderName, status:"sold", listingFeePaid:true });
      log.push("Sold: " + l.title);
    }

    const total = await BidListing.countDocuments();
    log.push("Total bid listings: " + total);
    res.json({ success:true, log, total });
  } catch (err) {
    res.status(500).json({ success:false, error:err.message });
  }
});

module.exports = router;