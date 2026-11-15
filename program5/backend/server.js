require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sequelize, Resident, User } = require("./models");

const app = express();
const PORT = process.env.PORT || 3005;
const JWT_SECRET = process.env.JWT_SECRET || "devsecret";

app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
app.use(express.json());

// logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// seed
async function seed() {
  await sequelize.sync();
  const count = await Resident.count();
  if (count === 0) {
    await Resident.bulkCreate([
      { name: "Aarav Sharma", roll: 1, room: "A-101", status: "active" },
      { name: "Diya Patel", roll: 2, room: "B-204", status: "active" },
      { name: "Kabir Singh", roll: 3, room: "C-305", status: "inactive" },
      { name: "Ananya Rao", roll: 4, room: "A-102", status: "active" },
      { name: "Rohan Mehta", roll: 5, room: "B-205", status: "active" },
      { name: "Sneha Iyer", roll: 6, room: "C-306", status: "inactive" },
      { name: "Vikram Joshi", roll: 7, room: "A-103", status: "active" },
      { name: "Priya Nair", roll: 8, room: "B-206", status: "active" },
    ]);
  }
  const uc = await User.count();
  if (uc === 0) {
    await User.create({ username: "admin", passwordHash: await bcrypt.hash("admin123", 10) });
  }
}

function auth(req, res, next) {
  const h = req.headers.authorization;
  if (!h) return res.status(401).json({ error: "missing token" });
  try { req.user = jwt.verify(h.split(" ")[1], JWT_SECRET); next(); }
  catch { return res.status(401).json({ error: "invalid token" }); }
}

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  const u = await User.findOne({ where: { username } });
  if (!u) return res.status(401).json({ error: "invalid" });
  const ok = await bcrypt.compare(password, u.passwordHash);
  if (!ok) return res.status(401).json({ error: "invalid" });
  const token = jwt.sign({ id: u.id, username: u.username }, JWT_SECRET, { expiresIn: "2h" });
  res.json({ token });
});

app.get("/api/residents", async (req, res) => res.json(await Resident.findAll()));
app.post("/api/residents", async (req, res) => {
  const { name, roll, room, status } = req.body;
  if (!name || !roll || !room) return res.status(400).json({ error: "required fields" });
  const r = await Resident.create({ name, roll: Number(roll), room, status: status || "active" });
  res.status(201).json(r);
});
app.put("/api/residents/:id", async (req, res) => {
  const r = await Resident.findByPk(req.params.id);
  if (!r) return res.status(404).json({ error: "not found" });
  await r.update(req.body);
  res.json(r);
});
app.delete("/api/residents/:id", async (req, res) => {
  const r = await Resident.findByPk(req.params.id);
  if (!r) return res.status(404).json({ error: "not found" });
  await r.destroy();
  res.json({ ok: true });
});
app.get("/api/protected", auth, async (req, res) => {
  res.json({ message: "protected", user: req.user, count: await Resident.count() });
});

// centralized error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "server error" });
});

seed().then(() => {
  app.listen(PORT, "0.0.0.0", () => console.log(`Backend listening on port ${PORT}`));
});
