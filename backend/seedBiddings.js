/**
 * Seed script — populates BidListing collection with active + completed auctions
 * Run: node seedBiddings.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const DB = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DATABASE_URL;

// ── Inline schemas ────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  name:String, email:{type:String,unique:true}, phone:String, password:String,
  role:{type:String,default:"user"}, accountType:{type:String,default:""},
  avatar:{type:String,default:""}, savedLands:[],
  sellerDocType:{type:String,default:""}, sellerDoc:{type:String,default:""},
  createdAt:{type:Date,default:Date.now},
});
let User;
try { User = mongoose.model("User"); } catch { User = mongoose.model("User", userSchema); }

const bidSchema = new mongoose.Schema({
  bidderId:{type:mongoose.Schema.Types.ObjectId,ref:"User"},
  bidderName:String, amount:Number, createdAt:{type:Date,default:Date.now},
});
const bidListingSchema = new mongoose.Schema({
  title:String, description:String, location:String,
  province:String, district:String, city:String, mapUrl:String,
  areaSize:String, mainCategory:String, subCategory:String,
  image:String, mediaFiles:[String],
  sellerId:{type:mongoose.Schema.Types.ObjectId,ref:"User"},
  sellerName:String, sellerPhone:String, sellerEmail:String,
  startingPrice:Number, reservePrice:{type:Number,default:0},
  minIncrement:{type:Number,default:1000},
  auctionStart:Date, auctionEnd:Date,
  status:{type:String,default:"pending"},
  bids:[bidSchema], currentBid:Number,
  currentBidder:{type:mongoose.Schema.Types.ObjectId,ref:"User"},
  currentBidderName:String,
  listingFeePaid:{type:Boolean,default:true},
  createdAt:{type:Date,default:Date.now},
});
let BidListing;
try { BidListing = mongoose.model("BidListing"); }
catch { BidListing = mongoose.model("BidListing", bidListingSchema); }

// ── Seed data ─────────────────────────────────────────────────────
const SELLER = {
  name:"Ramesh Sharma", email:"ramesh.sharma@gmail.com",
  phone:"9841234567", password:"Ramesh@123",
};

// Bidders pool
const BIDDERS = [
  { name:"Priya Thapa",    email:"priya.thapa.bid@gmail.com",    phone:"9852345678" },
  { name:"Bikash Gurung",  email:"bikash.gurung.bid@gmail.com",  phone:"9863456789" },
  { name:"Sunita Rai",     email:"sunita.rai.bid@gmail.com",     phone:"9874567890" },
  { name:"Rohan Adhikari", email:"rohan.adhikari.bid@gmail.com", phone:"9885678901" },
  { name:"Kabita Limbu",   email:"kabita.limbu.bid@gmail.com",   phone:"9818901234" },
  { name:"Dipesh Magar",   email:"dipesh.magar.bid@gmail.com",   phone:"9807890123" },
  { name:"Anita Shrestha", email:"anita.shrestha.bid@gmail.com", phone:"9840123456" },
];

// Google MyMaps embed URLs (public maps of Nepal locations)
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
const future = (days) => new Date(now.getTime() + days * 86400000);
const past   = (days) => new Date(now.getTime() - days * 86400000);

// ── Active listings (auction ongoing) ────────────────────────────
const ACTIVE_LISTINGS = [
  {
    title:"4 Aana Residential Land in Naxal",
    description:"Prime residential plot in Naxal, one of Kathmandu's most sought-after localities. 20ft road access, all utilities available. Ideal for building a luxury home or investment.",
    location:"Naxal, near Rani Pokhari, Kathmandu", province:"Bagmati", district:"Kathmandu", city:"Naxal",
    mapUrl: MAPS.naxal, areaSize:"4 aana", mainCategory:"Land", subCategory:"Residential Land",
    image:"https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800",
    startingPrice:8000000, minIncrement:100000,
    auctionStart: past(1), auctionEnd: future(3),
    bids:[
      { bidderName:"Priya Thapa",    amount:8100000, createdAt:past(0.9) },
      { bidderName:"Bikash Gurung",  amount:8300000, createdAt:past(0.7) },
      { bidderName:"Sunita Rai",     amount:8600000, createdAt:past(0.5) },
      { bidderName:"Rohan Adhikari", amount:9000000, createdAt:past(0.2) },
    ],
    currentBid:9000000, currentBidderName:"Rohan Adhikari",
  },
  {
    title:"3 BHK House in Thamel — Heritage Area",
    description:"Stunning 3-bedroom house in the heart of Thamel. Fully furnished, rooftop terrace with city views, parking for 2 cars. Perfect for residential or commercial use.",
    location:"Thamel, near Kathmandu Guest House", province:"Bagmati", district:"Kathmandu", city:"Thamel",
    mapUrl: MAPS.thamel, areaSize:"1200 sqft", mainCategory:"House", subCategory:"House / Villa",
    image:"https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800",
    startingPrice:15000000, minIncrement:200000,
    auctionStart: past(2), auctionEnd: future(5),
    bids:[
      { bidderName:"Kabita Limbu",   amount:15200000, createdAt:past(1.8) },
      { bidderName:"Dipesh Magar",   amount:15500000, createdAt:past(1.5) },
      { bidderName:"Anita Shrestha", amount:16000000, createdAt:past(1.0) },
      { bidderName:"Priya Thapa",    amount:16500000, createdAt:past(0.5) },
      { bidderName:"Bikash Gurung",  amount:17000000, createdAt:past(0.1) },
    ],
    currentBid:17000000, currentBidderName:"Bikash Gurung",
  },
  {
    title:"Lakeside Apartment in Pokhara — Mountain View",
    description:"Luxurious 2BHK apartment with direct Phewa Lake and Annapurna range views. Fully furnished, 24hr security, swimming pool access. Rare opportunity in Lakeside.",
    location:"Lakeside-6, near Phewa Lake, Pokhara", province:"Gandaki", district:"Kaski", city:"Lakeside",
    mapUrl: MAPS.pokhara, areaSize:"950 sqft", mainCategory:"House", subCategory:"Apartment / Flat",
    image:"https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
    startingPrice:12000000, minIncrement:150000,
    auctionStart: past(0.5), auctionEnd: future(4),
    bids:[
      { bidderName:"Sunita Rai",     amount:12150000, createdAt:past(0.4) },
      { bidderName:"Rohan Adhikari", amount:12400000, createdAt:past(0.3) },
      { bidderName:"Anita Shrestha", amount:12700000, createdAt:past(0.1) },
    ],
    currentBid:12700000, currentBidderName:"Anita Shrestha",
  },
  {
    title:"Commercial Land in Lazimpat — Diplomatic Zone",
    description:"6 aana commercial plot in Lazimpat, Kathmandu's prestigious diplomatic zone. Ideal for embassy, hotel, or high-end commercial development. Road access from two sides.",
    location:"Lazimpat, near Embassy area, Kathmandu", province:"Bagmati", district:"Kathmandu", city:"Lazimpat",
    mapUrl: MAPS.lazimpat, areaSize:"6 aana", mainCategory:"Land", subCategory:"Commercial Land",
    image:"https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800",
    startingPrice:25000000, minIncrement:500000,
    auctionStart: past(3), auctionEnd: future(2),
    bids:[
      { bidderName:"Dipesh Magar",   amount:25500000, createdAt:past(2.8) },
      { bidderName:"Kabita Limbu",   amount:26500000, createdAt:past(2.0) },
      { bidderName:"Bikash Gurung",  amount:28000000, createdAt:past(1.0) },
      { bidderName:"Priya Thapa",    amount:29500000, createdAt:past(0.3) },
    ],
    currentBid:29500000, currentBidderName:"Priya Thapa",
  },
  {
    title:"Bungalow in Jhamsikhel — Lalitpur",
    description:"Elegant 4-bedroom bungalow in Jhamsikhel, one of Lalitpur's most premium localities. Large garden, 3-car parking, solar power, backup generator. Walking distance to international schools.",
    location:"Jhamsikhel, near Sanepa, Lalitpur", province:"Bagmati", district:"Lalitpur", city:"Jhamsikhel",
    mapUrl: MAPS.jhamsikhel, areaSize:"2400 sqft", mainCategory:"House", subCategory:"Bungalow",
    image:"https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
    startingPrice:35000000, minIncrement:500000,
    auctionStart: past(1), auctionEnd: future(6),
    bids:[
      { bidderName:"Rohan Adhikari", amount:35500000, createdAt:past(0.9) },
      { bidderName:"Sunita Rai",     amount:36500000, createdAt:past(0.6) },
      { bidderName:"Anita Shrestha", amount:38000000, createdAt:past(0.2) },
    ],
    currentBid:38000000, currentBidderName:"Anita Shrestha",
  },
  {
    title:"Agricultural Land in Chitwan — Fertile Farmland",
    description:"12 ropani fertile agricultural land near Narayanghat, Chitwan. Irrigated, road access, suitable for commercial farming, resort, or eco-tourism development.",
    location:"Narayanghat, Chitwan", province:"Bagmati", district:"Chitwan", city:"Bharatpur",
    mapUrl: MAPS.chitwan, areaSize:"12 ropani", mainCategory:"Land", subCategory:"Agricultural Land",
    image:"https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800",
    startingPrice:5000000, minIncrement:100000,
    auctionStart: past(2), auctionEnd: future(1),
    bids:[
      { bidderName:"Bikash Gurung",  amount:5100000, createdAt:past(1.9) },
      { bidderName:"Kabita Limbu",   amount:5300000, createdAt:past(1.5) },
      { bidderName:"Dipesh Magar",   amount:5600000, createdAt:past(0.8) },
      { bidderName:"Priya Thapa",    amount:6000000, createdAt:past(0.2) },
    ],
    currentBid:6000000, currentBidderName:"Priya Thapa",
  },
  {
    title:"Heritage House in Bhaktapur Durbar Area",
    description:"Rare traditional Newari-style house adjacent to Bhaktapur Durbar Square. 3 floors, courtyard, original woodwork. UNESCO heritage zone — exceptional investment opportunity.",
    location:"Near Bhaktapur Durbar Square, Bhaktapur", province:"Bagmati", district:"Bhaktapur", city:"Bhaktapur",
    mapUrl: MAPS.bhaktapur, areaSize:"1100 sqft", mainCategory:"House", subCategory:"House / Villa",
    image:"https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800",
    startingPrice:20000000, minIncrement:300000,
    auctionStart: past(0.5), auctionEnd: future(7),
    bids:[
      { bidderName:"Anita Shrestha", amount:20300000, createdAt:past(0.4) },
      { bidderName:"Rohan Adhikari", amount:20700000, createdAt:past(0.2) },
    ],
    currentBid:20700000, currentBidderName:"Rohan Adhikari",
  },
];

// ── Completed (sold) listings ─────────────────────────────────────
const SOLD_LISTINGS = [
  {
    title:"2 BHK Flat in Patan — Heritage View",
    description:"Cozy 2BHK apartment with direct view of Patan Durbar Square. Fully furnished, 3rd floor, elevator access.",
    location:"Mangalbazar, Patan, Lalitpur", province:"Bagmati", district:"Lalitpur", city:"Patan",
    mapUrl: MAPS.patan, areaSize:"800 sqft", mainCategory:"House", subCategory:"Apartment / Flat",
    image:"https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
    startingPrice:7000000, minIncrement:100000,
    auctionStart: past(10), auctionEnd: past(3),
    bids:[
      { bidderName:"Priya Thapa",    amount:7100000, createdAt:past(9) },
      { bidderName:"Bikash Gurung",  amount:7300000, createdAt:past(8) },
      { bidderName:"Sunita Rai",     amount:7600000, createdAt:past(7) },
      { bidderName:"Kabita Limbu",   amount:8000000, createdAt:past(6) },
      { bidderName:"Dipesh Magar",   amount:8400000, createdAt:past(5) },
      { bidderName:"Anita Shrestha", amount:8900000, createdAt:past(4) },
      { bidderName:"Rohan Adhikari", amount:9500000, createdAt:past(3.1) },
    ],
    currentBid:9500000, currentBidderName:"Rohan Adhikari",
    status:"sold",
  },
  {
    title:"Commercial Plot in Biratnagar — Highway Frontage",
    description:"5 aana commercial land on the East-West Highway in Biratnagar. High traffic, ideal for showroom, hotel, or petrol pump.",
    location:"Biratnagar, Morang", province:"Koshi", district:"Morang", city:"Biratnagar",
    mapUrl: MAPS.biratnagar, areaSize:"5 aana", mainCategory:"Land", subCategory:"Commercial Land",
    image:"https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800",
    startingPrice:10000000, minIncrement:200000,
    auctionStart: past(15), auctionEnd: past(5),
    bids:[
      { bidderName:"Bikash Gurung",  amount:10200000, createdAt:past(14) },
      { bidderName:"Sunita Rai",     amount:10600000, createdAt:past(12) },
      { bidderName:"Priya Thapa",    amount:11200000, createdAt:past(10) },
      { bidderName:"Dipesh Magar",   amount:12000000, createdAt:past(7) },
      { bidderName:"Kabita Limbu",   amount:13000000, createdAt:past(5.2) },
    ],
    currentBid:13000000, currentBidderName:"Kabita Limbu",
    status:"sold",
  },
  {
    title:"Villa in Butwal — Rupandehi",
    description:"Spacious 4BHK villa near Butwal airport. Large garden, 3-car parking, solar power. Quiet residential area with excellent connectivity.",
    location:"Butwal, Rupandehi", province:"Lumbini", district:"Rupandehi", city:"Butwal",
    mapUrl: MAPS.butwal, areaSize:"1800 sqft", mainCategory:"House", subCategory:"House / Villa",
    image:"https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
    startingPrice:18000000, minIncrement:300000,
    auctionStart: past(20), auctionEnd: past(8),
    bids:[
      { bidderName:"Rohan Adhikari", amount:18300000, createdAt:past(19) },
      { bidderName:"Anita Shrestha", amount:19000000, createdAt:past(17) },
      { bidderName:"Priya Thapa",    amount:20000000, createdAt:past(14) },
      { bidderName:"Bikash Gurung",  amount:21500000, createdAt:past(10) },
      { bidderName:"Sunita Rai",     amount:23000000, createdAt:past(8.2) },
    ],
    currentBid:23000000, currentBidderName:"Sunita Rai",
    status:"sold",
  },
];

const fs = require("fs");
const LOG = [];
const log = (msg) => { console.log(msg); LOG.push(msg); };

async function seed() {
  await mongoose.connect(DB);
  log("✅ Connected to MongoDB");

  // ── 1. Get or create seller account ──────────────────────────────
  let seller = await User.findOne({ email: SELLER.email });
  if (!seller) {
    const hashed = await bcrypt.hash(SELLER.password, 10);
    seller = await User.create({ ...SELLER, password: hashed, role:"user", accountType:"seller" });
    log("✅ Created seller: " + seller._id);
  } else {
    await User.findByIdAndUpdate(seller._id, { accountType:"seller" });
    log("✅ Seller exists: " + seller._id);
  }

  // ── 2. Get or create bidder accounts ─────────────────────────────
  const bidderMap = {};
  for (const b of BIDDERS) {
    let u = await User.findOne({ email: b.email });
    if (!u) {
      const hashed = await bcrypt.hash("Bidder@123", 10);
      u = await User.create({ ...b, password: hashed, role:"user", accountType:"" });
      log("✅ Created bidder: " + u.name);
    }
    bidderMap[b.name] = u._id;
  }

  // ── 3. Clear existing bid listings ───────────────────────────────
  await BidListing.deleteMany({});
  log("🗑  Cleared existing bid listings");

  // ── 4. Insert active listings ─────────────────────────────────────
  for (const l of ACTIVE_LISTINGS) {
    const bids = l.bids.map(b => ({
      bidderId: bidderMap[b.bidderName] || seller._id,
      bidderName: b.bidderName,
      amount: b.amount,
      createdAt: b.createdAt,
    }));
    const topBid = bids[bids.length - 1];
    await BidListing.create({
      ...l,
      sellerId: seller._id,
      bids,
      currentBid: topBid.amount,
      currentBidder: topBid.bidderId,
      currentBidderName: topBid.bidderName,
      status: "active",
      listingFeePaid: true,
    });
    log("✅ Active: " + l.title);
  }

  // ── 5. Insert sold listings ───────────────────────────────────────
  for (const l of SOLD_LISTINGS) {
    const bids = l.bids.map(b => ({
      bidderId: bidderMap[b.bidderName] || seller._id,
      bidderName: b.bidderName,
      amount: b.amount,
      createdAt: b.createdAt,
    }));
    const topBid = bids[bids.length - 1];
    await BidListing.create({
      ...l,
      sellerId: seller._id,
      bids,
      currentBid: topBid.amount,
      currentBidder: topBid.bidderId,
      currentBidderName: topBid.bidderName,
      status: "sold",
      listingFeePaid: true,
    });
    log("✅ Sold: " + l.title);
  }

  const total = await BidListing.countDocuments();
  log("📊 Total bid listings: " + total);
  await mongoose.disconnect();
  log("✅ Done");
  fs.writeFileSync("./seedBiddings_result.txt", LOG.join("\n") + "\n");
}

seed().catch(e => {
  const fs = require("fs");
  fs.writeFileSync("./seedBiddings_result.txt", "FATAL: " + e.message + "\n");
  process.exit(1);
});
