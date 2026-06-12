
const express = require("express");
console.log("SERVER FILE LOADED");
const cors = require("cors");

const db = require("./database/db");

const memberRoutes = require("./routes/member.routes");
const syncGoogleSheet = require("./services/googleSheetSync");

const app = express();

/* ---------------- Middleware ---------------- */

app.use(cors());
app.use(express.json());

/* ---------------- Routes ---------------- */

app.use("/api/members", memberRoutes);

/* ---------------- Test Routes ---------------- */

app.get("/", (req, res) => {
  res.send("OmegaFit Backend Running");
});

app.get("/test", (req, res) => {
  res.json({ success: true });
});

/* ---------------- Google Sheet Sync ---------------- */

setInterval(() => {
  console.log("Running Google Sheet Sync...");
  syncGoogleSheet();
}, 30000);

/* ---------------- Start Server ---------------- */

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`OmegaFit backend running on port ${PORT}`);
});
