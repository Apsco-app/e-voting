const { allAsync, getDb, getAsync } = require('../database');

async function isElectionActive() {
  const election = await getAsync('SELECT is_active FROM election ORDER BY created_at DESC LIMIT 1');
  return Boolean(election && election.is_active);
}

async function getBallot(req, res) {
  try {
    const active = await isElectionActive();
    if (!active) {
      return res.status(403).json({ message: 'No active election at this time' });
    }

    const posts = await allAsync('SELECT name FROM posts WHERE is_active = 1 ORDER BY created_at');
    const candidates = await allAsync('SELECT id, name, post FROM candidates ORDER BY post, name');
    const uniqueCandidates = [];
    const seenCandidateKeys = new Set();
    for (const candidate of candidates) {
      const key = `${candidate.post.trim().toLowerCase()}|${candidate.name.trim().toLowerCase()}`;
      if (!seenCandidateKeys.has(key)) {
        seenCandidateKeys.add(key);
        uniqueCandidates.push(candidate);
      }
    }
    const ballot = posts.map((postRow) => ({
      post: postRow.name,
      candidates: uniqueCandidates.filter((candidate) => candidate.post === postRow.name),
    }));
    res.json({ ballot });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not load ballot' });
  }
}

async function submitVote(req, res) {
  const { votes } = req.body;
  const studentId = req.voter.id;

  if (!Array.isArray(votes) || votes.length === 0) {
    return res.status(400).json({ message: 'Votes payload is required' });
  }

  try {
    const active = await isElectionActive();
    if (!active) {
      return res.status(403).json({ message: 'No active election at this time' });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Election status check failed' });
  }

  const db = getDb();
  db.serialize(() => {
    db.run('BEGIN TRANSACTION', (beginErr) => {
      if (beginErr) {
        console.error(beginErr);
        return res.status(500).json({ message: 'Could not start transaction' });
      }

      db.get('SELECT has_voted FROM students WHERE id = ?', [studentId], (err, student) => {
        if (err || !student) {
          db.run('ROLLBACK');
          return res.status(500).json({ message: 'Student lookup failed' });
        }

        if (student.has_voted) {
          db.run('ROLLBACK');
          return res.status(403).json({ message: 'Student already voted' });
        }

        const insertVote = db.prepare('INSERT INTO votes (student_id, post, candidate_id) VALUES (?, ?, ?)');
        let completed = 0;
        let failed = false;

        const finalizeIfComplete = () => {
          if (completed !== votes.length) {
            return;
          }
          insertVote.finalize((finalizeErr) => {
            if (failed || finalizeErr) {
              db.run('ROLLBACK');
              return res.status(500).json({ message: 'Could not record votes' });
            }

            db.run('UPDATE students SET has_voted = 1 WHERE id = ?', [studentId], function (updateErr) {
              if (updateErr || this.changes !== 1) {
                db.run('ROLLBACK');
                return res.status(500).json({ message: 'Could not finalize voting' });
              }

              db.run('COMMIT', (commitErr) => {
                if (commitErr) {
                  console.error(commitErr);
                  return res.status(500).json({ message: 'Could not commit ballot' });
                }
                res.json({ message: 'Vote successfully cast' });
              });
            });
          });
        };

        votes.forEach((vote) => {
          if (failed || !vote.post || !vote.candidate_id) {
            failed = true;
            completed += 1;
            finalizeIfComplete();
            return;
          }

          insertVote.run([studentId, vote.post, vote.candidate_id], (voteErr) => {
            if (voteErr) {
              failed = true;
            }
            completed += 1;
            finalizeIfComplete();
          });
        });
      });
    });
  });
}

module.exports = {
  getBallot,
  submitVote,
};
