const express = require("express");
const userRouter = require("./User");
const organisationRouter = require("./organisation");

const router = express.Router();

router.use("/user", userRouter);
router.use("/organisation", organisationRouter);

// Health check
router.get("/health", (req, res) => res.json({ status: "ok" }));

module.exports = router;
