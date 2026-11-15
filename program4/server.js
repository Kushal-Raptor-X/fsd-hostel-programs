require("dotenv").config();
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3004;
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ---- Middleware: request logging ----
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ---- In-memory data ----
let residents = [
  { id: 1, name: "Aarav Sharma", roll: 1, room: "A-101", status: "active" },
  { id: 2, name: "Diya Patel", roll: 2, room: "B-204", status: "active" },
  { id: 3, name: "Kabir Singh", roll: 3, room: "C-305", status: "inactive" },
  { id: 4, name: "Ananya Rao", roll: 4, room: "A-102", status: "active" },
  { id: 5, name: "Rohan Mehta", roll: 5, room: "B-205", status: "active" },
];
let nextId = 6;

// ---- Users (bcrypt-hashed passwords) ----
const users = [
  { id: 1, username: "admin", passwordHash: bcrypt.hashSync("admin123", 10), role: "admin" },
];

// ---- Validation middleware ----
function validateResident(req, res, next) {
  const { name, roll, room } = req.body;
  if (!name || !roll || !room) {
    return res.status(400).json({ error: "name, roll, room are required" });
  }
  if (isNaN(roll) || Number(roll) <= 0) {
    return res.status(400).json({ error: "roll must be a positive number" });
  }
  next();
}

// ---- Auth middleware ----
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "missing token" });
  const token = header.split(" ")[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: "invalid token" });
  }
}

// ---- Routes ----
app.post("/api/login", async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = users.find((u) => u.username === username);
    if (!user) return res.status(401).json({ error: "invalid credentials" });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "invalid credentials" });
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: "1h" });
    res.json({ token });
  } catch (e) { next(e); }
});

app.get("/api/residents", (req, res) => {
  res.json(residents);
});

app.get("/api/residents/:id", (req, res, next) => {
  const r = residents.find((x) => x.id === Number(req.params.id));
  if (!r) return res.status(404).json({ error: "not found" });
  res.json(r);
});

app.post("/api/residents", validateResident, (req, res) => {
  const { name, roll, room, status } = req.body;
  const rec = { id: nextId++, name, roll: Number(roll), room, status: status || "active" };
  residents.push(rec);
  res.status(201).json(rec);
});

app.put("/api/residents/:id", validateResident, (req, res) => {
  const idx = residents.findIndex((x) => x.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: "not found" });
  const { name, roll, room, status } = req.body;
  residents[idx] = { ...residents[idx], name, roll: Number(roll), room, status: status || residents[idx].status };
  res.json(residents[idx]);
});

app.delete("/api/residents/:id", (req, res) => {
  const idx = residents.findIndex((x) => x.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: "not found" });
  const removed = residents.splice(idx, 1)[0];
  res.json({ ok: true, removed });
});

// Protected route
app.get("/api/protected", auth, (req, res) => {
  res.json({ message: "Protected data", user: req.user, residentsCount: residents.length });
});

// ---- Centralized error handler ----
app.use((err, req, res, next) => {
  console.error("[ERROR]", err.message);
  res.status(500).json({ error: "internal server error" });
});

app.listen(PORT, () => console.log(`Express API running at http://localhost:${PORT}`));
