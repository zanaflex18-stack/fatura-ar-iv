
import fs from "fs";
import path from "path";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB = path.join(__dirname, "invoices.db");
const OUT = path.join(__dirname, "backups");
if(!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive:true });
function ts(){ const d=new Date(); return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}_${String(d.getHours()).padStart(2,'0')}${String(d.getMinutes()).padStart(2,'0')}${String(d.getSeconds()).padStart(2,'0')}`; }
(async()=>{
  const db = await open({ filename: DB, driver: sqlite3.Database });
  const rows = await db.all("SELECT * FROM invoices");
  const jpath = path.join(OUT, `invoices_${ts()}.json`);
  fs.writeFileSync(jpath, JSON.stringify(rows, null, 2), "utf8");
  const dbcopy = path.join(OUT, `db_${ts()}.sqlite`);
  fs.copyFileSync(DB, dbcopy);
  console.log("Backup created:", jpath, dbcopy);
})();
