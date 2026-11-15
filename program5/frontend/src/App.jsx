import { useState, useEffect } from "react";
import { Routes, Route, Link } from "react-router-dom";

const API = (import.meta.env.VITE_API_URL || "http://localhost:3005") + "/api";
async function api(path, opts) {
  const res = await fetch(API + path, { cache: "no-store", ...(opts || {}) });
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.json();
}

function Home() {
  const [count, setCount] = useState(0);
  useEffect(() => { api("/residents").then(d => setCount(d.length)).catch(() => {}); }, []);
  return (
    <div className="container">
      <div className="card">
        <h1>Full-Stack Hostel (React + Express + Sequelize)</h1>
        <p>Frontend (Vercel) ↔ Backend (Render) ↔ Database (PostgreSQL/SQLite).</p>
        <div className="stat">{count}</div>
        <div>Total residents in DB</div>
      </div>
    </div>
  );
}

function List() {
  const [residents, setResidents] = useState([]);
  const [q, setQ] = useState("");
  const load = () => api("/residents").then(d => setResidents(d)).catch(() => {});
  useEffect(() => { load(); }, []);
  const del = async (id) => { await fetch(API + "/residents/" + id, { method: "DELETE" }); load(); };
  const toggle = async (r) => { await fetch(API + "/residents/" + r.id, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...r, status: r.status === "active" ? "inactive" : "active" }) }); load(); };
  const filtered = residents.filter(r => r.name.toLowerCase().includes(q.toLowerCase()) || r.room.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="container">
      <div className="card">
        <div className="toolbar">
          <button onClick={load}>GET</button>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search..." />
        </div>
        <table>
          <thead><tr><th>Name</th><th>Roll</th><th>Room</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id}>
                <td>{r.name}</td><td>{r.roll}</td><td>{r.room}</td>
                <td><span className={"badge " + r.status}>{r.status}</span></td>
                <td>
                  <button className="secondary" onClick={() => toggle(r)}>Toggle</button>{" "}
                  <button className="danger" onClick={() => del(r.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Add() {
  const [form, setForm] = useState({ name: "", roll: "", room: "", status: "active" });
  const [msg, setMsg] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(API + "/residents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, roll: Number(form.roll) }) });
      if (!res.ok) throw new Error("HTTP " + res.status);
      setMsg("Created.");
      setForm({ name: "", roll: "", room: "", status: "active" });
    } catch (e) { setMsg("Failed"); }
  };
  return (
    <div className="container">
      <div className="card">
        <h2>Add Resident (POST)</h2>
        <form onSubmit={submit}>
          <div className="row">
            <label>Name <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
            <label>Roll <input type="number" value={form.roll} onChange={e => setForm({ ...form, roll: e.target.value })} /></label>
            <label>Room <input value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} /></label>
            <label>Status <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
          </div>
          <div style={{ marginTop: 12 }}><button type="submit">Add</button></div>
          {msg && <div className="msg">{msg}</div>}
        </form>
      </div>
    </div>
  );
}

function Protected() {
  const [token, setToken] = useState("");
  const [out, setOut] = useState("");
  const login = async () => {
    const res = await fetch(API + "/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: "admin", password: "admin123" }) });
    const data = await res.json();
    setToken(data.token);
  };
  const call = async () => {
    const res = await fetch(API + "/protected", { headers: { Authorization: "Bearer " + token } });
    const data = await res.json();
    setOut(JSON.stringify(data, null, 2));
  };
  return (
    <div className="container">
      <div className="card">
        <h2>Protected (JWT)</h2>
        <button onClick={login}>Login (admin/admin123)</button>{" "}
        <button onClick={call} disabled={!token}>Call protected</button>
        <pre style={{ background: "#051a18", padding: 10, borderRadius: 6, marginTop: 8, overflow: "auto" }}>{out}</pre>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div>
      <nav className="topbar">
        <Link to="/">Home</Link>
        <Link to="/list">List</Link>
        <Link to="/add">Add</Link>
        <Link to="/protected">Protected</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/list" element={<List />} />
        <Route path="/add" element={<Add />} />
        <Route path="/protected" element={<Protected />} />
      </Routes>
    </div>
  );
}
