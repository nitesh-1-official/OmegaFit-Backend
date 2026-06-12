const db = require("../database/db");

// Get all payments
exports.getPayments = (req, res) => {

  const sql = `
  SELECT 
    id,
    name,
    plan,
    CASE
      WHEN plan = 1 THEN 800
      WHEN plan = 3 THEN 2250
      WHEN plan = 6 THEN 4200
      WHEN plan = 12 THEN 7800
      ELSE 0
    END AS amount,
    startDate AS payment_date
  FROM members
  WHERE deleted = 0
  ORDER BY payment_date DESC
  `;

  db.all(sql, [], (err, rows) => {

    if (err) {
      return res.status(500).json(err);
    }

    res.json(rows);

  });

};


// Monthly Revenue
exports.getMonthlyRevenue = (req, res) => {

  const sql = `
  SELECT 
    strftime('%Y-%m', startDate) AS month,
    SUM(
      CASE
        WHEN plan = 1 THEN 800
        WHEN plan = 3 THEN 2250
        WHEN plan = 6 THEN 4200
        WHEN plan = 12 THEN 7800
        ELSE 0
      END
    ) AS revenue
  FROM members
  WHERE deleted = 0
  GROUP BY month
  ORDER BY month DESC
  `;

  db.all(sql, [], (err, rows) => {

    if (err) {
      return res.status(500).json(err);
    }

    res.json(rows);

  });

};