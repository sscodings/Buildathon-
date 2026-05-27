require("dotenv").config();
const mongoose = require("mongoose");
const { MONGO_URI } = require("./config");

if (!MONGO_URI) {
  console.error("FATAL: MONGO_URI is not set in environment. Check your .env file.");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });

mongoose.connection.on("disconnected", () =>
  console.warn("[MongoDB] Disconnected — will auto-reconnect")
);
mongoose.connection.on("reconnected", () =>
  console.log("[MongoDB] Reconnected")
);


  
// ─── Organisation ────────────────────────────────────────────────────────────
const organisationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    website: String,
    description: String,
    type: {
      type: String,
      enum: ["Education", "Healthcare", "Environment", "Animal Welfare", "Other"],
      default: "Other",
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: { type: String, default: "India" },
      pincode: String,
    },
    registrationNumber: { type: String, required: true, unique: true },
    documents: [{ name: String, fileUrl: String }],
    isVerified: { type: Boolean, default: false },
    needs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Need" }],
    events: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
    photos: [String],
    role: { type: String, default: "Organisation" }, // constant — makes session.js happy
  },
  { timestamps: true }
);

// ─── User (Volunteer) ────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    phone: String,
    bio: String,
    education: String,
    profession: String,
    location: String,
    skills: [String],
    appliedNeeds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Need" }],
    completedNeeds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Need" }],
    rating: { type: Number, default: 0 },
    role: { type: String, default: "volunteer" }, // constant — for session.js
  },
  { timestamps: true }
);

// ─── Need ────────────────────────────────────────────────────────────────────
const needSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ["Volunteer", "Donation", "Event", "Other"],
      required: true,
    },
    organisation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organisation",
      required: true,
    },
    location: { city: String, state: String },
    skillsRequired: [String],
    requiredCount: { type: Number, default: 1 },
    applicants: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        status: {
          type: String,
          enum: ["pending", "accepted", "rejected"],
          default: "pending",
        },
        appliedAt: { type: Date, default: Date.now },
      },
    ],
    deadline: Date,
    status: { type: String, enum: ["Open", "Closed"], default: "Open" },
  },
  { timestamps: true }
);

// ─── Event / Post ────────────────────────────────────────────────────────────
const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    image: String,
    date: { type: Date, default: Date.now },
    organisation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organisation",
      required: true,
    },
  },
  { timestamps: true }
);

// ─── NGO Request ─────────────────────────────────────────────────────────────
const ngoRequestSchema = new mongoose.Schema(
  {
    organisation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organisation",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    typeOfFest: { type: String, required: true },
    date: { type: Date, required: true },
    requirements: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const Organisation = mongoose.model("Organisation", organisationSchema);
const User = mongoose.model("User", userSchema);
const Need = mongoose.model("Need", needSchema);
const Event = mongoose.model("Event", eventSchema);
const NGORequest = mongoose.model("NGORequest", ngoRequestSchema);

module.exports = { Organisation, User, Need, Event, NGORequest };
