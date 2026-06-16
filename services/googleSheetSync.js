const axios = require("axios");
const { parse } = require("csv-parse/sync");
const db = require("../database/db");

const {
  addPayment
} = require("./googleSheetsPayment");

const SHEET_URL =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vTkHRfjAqK_7Kg0gJDtmSM4vcAlbW1PYMf3Im4fJSJPkqDEDM7doqVo5mp0UXEjj8-C8ionXAxKaBbE/pub?output=csv";

const planPrices = {
  1: 800,
  3: 2250,
  6: 4200,
  12: 7800
};

/* Parse DD/MM/YYYY timestamp */

function parseTimestamp(ts) {

  if (!ts) return null;

  try {

    if (ts.includes("/")) {

      const [datePart, timePart] =
        ts.split(" ");

      const [day, month, year] =
        datePart.split("/").map(Number);

      let hour = 0;
      let minute = 0;
      let second = 0;

      if (timePart) {

        [hour, minute, second] =
          timePart.split(":").map(Number);

      }

      return new Date(
        year,
        month - 1,
        day,
        hour,
        minute,
        second
      );

    }

    const d = new Date(ts);

    if (!isNaN(d)) return d;

    return null;

  } catch {

    return null;

  }

}

async function syncGoogleSheet() {

  try {

    console.log("SYNC STARTED");

    const response =
      await axios.get(SHEET_URL);

    const records = parse(
      response.data,
      {
        columns: true,
        skip_empty_lines: true
      }
    );

    console.log(
      "ROWS FOUND:",
      records.length
    );

    records.forEach((row) => {

      const name =
        row["Name"] ||
        row[" Name"] ||
        row["NAME"];

      const phone =
        row["Phone No."] ||
        row["Phone No"] ||
        row["Phone"] ||
        row["WhatsApp no"];

      const plan =
        parseInt(row["DurationMonths"]) ||
        parseInt(row["Plan"]) ||
        1;

      const timestamp =
        row["Timestamp"] ||
        row[" Time stamp"];

      if (
        !name ||
        !phone ||
        !timestamp
      ) {
        return;
      }

      const start =
        parseTimestamp(timestamp);

      if (!start) return;

      const expiry =
        new Date(start);

      expiry.setMonth(
        expiry.getMonth() + plan
      );

      const startDate =
        start.toISOString().split("T")[0];

      const expiryDate =
        expiry.toISOString().split("T")[0];

      db.run(
        `
        INSERT INTO members
        (
          name,
          phone,
          plan,
          startDate,
          expiryDate,
          deleted
        )
        VALUES (?, ?, ?, ?, ?, 0)
        ON CONFLICT(phone) DO NOTHING
        `,
        [
          name,
          phone,
          plan,
          startDate,
          expiryDate
        ],
        function(err) {

          if (err) {

            console.log(
              "DB ERROR:",
              err.message
            );

            return;

          }

          /* New member inserted */

          if (this.changes > 0) {

            const amount =
              planPrices[plan] || 0;

            addPayment(
              startDate,
              name,
              phone,
              plan,
              amount,
              "Admission"
            )
            .then(() => {

              console.log(
                "ADMISSION PAYMENT WRITTEN:",
                name
              );

            })
            .catch((err) => {

              console.log(
                "PAYMENT SHEET ERROR:",
                err.message
              );

            });

          }

        }
      );

    });

    console.log("SYNC FINISHED");

  } catch (err) {

    console.log(
      "SYNC ERROR:",
      err.message
    );

  }

}

module.exports = syncGoogleSheet;
