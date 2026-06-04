require("dotenv").config();
const mongoose = require("mongoose");

const DB = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DATABASE_URL;

if (!DB) {
  process.stdout.write("ERROR: No MongoDB URI found in .env\n");
  process.exit(1);
}

process.stdout.write("Connecting to: " + DB.replace(/:([^@]+)@/, ":***@") + "\n");

async function patch() {
  try {
    await mongoose.connect(DB, { serverSelectionTimeoutMS: 10000 });
    process.stdout.write("Connected to MongoDB\n");
  } catch (err) {
    process.stdout.write("Connection failed: " + err.message + "\n");
    process.exit(1);
  }

  const db = mongoose.connection.db;

  const ramesh = await db.collection("users").findOne({ email: "ramesh.sharma@gmail.com" });
  if (!ramesh) {
    process.stdout.write("Ramesh account not found — run seedListings.js first\n");
    await mongoose.disconnect();
    process.exit(1);
  }
  process.stdout.write("Ramesh _id: " + ramesh._id.toString() + "\n");

  const rpRes = await db.collection("rentalpartners").updateMany(
    { userId: null },
    { $set: { userId: ramesh._id } }
  );
  process.stdout.write("RentalPartners patched: " + rpRes.modifiedCount + "\n");

  const bpRes = await db.collection("buyerposts").updateMany(
    { userId: null },
    { $set: { userId: ramesh._id } }
  );
  process.stdout.write("BuyerPosts patched: " + bpRes.modifiedCount + "\n");

  await mongoose.disconnect();
  process.stdout.write("Done — all seeded records linked to Ramesh account\n");
}

patch().catch(e => {
  process.stdout.write("Fatal: " + e.message + "\n");
  process.exit(1);
});
