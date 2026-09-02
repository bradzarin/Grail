
import sqlite3
from pathlib import Path

DB = Path(__file__).resolve().parents[1] / "data" / "grail.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_id TEXT NOT NULL,
    grade TEXT NOT NULL,
    sold_at TEXT NOT NULL,
    price REAL NOT NULL,
    venue TEXT NOT NULL,
    source_url TEXT,
    external_id TEXT NOT NULL DEFAULT '',
    verified INTEGER NOT NULL DEFAULT 1,
    buyer_premium REAL NOT NULL DEFAULT 0,
    shipping REAL NOT NULL DEFAULT 0,
    UNIQUE(card_id, grade, venue, sold_at, price, external_id)
);
CREATE INDEX IF NOT EXISTS idx_sales_card_grade_date
ON sales(card_id, grade, sold_at);
CREATE TABLE IF NOT EXISTS refresh_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_id TEXT NOT NULL,
    source TEXT NOT NULL,
    checked_at TEXT NOT NULL,
    inserted INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL,
    detail TEXT
);
"""

def connect():
    DB.parent.mkdir(parents=True, exist_ok=True)
    c = sqlite3.connect(DB)
    c.row_factory = sqlite3.Row
    return c

def init_db():
    with connect() as c:
        c.executescript(SCHEMA)

def insert_sale(sale):
    with connect() as c:
        try:
            c.execute(
                """INSERT INTO sales
                (card_id, grade, sold_at, price, venue, source_url, external_id, verified, buyer_premium, shipping)
                VALUES (?,?,?,?,?,?,?,?,?,?)""",
                (sale["card_id"], sale["grade"], sale["sold_at"], sale["price"],
                 sale["venue"], sale.get("source_url"), sale.get("external_id") or "",
                 1 if sale.get("verified", True) else 0,
                 sale.get("buyer_premium", 0), sale.get("shipping", 0))
            )
            return 1
        except sqlite3.IntegrityError:
            return 0

def sales(card_id, grade):
    with connect() as c:
        rows = c.execute(
            "SELECT * FROM sales WHERE card_id=? AND grade=? ORDER BY sold_at, id",
            (card_id, grade)
        ).fetchall()
        return [dict(r) for r in rows]

def log_refresh(card_id, source, checked_at, inserted, status, detail=""):
    with connect() as c:
        c.execute(
            "INSERT INTO refresh_log(card_id,source,checked_at,inserted,status,detail) VALUES(?,?,?,?,?,?)",
            (card_id,source,checked_at,inserted,status,detail)
        )

def refresh_logs(card_id, limit=12):
    with connect() as c:
        rows = c.execute(
            "SELECT * FROM refresh_log WHERE card_id=? ORDER BY id DESC LIMIT ?",
            (card_id,limit)
        ).fetchall()
        return [dict(r) for r in rows]
