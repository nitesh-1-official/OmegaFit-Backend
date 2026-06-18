
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

/* ---------------- Test Routes ---------------- */

app.get("/", (req, res) => {
  res.send("OmegaFit Backend Running");
});

app.get("/test", (req, res) => {
  res.json({ success: true });
});

app.get("/db-check", (req, res) => {

  db.all(
    "PRAGMA table_info(members)",
    [],
    (err, rows) => {

      if (err) {
        return res.json(err);
      }

      res.json(rows);

    }
  );

});

app.get("/duplicate-check", (req, res) => {

  db.all(
    `
    SELECT phone, COUNT(*) as total
    FROM members
    GROUP BY phone
    HAVING COUNT(*) > 1
    `,
    [],
    (err, rows) => {

      if (err) {
        return res.json(err);
      }

      res.json(rows);

    }
  );

});
app.get("/member-check/:phone", (req, res) => {

  db.all(
    "SELECT * FROM members WHERE phone = ?",
    [req.params.phone],
    (err, rows) => {

      if (err) {
        return res.json(err);
      }

      res.json(rows);

    }
  );

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
