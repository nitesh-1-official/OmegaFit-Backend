const db = require("../database/database");

exports.getDashboardStats = (req, res) => {

  const today = new Date();
  const soonLimit = new Date();
  soonLimit.setDate(today.getDate() + 7);

  let totalMembers = 0;
  let activeMembers = 0;
  let inactiveMembers = 0;
  let expiringSoon = 0;

  db.all("SELECT * FROM members", [], (err, members) => {

    if (err) {
      return res.status(500).json(err);
    }

    totalMembers = members.length;

    members.forEach(member => {

      const expiry = new Date(member.expiryDate);

      if (expiry < today) {
        inactiveMembers++;
      } else {
        activeMembers++;
      }

      if (expiry >= today && expiry <= soonLimit) {
        expiringSoon++;
      }

    });

    db.get("SELECT SUM(amount) as totalRevenue FROM payments", [], (err, result) => {

      if (err) {
        return res.status(500).json(err);
      }

      res.json({
        totalMembers,
        activeMembers,
        inactiveMembers,
        expiringSoon,
        totalRevenue: result.totalRevenue || 0
      });

    });

  });

};