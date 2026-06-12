const fs = require("fs");
const csv = require("csv-parser");
const db = require("./database/db");

function syncSheet() {

  const results = [];

  fs.createReadStream("members.csv")
    .pipe(csv())
    .on("data", (data) => {
      results.push(data);
    })
    .on("end", () => {

      results.forEach((row) => {

        const name = row["Name"];
        const phone = row["Phone No."];

        if (!name || !phone) return; // skip empty rows

        const plan = parseInt(row["DurationMonths"]) || 1;

        // Start date from sheet or today
        let startDate = row["StartDate"];

        if (!startDate) {
          startDate = new Date();
        } else {
          startDate = new Date(startDate);
        }

        // Calculate expiry
        const expiry = new Date(startDate);
        expiry.setMonth(expiry.getMonth() + plan);

        const startISO = startDate.toISOString();
        const expiryISO = expiry.toISOString();

        const sql = `
          INSERT INTO members (name, phone, plan, start_date, expiry_date)
          SELECT ?, ?, ?, ?, ?
          WHERE NOT EXISTS (
            SELECT 1 FROM members WHERE phone = ?
          )
        `;

        db.run(sql, [name, phone, plan, startISO, expiryISO, phone]);

      });

      console.log("✅ Google Sheet synced successfully");

    });

}

module.exports = syncSheet;