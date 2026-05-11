import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { voterLogin, saveVoterToken } from '../services/api';

function LoginPage() {
  const [voterId, setVoterId] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.removeItem('adminToken');
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    const trimmedVoterId = String(voterId || '').trim();
    if (!trimmedVoterId) {
      setError('Voter ID is required');
      return;
    }

    try {
      const data = await voterLogin(trimmedVoterId);
      saveVoterToken(data.token);
      navigate('/vote');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="login-shell">
      <section className="login-branding">
        <div className="brand-block">
          <img src="/logo.jpg" alt="School logo" className="login-logo" />
          <div>
            <h2>UMSSN E-Voting</h2>
            <p>Fast, secure voting for students and teachers. Use your voter ID and full name to begin.</p>
          </div>
        </div>
      </section>
      <section className="login-card">
        <div className="login-card-inner">
          <h2>Student Login</h2>
          <p className="login-instruction">Enter your registered voter ID to access the ballot.</p>
          <form onSubmit={handleSubmit}>
            <label>
              Voter ID
              <input value={voterId} onChange={(e) => setVoterId(e.target.value)} placeholder="Enter your voter ID here" />
            </label>
            <button type="submit" className="primary-button">Continue</button>
          </form>
          {error && <div className="message error">{error}</div>}
          {message && <div className="message success">{message}</div>}
        </div>
      </section>
      <footer className='footer'>&copy; Nkono Jeremie 2026</footer>
    </div>
  );
}

export default LoginPage;
