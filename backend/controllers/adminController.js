const { runAsync, allAsync, getAsync } = require('../database');
const { parseStudentsPayload, generateVoterCode, hashVoterId } = require('../models/utils');

async function login(req, res) {
  return res.status(400).json({ message: 'Use /auth/login for voter access and /admin/login for admin.' });
}

async function importStudents(req, res) {
  try {
    const { format, data } = req.body;
    if (!format || !data) {
      return res.status(400).json({ message: 'format and data required' });
    }

    const rows = parseStudentsPayload(data, format);
    const created = [];

    for (const item of rows) {
      if (!item.full_name) {
        continue;
      }

      const lastName = item.last_name || item.full_name.split(' ').slice(-1).join(' ');
      let voterId = generateVoterCode();
      let hash = hashVoterId(voterId);
      let tries = 0;

      while (tries < 10) {
        try {
          await runAsync(
            'INSERT INTO students (full_name, last_name, voter_id, voter_id_hash) VALUES (?, ?, ?, ?)',
            [item.full_name, lastName, voterId, hash]
          );
          created.push({ full_name: item.full_name, voter_id: voterId });
          break;
        } catch (err) {
          if (err && err.message && err.message.includes('UNIQUE')) {
            voterId = generateVoterCode();
            hash = hashVoterId(voterId);
            tries += 1;
            continue;
          }
          throw err;
        }
      }
    }

    res.json({ imported: created.length, students: created });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not import students' });
  }
}

async function createElection(req, res) {
  try {
    const { post } = req.body;
    if (!post) {
      return res.status(400).json({ message: 'Post name is required' });
    }
    await runAsync('INSERT OR IGNORE INTO posts (name, is_active) VALUES (?, 1)', [post.trim()]);
    res.json({ message: 'Election post created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not create election post' });
  }
}

async function addCandidate(req, res) {
  try {
    const { name, post } = req.body;
    if (!name || !post) {
      return res.status(400).json({ message: 'Candidate name and post are required' });
    }
    const postRow = await getAsync('SELECT id FROM posts WHERE name = ? AND is_active = 1', [post.trim()]);
    if (!postRow) {
      return res.status(400).json({ message: 'Post not found or election not active' });
    }
    const existingCandidate = await getAsync(
      'SELECT id FROM candidates WHERE name = ? AND post = ?',
      [name.trim(), post.trim()]
    );
    if (existingCandidate) {
      return res.status(409).json({ message: 'Candidate already exists for this post' });
    }
    await runAsync('INSERT INTO candidates (name, post) VALUES (?, ?)', [name.trim(), post.trim()]);
    res.json({ message: 'Candidate added' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not add candidate' });
  }
}

async function startElection(req, res) {
  try {
    await runAsync('UPDATE election SET is_active = 0 WHERE is_active = 1');
    await runAsync('INSERT INTO election (is_active) VALUES (1)');
    res.json({ message: 'Election started' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not start election' });
  }
}
async function clearAllData(req, res) {
  try {
    await runAsync('DELETE FROM votes');
    await runAsync('DELETE FROM candidates');
    await runAsync('DELETE FROM students');
    await runAsync('DELETE FROM posts');
    await runAsync('UPDATE election SET is_active = 0');
    res.json({ message: 'All data cleared' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not clear data' });
  }
}
async function endElection(req, res) {
  try {
    await runAsync('UPDATE election SET is_active = 0 WHERE is_active = 1');
    res.json({ message: 'Election ended' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not end election' });
  }
}

async function resetElection(req, res) {
  try {
    await runAsync('DELETE FROM votes');
    await runAsync('UPDATE students SET has_voted = 0');
    res.json({ message: 'Election data reset' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not reset election' });
  }
}

async function stats(req, res) {
  try {
    const students = await getAsync('SELECT COUNT(*) AS count FROM students');
    const votes = await getAsync('SELECT COUNT(*) AS count FROM votes');
    const posts = await getAsync('SELECT COUNT(*) AS count FROM posts');
    const candidates = await getAsync('SELECT COUNT(*) AS count FROM candidates');
    const election = await getAsync('SELECT is_active FROM election ORDER BY created_at DESC LIMIT 1');
    res.json({
      total_students: students.count,
      total_votes: votes.count,
      total_posts: posts.count,
      total_candidates: candidates.count,
      election_active: Boolean(election && election.is_active),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not load stats' });
  }
}

async function results(req, res) {
  try {
    const rows = await allAsync(
      `SELECT c.id, c.name, c.post, c.photo, COUNT(v.id) AS votes
       FROM candidates c
       LEFT JOIN votes v ON v.candidate_id = c.id
       GROUP BY c.id
       ORDER BY c.post COLLATE NOCASE, votes DESC`
    );
    res.json({ results: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not load results' });
  }
}

async function students(req, res) {
  try {
    const rows = await allAsync(
      'SELECT id, full_name, last_name, voter_id, has_voted, created_at FROM students ORDER BY created_at DESC LIMIT 200'
    );
    res.json({ students: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not load student list' });
  }
}

function escapeCsv(value) {
  return `"${String(value || '').replace(/"/g, '""')}"`;
}

async function exportVoters(req, res) {
  try {
    const rows = await allAsync('SELECT full_name, voter_id FROM students ORDER BY full_name');
    const csvRows = rows.map((row) => [escapeCsv(row.full_name), escapeCsv(row.voter_id)].join(','));
    const csv = ['full_name,voter_id', ...csvRows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="voter-list.csv"');
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not export voter list' });
  }
}

async function candidates(req, res) {
  try {
    const rows = await allAsync('SELECT id, name, post, photo FROM candidates ORDER BY post, name');
    res.json({ candidates: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not load candidate list' });
  }
}

module.exports = {
  login,
  importStudents,
  createElection,
  addCandidate,
  startElection,
  endElection,
  resetElection,
  clearAllData,
  stats,
  results,
  students,
  exportVoters,
  candidates,
};
