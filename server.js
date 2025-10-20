
import express from "express";
import session from "express-session";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import bcrypt from "bcrypt";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import openBrowser from "open";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;

// Hardcoded simple admin for zero-config use (grand / test)
const ADMIN_USERNAME = "grand";
const ADMIN_PASSWORD_PLAIN = "test";
let ADMIN_PASSWORD_HASH = null;
(async()=>{ ADMIN_PASSWORD_HASH = await bcrypt.hash(ADMIN_PASSWORD_PLAIN, 10); })();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(session({
  secret: "grandfilocar_v3_secret",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24*60*60*1000 }
}));

// DB setup
const DB_PATH = path.join(__dirname, "invoices.db");
async function initDb(){
  const db = await open({ filename: DB_PATH, driver: sqlite3.Database });
  await db.exec(`
  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_no TEXT,
    company_name TEXT,
    tax_office TEXT,
    tax_number TEXT,
    client_name TEXT,
    client_taxno TEXT,
    client_id_no TEXT,
    phone TEXT,
    email TEXT,
    start_date TEXT,
    end_date TEXT,
    plate TEXT,
    amount_net REAL,
    vat_rate REAL,
    amount_gross REAL,
    notes TEXT,
    created_by TEXT,
    created_at TEXT,
    updated_at TEXT,
    deleted_flag INTEGER DEFAULT 0
  );
  `);
  return db;
}
const dbPromise = initDb();

function ensureAuth(req, res, next){
  if(req.session && req.session.user) return next();
  return res.status(401).redirect("/login.html");
}

// Routes
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  if(!username || !password) return res.status(400).json({ ok:false, message:"Eksik bilgiler." });
  const valid = username === ADMIN_USERNAME && await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
  if(valid){ req.session.user = username; return res.json({ ok:true }); }
  return res.status(403).json({ ok:false, message:"Hatalı kullanıcı adı veya şifre." });
});

app.post("/api/logout", (req, res)=>{ req.session.destroy(()=> res.json({ ok:true })); });

app.post("/api/invoices", ensureAuth, async (req, res) => {
  const db = await dbPromise;
  const data = req.body;
  const now = new Date().toISOString();
  const invoice_no = `INV-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Date.now().toString().slice(-4)}`;
  const company_name = "Grand® Filo Car";
  const tax_office = "İstanbul";
  const tax_number = "1234567890";
  const vat = Number(data.vat_rate ?? 18);
  const net = Number(data.amount_net||0);
  const gross = +(net + (net * vat / 100)).toFixed(2);
  await db.run(`INSERT INTO invoices (invoice_no, company_name, tax_office, tax_number, client_name, client_taxno, client_id_no, phone, email, start_date, end_date, plate, amount_net, vat_rate, amount_gross, notes, created_by, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [invoice_no, company_name, tax_office, tax_number, data.client_name, data.client_taxno, data.client_id_no, data.phone, data.email, data.start_date, data.end_date, data.plate, net, vat, gross, data.notes||"", req.session.user||ADMIN_USERNAME, now]
  );
  const row = await db.get("SELECT * FROM invoices WHERE invoice_no = ?", invoice_no);
  res.json({ ok:true, invoice: row });
});

app.get("/api/invoices", ensureAuth, async (req, res) => {
  const db = await dbPromise;
  const rows = await db.all("SELECT * FROM invoices WHERE deleted_flag = 0 ORDER BY id DESC");
  res.json(rows);
});

app.get("/api/invoices/:id", ensureAuth, async (req, res) => {
  const db = await dbPromise;
  const row = await db.get("SELECT * FROM invoices WHERE id = ? AND deleted_flag = 0", req.params.id);
  if(!row) return res.status(404).json({ ok:false });
  res.json({ ok:true, invoice: row });
});

app.delete("/api/invoices/:id", ensureAuth, async (req, res) => {
  const db = await dbPromise;
  await db.run("UPDATE invoices SET deleted_flag = 1, updated_at = ? WHERE id = ?", new Date().toISOString(), req.params.id);
  res.json({ ok:true });
});

// Backup endpoints
app.get("/api/backup/json", ensureAuth, async (req, res) => {
  const db = await dbPromise;
  const rows = await db.all("SELECT * FROM invoices WHERE deleted_flag = 0 ORDER BY id DESC");
  const fname = `invoices_${new Date().toISOString().replace(/[:.]/g,'').replace(/T/g,'_').slice(0,19)}.json`;
  res.setHeader('Content-Disposition', `attachment; filename="${fname}"`);
  res.json(rows);
});

app.get("/api/backup/db", ensureAuth, (req, res) => {
  res.download(DB_PATH, path.basename(DB_PATH));
});

// Simple health
app.get("/api/ping", (req, res) => res.json({ ok:true }));

// Backup helper (used on schedule and manual)
async function doBackup(){
  try{
    const db = await dbPromise;
    const rows = await db.all("SELECT * FROM invoices");
    const ts = new Date().toISOString().replace(/[:.]/g,'').replace(/T/g,'_').slice(0,19);
    const outDir = path.join(__dirname, "backups");
    if(!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive:true });
    fs.writeFileSync(path.join(outDir, `invoices_${ts}.json`), JSON.stringify(rows, null, 2));
    fs.copyFileSync(DB_PATH, path.join(outDir, `db_${ts}.sqlite`));
    console.log("Auto-backup saved:", ts);
  }catch(e){ console.error("Backup failed:", e); }
}

// Run immediate backup on start, then every 12 hours
(async()=>{ await new Promise(r=>setTimeout(r,1000)); doBackup(); setInterval(doBackup, 12*60*60*1000); })();

app.listen(PORT, async ()=>{
  console.log(`Grand Filo Fatura v3: http://localhost:${PORT}`);
  // Try to open default browser (best-effort)
  try{ await openBrowser(`http://localhost:${PORT}`); }catch(e){}
});
