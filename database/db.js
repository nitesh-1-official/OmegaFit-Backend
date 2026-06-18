const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "gym.db");
console.log("DB PATH:", dbPath);
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log("Connected to SQLite database");
  }
});
db.serialize(() => {

  db.run(`
    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      phone TEXT UNIQUE,
      plan INTEGER,
      startDate TEXT,
      expiryDate TEXT,
      deleted INTEGER DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      memberId INTEGER,
      memberName TEXT,
      plan INTEGER,
      amount INTEGER,
      paymentDate TEXT
    )
  `, (err) => {

    if (err) {
      console.log("PAYMENTS TABLE ERROR:", err.message);
    } else {
      console.log("PAYMENTS TABLE READY");
    }

  });

});

module.exports = db;
