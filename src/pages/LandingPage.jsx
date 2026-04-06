import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const { user } = useAuth();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Outfit:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .lp-root {
          background: var(--bg-color);
          color: var(--text-main);
          font-family: 'Outfit', sans-serif;
          min-height: 100vh;
          overflow-x: hidden;
        }

        /* ── Noise grain overlay ── */
        .lp-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 0;
          opacity: 0.5;
        }

        /* ── Hero ── */
        .hero-section {
          position: relative;
          z-index: 1;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 6rem 2rem 4rem;
          max-width: 1100px;
          margin: 0 auto;
        }

        /* Glowing blob */
        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          pointer-events: none;
          z-index: 0;
        }
        .blob-1 {
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(89,163,16,0.12), transparent 70%);
          top: -100px; left: -150px;
        }
        .blob-2 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(89,163,16,0.12), transparent 70%);
          bottom: 0; right: -100px;
        }

        .hero-eyebrow {
          font-family: 'DM Mono', monospace;
          font-size: 0.75rem;
          letter-spacing: 0.18em;
          color: var(--primary);
          text-transform: uppercase;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .hero-eyebrow::before {
          content: '';
          display: inline-block;
          width: 32px; height: 1px;
          background: var(--primary);
        }

        .hero-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(3rem, 8vw, 7rem);
          font-weight: 800;
          line-height: 0.95;
          letter-spacing: -0.03em;
          margin-bottom: 2rem;
          position: relative;
          z-index: 1;
        }
        .hero-title .accent {
          color: var(--primary);
          display: block;
        }
        .hero-title .dim {
          color: var(--text-main);
        }

        .hero-sub {
          font-size: 1.15rem;
          color: var(--text-main);
          max-width: 480px;
          line-height: 1.7;
          margin-bottom: 3rem;
          position: relative;
          z-index: 1;
        }

        .hero-ctas {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          position: relative;
          z-index: 1;
        }

        .btn-primary {
          padding: 0.9rem 2rem;
          background: var(--primary);
          color: var(--text-main);
          border: none;
          border-radius: 10px;
          font-family: 'Outfit', sans-serif;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 0 0 0 rgba(89,163,16,0.4);
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(89,163,16,0.25);
        }

        .btn-ghost {
          padding: 0.9rem 2rem;
          background: var(--secondary);
          color: var(--primary);
          border: 1px solid var(--primary);
          border-radius: 10px;
          font-family: 'Outfit', sans-serif;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          transition: border-color 0.2s, color 0.2s;
        }
        .btn-ghost:hover {
          border-color: var(--primary);
          color: var(--primary);
          background: var(--text-main);
        }

        /* ── Ticker strip ── */
        .ticker-strip {
          position: relative;
          z-index: 1;
          border-top: 1px solid var(--primary);
          border-bottom: 1px solid var(--primary);
          overflow: hidden;
          padding: 1rem 0;
          background: var(--text-main);
        }
        .ticker-track {
          display: flex;
          gap: 3rem;
          animation: ticker 20s linear infinite;
          white-space: nowrap;
        }
        .ticker-item {
          font-family: 'DM Mono', monospace;
          font-size: 0.75rem;
          letter-spacing: 0.1em;
          color: white;
          text-transform: uppercase;
          flex-shrink: 0;
        }
        .ticker-item span { color: var(--primary); margin-right: 1rem; }
        @keyframes ticker {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        /* ── How it works ── */
        .section {
          position: relative;
          z-index: 1;
          max-width: 1100px;
          margin: 0 auto;
          padding: 6rem 2rem;
        }

        .section-label {
          font-family: 'DM Mono', monospace;
          font-size: 0.72rem;
          letter-spacing: 0.16em;
          color: var(--text-muted);
          text-transform: uppercase;
          margin-bottom: 1rem;
        }

        .section-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(2rem, 5vw, 3.5rem);
          font-weight: 800;
          line-height: 1.05;
          letter-spacing: -0.02em;
          margin-bottom: 3.5rem;
        }

        .steps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.5px;
          background: var(--text-main);
          border: 1px solid var(--primary);
          border-radius: 16px;
          overflow: hidden;
        }

        .step-card {
          background: var(--bg-alt);
          padding: 2.5rem 2rem;
          transition: background 0.25s;
        }
        .step-card:hover { background: var(--primary); }

        .step-number {
          font-family: 'DM Mono', monospace;
          font-size: 0.7rem;
          color: var(--primary);
          letter-spacing: 0.1em;
          margin-bottom: 1.25rem;
        }

        .step-icon {
          font-size: 2rem;
          margin-bottom: 1rem;
          display: block;
        }

        .step-title {
          font-family: 'Syne', sans-serif;
          font-size: 1.15rem;
          font-weight: 700;
          margin-bottom: 0.6rem;
          color: var(--text-main);
        }

        .step-desc {
          font-size: 0.88rem;
          color: var(--text-main);
          line-height: 1.65;
        }

        /* ── Stats row ── */
        .stats-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1px;
          background: var(--text-main);
          border: 1px solid var(--primary);
          border-radius: 16px;
          overflow: hidden;
          margin-top: 5rem;
        }

        .stat-block {
          background: var(--primary);
          padding: 2.5rem 2rem;
          text-align: center;
        }

        .stat-num {
          font-family: 'Syne', sans-serif;
          font-size: 3rem;
          font-weight: 800;
          color: var(--text-main);
          line-height: 1;
          margin-bottom: 0.5rem;
        }

        .stat-desc {
          font-size: 0.82rem;
          color: var(--text-main);
          letter-spacing: 0.04em;
        }

        /* ── Divider ── */
        .divider {
          height: 1px;
          background: var(--primary);
          margin: 0 2rem;
          position: relative;
          z-index: 1;
        }

        /* ── How earning works ── */
        .earn-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          align-items: center;
        }

        @media (max-width: 700px) {
          .earn-grid { grid-template-columns: 1fr; }
          .hero { padding: 2rem 1.5rem 1.5rem; }
          .hero-blob { display: none; }
          .hero h1 { font-size: clamp(2rem, 6vw, 3rem); }
          .hero-sub { font-size: 1rem; margin-bottom: 2rem; }
          .hero-ctas { flex-wrap: wrap; justify-content: center; }
          .btn-primary, .btn-ghost { padding: 0.75rem 1.5rem; font-size: 0.85rem; }
          .section { padding: 3rem 1.5rem; }
          .section-title { font-size: clamp(1.5rem, 5vw, 2.5rem); margin-bottom: 2rem; }
          .steps-grid { grid-template-columns: 1fr; }
          .step-card { padding: 1.75rem 1.5rem; }
          .step-icon { font-size: 1.5rem; }
          .step-title { font-size: 1rem; }
          .stats-row { grid-template-columns: 1fr; }
          .stat-num { font-size: 2rem; }
          .stat-block { padding: 1.75rem 1.5rem; }
          .ticker-track { gap: 1.5rem; }
          .ticker-item { font-size: 0.65rem; }
          .earn-left { padding-right: 0; margin-bottom: 1.5rem; }
        }
        
        /* Tablet: 640px - 1023px */
        @media (min-width: 640px) and (max-width: 1023px) {
          .hero { padding: 3rem 2rem 2rem; }
          .hero-blob { width: 250px; height: 250px; }
          .hero h1 { font-size: clamp(2.5rem, 6vw, 3.5rem); }
          .section { padding: 4rem 2rem; }
          .section-title { font-size: clamp(2rem, 5vw, 3rem); margin-bottom: 2.5rem; }
          .steps-grid { grid-template-columns: repeat(2, 1fr); }
          .step-card { padding: 2rem; }
          .stats-row { grid-template-columns: repeat(2, 1fr); }
        }
        
        /* Small phones: < 360px */
        @media (max-width: 359px) {
          .hero h1 { font-size: 1.75rem; }
          .hero-sub { font-size: 0.9rem; margin-bottom: 1.5rem; }
          .btn-primary, .btn-ghost { padding: 0.65rem 1.25rem; font-size: 0.8rem; }
          .section { padding: 2rem 1rem; }
          .step-card { padding: 1.5rem 1rem; }
        }

        .earn-left {
          padding-right: 2rem;
        }

        .earn-right {
          background: var(--primary);
          border: 1px solid var(--primary);
          border-radius: 16px;
          padding: 2rem;
          font-family: 'DM Mono', monospace;
          font-size: 0.82rem;
        }

        .earn-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.9rem 0;
          border-bottom: 1px solid var(--primary);
          color: var(--text-main);
        }
        .earn-row:last-child { border-bottom: none; }
        .earn-row .val { color: var(--text-main); font-weight: 500; }
        .earn-row .green { color: var(--primary); }
        .earn-row .yellow { color: var(--primary); }

        /* ── CTA section ── */
        .cta-section {
          position: relative;
          z-index: 1;
          margin: 0 2rem 6rem;
          border-radius: 20px;
          background: var(--primary);
          border: 1px solid var(--primary);
          padding: 5rem 3rem;
          text-align: center;
          overflow: hidden;
        }
        .cta-section::before {
          content: '';
          position: absolute;
          top: -80px; left: 50%;
          transform: translateX(-50%);
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(89,163,16,0.16), transparent 70%);
          pointer-events: none;
        }
        .cta-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(1.8rem, 4vw, 3rem);
          font-weight: 800;
          letter-spacing: -0.02em;
          margin-bottom: 1rem;
          position: relative;
          z-index: 1;
        }
        .cta-sub {
          color: var(--text-muted);
          font-size: 1rem;
          margin-bottom: 2.5rem;
          position: relative;
          z-index: 1;
        }
      `}</style>

      <div className="lp-root">

        {/* ── Hero ── */}
        <div className="hero-section">
          <div className="blob blob-1" />
          <div className="blob blob-2" />

          <div className="hero-eyebrow">Past Questions · Ghana</div>

          <h1 className="hero-title">
            <span className="dim">Upload.</span>
            <span className="accent">Earn.</span>
            Succeed.
          </h1>

          <p className="hero-sub">
            Share past questions, help thousands of students prepare, and get paid every time someone buys your document.
          </p>

          <div className="hero-ctas">
            <Link to="/marketplace" className="btn-primary">
              Browse Questions →
            </Link>
            <Link to={user ? '/upload' : '/login'} className="btn-ghost">
              Start Uploading
            </Link>
          </div>
        </div>

        {/* ── Ticker ── */}
        <div className="ticker-strip">
          <div className="ticker-track">
            {Array(2).fill([
              '📄 Past Questions',
              '💰 Earn 95% Per Sale',
              '🎓 All Institutions',
              '📱 Mobile Money Payouts',
              '🔒 Secure Downloads',
              '⚡ Instant Access',
              '📚 Every Course',
              '✅ Admin Verified',
            ]).flat().map((item, i) => (
              <div key={i} className="ticker-item">
                <span>✦</span>{item}
              </div>
            ))}
          </div>
        </div>

        {/* ── How it works ── */}
        <div className="section">
          <div className="section-label">How it works</div>
          <h2 className="section-title">
            Three steps.<br />
            <span style={{ color: 'var(--secondary)' }}>Real money.</span>
          </h2>

          <div className="steps-grid">
            {[
              { n: '01', icon: '📤', title: 'Upload', desc: 'Submit your past question papers. Our admin team reviews and approves each document to keep quality high.' },
              { n: '02', icon: '🛒', title: 'Students Buy', desc: 'Other students find your document via the download section and purchase per-paper or with a monthly subscription.' },
              { n: '03', icon: '💸', title: 'You Earn', desc: 'You pocket 95% of every sale. Request a payout anytime and receive funds directly to your Mobile Money.' },
            ].map(s => (
              <div key={s.n} className="step-card">
                <div className="step-number">STEP {s.n}</div>
                <span className="step-icon">{s.icon}</span>
                <div className="step-title">{s.title}</div>
                <div className="step-desc">{s.desc}</div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="stats-row">
            {[
              { num: '95%', desc: 'You keep per sale' },
              { num: 'GHS 35', desc: 'Monthly subscription' },
              { num: '2hrs', desc: 'Payout processing' },
              { num: '∞', desc: 'Courses & institutions' },
            ].map(s => (
              <div key={s.num} className="stat-block">
                <div className="stat-num">{s.num}</div>
                <div className="stat-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="divider" />

        {/* ── Earning breakdown ── */}
        <div className="section">
          <div className="section-label">Earnings breakdown</div>
          <h2 className="section-title" style={{ marginBottom: '2.5rem' }}>
            See exactly<br />
            <span style={{ color: 'var(--secondary)' }}>what you make.</span>
          </h2>

          <div className="earn-grid">
            <div className="earn-left">
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.8, fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                Set your own price for every document you upload. Every time a student purchases it, 95% goes straight to your wallet.
              </p>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.8, fontSize: '0.95rem' }}>
                Request a payout whenever your balance is ready. Admin approves and sends it to your MoMo number within 2 hours.
              </p>
            </div>

            <div className="earn-right">
              <div className="earn-row">
                <span>Document price</span>
                <span className="val">GHS 10.00</span>
              </div>
              <div className="earn-row">
                <span>Platform fee (5%)</span>
                <span style={{ color: 'black' }}>− GHS 0.50</span>
              </div>
              <div className="earn-row">
                <span>Your earnings</span>
                <span className="green" style={{ color: 'black' }}>GHS 9.50</span>
              </div>
              <div className="earn-row" style={{ marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--primary)' }}>
                <span>10 sales/month</span>
                <span className="yellow">GHS 95.00</span>
              </div>
              <div className="earn-row">
                <span>50 sales/month</span>
                <span className="yellow">GHS 475.00</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Final CTA ── */}
        <div className="cta-section">
          <h2 className="cta-title">
            Your notes are worth money.<br />Start earning today.
          </h2>
          <p className="cta-sub">Join students already earning from their past questions.</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
            <Link to={user ? '/upload' : '/login'} className="btn-primary">
              Upload Your First Document →
            </Link>
            <Link to="/marketplace" className="btn-ghost">
              Download Past Questions
            </Link>
          </div>
        </div>

      </div>
    </>
  );
};

export default LandingPage;
