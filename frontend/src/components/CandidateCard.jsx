import './CandidateCard.css';

function CandidateCard({ candidate, selected, onSelect }) {
  return (
    <button
      type="button"
      className={`candidate-card ${selected ? 'selected' : ''}`}
      onClick={() => onSelect(candidate)}
    >
      <div className="candidate-photo">{candidate.photo ? <img src={candidate.photo} alt={candidate.name} /> : <span>Photo</span>}</div>
      <div className="candidate-details">
        <strong>{candidate.name}</strong>
        <span>{candidate.post}</span>
      </div>
    </button>
  );
}

export default CandidateCard;
