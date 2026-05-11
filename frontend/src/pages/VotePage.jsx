import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchBallot, submitVote } from '../services/api';

function VotePage() {
  const [ballot, setBallot] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState({});
  const [stage, setStage] = useState('loading');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBallot()
      .then((data) => {
        setBallot(data.ballot || []);
        setStage('ready');
      })
      .catch((err) => {
        setStage('error');
        setError(err.message);
      });
  }, []);

  const currentPost = ballot[currentIndex];
  const candidatesForCurrent = useMemo(() => {
    if (!currentPost) return [];
    const normalized = search.toLowerCase().trim();
    const rawCandidates = normalized
      ? currentPost.candidates.filter((candidate) => candidate.name.toLowerCase().includes(normalized))
      : currentPost.candidates;
    const seen = new Set();
    return rawCandidates.filter((candidate) => {
      const key = `${candidate.post.trim().toLowerCase()}|${candidate.name.trim().toLowerCase()}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }, [currentPost, search]);

  const pageCount = Math.ceil(candidatesForCurrent.length / 12) || 1;
  const currentPageCandidates = candidatesForCurrent.slice((page - 1) * 12, page * 12);
  const selectedCandidateId = currentPost ? selected[currentPost.post] : null;

  function selectCandidate(candidate) {
    setSelected((prev) => ({ ...prev, [currentPost.post]: candidate.id }));
    setError('');
  }

  function handleNext() {
    if (!selectedCandidateId) {
      setError('Please select a candidate before continuing.');
      return;
    }
    setError('');
    setPage(1);
    setSearch('');
    if (currentIndex < ballot.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setStage('review');
    }
  }

  function handlePrevious() {
    setError('');
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setPage(1);
      setSearch('');
    }
  }

  function handleReview() {
    if (!selectedCandidateId) {
      setError('Please select a candidate before continuing.');
      return;
    }
    setError('');
    setStage('review');
  }

  function handleBackToVoting() {
    setStage('ready');
  }

  async function handleSubmit() {
    const missing = ballot.some((item) => !selected[item.post]);
    if (missing) {
      setError('Please complete every post before submitting.');
      return;
    }

    setError('');
    try {
      const votes = ballot.map((item) => ({ post: item.post, candidate_id: selected[item.post] }));
      await submitVote(votes);
      setSuccess('Your vote has been securely recorded.');
      setStage('completed');
    } catch (err) {
      setError(err.message);
    }
  }

  const reviewItems = ballot.map((item) => {
    const candidate = item.candidates.find((candidate) => candidate.id === selected[item.post]);
    return { post: item.post, candidateName: candidate?.name || 'Not selected' };
  });

  if (stage === 'loading') {
    return <div className="page-card">Loading ballot…</div>;
  }

  if (stage === 'error') {
    return (
      <div className="page-card">
        <p>Could not load ballot.</p>
        <div className="message error">{error}</div>
      </div>
    );
  }

  if (stage === 'completed') {
    return (
      <div className="page-card centered-card">
        <div className="success-block">
          <h2>Vote recorded</h2>
          <p>Your vote has been securely recorded.</p>
          <button type="button" onClick={() => navigate('/')}>Back to home</button>
        </div>
      </div>
    );
  }

  if (!currentPost || ballot.length === 0) {
    return (
      <div className="page-card">
        <p>No active election found. Contact the administrator.</p>
      </div>
    );
  }

  if (stage === 'review') {
    return (
      <div className="page-card" style={{ maxWidth: 760 }}>
        <div className="vote-header banner-card">
          <div>
            <div className="school-logo"><img src="/logo.jpg" alt="School logo" /></div>
            <div>
              <div className="school-name">UMSSN Election</div>
              <div className="school-subtitle">Review your choices before submit</div>
            </div>
          </div>
        </div>
        <div className="progress-line">Review selections</div>
        <div className="review-grid">
          {reviewItems.map((item) => (
            <div key={item.post} className="review-card">
              <div className="review-post">{item.post}</div>
              <div className="review-name">{item.candidateName}</div>
            </div>
          ))}
        </div>
        {error && <div className="message error">{error}</div>}
        <div className="form-row">
          <button type="button" className="secondary" onClick={handleBackToVoting}>Back to voting</button>
          <button type="button" onClick={handleSubmit}>Confirm and Submit Vote</button>
        </div>
      </div>
    );
  }

  const canContinue = Boolean(selectedCandidateId);
  return (
    <div className="page-card" style={{ maxWidth: 760 }}>
      <div className="vote-header banner-card">
        <div>
          
          <div>
            <div className="school-name">Uganda Martyrs SS Namugongo Election</div>
            <div className="school-subtitle">Vote smart. Vote fairly</div>
          </div>
        </div>
      </div>
      <div className="progress-line">
        <div className="progress-stepper">
          {ballot.map((_, index) => (
            <span key={index} className={`step ${index === currentIndex ? 'active' : index < currentIndex ? 'completed' : ''}`}></span>
          ))}
        </div>
      </div>
      <div className="vote-summary">
        <div className="post-title">{currentPost.post}</div>
        <p>Select one candidate for this post.</p>
      </div>
      {currentPost.candidates.length > 12 && (
        <div className="search-row">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search candidates"
          />
        </div>
      )}
      <div className="candidate-grid">
        {currentPageCandidates.map((candidate) => {
          const selectedThis = selectedCandidateId === candidate.id;
          return (
            <button
              type="button"
              key={candidate.id}
              className={`candidate-card ${selectedThis ? 'selected' : ''}`}
              onClick={() => selectCandidate(candidate)}
            >
              <div className="candidate-name">
                <span>{candidate.name}</span>
                {selectedThis && <span className="checkmark">✓</span>}
              </div>
            </button>
          );
        })}
      </div>
      {pageCount > 1 && (
        <div className="pagination-row">
          <button type="button" className="secondary" disabled={page === 1} onClick={() => setPage((prev) => Math.max(prev - 1, 1))}>
            Previous
          </button>
          <span>
            Page {page} of {pageCount}
          </span>
          <button type="button" className="secondary" disabled={page === pageCount} onClick={() => setPage((prev) => Math.min(prev + 1, pageCount))}>
            Next
          </button>
        </div>
      )}
      {error && <div className="message error">{error}</div>}
      <div className="form-row">
        <button type="button" className="secondary" onClick={handlePrevious} disabled={currentIndex === 0}>
          Back
        </button>
        <button type="button" onClick={currentIndex === ballot.length - 1 ? handleReview : handleNext} disabled={!canContinue}>
          {currentIndex === ballot.length - 1 ? 'Review' : 'Next'}
        </button>
      </div>
    </div>
  );
}

export default VotePage;
