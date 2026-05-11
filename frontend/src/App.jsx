import { Routes, Route, NavLink } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import VotePage from './pages/VotePage';
import AdminPage from './pages/AdminPage';

function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-group">
          <img className="app-logo" src="/logo.jpg" alt="School logo" />
          <div>
            <h1>UMSSN E-Voting</h1>
            <p className="app-subtitle">Secure free and fair voting for everyone.</p>
          </div>
        </div>
        <nav>
          <NavLink to="/" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Vote
          </NavLink>
          <NavLink to="/admin" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Admin
          </NavLink>
        </nav>
      </header>
      <main className="page-content">
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/vote" element={<VotePage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
