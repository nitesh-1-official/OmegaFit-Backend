const db = require("../database/database");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "omega_secret";

// Login admin
exports.login = (req, res) => {
  const { username, password } = req.body;

  db.get(
    "SELECT * FROM admin WHERE username = ?",
    [username],
    async (err, admin) => {
      if (err) return res.status(500).json(err);

      if (!admin) {
        return res.status(401).json({ message: "Invalid username" });
      }

      const validPassword = await bcrypt.compare(password, admin.password);

      if (!validPassword) {
        return res.status(401).json({ message: "Invalid password" });
      }

      const token = jwt.sign({ id: admin.id }, SECRET, { expiresIn: "1d" });

      res.json({
        message: "Login successful",
        token,
      });
    }
  );
};