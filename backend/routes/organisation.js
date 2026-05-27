const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const { Need, User, Organisation, Event, NGORequest } = require("../db");
const { JWT_SECRET } = require("../config");
const { authenticateOrg, authenticateUser } = require("../middleware");

const router = express.Router();

const ngoRequestValidationSchema = z.object({
  organisationId: z.string().min(1, "Organisation ID required"),
  typeOfFest: z.string().min(3, "Type of fest must be at least 3 characters"),
  date: z.string().refine((d) => !isNaN(Date.parse(d)), {
    message: "Invalid date format",
  }),
  requirements: z.string().min(10, "Requirements must be at least 10 characters"),
});

// ─── Validation schemas ───────────────────────────────────────────────────────

const signupSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().min(10, "Enter a valid phone number"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  registrationNumber: z.string().min(3, "Registration number required"),
  type: z
    .enum(["Education", "Healthcare", "Environment", "Animal Welfare", "Other"])
    .optional(),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      pincode: z.string().optional(),
    })
    .optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const needSchema = z.object({
  title: z.string().min(3, "Title too short"),
  description: z.string().min(10, "Description too short"),
  category: z.enum(["Volunteer", "Donation", "Event", "Other"]),
  location: z
    .object({ city: z.string().optional(), state: z.string().optional() })
    .optional(),
  skillsRequired: z.array(z.string()).optional().default([]),
  requiredCount: z.number().int().min(1).default(1),
  deadline: z.string().refine((d) => !isNaN(Date.parse(d)), {
    message: "Invalid deadline date",
  }),
});

// ─── POST /organisation/signup ────────────────────────────────────────────────
router.post("/signup", async (req, res) => {
  try {
    const result = signupSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: "Invalid details",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const data = result.data;

    const existingEmail = await Organisation.findOne({ email: data.email });
    if (existingEmail) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const existingReg = await Organisation.findOne({
      registrationNumber: data.registrationNumber,
    });
    if (existingReg) {
      return res.status(409).json({ message: "Registration number already used" });
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const organisation = await Organisation.create({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      phone: data.phone,
      description: data.description,
      registrationNumber: data.registrationNumber,
      type: data.type,
      address: data.address,
    });

    const token = jwt.sign(
      { id: organisation._id, role: "Organisation" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Shape matches what frontend session.js expects:
    // res.organization.id/name/email/role
    return res.status(201).json({
      message: "Organisation registered successfully",
      token,
      organization: {
        id: organisation._id,
        name: organisation.name,
        email: organisation.email,
        role: "Organisation",
      },
    });
  } catch (err) {
    console.error("[POST /organisation/signup]", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ─── POST /organisation/login ─────────────────────────────────────────────────
// FIX: original required phone + registrationNumber on login — that's bad UX.
// Frontend only sends email + password. We match on those only.
router.post("/login", async (req, res) => {
  try {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid email or password format" });
    }

    const { email, password } = result.data;

    const organisation = await Organisation.findOne({ email });
    if (!organisation) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const passwordMatch = await bcrypt.compare(password, organisation.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: organisation._id, role: "Organisation" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      organization: {
        id: organisation._id,
        name: organisation.name,
        email: organisation.email,
        role: "Organisation",
      },
    });
  } catch (err) {
    console.error("[POST /organisation/login]", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ─── POST /organisation/create  (post a new need) ─────────────────────────────
router.post("/create", authenticateOrg, async (req, res) => {
  try {
    const result = needSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: "Invalid need details",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const data = result.data;

    const need = await Need.create({
      title: data.title,
      description: data.description,
      category: data.category,
      location: data.location,
      skillsRequired: data.skillsRequired,
      requiredCount: data.requiredCount,
      deadline: new Date(data.deadline),
      organisation: req.userId,
      status: "Open",
    });

    // Keep the organisation's needs array in sync
    await Organisation.findByIdAndUpdate(req.userId, {
      $push: { needs: need._id },
    });

    return res.status(201).json({
      message: "Need posted successfully",
      need: { id: need._id, title: need.title },
    });
  } catch (err) {
    console.error("[POST /organisation/create]", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ─── GET /organisation/my-needs ───────────────────────────────────────────────
// Returns all needs posted by this org, with full applicant details.
// NGO Dashboard uses this to show the needs list + applicant review panel.
router.get("/my-needs", authenticateOrg, async (req, res) => {
  try {
    const needs = await Need.find({ organisation: req.userId })
      .populate("applicants.user", "name email phone skills bio")
      .sort({ createdAt: -1 });

    return res.status(200).json(needs);
  } catch (err) {
    console.error("[GET /organisation/my-needs]", err);
    return res.status(500).json({ message: "Could not fetch needs" });
  }
});

// ─── POST /organisation/needs/:needId/applicant/:userId ───────────────────────
// Accept or reject a volunteer's application.
router.post(
  "/needs/:needId/applicant/:userId",
  authenticateOrg,
  async (req, res) => {
    try {
      const orgId = req.userId;
      const { needId, userId } = req.params;
      const { status } = req.body;
      const mongoose = require("mongoose");

      if (!mongoose.Types.ObjectId.isValid(needId) || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(404).json({ message: "Need or applicant not found" });
      }

      if (!["accepted", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Status must be 'accepted' or 'rejected'" });
      }

      const need = await Need.findById(needId);
      if (!need) return res.status(404).json({ message: "Need not found" });

      if (need.organisation.toString() !== orgId) {
        return res.status(403).json({ message: "This need does not belong to your organisation" });
      }

      const applicant = need.applicants.find(
        (a) => a.user.toString() === userId
      );
      if (!applicant) {
        return res.status(404).json({ message: "Applicant not found for this need" });
      }

      applicant.status = status;
      await need.save();

      // If accepted, add to volunteer's completedNeeds
      if (status === "accepted") {
        await User.findByIdAndUpdate(userId, {
          $addToSet: { completedNeeds: needId },
        });
      }

      return res.status(200).json({
        message: status === "accepted" ? "Volunteer accepted!" : "Application declined",
      });
    } catch (err) {
      console.error("[POST /organisation/needs/:needId/applicant/:userId]", err);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

// ─── PATCH /organisation/needs/:needId/status ─────────────────────────────────
// Let the NGO close or reopen a need.
router.patch("/needs/:needId/status", authenticateOrg, async (req, res) => {
  try {
    const { needId } = req.params;
    const { status } = req.body;
    const mongoose = require("mongoose");

    if (!mongoose.Types.ObjectId.isValid(needId)) {
      return res.status(404).json({ message: "Need not found" });
    }

    if (!["Open", "Closed"].includes(status)) {
      return res.status(400).json({ message: "Status must be 'Open' or 'Closed'" });
    }

    const need = await Need.findById(needId);
    if (!need) return res.status(404).json({ message: "Need not found" });

    if (need.organisation.toString() !== req.userId) {
      return res.status(403).json({ message: "Not authorised" });
    }

    need.status = status;
    await need.save();

    return res.status(200).json({ message: `Need marked as ${status}` });
  } catch (err) {
    console.error("[PATCH /organisation/needs/:needId/status]", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ─── GET /organisation/profile/:id ───────────────────────────────────────────────
// Public route to view an organisation's profile
router.get("/profile/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const mongoose = require("mongoose");

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: "Organisation not found" });
    }

    const organisation = await Organisation.findById(id)
      .select("-password")
      .populate("needs")
      .populate("events");

    if (!organisation) {
      return res.status(404).json({ message: "Organisation not found" });
    }

    return res.status(200).json(organisation);
  } catch (err) {
    console.error("[GET /organisation/profile/:id]", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ─── PATCH /organisation/profile ────────────────────────────────────────────────
// Private route for an organisation to update its own profile
router.patch("/profile", authenticateOrg, async (req, res) => {
  try {
    const orgId = req.userId;
    const updates = req.body;
    
    // Remove sensitive or read-only fields
    delete updates.password;
    delete updates.email;
    delete updates.registrationNumber;
    delete updates._id;

    // Special handling for address: if sent as a flat object or partial object,
    // we want to ensure it doesn't overwrite other sub-fields if not intended.
    // However, the frontend currently sends a full address object.
    // To be safe and support partial updates, we flatten it:
    if (updates.address && typeof updates.address === 'object') {
      for (const key in updates.address) {
        updates[`address.${key}`] = updates.address[key];
      }
      delete updates.address;
    } else if (typeof updates.address === 'string') {
      // Legacy support if someone sends a stringified JSON
      try {
        const addr = JSON.parse(updates.address);
        for (const key in addr) {
          updates[`address.${key}`] = addr[key];
        }
        delete updates.address;
      } catch(e) {
        // If it's not valid JSON, we leave it (Mongoose will likely fail validation)
      }
    }

    const organisation = await Organisation.findByIdAndUpdate(
      orgId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");

    if (!organisation) {
      return res.status(404).json({ message: "Organisation not found" });
    }

    return res.status(200).json({
      message: "Profile updated successfully",
      organisation,
    });
  } catch (err) {
    console.error("[PATCH /organisation/profile] ERROR:", err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        message: "Validation failed", 
        errors: Object.values(err.errors).map(e => e.message) 
      });
    }
    // If it's a CastError (e.g. invalid type for a field)
    if (err.name === 'CastError') {
      return res.status(400).json({ message: `Invalid value for field: ${err.path}` });
    }
    return res.status(500).json({ message: "Server error", detail: err.message });
  }
});

// ─── POST /organisation/events ────────────────────────────────────────────────
// Create a new event/post for the organisation
router.post("/events", authenticateOrg, async (req, res) => {
  try {
    const { title, description, image, date } = req.body;
    if (!title || !description) {
      return res.status(400).json({ message: "Title and description required" });
    }

    const event = await Event.create({
      title,
      description,
      image,
      date: date || new Date(),
      organisation: req.userId,
    });

    await Organisation.findByIdAndUpdate(req.userId, {
      $push: { events: event._id },
    });

    return res.status(201).json({ message: "Event created successfully", event });
  } catch (err) {
    console.error("[POST /organisation/events]", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ─── DELETE /organisation/events/:id ──────────────────────────────────────────
router.delete("/events/:id", authenticateOrg, async (req, res) => {
  try {
    const { id } = req.params;
    const mongoose = require("mongoose");

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: "Event not found" });
    }

    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (event.organisation.toString() !== req.userId) {
      return res.status(403).json({ message: "Not authorised" });
    }

    await Event.findByIdAndDelete(id);
    await Organisation.findByIdAndUpdate(req.userId, {
      $pull: { events: id },
    });

    return res.status(200).json({ message: "Event deleted" });
  } catch (err) {
    console.error("[DELETE /organisation/events/:id]", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ─── GET /organisation/all ──────────────────────────────────────────────────
router.get("/all", async (req, res) => {
  try {
    const organisations = await Organisation.find({}).select("-password");
    return res.status(200).json(organisations);
  } catch (err) {
    console.error("[GET /organisation/all]", err);
    return res.status(500).json({ message: "Could not fetch organisations" });
  }
});

// ─── POST /organisation/request ──────────────────────────────────────────────
router.post("/request", authenticateUser, async (req, res) => {
  try {
    const result = ngoRequestValidationSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: "Invalid request details",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const { organisationId, typeOfFest, date, requirements } = result.data;
    const userId = req.userId;

    const orgExists = await Organisation.findById(organisationId);
    if (!orgExists) {
      return res.status(404).json({ message: "Organisation not found" });
    }

    const ngoRequest = await NGORequest.create({
      organisation: organisationId,
      user: userId,
      typeOfFest,
      date: new Date(date),
      requirements,
      status: "pending",
    });

    return res.status(201).json({
      message: "Request submitted successfully",
      request: ngoRequest,
    });
  } catch (err) {
    console.error("[POST /organisation/request]", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ─── GET /organisation/requests ──────────────────────────────────────────────
router.get("/requests", authenticateOrg, async (req, res) => {
  try {
    const requests = await NGORequest.find({ organisation: req.userId })
      .populate("user", "name email phone skills bio")
      .sort({ createdAt: -1 });
    return res.status(200).json(requests);
  } catch (err) {
    console.error("[GET /organisation/requests]", err);
    return res.status(500).json({ message: "Could not fetch requests" });
  }
});

// ─── POST /organisation/requests/:id/status ──────────────────────────────────
router.post("/requests/:id/status", authenticateOrg, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const mongoose = require("mongoose");

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const ngoRequest = await NGORequest.findById(id);
    if (!ngoRequest) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (ngoRequest.organisation.toString() !== req.userId) {
      return res.status(403).json({ message: "Not authorised to manage this request" });
    }

    ngoRequest.status = status;
    await ngoRequest.save();

    return res.status(200).json({
      message: `Request marked as ${status}`,
      request: ngoRequest,
    });
  } catch (err) {
    console.error("[POST /organisation/requests/:id/status]", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
