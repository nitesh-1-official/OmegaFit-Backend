
const db = require("../database/db");

const {
  addPayment,
  auth,
  SPREADSHEET_ID
} = require("../services/googleSheetsPayment");

const { google } = require("googleapis");

const today = new Date().toISOString().split("T")[0];

const planPrices = {
  1: 800,
  3: 2250,
  6: 4200,
  12: 7800
};

const getPlanAmount = (plan) => {
  return planPrices[plan] || 0;
};

/* Utility: Add months */

const addMonths = (date, months) => {

  const d = new Date(date);
  d.setMonth(d.getMonth() + months);

  return d.toISOString().split("T")[0];

};



/* ================= GET ALL MEMBERS ================= */

exports.getMembers = (req, res) => {

  const query = `
    SELECT *
    FROM members
    WHERE deleted = 0
    ORDER BY id DESC
  `;

  db.all(query, [], (err, rows) => {

    if (err) return res.status(500).json(err);

    res.json(rows);

  });

};



/* ================= ACTIVE MEMBERS ================= */

exports.getActiveMembers = (req, res) => {

  const query = `
    SELECT *
    FROM members
    WHERE deleted = 0
    AND expiryDate >= ?
    ORDER BY expiryDate ASC
  `;

  db.all(query, [today], (err, rows) => {

    if (err) return res.status(500).json(err);

    res.json(rows);

  });

};



/* ================= EXPIRED MEMBERS ================= */

exports.getExpiredMembers = (req, res) => {

  const query = `
    SELECT *
    FROM members
    WHERE deleted = 0
    AND expiryDate < ?
    ORDER BY expiryDate DESC
  `;

  db.all(query, [today], (err, rows) => {

    if (err) return res.status(500).json(err);

    res.json(rows);

  });

};



/* ================= ADD MEMBER ================= */

exports.addMember = (req, res) => {

  const { name, phone, plan } = req.body;

  if (!name || !phone || !plan) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const startDate = today;
  const expiryDate = addMonths(startDate, plan);

  const query = `
    INSERT INTO members
    (name, phone, plan, startDate, expiryDate, deleted)
    VALUES (?, ?, ?, ?, ?, 0)
  `;

  db.run(
    query,
    [name, phone, plan, startDate, expiryDate],
    function(err) {

      if (err) return res.status(500).json(err);

      const memberId = this.lastID;
      const amount = getPlanAmount(plan);

      db.run(
        `
        INSERT INTO payments
        (memberId, memberName, plan, amount, paymentDate)
        VALUES (?, ?, ?, ?, ?)
        `,
        [
          memberId,
          name,
          plan,
          amount,
          startDate
        ]
      );
      addPayment(
  startDate,
  name,
  phone,
  plan,
  amount,
  "Admission"
)
.catch(err => {

  console.log(
    "GOOGLE SHEET ADMISSION ERROR:",
    err.message
  );

});

      res.json({
        message: "Member added",
        id: memberId
      });

    }
  );

};



/* ================= DELETE MEMBER ================= */

exports.deleteMember = (req, res) => {

  const id = req.params.id;

  const query = `
    UPDATE members
    SET deleted = 1
    WHERE id = ?
  `;

  db.run(query, [id], function(err) {

    if (err) return res.status(500).json(err);

    res.json({ message: "Member deleted" });

  });

};



/* ================= RENEW MEMBERSHIP ================= */

exports.renewMember = (req, res) => {

  console.log("RENEW ROUTE HIT");

  const id = req.params.id;

  const { plan, startDate } = req.body;

  if (!plan) {
    return res.status(400).json({
      message: "Plan required"
    });
  }

  const renewalDate = startDate || today;

  const expiryDate = addMonths(
    renewalDate,
    plan
  );

  const updateQuery = `
    UPDATE members
    SET plan = ?, startDate = ?, expiryDate = ?
    WHERE id = ?
  `;

  db.run(
    updateQuery,
    [plan, renewalDate, expiryDate, id],
    function(err) {

      if (err) {
        return res.status(500).json(err);
      }

      db.get(
  "SELECT name, phone FROM members WHERE id = ?",
        [id],
        (err, member) => {

          if (!err && member) {

           const amount =
  getPlanAmount(plan);

/* SQLite */

/* SQLite */

db.run(
  `
  INSERT INTO payments
  (memberId, memberName, plan, amount, paymentDate)
  VALUES (?, ?, ?, ?, ?)
  `,
  [
    id,
    member.name,
    plan,
    amount,
    renewalDate
  ],
  function(err) {

    if (err) {

      console.log(
        "PAYMENT INSERT ERROR:",
        err
      );

    } else {

      console.log(
        "PAYMENT INSERTED:",
        this.lastID
      );

    }

  }
);

/* Google Sheets */

addPayment(
  renewalDate,
  member.name,
  member.phone,
  plan,
  amount,
  "Renewal"
)
.then(() => {
  console.log(
    "PAYMENT WRITTEN TO GOOGLE SHEET"
  );
})
.catch((err) => {
  console.log(
    "GOOGLE SHEET PAYMENT ERROR:",
    err.message
  );
}); 

          }

          res.json({
            message: "Membership renewed"
          });

        }
      );

    }
  );

};

/* ================= DASHBOARD STATS ================= */

exports.getDashboardStats = (req, res) => {

  const statsQuery = `
    SELECT 
      COUNT(*) as totalMembers,
      SUM(CASE WHEN expiryDate >= ? THEN 1 ELSE 0 END) as activeMembers,
      SUM(CASE WHEN expiryDate < ? THEN 1 ELSE 0 END) as expiredMembers
    FROM members
    WHERE deleted = 0
  `;

  db.get(statsQuery, [today, today], (err, stats) => {

    if (err) return res.status(500).json(err);

    db.all(
      "SELECT plan FROM members WHERE deleted = 0",
      [],
      (err, rows) => {

        if (err) return res.status(500).json(err);

        let totalRevenue = 0;

        rows.forEach(member => {

          if (planPrices[member.plan]) {
            totalRevenue += planPrices[member.plan];
          }

        });

        res.json({
          totalMembers: stats.totalMembers || 0,
          activeMembers: stats.activeMembers || 0,
          expiredMembers: stats.expiredMembers || 0,
          totalRevenue: totalRevenue
        });

      }
    );

  });

};

/* ================= MONTHLY REVENUE ================= */
exports.getMonthlyRevenue = async (req, res) => {

  try {

    const client = await auth.getClient();

    const sheets = google.sheets({
      version: "v4",
      auth: client
    });

    const response =
      await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: "Payments!A:F"
      });

    const rows =
      response.data.values || [];

    const revenue = {};

    rows.slice(1).forEach((row) => {

      const paymentDate =
        row[0] || "";

      const amount =
        Number(row[4] || 0);

      if (!paymentDate) return;

      const month =
        paymentDate.substring(0, 7);

      revenue[month] =
        (revenue[month] || 0) + amount;

    });

    res.json(revenue);

  } catch (err) {

    console.log(
      "MONTHLY REVENUE ERROR:",
      err
    );

    res.status(500).json({
      error: err.message
    });

  }

};
/* ================= PAYMENT HISTORY ================= */

exports.getPayments = async (req, res) => {

  try {

    const client = await auth.getClient();

    const sheets = google.sheets({
      version: "v4",
      auth: client
    });

    const response =
      await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: "Payments!A:F"
      });

    const rows =
      response.data.values || [];

    const payments =
      rows.slice(1).map((row, index) => ({
        id: index + 1,
        paymentDate: row[0] || "",
        memberName: row[1] || "",
        phone: row[2] || "",
        plan: Number(row[3] || 0),
        amount: Number(row[4] || 0),
        type: row[5] || ""
      }));

    res.json(payments);

  } catch (err) {

    console.log(
      "GET PAYMENTS ERROR:",
      err
    );

    res.status(500).json({
      error: err.message
    });

  }

};
