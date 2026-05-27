require("dotenv").config(); // must be first — loads .env before anything else
require("./db"); // connect to MongoDB on startup

const express = require("express");
const cors = require("cors");
const { PORT } = require("./config");
const mainRouter = require("./routes/index");

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/", mainRouter);

// ── 404 fallback ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("[Unhandled Error]", err);
  res.status(500).json({ message: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`SevaConnect backend running on http://localhost:${PORT}`);
});
