import { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { adminLogin, createElection, addCandidate, importStudents, getStats, getResults, getStudents, getCandidates, endElection, startElection, resetElection, exportVoterList, saveAdminToken, clearTokens, clearAllData } from '../services/api';

function AdminPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [stats, setStats] = useState(null);
  const [results, setResults] = useState([]);
  const [students, setStudents] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [postFilter, setPostFilter] = useState('All');
  const [importFile, setImportFile] = useState(null);
  const [importFileName, setImportFileName] = useState('');
  const [newPost, setNewPost] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [candidatePost, setCandidatePost] = useState('');

  useEffect(() => {
    if (!token) return;
    refreshAdminData().catch((err) => {
      if (err.message.toLowerCase().includes('token')) {
        clearTokens();
        setToken('');
        setError('Admin session expired, please sign in again.');
      }
    });
  }, [token]);

  async function refreshAdminData() {
    try {
      const [statsRes, resultsRes, studentsRes, candidatesRes] = await Promise.all([
        getStats(),
        getResults(),
        getStudents(),
        getCandidates(),
      ]);
      setStats(statsRes);
      setResults(resultsRes.results || []);
      setStudents(studentsRes.students || []);
      setCandidates(candidatesRes.candidates || []);
    } catch (err) {
      setError(err.message);
    }
  }

  const postOptions = useMemo(() => {
    const posts = Array.from(new Set(candidates.map((item) => item.post))).sort();
    return ['All', ...posts];
  }, [candidates]);

  const filteredCandidates = useMemo(() => {
    if (postFilter === 'All') {
      return candidates;
    }
    return candidates.filter((candidate) => candidate.post === postFilter);
  }, [candidates, postFilter]);

  const groupedCandidates = useMemo(() => {
    return filteredCandidates.reduce((acc, candidate) => {
      const group = acc[candidate.post] || [];
      return { ...acc, [candidate.post]: [...group, candidate] };
    }, {});
  }, [filteredCandidates]);

  async function handleLogin(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    const trimmedUsername = String(username || '').trim();
    const trimmedPassword = String(password || '').trim();
    if (!trimmedUsername || !trimmedPassword) {
      setError('Username and password are required');
      return;
    }

    try {
      const data = await adminLogin(trimmedUsername, trimmedPassword);
      saveAdminToken(data.token);
      setToken(data.token);
      setMessage('Admin login successful');
    } catch (err) {
      setError(err.message);
    }
  }

  async function parseImportFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'xlsx' || ext === 'xls') {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      return XLSX.utils.sheet_to_json(sheet, { defval: '' });
    }
    return await file.text();
  }

  async function handleImport(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    if (!importFile) {
      setError('Please select a CSV or XLSX file');
      return;
    }
    try {
      const ext = importFile.name.split('.').pop().toLowerCase();
      let result;
      if (ext === 'xlsx' || ext === 'xls') {
        const data = await parseImportFile(importFile);
        result = await importStudents('json', data);
      } else {
        const text = await parseImportFile(importFile);
        result = await importStudents('csv', text);
      }
      if (!result.imported) {
        setError('No students were imported. Please check the file headers and try again.');
        return;
      }
      setMessage(`Imported ${result.imported} students`);
      setImportFile(null);
      setImportFileName('');
      refreshAdminData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreatePost(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      await createElection(newPost.trim());
      setMessage('Election post created');
      setNewPost('');
      refreshAdminData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAddCandidate(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      await addCandidate({ name: candidateName.trim(), post: candidatePost.trim() });
      setMessage('Candidate added');
      setCandidateName('');
      setCandidatePost('');
      refreshAdminData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleStartElection() {
    setError('');
    setMessage('');
    try {
      await startElection();
      setMessage('Election started');
      refreshAdminData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleEndElection() {
    setError('');
    setMessage('');
    try {
      await endElection();
      setMessage('Election ended');
      refreshAdminData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleResetElection() {
    setError('');
    setMessage('');
    try {
      await resetElection();
      setMessage('Election reset successfully');
      refreshAdminData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleClearAllData() {
    const confirmed = window.confirm('This will delete ALL students, candidates, votes, and results. This action cannot be undone. Continue?');
    if (!confirmed) return;
    setError('');
    setMessage('');
    try {
      await clearAllData();
      setMessage('All data cleared successfully');
      refreshAdminData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleExport() {
    setError('');
    setMessage('');
    try {
      const blob = await exportVoterList();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'voter-list.csv';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setMessage('Voter list exported successfully');
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleExportResults() {
    setError('');
    setMessage('');
    try {
      const csvContent = 'Post,Candidate,Votes\n' + results.map(r => `${r.post},${r.name},${r.votes}`).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'election-results.csv';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setMessage('Results exported successfully');
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleExportStudents() {
    setError('');
    setMessage('');
    try {
      const csvContent = 'Name,Voter ID,Voted\n' + students.map(s => `${s.full_name},${s.voter_id},${s.has_voted ? 'Yes' : 'No'}`).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'students.csv';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setMessage('Students exported successfully');
    } catch (err) {
      setError(err.message);
    }
  }

  function handleLogout() {
    clearTokens();
    setToken('');
    setStats(null);
    setResults([]);
    setStudents([]);
    setCandidates([]);
  }

  if (!token) {
    return (
      <div className="card" style={{ maxWidth: 520 }}>
        <h2>Admin Login</h2>
        <form onSubmit={handleLogin}>
          <label>
            Username
            <input value={username} onChange={(e) => setUsername(e.target.value)} />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          <button type="submit">Sign In</button>
        </form>
        {error && <div className="message error">{error}</div>}
      </div>
    );
  }

  return (
    <div className="admin-grid">
      <div className="card admin-panel">
        <div className="panel-header">
          <h2>Admin Dashboard</h2>
          <button type="button" className="secondary" onClick={handleLogout}>Logout</button>
        </div>
        {message && <div className="message success">{message}</div>}
        {error && <div className="message error">{error}</div>}
        <div className="stats-row">
          <div>Status: <strong>{stats?.election_active ? 'Active' : 'Ended'}</strong></div>
          <div>Total Students: {stats?.total_students ?? '—'}</div>
          <div>Total Votes: {stats?.total_votes ?? '—'}</div>
          <div>Total Posts: {stats?.total_posts ?? '—'}</div>
        </div>
        <div className="action-row">
          <button type="button" onClick={handleStartElection}>Start Election</button>
          <button type="button" className="secondary" onClick={handleEndElection}>End Election</button>
          <button type="button" className="danger" onClick={handleResetElection}>Reset Election</button>
          <button type="button" className="danger" onClick={handleClearAllData}>Clear All Data</button>
        </div>
        <h3>Students</h3>
        {students.length === 0 ? (
          <div className="student-import-block">
            <p>Import students here to populate the voter list.</p>
            <form onSubmit={handleImport} className="import-form">
              <label className="file-label">
                <span>{importFileName || 'Upload CSV/XLSX'}</span>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    setImportFile(file || null);
                    setImportFileName(file ? file.name : '');
                  }}
                />
              </label>
              {importFileName && <div className="small-note">Selected file: {importFileName}</div>}
              <button type="submit" disabled={!importFile}>Import</button>
            </form>
          </div>
        ) : (
          <>
            <div className="student-import-actions">
              <form onSubmit={handleImport} className="import-form">
                <label className="file-label">
                  <span>{importFileName || 'Upload CSV/XLSX'}</span>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      setImportFile(file || null);
                      setImportFileName(file ? file.name : '');
                    }}
                  />
                </label>
                <button type="submit" disabled={!importFile}>Import</button>
              </form>
              {importFileName && <div className="small-note">Selected file: {importFileName}</div>}
            </div>
            <div className="student-import-actions">
              <button type="button" className="secondary" onClick={handleExportStudents}>Export Students (CSV)</button>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Voter ID</th>
                    <th>Voted</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id}>
                      <td>{student.full_name}</td>
                      <td>{student.voter_id || '-'}</td>
                      <td>{student.has_voted ? 'Yes' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        <form onSubmit={handleCreatePost}>
          <h3>Create Election Post</h3>
          <label>
            Post name
            <input value={newPost} onChange={(e) => setNewPost(e.target.value)} />
          </label>
          <button type="submit">Create Post</button>
        </form>
        <form onSubmit={handleAddCandidate}>
          <h3>Add Candidate</h3>
          <label>
            Candidate name
            <input value={candidateName} onChange={(e) => setCandidateName(e.target.value)} />
          </label>
          <label>
            Post
            <input value={candidatePost} onChange={(e) => setCandidatePost(e.target.value)} />
          </label>
          <button type="submit">Add Candidate</button>
        </form>
      </div>
      <div className="card admin-panel">
        <h3>Results</h3>
        <button type="button" className="secondary" onClick={handleExportResults}>Export Results (CSV)</button>
        <table>
          <thead>
            <tr>
              <th>Post</th>
              <th>Candidate</th>
              <th>Votes</th>
            </tr>
          </thead>
          <tbody>
            {results.map((item) => (
              <tr key={item.id}>
                <td>{item.post}</td>
                <td>{item.name}</td>
                <td>{item.votes}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <h3>Candidates</h3>
        <div className="form-row">
          <label>
            Filter by post
            <select value={postFilter} onChange={(e) => setPostFilter(e.target.value)}>
              {postOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="candidate-group-list">
          {Object.keys(groupedCandidates).length === 0 && <p>No candidates available.</p>}
          {Object.entries(groupedCandidates).map(([post, group]) => (
            <div key={post} className="candidate-group">
              <div className="candidate-group-title">{post}</div>
              <div className="candidate-group-items">
                {group.map((candidate) => (
                  <div key={candidate.id} className="candidate-group-item">
                    <div>{candidate.name}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminPage;
