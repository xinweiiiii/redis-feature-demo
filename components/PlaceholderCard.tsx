interface PlaceholderCardProps {
  title: string;
  description: string;
  comingSoon?: boolean;
}

export default function PlaceholderCard({ title, description, comingSoon }: PlaceholderCardProps) {
  return (
    <div className="card placeholder-card placeholder-card-compact">
      {comingSoon && (
        <div className="coming-soon-badge">Coming Soon</div>
      )}
      <div className="placeholder-icon-compact">
        <svg
          width="60"
          height="60"
          viewBox="0 0 60 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="8" y="8" width="44" height="44" rx="6" stroke="#ccc" strokeWidth="2" fill="none" />
          <path d="M20 30H40M30 20V40" stroke="#ccc" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <h2>{title}</h2>
      <p className="card-description">{description}</p>
      <button className="demo-button" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
        Coming Soon
      </button>
    </div>
  );
}
