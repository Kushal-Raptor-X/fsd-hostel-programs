import { useState, useEffect } from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";

const STORAGE_KEY = "hostel_residents";

function loadInitial() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return JSON.parse(saved);
  return [
    { id: 1, name: "Aarav Sharma", roll: 1, room: "A-101", status: "active" },
    { id: 2, name: "Diya Patel", roll: 2, room: "B-204", status: "active" },
    { id: 3, name: "Kabir Singh", roll: 3, room: "C-305", status: "inactive" },
  ];
}

function Home() {
  const [residents] = useState(loadInitial);
  return (
    <div className="container">
      <div className="card">
        <h2>Hostel Management Dashboard</h2>
        <p>Total residents: {residents.length}</p>
        <p>Active: {residents.filter(r => r.status === "active").length}</p>
        <p>Inactive: {residents.filter(r => r.status === "inactive").length}</p>
        <nav style={{ display: "flex", gap: 12, marginTop: 16 }}>
          <Link to="/add"><button>Add Resident</button></Link>
          <Link to="/list"><button className="secondary">View List</button></Link>
        </nav>
      </div>
    </div>
  );
}

function AddResident({ onAdd }) {
  const [form, setForm] = useState({ name: "", roll: "", room: "", status: "active" });
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Name required"); setOk(""); return; }
    if (!form.roll || Number(form.roll) <= 0) { setError("Valid roll required"); setOk(""); return; }
    if (!form.room.trim()) { setError("Room required"); setOk(""); return; }
    setError("");
    onAdd({ ...form, roll: Number(form.roll), id: Date.now() });
    setOk("Resident added (POST).");
    setForm({ name: "", roll: "", room: "", status: "active" });
    setTimeout(() => navigate("/list"), 600);
  };

  return (
    <div className="container">
      <div className="card">
        <h2>Add Resident</h2>
        <form onSubmit={handleSubmit}>
          <div className="row">
            <label>Name <input name="name" value={form.name} onChange={handleChange} placeholder="Full name" /></label>
            <label>Roll No <input name="roll" type="number" value={form.roll} onChange={handleChange} placeholder="e.g. 43" /></label>
            <label>Room <input name="room" value={form.room} onChange={handleChange} placeholder="e.g. A-101" /></label>
            <label>Status
              <select name="status" value={form.status} onChange={handleChange}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
          </div>
          <div style={{ marginTop: 12 }}>
            <button type="submit">Add (POST)</button>
          </div>
          {error && <div className="msg err">{error}</div>}
          {ok && <div className="msg ok">{ok}</div>}
        </form>
      </div>
    </div>
  );
}

function ResidentList({ residents, onToggle, onDelete }) {
  const [sort, setSort] = useState("name");
  const [query, setQuery] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(residents));
  }, [residents]);

  let list = [...residents].sort((a, b) => {
    if (sort === "roll") return a.roll - b.roll;
    return String(a[sort]).localeCompare(String(b[sort]));
  });
  if (query) list = list.filter(r => r.name.toLowerCase().includes(query.toLowerCase()) || r.room.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="container">
      <div className="card">
        <h2>Resident List</h2>
        <div className="toolbar">
          <label style={{ flex: 0, minWidth: 120 }}>Sort by
            <select value={sort} onChange={e => setSort(e.target.value)}>
              <option value="name">Name</option>
              <option value="roll">Roll</option>
              <option value="room">Room</option>
            </select>
          </label>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search name/room..." style={{ flex: 0, minWidth: 200 }} />
        </div>
        {list.length === 0 ? <p>No residents.</p> : (
          <table>
            <thead><tr><th>Name</th><th>Roll No</th><th>Room</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {list.map(r => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{r.roll}</td>
                  <td>{r.room}</td>
                  <td><span className={"badge " + r.status}>{r.status}</span></td>
                  <td>
                    <button className="secondary" onClick={() => onToggle(r.id)}>Toggle</button>{" "}
                    <button className="danger" onClick={() => onDelete(r.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div style={{ marginTop: 12 }}>
          <Link to="/"><button className="secondary">Back</button></Link>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [residents, setResidents] = useState(loadInitial);

  const addResident = (r) => setResidents(prev => [...prev, r]);
  const toggleStatus = (id) => setResidents(prev => prev.map(r => r.id === id ? { ...r, status: r.status === "active" ? "inactive" : "active" } : r));
  const deleteResident = (id) => setResidents(prev => prev.filter(r => r.id !== id));

  return (
    <div>
      <nav className="topbar">
        <Link to="/">Home</Link>
        <Link to="/add">Add</Link>
        <Link to="/list">List</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/add" element={<AddResident onAdd={addResident} />} />
        <Route path="/list" element={<ResidentList residents={residents} onToggle={toggleStatus} onDelete={deleteResident} />} />
      </Routes>
    </div>
  );
}
