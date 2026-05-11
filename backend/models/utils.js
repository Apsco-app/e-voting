const crypto = require('crypto');

function hashVoterId(voterId) {
  return crypto.createHash('sha256').update(voterId.trim().toUpperCase()).digest('hex');
}

function generateVoterCode() {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const randomChars = (length) =>
    Array.from({ length }, () => alphabet[crypto.randomInt(0, alphabet.length)]).join('');
  return `${randomChars(3)}-${randomChars(6)}`;
}

function normalizeKey(key) {
  return String(key || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

function normalizeRow(row) {
  const normalized = {};
  Object.entries(row || {}).forEach(([key, value]) => {
    normalized[normalizeKey(key)] = value;
  });
  return normalized;
}

function parseStudentsPayload(payload, format) {
  const normalize = (value) => String(value || '').trim();

  const extract = (row) => {
    const normalized = normalizeRow(row);
    const firstName = normalize(normalized.first_name || normalized.firstname || normalized.first || '');
    const lastName = normalize(normalized.last_name || normalized.lastname || normalized.last || normalized.surname || '');
    const fullName = normalize(
      normalized.full_name ||
      normalized.fullname ||
      normalized.name ||
      normalized.student_name ||
      normalized.studentname ||
      normalized.student ||
      `${firstName} ${lastName}`.trim()
    );

    return {
      full_name: fullName,
      last_name: lastName,
      class_name: ''
    };
  };

  if (format === 'json') {
    if (!Array.isArray(payload)) {
      throw new Error('Expected JSON array of students.');
    }
    return payload.map(extract);
  }

  const text = String(payload || '');
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return [];
  }

  const headers = lines[0].split(',').map((header) => normalizeKey(header));
  return lines.slice(1).map((line) => {
    const columns = line.split(',').map((value) => value.trim());
    const row = {};
    headers.forEach((header, index) => {
      row[header] = columns[index] || '';
    });
    return extract(row);
  });
}

module.exports = {
  hashVoterId,
  generateVoterCode,
  parseStudentsPayload,
};
