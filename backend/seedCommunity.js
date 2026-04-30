/**
 * Seed script — populates RentalPartner and BuyerPost collections
 * Run: node seedCommunity.js
 */
require("dotenv").config();
const mongoose = require("mongoose");

const DB = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DATABASE_URL;

/* ── inline schemas (mirrors communityController) ─────────────────── */
const rentalPartnerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  name: String, phone: String, email: String,
  location: String, budget: Number,
  propertyType: String, subCategory: String,
  preferredGender: String, preferredAge: String,
  moveInDate: String, description: String,
  paymentStatus: { type: String, default: "paid" },
  createdAt: { type: Date, default: Date.now },
});
const buyerPostSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  userName: String, userAvatar: String,
  title: String, postType: String,
  description: String, propertyType: String, subCategory: String,
  location: String, budget: Number,
  contactPhone: String, contactEmail: String,
  media: [String],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  comments: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    userName: String, userAvatar: String, text: String,
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
});

let RentalPartner, BuyerPost;
try {
  RentalPartner = mongoose.model("RentalPartner");
  BuyerPost     = mongoose.model("BuyerPost");
} catch {
  RentalPartner = mongoose.model("RentalPartner", rentalPartnerSchema);
  BuyerPost     = mongoose.model("BuyerPost",     buyerPostSchema);
}

/* ── seed data ─────────────────────────────────────────────────────── */
const RENTAL_PARTNERS = [
  { name:"Aarav Sharma",    phone:"9841234567", email:"aarav.sharma@gmail.com",    location:"Thamel, Kathmandu",        budget:12000, propertyType:"Room",  subCategory:"Room - Living",      preferredGender:"Male",   preferredAge:"18-25", moveInDate:"2026-06-01", description:"Software engineer, non-smoker, clean habits. Looking for a quiet flatmate near Thamel." },
  { name:"Priya Thapa",     phone:"9852345678", email:"priya.thapa@gmail.com",     location:"Lalitpur, Patan",          budget:18000, propertyType:"House", subCategory:"Apartment / Flat",   preferredGender:"Female", preferredAge:"25-35", moveInDate:"2026-06-15", description:"Working professional, prefer female flatmate. Near Patan Dhoka area." },
  { name:"Bikash Gurung",   phone:"9863456789", email:"bikash.gurung@gmail.com",   location:"Pokhara, Lakeside",        budget:9000,  propertyType:"Room",  subCategory:"Room - Living",      preferredGender:"Any",    preferredAge:"18-25", moveInDate:"2026-07-01", description:"Tourism student at Pokhara University. Looking for budget room near Lakeside." },
  { name:"Sunita Rai",      phone:"9874567890", email:"sunita.rai@gmail.com",      location:"Biratnagar, Morang",       budget:7500,  propertyType:"Room",  subCategory:"Room - Office",      preferredGender:"Female", preferredAge:"25-35", moveInDate:"2026-06-01", description:"Bank employee. Need a clean room close to Biratnagar main road." },
  { name:"Rohan Adhikari",  phone:"9885678901", email:"rohan.adhikari@gmail.com",  location:"Bhaktapur, Suryabinayak", budget:15000, propertyType:"House", subCategory:"House / Villa",      preferredGender:"Any",    preferredAge:"25-35", moveInDate:"2026-07-15", description:"Family of 3 looking for a 2BHK house in Bhaktapur. Prefer ground floor." },
  { name:"Manisha Koirala", phone:"9896789012", email:"manisha.koirala@gmail.com", location:"Butwal, Rupandehi",        budget:8000,  propertyType:"Room",  subCategory:"Room - Living",      preferredGender:"Female", preferredAge:"18-25", moveInDate:"2026-06-10", description:"College student at Butwal campus. Looking for a safe room near college." },
  { name:"Dipesh Magar",    phone:"9807890123", email:"dipesh.magar@gmail.com",    location:"Chitwan, Bharatpur",       budget:20000, propertyType:"House", subCategory:"Apartment / Flat",   preferredGender:"Any",    preferredAge:"25-35", moveInDate:"2026-08-01", description:"Doctor at Bharatpur Hospital. Need a furnished flat close to hospital." },
  { name:"Kabita Limbu",    phone:"9818901234", email:"kabita.limbu@gmail.com",    location:"Dharan, Sunsari",          budget:6500,  propertyType:"Room",  subCategory:"Room - Living",      preferredGender:"Female", preferredAge:"18-25", moveInDate:"2026-06-20", description:"Nursing student. Looking for a room with attached bathroom in Dharan." },
  { name:"Sanjay Pandey",   phone:"9829012345", email:"sanjay.pandey@gmail.com",   location:"Hetauda, Makwanpur",       budget:11000, propertyType:"House", subCategory:"Bungalow",           preferredGender:"Any",    preferredAge:"35-50", moveInDate:"2026-07-01", description:"Business owner. Need a bungalow with parking space in Hetauda." },
  { name:"Anita Shrestha",  phone:"9840123456", email:"anita.shrestha@gmail.com",  location:"Kirtipur, Kathmandu",      budget:13500, propertyType:"House", subCategory:"Apartment / Flat",   preferredGender:"Female", preferredAge:"25-35", moveInDate:"2026-06-01", description:"Teacher at TU. Looking for a 1BHK flat near Kirtipur campus." },
  { name:"Nabin Tamang",    phone:"9851234567", email:"nabin.tamang@gmail.com",    location:"Damak, Jhapa",             budget:5500,  propertyType:"Room",  subCategory:"Room - Storage",     preferredGender:"Male",   preferredAge:"18-25", moveInDate:"2026-07-10", description:"Tea garden worker. Need a basic room in Damak town area." },
  { name:"Puja Karki",      phone:"9862345678", email:"puja.karki@gmail.com",      location:"Nepalgunj, Banke",         budget:9500,  propertyType:"Room",  subCategory:"Room - Living",      preferredGender:"Female", preferredAge:"25-35", moveInDate:"2026-06-15", description:"Nurse at Nepalgunj Medical College. Prefer female flatmate, non-smoker." },
  { name:"Suresh Basnet",   phone:"9873456789", email:"suresh.basnet@gmail.com",   location:"Birgunj, Parsa",           budget:16000, propertyType:"House", subCategory:"House / Villa",      preferredGender:"Any",    preferredAge:"35-50", moveInDate:"2026-08-01", description:"Import-export businessman. Need a spacious house near Birgunj customs." },
  { name:"Nisha Bhandari",  phone:"9884567890", email:"nisha.bhandari@gmail.com",  location:"Gorkha, Gandaki",          budget:7000,  propertyType:"Room",  subCategory:"Room - Living",      preferredGender:"Female", preferredAge:"18-25", moveInDate:"2026-07-01", description:"Tourism guide. Looking for a cozy room in Gorkha bazaar area." },
  { name:"Anil Joshi",      phone:"9895678901", email:"anil.joshi@gmail.com",      location:"Dhulikhel, Kavrepalanchok",budget:14000, propertyType:"House", subCategory:"Apartment / Flat",   preferredGender:"Any",    preferredAge:"25-35", moveInDate:"2026-06-01", description:"IT professional working remotely. Need a quiet flat with good internet in Dhulikhel." },
];

const BUYER_POSTS = [
  { userName:"Rajan Maharjan",  location:"Kathmandu, Baneshwor",    propertyType:"House", subCategory:"Apartment / Flat",   budget:25000, contactPhone:"9841111222", contactEmail:"rajan.maharjan@gmail.com",  title:"Looking for 2BHK apartment in Baneshwor",          description:"Need a furnished 2BHK apartment near Baneshwor Chowk. Prefer 2nd floor or above with parking. Family of 4.", postType:"section" },
  { userName:"Sita Devi Yadav", location:"Janakpur, Dhanusha",      propertyType:"Land",  subCategory:"Residential Land",   budget:50000, contactPhone:"9852222333", contactEmail:"sita.yadav@gmail.com",      title:"Residential land needed in Janakpur",              description:"Looking for 3-5 aana residential land near Janakpur main road. Ready to pay advance.", postType:"section" },
  { userName:"Prakash Oli",     location:"Pokhara, Newroad",        propertyType:"Room",  subCategory:"Room - Office",      budget:8000,  contactPhone:"9863333444", contactEmail:"prakash.oli@gmail.com",     title:"Office room needed near Pokhara Newroad",          description:"Small office space needed for a travel agency. Ground floor preferred, 200-400 sqft.", postType:"section" },
  { userName:"Kamala Thapa",    location:"Lalitpur, Jawalakhel",    propertyType:"House", subCategory:"House / Villa",      budget:35000, contactPhone:"9874444555", contactEmail:"kamala.thapa@gmail.com",    title:"3BHK house wanted in Jawalakhel area",             description:"Looking for a 3BHK house with garden. Prefer quiet neighborhood. Ready to sign 2-year lease.", postType:"section" },
  { userName:"Binod Chaudhary", location:"Dhangadhi, Kailali",      propertyType:"Land",  subCategory:"Commercial Land",    budget:80000, contactPhone:"9885555666", contactEmail:"binod.chaudhary@gmail.com", title:"Commercial land for business in Dhangadhi",        description:"Need 5-10 aana commercial land on main road in Dhangadhi for a supermarket project.", postType:"section" },
  { userName:"Gita Rana",       location:"Biratnagar, Morang",      propertyType:"House", subCategory:"Apartment / Flat",   budget:18000, contactPhone:"9896666777", contactEmail:"gita.rana@gmail.com",       title:"1BHK flat needed in Biratnagar",                   description:"Single working woman. Need a safe 1BHK flat near Biratnagar hospital. Prefer female landlord.", postType:"section" },
  { userName:"Ramesh Poudel",   location:"Chitwan, Narayanghat",    propertyType:"Land",  subCategory:"Agricultural Land",  budget:30000, contactPhone:"9807777888", contactEmail:"ramesh.poudel@gmail.com",   title:"Agricultural land for lease in Chitwan",           description:"Looking for 10+ ropani agricultural land for vegetable farming near Narayanghat.", postType:"section" },
  { userName:"Sarita Gurung",   location:"Butwal, Rupandehi",       propertyType:"Room",  subCategory:"Room - Living",      budget:6000,  contactPhone:"9818888999", contactEmail:"sarita.gurung@gmail.com",   title:"Affordable room needed in Butwal",                 description:"College student. Need a clean room with attached bathroom near Butwal campus. Budget is strict.", postType:"section" },
  { userName:"Deepak Shrestha", location:"Hetauda, Makwanpur",      propertyType:"House", subCategory:"Bungalow",           budget:45000, contactPhone:"9829999000", contactEmail:"deepak.shrestha@gmail.com", title:"Bungalow for rent in Hetauda",                     description:"Company executive. Need a furnished bungalow with 3+ bedrooms and parking for 2 cars.", postType:"section" },
  { userName:"Anupama Karki",   location:"Bhaktapur, Thimi",        propertyType:"House", subCategory:"Apartment / Flat",   budget:22000, contactPhone:"9840000111", contactEmail:"anupama.karki@gmail.com",   title:"2BHK apartment in Thimi, Bhaktapur",               description:"Young couple. Looking for a modern 2BHK apartment in Thimi. Need good ventilation and sunlight.", postType:"section" },
  { userName:"Sunil Tamang",    location:"Dharan, Sunsari",         propertyType:"Land",  subCategory:"Residential Land",   budget:40000, contactPhone:"9851111222", contactEmail:"sunil.tamang@gmail.com",    title:"Land plot needed in Dharan for house construction",description:"Planning to build a house. Need 4-6 aana land in Dharan-10 or nearby. Road access required.", postType:"section" },
  { userName:"Mina Limbu",      location:"Ilam, Eastern Nepal",     propertyType:"Room",  subCategory:"Room - Living",      budget:5500,  contactPhone:"9862222333", contactEmail:"mina.limbu@gmail.com",      title:"Room needed in Ilam town",                         description:"Tea estate worker. Need a basic room in Ilam bazaar. Prefer with kitchen access.", postType:"section" },
  { userName:"Kiran Adhikari",  location:"Nepalgunj, Banke",        propertyType:"House", subCategory:"House / Villa",      budget:28000, contactPhone:"9873333444", contactEmail:"kiran.adhikari@gmail.com",  title:"House for rent in Nepalgunj",                      description:"Government officer. Need a 3BHK house in Nepalgunj. Prefer near main road with stable electricity.", postType:"section" },
  { userName:"Poonam Basnet",   location:"Gorkha, Gandaki",         propertyType:"Land",  subCategory:"Agricultural Land",  budget:15000, contactPhone:"9884444555", contactEmail:"poonam.basnet@gmail.com",   title:"Small farm land for lease in Gorkha",              description:"Organic farming enthusiast. Looking for 5-8 ropani land near water source in Gorkha district.", postType:"section" },
  { userName:"Naresh Joshi",    location:"Dhulikhel, Kavrepalanchok",propertyType:"House",subCategory:"Apartment / Flat",   budget:20000, contactPhone:"9895555666", contactEmail:"naresh.joshi@gmail.com",    title:"Flat needed in Dhulikhel for remote work",         description:"Freelance developer. Need a quiet 1-2BHK flat with reliable internet. Mountain view preferred.", postType:"section" },
];

async function seed() {
  await mongoose.connect(DB);
  console.log("✅ Connected to MongoDB");

  // Try to find the Ramesh seller account created by seedListings.js
  let User;
  try { User = mongoose.model("User"); } catch {
    const userSchema = new mongoose.Schema({ name: String, email: String }, { strict: false });
    User = mongoose.model("User", userSchema);
  }
  const ramesh = await User.findOne({ email: "ramesh.sharma@gmail.com" });
  const fallbackUserId = ramesh?._id || null;
  if (fallbackUserId) console.log(`✅ Linking seeded posts to Ramesh account: ${fallbackUserId}`);
  else console.log("⚠️  No Ramesh account found — userId will be null (message button hidden)");

  // Clear existing
  await RentalPartner.deleteMany({});
  await BuyerPost.deleteMany({ postType: "section" });
  console.log("🗑  Cleared existing community data");

  // Insert rental partners — attach userId so message button works
  const rpWithUser = RENTAL_PARTNERS.map(p => ({ ...p, userId: fallbackUserId }));
  const rp = await RentalPartner.insertMany(rpWithUser);
  console.log(`✅ Inserted ${rp.length} rental partner listings`);

  // Insert buyer posts — attach userId so message button works
  const bpWithUser = BUYER_POSTS.map(p => ({ ...p, userId: fallbackUserId }));
  const bp = await BuyerPost.insertMany(bpWithUser);
  console.log(`✅ Inserted ${bp.length} buyer section posts`);

  await mongoose.disconnect();
  console.log("✅ Done — disconnected");
}

seed().catch(e => { console.error(e); process.exit(1); });
