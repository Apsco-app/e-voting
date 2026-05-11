const BASE_URL = `${window.location.protocol}//${window.location.hostname}:3000`;

function getToken() {
  return localStorage.getItem('adminToken') || localStorage.getItem('voterToken');
}

function buildHeaders(useAdmin = false) {
  const token = useAdmin ? localStorage.getItem('adminToken') : localStorage.getItem('voterToken');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
}

export async function adminLogin(username, password) {
  return request('/admin/login', {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({ username, password }),
  });
}

export async function importStudents(format, data) {
  return request('/admin/import-students', {
    method: 'POST',
    headers: buildHeaders(true),
    body: JSON.stringify({ format, data }),
  });
}

export async function createElection(post) {
  return request('/admin/create-election', {
    method: 'POST',
    headers: buildHeaders(true),
    body: JSON.stringify({ post }),
  });
}

export async function addCandidate(candidate) {
  return request('/admin/add-candidate', {
    method: 'POST',
    headers: buildHeaders(true),
    body: JSON.stringify(candidate),
  });
}

export async function getStats() {
  return request('/admin/stats', { headers: buildHeaders(true) });
}

export async function getResults() {
  return request('/admin/results', { headers: buildHeaders(true) });
}

export async function getStudents() {
  return request('/admin/students', { headers: buildHeaders(true) });
}

export async function exportVoterList() {
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${BASE_URL}/admin/export-voters`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || 'Could not export voter list');
  }
  return response.blob();
}

export async function getCandidates() {
  return request('/admin/candidates', { headers: buildHeaders(true) });
}

export async function startElection() {
  return request('/admin/start-election', { method: 'POST', headers: buildHeaders(true) });
}

export async function endElection() {
  return request('/admin/end-election', { method: 'POST', headers: buildHeaders(true) });
}

export async function resetElection() {
  return request('/admin/reset-election', { method: 'POST', headers: buildHeaders(true) });
}

export async function clearAllData() {
  return request('/admin/clear-all-data', { method: 'POST', headers: buildHeaders(true) });
}

export async function voterLogin(voter_id) {
  return request('/auth/login', {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({ voter_id }),
  });
}

export async function fetchBallot() {
  return request('/ballot', { headers: buildHeaders() });
}

export async function submitVote(votes) {
  return request('/vote', {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({ votes }),
  });
}

export function saveAdminToken(token) {
  localStorage.setItem('adminToken', token);
}

export function saveVoterToken(token) {
  localStorage.setItem('voterToken', token);
}

export function clearTokens() {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('voterToken');
}
