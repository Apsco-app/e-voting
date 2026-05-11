const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'data.sqlite');
let db;

function initDatabase() {
  if (db) return db;

  const mustInitialize = !fs.existsSync(dbPath);
  db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
      console.error('Failed to open SQLite database', err);
      process.exit(1);
    }
  });

  db.serialize(() => {
    db.run('PRAGMA journal_mode = WAL;');
    db.run('PRAGMA synchronous = NORMAL;');
    db.run('PRAGMA foreign_keys = ON;');

    db.run(`
      CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        voter_id TEXT UNIQUE NOT NULL,
        voter_id_hash TEXT UNIQUE NOT NULL,
        has_voted INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.all('PRAGMA table_info(students)', [], (err, columns) => {
      const hasVoterId = !err && columns.some((column) => column.name === 'voter_id');
      if (!hasVoterId) {
        db.run('ALTER TABLE students ADD COLUMN voter_id TEXT', (alterErr) => {
          if (alterErr && !alterErr.message.includes('duplicate column name')) {
            console.error('Failed to add voter_id column', alterErr);
          }
          db.run('CREATE INDEX IF NOT EXISTS idx_students_voter_id ON students(voter_id);');
        });
      } else {
        db.run('CREATE INDEX IF NOT EXISTS idx_students_voter_id ON students(voter_id);');
      }
    });

    db.run(`
      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS candidates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        post TEXT NOT NULL,
        photo TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    db.all(
      'SELECT id, name, post FROM candidates ORDER BY post, name, id',
      [],
      (err, rows) => {
        if (err) {
          console.error('Failed to inspect candidates for deduplication', err);
          return;
        }

        const groups = new Map();
        for (const row of rows) {
          const key = `${row.post.trim().toLowerCase()}|${row.name.trim().toLowerCase()}`;
          if (!groups.has(key)) {
            groups.set(key, []);
          }
          groups.get(key).push(row.id);
        }

        for (const ids of groups.values()) {
          if (ids.length <= 1) continue;
          const keepId = ids[0];
          const removeIds = ids.slice(1);

          for (const removeId of removeIds) {
            db.run('UPDATE votes SET candidate_id = ? WHERE candidate_id = ?', [keepId, removeId], (updateErr) => {
              if (updateErr) {
                console.error('Failed to remap duplicate candidate votes', updateErr);
              }
            });
          }

          db.run(
            `DELETE FROM candidates WHERE id IN (${removeIds.map(() => '?').join(',')})`,
            removeIds,
            (deleteErr) => {
              if (deleteErr) {
                console.error('Failed to delete duplicate candidates', deleteErr);
              }
            }
          );
        }
      }
    );
    db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_candidates_name_post ON candidates(name, post);', (err) => {
      if (err) {
        console.error('Failed to create candidate unique index', err);
      }
    });

    db.run(`
      CREATE TABLE IF NOT EXISTS votes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        post TEXT NOT NULL,
        candidate_id INTEGER NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(student_id) REFERENCES students(id),
        FOREIGN KEY(candidate_id) REFERENCES candidates(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS election (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        is_active INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, [], (err) => {
      if (err) {
        console.error('Failed to create election table', err);
        return;
      }
      db.get('SELECT COUNT(*) AS count FROM election', [], (err, row) => {
        if (err) {
          console.error('Failed to check election table', err);
          return;
        }
        if (!row || row.count === 0) {
          db.run('INSERT INTO election (is_active) VALUES (0)', [], (insertErr) => {
            if (insertErr) {
              console.error('Failed to initialize election record', insertErr);
            } else {
              console.log('Election table initialized with inactive record');
            }
          });
        }
      });
    });

    db.run('CREATE INDEX IF NOT EXISTS idx_students_voter_hash ON students(voter_id_hash);');
    db.run('CREATE INDEX IF NOT EXISTS idx_votes_student_id ON votes(student_id);');
    db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_votes_student_post ON votes(student_id, post);');
  });

  return db;
}

function getDb() {
  if (!db) initDatabase();
  return db;
}

function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

function getAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function allAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function execAsync(sql) {
  return new Promise((resolve, reject) => {
    getDb().exec(sql, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

module.exports = {
  initDatabase,
  getDb,
  runAsync,
  getAsync,
  allAsync,
  execAsync,
};
