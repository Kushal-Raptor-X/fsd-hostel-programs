const http = require("http");
const fs = require("fs");
const path = require("path");
const { EventEmitter } = require("events");

const PORT = 3003;
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "residents.json");

const notifier = new EventEmitter();
notifier.on("update", (msg) => console.log("[NOTIFY]", msg));
notifier.on("error", (e) => console.error("[ERR]", e.message));

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
}

function readRecords() {
  ensureDataFile();
  // Use stream to read (demonstrate Streams)
  return new Promise((resolve, reject) => {
    const chunks = [];
    const stream = fs.createReadStream(DATA_FILE, { encoding: "utf8" });
    stream.on("data", (c) => chunks.push(c));
    stream.on("end", () => {
      try { resolve(JSON.parse(chunks.join("") || "[]")); }
      catch (e) { reject(e); }
    });
    stream.on("error", reject);
  });
}

async function writeRecords(records) {
  ensureDataFile();
  // Use stream to write
  return new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(DATA_FILE, { encoding: "utf8" });
    stream.write(JSON.stringify(records, null, 2));
    stream.end();
    stream.on("finish", resolve);
    stream.on("error", reject);
  });
}

function send(res, status, body, type = "application/json") {
  res.writeHead(status, { "Content-Type": type, "Access-Control-Allow-Origin": "*" });
  res.end(typeof body === "string" ? body : JSON.stringify(body));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // Serve static index.html
  if (req.method === "GET" && pathname === "/") {
    const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
    return send(res, 200, html, "text/html");
  }

  if (req.method === "GET" && pathname === "/api/residents") {
    try {
      const records = await readRecords();
      return send(res, 200, records);
    } catch (e) { notifier.emit("error", e); return send(res, 500, { error: e.message }); }
  }

  if (req.method === "POST" && pathname === "/api/residents") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", async () => {
      try {
        const data = JSON.parse(body || "{}");
        if (!data.name || !data.roll || !data.room) {
          return send(res, 400, { error: "name, roll, room required" });
        }
        const records = await readRecords();
        const rec = { id: Date.now(), name: data.name, roll: Number(data.roll), room: data.room, status: data.status || "active" };
        records.push(rec);
        await writeRecords(records);
        notifier.emit("update", `Added resident ${rec.name}`);
        return send(res, 201, rec);
      } catch (e) { notifier.emit("error", e); return send(res, 500, { error: e.message }); }
    });
    return;
  }

  if (req.method === "PUT" && pathname.startsWith("/api/residents/")) {
    const id = Number(pathname.split("/").pop());
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", async () => {
      try {
        const data = JSON.parse(body || "{}");
        const records = await readRecords();
        const idx = records.findIndex((r) => r.id === id);
        if (idx === -1) return send(res, 404, { error: "not found" });
        records[idx] = { ...records[idx], ...data, id };
        await writeRecords(records);
        notifier.emit("update", `Updated resident ${id}`);
        return send(res, 200, records[idx]);
      } catch (e) { notifier.emit("error", e); return send(res, 500, { error: e.message }); }
    });
    return;
  }

  if (req.method === "DELETE" && pathname.startsWith("/api/residents/")) {
    const id = Number(pathname.split("/").pop());
    try {
      const records = await readRecords();
      const filtered = records.filter((r) => r.id !== id);
      await writeRecords(filtered);
      notifier.emit("update", `Deleted resident ${id}`);
      return send(res, 200, { ok: true });
    } catch (e) { notifier.emit("error", e); return send(res, 500, { error: e.message }); }
  }

  send(res, 404, { error: "not found" });
});

server.listen(PORT, () => {
  console.log(`Hostel utility server running at http://localhost:${PORT}`);
  ensureDataFile();
});
