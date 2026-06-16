const db = require("./database/db");

const {
  addPayment,
  auth,
  SPREADSHEET_ID
} = require("./services/googleSheetsPayment");

const { google } = require("googleapis");

const planPrices = {
  1: 800,
  3: 2250,
  6: 4200,
  12: 7800
};

async function migrate() {

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

  const existingAdmissions =
    new Set();

  rows.slice(1).forEach(row => {

    const memberName =
      (row[1] || "").trim();

    const type =
      (row[5] || "").trim();

    if (
      memberName &&
      type === "Admission"
    ) {
      existingAdmissions.add(
        memberName
      );
    }

  });

  console.log(
    "EXISTING ADMISSIONS:",
    existingAdmissions.size
  );

  db.all(
    `
    SELECT *
    FROM members
    WHERE deleted = 0
    `,
    [],
    async (err, members) => {

      if (err) {
        console.log(err);
        process.exit();
      }

      let added = 0;
      let skipped = 0;

      for (const member of members) {

        const memberName =
          (member.name || "").trim();

        if (
          existingAdmissions.has(
            memberName
          )
        ) {

          skipped++;

          continue;

        }

        try {

          const amount =
            planPrices[
              member.plan
            ] || 0;

          await addPayment(
            member.startDate,
            member.name,
            member.phone,
            member.plan,
            amount,
            "Admission"
          );

          added++;

          console.log(
            "ADDED:",
            member.name
          );

          await new Promise(
            resolve =>
              setTimeout(
                resolve,
                1500
              )
          );

        } catch (err) {

          console.log(
            "FAILED:",
            member.name
          );

          console.log(
            err.message
          );

        }

      }

      console.log(
        "SKIPPED:",
        skipped
      );

      console.log(
        "ADDED:",
        added
      );

      console.log(
        "MIGRATION COMPLETE"
      );

      process.exit();

    }
  );

}

migrate();
