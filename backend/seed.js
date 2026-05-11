const { initDatabase, runAsync, getAsync } = require('./database');
const { generateVoterCode, hashVoterId } = require('./models/utils');

const sampleData = {
  posts: [
    {
      name: 'President',
      candidates: ['Alice Kyomuhendo', 'Brook Namusoke', 'Charles Semuju'],
    },
    {
      name: 'Vice President',
      candidates: ['Diana Kintu', 'Emmanuel Ssekandi', 'Faith Namirembe'],
    },
    {
      name: 'Secretary',
      candidates: ['Grace Atuhaire', 'Hassan Mulindwa', 'Irene Mukama'],
    },
  ],
  students: [
    'Catherine Auma',
    'Daniel Walusimbi',
    'Esther Nanyonga',
    'Fredrick Ssekajja',
    'Gloria Achieng',
    'Henry Lutaaya',
    'Isaac Kato',
    'Jane Mugisha',
    'Kevin Nsubuga',
    'Linda Nakabira',
  ],
};

async function seed() {
  initDatabase();

  const studentCount = await getAsync('SELECT COUNT(*) AS count FROM students');
  const postCount = await getAsync('SELECT COUNT(*) AS count FROM posts');

  if (postCount.count === 0) {
    for (const post of sampleData.posts) {
      await runAsync('INSERT INTO posts (name, is_active) VALUES (?, 1)', [post.name]);
      for (const candidate of post.candidates) {
        await runAsync('INSERT INTO candidates (name, post) VALUES (?, ?)', [candidate, post.name]);
      }
    }
  }

  if (studentCount.count === 0) {
    for (const fullName of sampleData.students) {
      const lastName = fullName.split(' ').slice(-1).join(' ');
      let voterId = generateVoterCode();
      let hash = hashVoterId(voterId);
      let tries = 0;

      while (tries < 10) {
        try {
          await runAsync(
            'INSERT INTO students (full_name, last_name, voter_id, voter_id_hash) VALUES (?, ?, ?, ?)',
            [fullName, lastName, voterId, hash]
          );
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
  }

  await runAsync('UPDATE election SET is_active = 0');
  await runAsync('INSERT INTO election (is_active) VALUES (1)');

  console.log('Seed complete.');
}

seed().catch((err) => {
  console.error('Seed error', err);
  process.exit(1);
});
