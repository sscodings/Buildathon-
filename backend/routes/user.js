const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const { Need, User } = require("../db");
const { JWT_SECRET } = require("../config");
const { authenticateUser, authenticate } = require("../middleware");

const router = express.Router();

// ─── Validation schemas ───────────────────────────────────────────────────────

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
  bio: z.string().optional(),
  skills: z.array(z.string()).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ─── POST /user/signup ────────────────────────────────────────────────────────
router.post("/signup", async (req, res) => {
  try {
    const result = signupSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: "Invalid details",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const { name, email, password, phone, bio, skills } = result.data;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone: phone || "",
      bio,
      skills,
    });

    const token = jwt.sign({ id: user._id, role: "volunteer" }, JWT_SECRET, {
      expiresIn: "7d",
    });

    // Shape matches what frontend session.js expects:
    // res.user.id, res.user.name, res.user.email, res.user.role
    return res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: "volunteer",
      },
    });
  } catch (err) {
    console.error("[POST /user/signup]", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ─── POST /user/login ─────────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid email or password format" });
    }

    const { email, password } = result.data;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id, role: "volunteer" }, JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: "volunteer",
      },
    });
  } catch (err) {
    console.error("[POST /user/login]", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ─── GET /user/all  (public feed of open needs) ───────────────────────────────
// Frontend calls this from both Explore page (unauthenticated possible) and
// User Dashboard. We keep it open but still parse auth if present.
router.get("/all", async (req, res) => {
  try {
    const { search } = req.query;

    const query = { status: "Open" };
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { skillsRequired: { $elemMatch: { $regex: search, $options: "i" } } },
      ];
    }

    const needs = await Need.find(query)
      .populate("organisation", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json(needs);
  } catch (err) {
    console.error("[GET /user/all]", err);
    return res.status(500).json({ message: "Could not fetch needs" });
  }
});

// ─── POST /user/apply/:needId ─────────────────────────────────────────────────
router.post("/apply/:needId", authenticateUser, async (req, res) => {
  try {
    const { needId } = req.params;
    const userId = req.userId;
    const mongoose = require("mongoose");

    if (!mongoose.Types.ObjectId.isValid(needId)) {
      return res.status(404).json({ message: "Need not found" });
    }

    const need = await Need.findById(needId);
    if (!need) return res.status(404).json({ message: "Need not found" });
    if (need.status === "Closed") {
      return res.status(400).json({ message: "This need is no longer accepting applications" });
    }

    // Check duplicate application
    const alreadyApplied = need.applicants.some(
      (a) => a.user.toString() === userId
    );
    if (alreadyApplied) {
      return res.status(409).json({ message: "Already applied to this need" });
    }

    need.applicants.push({ user: userId, status: "pending" });
    await need.save();

    await User.findByIdAndUpdate(userId, { $addToSet: { appliedNeeds: needId } });

    return res.status(200).json({ message: "Applied successfully" });
  } catch (err) {
    console.error("[POST /user/apply]", err);
    return res.status(500).json({ message: "Could not apply" });
  }
});

// ─── GET /user/my-applications ────────────────────────────────────────────────
// Returns all needs the volunteer has applied to, with their status.
// Frontend UserDashboard expects: [{ need: { _id, title, organisation: {name}, category }, status }]
router.get("/my-applications", authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;

    // Find all needs where this user is in applicants
    const needs = await Need.find({ "applicants.user": userId }).populate(
      "organisation",
      "name"
    );

    const applications = needs.map((need) => {
      const applicantEntry = need.applicants.find(
        (a) => a.user.toString() === userId
      );
      return {
        need: {
          _id: need._id,
          title: need.title,
          category: need.category,
          organisation: need.organisation,
          deadline: need.deadline,
          location: need.location,
        },
        status: applicantEntry?.status || "pending",
        appliedAt: applicantEntry?.appliedAt,
      };
    });

    return res.status(200).json(applications);
  } catch (err) {
    console.error("[GET /user/my-applications]", err);
    return res.status(500).json({ message: "Could not fetch applications" });
  }
});

// ─── GET /user/profile/:id ───────────────────────────────────────────────────
// Get full profile details of a user/volunteer
router.get("/profile/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const mongoose = require("mongoose");

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = await User.findById(id).select("-password").populate({
      path: "completedNeeds",
      select: "title category organisation",
      populate: {
        path: "organisation",
        select: "name"
      }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(user);
  } catch (err) {
    console.error("[GET /user/profile/:id]", err);
    return res.status(500).json({ message: "Could not fetch user profile" });
  }
});

// ─── PATCH /user/profile ───────────────────────────────────────────────────────
// Private route for a volunteer to update their own profile
router.patch("/profile", authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const updates = req.body;

    // Remove sensitive fields
    delete updates.password;
    delete updates.email;
    delete updates._id;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Profile updated successfully",
      user,
    });
  } catch (err) {
    console.error("[PATCH /user/profile]", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
