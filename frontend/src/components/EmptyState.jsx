import React from 'react';

// Inline SVG illustration for "no data yet"
function NoRequestsIllustration() {
  return (
    <svg width="120" height="96" viewBox="0 0 120 96" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="20" width="100" height="60" rx="8" fill="#f0faf4" stroke="#b8edcc" strokeWidth="1.5"/>
      <rect x="22" y="34" width="48" height="6" rx="3" fill="#86d9a8"/>
      <rect x="22" y="46" width="32" height="4" rx="2" fill="#b8edcc"/>
      <rect x="22" y="56" width="40" height="4" rx="2" fill="#b8edcc"/>
      <circle cx="90" cy="34" r="14" fill="#1a5c38"/>
      <path d="M84 34l4 4 8-8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Stars */}
      <text x="48" y="16" fontSize="14" textAnchor="middle" fill="#3aa867">★</text>
      <text x="62" y="12" fontSize="12" textAnchor="middle" fill="#5cc487">★</text>
      <text x="74" y="16" fontSize="10" textAnchor="middle" fill="#86d9a8">★</text>
    </svg>
  );
}

function NoSetupIllustration() {
  return (
    <svg width="100" height="90" viewBox="0 0 100 90" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="40" r="28" fill="#f0faf4" stroke="#b8edcc" strokeWidth="1.5"/>
      <path d="M38 40l8 8 16-16" stroke="#1a5c38" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M22 75 Q50 60 78 75" stroke="#b8edcc" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export default function EmptyState({ variant = 'noRequests', onAction, actionLabel }) {
  const content = {
    noRequests: {
      Illustration: NoRequestsIllustration,
      title: 'Noch keine Anfragen',
      text: 'Sobald dein nächster Auftrag abgeschlossen wird, sendet ReviewPulse automatisch eine Review-Anfrage.',
      emoji: '📬',
    },
    noSetup: {
      Illustration: NoSetupIllustration,
      title: 'Fast fertig!',
      text: 'Füge deine Google Review URL hinzu, um automatisch nach jedem Kauf Bewertungen zu erhalten.',
      emoji: '🔧',
    },
  }[variant] || {};

  const { Illustration, title, text } = content;

  return (
    <div className="empty-state animate-fade-in">
      <div className="empty-state-icon">
        {Illustration ? <Illustration /> : <span style={{ fontSize: 40 }}>{content.emoji}</span>}
      </div>
      <div className="empty-state-title">{title}</div>
      <div className="empty-state-text">{text}</div>
      {onAction && (
        <button className="btn btn-primary" onClick={onAction}>
          {actionLabel || 'Los geht\'s'}
        </button>
      )}
    </div>
  );
}
