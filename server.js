const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(express.json({ limit: "1mb" }));

// Serve everything in /public (front.html, kitchen.html, reports.html, css, js)
app.use(express.static(path.join(__dirname, "public")));

const DATA_FILE = path.join(__dirname, "orders.json");

let DB = [];

// Load existing orders on startup
if (fs.existsSync(DATA_FILE)) {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    DB = JSON.parse(raw);
  } catch (e) {
    console.error("Failed to read orders.json:", e.message);
    DB = [];
  }
}

function saveDb() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(DB, null, 2));
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function getBusinessDate(d = new Date()) {
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  return `${y}-${m}-${day}`;
}

// Meta info
app.get("/api/meta", (req, res) => {
  res.json({
    storeName: "Sabor a Mexico",
    businessDateToday: getBusinessDate(new Date())
  });
});

// Create order
app.post("/api/orders", (req, res) => {
  const { createdBy = "FrontDesk", orderType = "Takeaway", notes = "", items = [] } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "items must be a non-empty array" });
  }
  const now = Date.now();
  const order = {
    id: DB.length ? DB[DB.length - 1].id + 1 : 1,
    createdBy,
    orderType,
    notes,
    items,
    status: "NEW",
    createdAt: now,
    acceptedAt: null,
    doneAt: null,
    canceledAt: null,
    businessDate: getBusinessDate(new Date())
  };
  DB.push(order);
  saveDb();
  res.json({ id: order.id, status: order.status });
});

// List orders
app.get("/api/orders", (req, res) => {
  const { date, status } = req.query;
  let result = DB.slice();
  if (date) result = result.filter(o => o.businessDate === date);
  if (status) result = result.filter(o => o.status === status);
  result.sort((a, b) => b.id - a.id);
  res.json(result);
});

// Update status
app.patch("/api/orders/:id", (req, res) => {
  const id = Number(req.params.id);
  const { action } = req.body || {};
  const now = Date.now();
  const order = DB.find(o => o.id === id);
  if (!order) return res.status(404).json({ error: "Order not found" });

  if (action === "ACCEPT" && order.status === "NEW") {
    order.status = "IN_PROGRESS";
    order.acceptedAt = now;
  } else if (action === "DONE" && (order.status === "NEW" || order.status === "IN_PROGRESS")) {
    order.status = "COMPLETED";
    order.doneAt = now;
  } else if (action === "CANCEL" && (order.status === "NEW" || order.status === "IN_PROGRESS")) {
    order.status = "CANCELED";
    order.canceledAt = now;
  } else {
    return res.status(400).json({ error: "Invalid action or status transition" });
  }

  saveDb();
  res.json({ ok: true, status: order.status });
});

// Summary for a date
app.get("/api/summary", (req, res) => {
  const date = req.query.date || getBusinessDate(new Date());
  const list = DB.filter(o => o.businessDate === date);
  const total = list.length;
  const completed = list.filter(o => o.status === "COMPLETED").length;
  const canceled = list.filter(o => o.status === "CANCELED").length;
  const inProgress = list.filter(o => o.status === "IN_PROGRESS").length;

  const prepTimes = list
    .filter(o => o.createdAt && o.doneAt && o.doneAt >= o.createdAt)
    .map(o => (o.doneAt - o.createdAt) / 60000);

  const avgPrepMin = prepTimes.length
    ? Number((prepTimes.reduce((a, b) => a + b, 0) / prepTimes.length).toFixed(1))
    : 0;

  res.json({ date, total, completed, canceled, inProgress, avgPrepMin });
});

// CSV export
app.get("/api/export.csv", (req, res) => {
  const date = req.query.date || getBusinessDate(new Date());
  const list = DB.filter(o => o.businessDate === date);
  const headers = [
    "id","businessDate","status","orderType",
    "createdBy","createdAt","acceptedAt","doneAt",
    "notes","items"
  ];
  const lines = [headers.join(",")];

  const toCsv = (v) => {
    const s = (v ?? "").toString();
    if (s.includes('"') || s.includes(",") || s.includes("\n")) {
      return '"' + s.replace(/"/g,'""') + '"';
    }
    return s;
  };

  for (const o of list) {
    const itemsStr = (o.items || []).map(it => {
      const base = `${it.qty}x ${it.name}`;
      const note = it.note ? ` (${it.note})` : "";
      const price = typeof it.price === "number" ? ` $${it.price.toFixed(2)}` : "";
      return base + note + price;
    }).join(" | ");

    const row = [
      o.id,
      o.businessDate,
      o.status,
      o.orderType,
      o.createdBy,
      o.createdAt,
      o.acceptedAt,
      o.doneAt,
      o.notes || "",
      itemsStr
    ].map(toCsv);

    lines.push(row.join(","));
  }

  res.setHeader("Content-Type","text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="orders_${date}.csv"`);
  res.send(lines.join("\n"));
});

// Default routes so they always work
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "front.html"));
});
app.get("/front.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "front.html"));
});
app.get("/kitchen.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "kitchen.html"));
});
app.get("/reports.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "reports.html"));
});

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log("KDS Sabor a Mexico running on port " + PORT);
});
