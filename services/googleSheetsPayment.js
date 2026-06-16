const { google } = require("googleapis");

console.log("GOOGLE PAYMENT SERVICE LOADED");

let credentials;

/* Render */

if (process.env.GOOGLE_CREDENTIALS) {

  credentials = JSON.parse(
    process.env.GOOGLE_CREDENTIALS
  );

} else {

  /* Local PC */

  credentials = require(
    "../credentials/omegafit-service-account.json"
  );

}

console.log(
  "GOOGLE PROJECT:",
  credentials.project_id
);

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: [
    "https://www.googleapis.com/auth/spreadsheets"
  ]
});

const SPREADSHEET_ID =
"1a0WC-VFjn5k0oTW1SF-BZNiH2TTfTcqxdDdbMrX7miM";

async function addPayment(
  paymentDate,
  memberName,
  phone,
  plan,
  amount,
  type
) {

  console.log("ADD PAYMENT CALLED");

  console.log({
    paymentDate,
    memberName,
    phone,
    plan,
    amount,
    type
  });

  const client = await auth.getClient();

  const sheets = google.sheets({
    version: "v4",
    auth: client
  });

  console.log("WRITING TO GOOGLE SHEET...");

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: "Payments!A:F",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[
        paymentDate,
        memberName,
        phone,
        plan,
        amount,
        type
      ]]
    }
  });

  console.log(
    "PAYMENT WRITTEN TO GOOGLE SHEET"
  );

}

module.exports = {
  addPayment,
  auth,
  SPREADSHEET_ID
};
