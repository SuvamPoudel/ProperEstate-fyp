const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const connectDB = require("./config/database");
const app = express();
const server = http.createServer(app);

// Socket.io for live bidding
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});
app.set("io", io);

io.on("connection", (socket) => {
  // Join a bid listing room
  socket.on("join_bid", (listingId) => {
    socket.join(`bid_${listingId}`);
  });
  socket.on("leave_bid", (listingId) => {
    socket.leave(`bid_${listingId}`);
  });
});

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Connect to MongoDB
connectDB();

// Routes
app.use("/", require("./routes/authRoutes"));
app.use("/", require("./routes/landRoutes"));
app.use("/", require("./routes/adminRoutes"));
app.use("/", require("./routes/bookingRoutes"));
app.use("/", require("./routes/chatRoutes"));
app.use("/", require("./routes/communityRoutes"));
app.use("/", require("./routes/aiRoutes"));
app.use("/", require("./routes/helpRoutes"));
app.use("/", require("./routes/seedRoutes"));
app.use("/", require("./routes/buildRoutes"));
app.use("/", require("./routes/biddingRoutes"));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
