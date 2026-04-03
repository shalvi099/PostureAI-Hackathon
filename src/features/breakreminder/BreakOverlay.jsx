import "./BreakOverlay.css";

const STRETCHES = [
  { emoji: "🙆", name: "Neck Rolls", desc: "Slowly roll your head in circles, 5 times each direction" },
  { emoji: "💪", name: "Shoulder Shrugs", desc: "Raise shoulders to ears, hold 3s, release. Repeat 5x" },
  { emoji: "🧘", name: "Seated Twist", desc: "Twist torso left, hold 10s, then right. Repeat 3x" },
  { emoji: "👐", name: "Wrist Circles", desc: "Extend arms, rotate wrists 10x each direction" },
  { emoji: "🦵", name: "Standing Stretch", desc: "Stand up, reach for the ceiling, hold 10 seconds" },
  { emoji: "👁️", name: "Eye Break", desc: "Look at something 20ft away for 20 seconds (20-20-20 rule)" },
];

export default function BreakOverlay({ onSnooze, onDismiss }) {
  // Pick 2 random stretches
  const picks = [];
  const indices = new Set();
  while (indices.size < 2) {
    indices.add(Math.floor(Math.random() * STRETCHES.length));
  }
  [...indices].forEach((i) => picks.push(STRETCHES[i]));

  return (
    <div className="break-overlay">
      <div className="break-modal">
        <div className="break-icon">⏰</div>
        <h2 className="break-title">Time for a Break!</h2>
        <p className="break-sub">
          You've been sitting for a while. Try these stretches:
        </p>

        <div className="break-stretches">
          {picks.map((s, i) => (
            <div key={i} className="break-stretch-card">
              <span className="break-stretch-emoji">{s.emoji}</span>
              <div>
                <div className="break-stretch-name">{s.name}</div>
                <div className="break-stretch-desc">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="break-actions">
          <button className="break-btn-snooze" onClick={() => onSnooze(5)}>
            💤 Snooze 5 min
          </button>
          <button className="break-btn-done" onClick={onDismiss}>
            ✅ I Stretched!
          </button>
        </div>
      </div>
    </div>
  );
}
