import { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import MoMoModal from '../components/MoMoModal';

// ─── Constants ────────────────────────────────────────────────────────────────
const TABS = ['Overview', 'My Uploads', 'Withdraw'];

// ─── Micro components ─────────────────────────────────────────────────────────
const StatusPill = ({ status }) => {
  const map = {
    pending:  { bg: '#2D2A1A', color: '#FBBF24', label: 'Pending' },
    approved: { bg: '#0F2A1A', color: '#34D399', label: 'Approved' },
    rejected: { bg: '#2A0F0F', color: '#F87171', label: 'Rejected' },
    active:   { bg: '#0F1A2A', color: '#60A5FA', label: 'Active' },
    expired:  { bg: '#1A1A1A', color: '#9CA3AF', label: 'Expired' },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{
      padding: '3px 10px', borderRadius: '999px', fontSize: '0.72rem',
      fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
      background: s.bg, color: s.color, border: `1px solid ${s.color}33`
    }}>{s.label}</span>
  );
};

const GlassCard = ({ children, style = {} }) => (
  <div style={{
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: '16px',
    padding: '1.75rem',
    backdropFilter: 'blur(10px)',
    ...style
  }}>
    {children}
  </div>
);

const Label = ({ children }) => (
  <div style={{
    fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em',
    textTransform: 'uppercase', color: '#6B7280', marginBottom: '0.4rem'
  }}>{children}</div>
);

const BigNumber = ({ value, prefix = '', color = '#F9FAFB' }) => (
  <div style={{ fontSize: '2.4rem', fontWeight: 800, color, lineHeight: 1.1, fontFamily: "'DM Mono', monospace" }}>
    {prefix}{value}
  </div>
);


// ─── Countdown hook ───────────────────────────────────────────────────────────
const useCountdown = (expiresAt) => {
  const calc = () => {
    if (!expiresAt) return null;
    const diff = new Date(expiresAt) - new Date();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    return {
      days:    Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours:   Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
      expired: false
    };
  };
  const [timeLeft, setTimeLeft] = useState(calc);
  useEffect(() => {
    if (!expiresAt) return;
    setTimeLeft(calc());
    const t = setInterval(() => setTimeLeft(calc()), 1000);
    return () => clearInterval(t);
  }, [expiresAt]);
  return timeLeft;
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const Dashboard = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState(0);
  const [wallet, setWallet] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscriptionPrice, setSubscriptionPrice] = useState(15);
  const [toast, setToast] = useState(null);

  // Withdrawal form
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  // MoMo modal
  const [momoOpen, setMomoOpen] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [walletRes, subRes, uploadsRes, settingsRes] = await Promise.all([
        api.get('/wallet'),
        api.get('/subscription'),
        api.get('/uploads/mine').catch(() => ({ data: [] })), // graceful if route doesn't exist yet
        api.get('/settings').catch(() => ({ data: {} }))
      ]);
      setWallet(walletRes.data);
      setSubscription(subRes.data);
      setUploads(uploadsRes.data);
      if (settingsRes.data?.subscriptionPrice) setSubscriptionPrice(settingsRes.data.subscriptionPrice);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Subscribe ───────────────────────────────────────────────────────────────
  const handleSubscribe = () => setMomoOpen(true);

  // ── Withdraw ────────────────────────────────────────────────────────────────
  const handleWithdraw = async (e) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) return showToast('Enter a valid amount', 'error');
    if (wallet && amount > wallet.balance) return showToast('Amount exceeds balance', 'error');

    setWithdrawing(true);
    try {
      await api.post('/wallet/withdraw', { amount });
      showToast(`GHS ${amount.toFixed(2)} withdrawal requested!`);
      setWithdrawAmount('');
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || 'Withdrawal failed', 'error');
    } finally {
      setWithdrawing(false);
    }
  };

  const hasActiveSub = subscription?.hasSubscription;
  const subData = subscription?.subscription;
  const countdown = useCountdown(subData?.expiresAt);

  return (
    <>
      {/* Google Font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Mono:wght@400;500&family=Outfit:wght@400;500;600;700;800&display=swap');

        .dash-root {
          min-height: 100vh;
          background: #0D0D0F;
          color: #F9FAFB;
          font-family: 'Outfit', sans-serif;
          padding: 2rem 1.5rem 4rem;
        }
        .dash-tab-btn {
          padding: 0.6rem 1.2rem;
          border: none;
          background: none;
          font-family: 'Outfit', sans-serif;
          font-weight: 600;
          font-size: 0.88rem;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s;
          letter-spacing: 0.02em;
        }
        .dash-tab-btn.active {
          background: rgba(255,255,255,0.1);
          color: #F9FAFB;
        }
        .dash-tab-btn:not(.active) {
          color: #6B7280;
        }
        .dash-tab-btn:hover:not(.active) {
          color: #D1D5DB;
          background: rgba(255,255,255,0.05);
        }
        .upload-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.25rem;
          border-radius: 12px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          margin-bottom: 0.75rem;
          flex-wrap: wrap;
          transition: background 0.2s;
        }
        .upload-row:hover { background: rgba(255,255,255,0.06); }
        .withdraw-input {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px;
          padding: 0.9rem 1rem;
          color: #F9FAFB;
          font-size: 1.1rem;
          font-family: 'DM Mono', monospace;
          font-weight: 500;
          width: 100%;
          outline: none;
          transition: border 0.2s;
        }
        .withdraw-input:focus { border-color: rgba(255,255,255,0.3); }
        .withdraw-input::placeholder { color: #4B5563; }
        .sub-btn {
          padding: 0.75rem 1.5rem;
          border-radius: 10px;
          border: none;
          font-family: 'Outfit', sans-serif;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.15s;
        }
        .sub-btn:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
        .sub-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .fade-in {
          animation: fadeUp 0.4s ease both;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        /* Mobile: < 640px */
        @media (max-width: 639px) {
          .dash-root { padding: 1rem 0.75rem 4rem; }
          .dash-root h1 { font-size: 1.8rem !important; }
          .dash-tab-btn { padding: 0.5rem 0.8rem; font-size: 0.75rem; }
          .dash-tab-btn span { margin-left: 4px; padding: 1px 4px; font-size: 0.6rem; }
          div[style*="display: grid"][style*="minmax(200px"] { grid-template-columns: 1fr !important; gap: 0.75rem !important; }
          .sub-btn { width: 100%; padding: 0.65rem 0.9rem; font-size: 0.8rem; }
          .withdraw-input { padding: 0.65rem 0.85rem; font-size: 0.9rem; }
          div[style*="gap: '0.75rem'"i] { gap: 0.5rem !important; }
        }
        
        /* Tablet: 640px - 1023px */
        @media (min-width: 640px) and (max-width: 1023px) {
          .dash-root { padding: 1.5rem 1rem 4rem; }
          .dash-root h1 { font-size: 2rem !important; }
          div[style*="display: grid"][style*="minmax(200px"] { grid-template-columns: repeat(2, 1fr) !important; gap: 1rem !important; }
        }
      `}</style>

      <div className="dash-root">
        {/* Toast */}
        {toast && (
          <div style={{
            position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 999,
            padding: '0.85rem 1.5rem', borderRadius: '10px', fontWeight: 600,
            fontSize: '0.88rem', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            background: toast.type === 'error' ? '#450A0A' : '#052E16',
            color: toast.type === 'error' ? '#FCA5A5' : '#86EFAC',
            border: `1px solid ${toast.type === 'error' ? '#7F1D1D' : '#14532D'}`,
          }}>
            {toast.msg}
          </div>
        )}

        <div style={{ maxWidth: '860px', margin: '0 auto' }}>

          {/* Header */}
          <div style={{ marginBottom: '2.5rem' }} className="fade-in">
            <div style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
              Welcome back
            </div>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '2.4rem', margin: 0, lineHeight: 1.1 }}>
              {user?.name || 'Student'}
            </h1>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '2rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '0.35rem', width: 'fit-content' }}>
            {TABS.map((t, i) => (
              <button key={t} className={`dash-tab-btn ${tab === i ? 'active' : ''}`} onClick={() => setTab(i)}>
                {t}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ color: '#4B5563', padding: '4rem', textAlign: 'center' }}>Loading your data...</div>
          ) : (
            <>
              {/* ── OVERVIEW TAB ── */}
              {tab === 0 && (
                <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                  {/* Top stats row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <GlassCard>
                      <Label>Wallet Balance</Label>
                      <BigNumber prefix="GHS " value={(wallet?.balance || 0).toFixed(2)} color="#34D399" />
                    </GlassCard>
                    <GlassCard>
                      <Label>Total Earned</Label>
                      <BigNumber prefix="GHS " value={(wallet?.totalEarnings || 0).toFixed(2)} color="#FBBF24" />
                    </GlassCard>
                    <GlassCard>
                      <Label>Uploads</Label>
                      <BigNumber value={uploads.length} color="#60A5FA" />
                    </GlassCard>
                  </div>

                  {/* Subscription card */}
                  <GlassCard>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                      <div>
                        <Label>Subscription</Label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.4rem' }}>
                          <StatusPill status={hasActiveSub ? 'active' : 'expired'} />
                          {!hasActiveSub && <span style={{ color: '#6B7280', fontSize: '0.82rem' }}>No active plan</span>}
                          {hasActiveSub && subData?.expiresAt && (
                            <span style={{ color: '#6B7280', fontSize: '0.82rem' }}>
                              Expires {new Date(subData.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          )}
                        </div>
                        {hasActiveSub && (
                          <div style={{ color: '#4B5563', fontSize: '0.78rem', marginTop: '0.3rem' }}>
                            Monthly · Unlimited access to all documents
                          </div>
                        )}
                      </div>

                      {!hasActiveSub ? (
                        <button className="sub-btn" onClick={handleSubscribe} style={{ background: '#F9FAFB', color: '#0D0D0F' }}>
                          ✦ Subscribe — GHS {subscriptionPrice}/mo
                        </button>
                      ) : (
                        <button
                          className="sub-btn"
                          onClick={async () => {
                            try {
                              await api.post('/subscription/cancel');
                              showToast('Subscription cancelled');
                              fetchAll();
                            } catch {
                              showToast('Failed to cancel', 'error');
                            }
                          }}
                          style={{ background: 'rgba(239,68,68,0.15)', color: '#F87171', border: '1px solid #7F1D1D' }}
                        >
                          Cancel Plan
                        </button>
                      )}
                    </div>

                    {/* ── Live countdown ── */}
                    {hasActiveSub && countdown && !countdown.expired && (
                      <div style={{ marginTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.25rem' }}>
                        <div style={{ fontSize: '0.68rem', color: '#52525B', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                          Time remaining
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                          {[
                            { label: 'Days',    value: countdown.days },
                            { label: 'Hours',   value: countdown.hours },
                            { label: 'Minutes', value: countdown.minutes },
                            { label: 'Seconds', value: countdown.seconds },
                          ].map(({ label, value }) => (
                            <div key={label} style={{
                              flex: 1, background: 'rgba(255,255,255,0.04)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: '10px', padding: '0.75rem 0.5rem',
                              textAlign: 'center'
                            }}>
                              <div style={{
                                fontFamily: "'DM Mono', monospace",
                                fontSize: 'clamp(1.1rem, 3vw, 1.6rem)',
                                fontWeight: 700,
                                color: label === 'Days' ? '#EAB308' : '#F4F4F5',
                                lineHeight: 1
                              }}>
                                {String(value).padStart(2, '0')}
                              </div>
                              <div style={{ fontSize: '0.62rem', color: '#52525B', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '0.35rem' }}>
                                {label}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Expired state */}
                    {hasActiveSub && countdown?.expired && (
                      <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem', color: '#F87171', fontSize: '0.82rem' }}>
                        Your subscription has expired. Renew to continue accessing documents.
                      </div>
                    )}
                  </GlassCard>

                  {/* Recent uploads preview */}
                  {uploads.length > 0 && (
                    <GlassCard>
                      <Label>Recent Uploads</Label>
                      <div style={{ marginTop: '1rem' }}>
                        {uploads.slice(0, 3).map(u => (
                          <div key={u._id} className="upload-row">
                            <span style={{ fontSize: '1.1rem' }}>📄</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{u.title}</div>
                              <div style={{ color: '#6B7280', fontSize: '0.78rem' }}>{u.courseCode} · {u.year}</div>
                            </div>
                            <StatusPill status={u.status} />
                            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.85rem', color: '#9CA3AF' }}>
                              GHS {u.price?.toFixed(2)}
                            </div>
                          </div>
                        ))}
                        {uploads.length > 3 && (
                          <button onClick={() => setTab(1)} style={{
                            background: 'none', border: 'none', color: '#6B7280',
                            fontSize: '0.82rem', cursor: 'pointer', marginTop: '0.5rem',
                            padding: 0, fontFamily: 'inherit'
                          }}>
                            View all {uploads.length} uploads →
                          </button>
                        )}
                      </div>
                    </GlassCard>
                  )}
                </div>
              )}

              {/* ── MY UPLOADS TAB ── */}
              {tab === 1 && (
                <div className="fade-in">
                  <GlassCard>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <Label>All Uploads ({uploads.length})</Label>
                      <a href="/upload" style={{
                        padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.08)',
                        borderRadius: '8px', fontSize: '0.8rem', color: '#D1D5DB',
                        textDecoration: 'none', fontWeight: 600, border: '1px solid rgba(255,255,255,0.1)'
                      }}>+ New Upload</a>
                    </div>

                    {uploads.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '3rem', color: '#4B5563' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📂</div>
                        <div style={{ fontWeight: 600 }}>No uploads yet</div>
                        <div style={{ fontSize: '0.85rem', marginTop: '0.3rem' }}>Share past questions and start earning</div>
                      </div>
                    ) : uploads.map(u => (
                      <div key={u._id} className="upload-row">
                        <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>📄</span>
                        <div style={{ flex: 1, minWidth: '150px' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.92rem', color: '#F9FAFB' }}>{u.title}</div>
                          <div style={{ color: '#6B7280', fontSize: '0.78rem', marginTop: '2px' }}>
                            {u.courseCode} · {u.institution} · {u.year}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          <span style={{ color: '#6B7280', fontSize: '0.78rem' }}>
                            ↓ {u.downloadCount || 0}
                          </span>
                          <StatusPill status={u.status} />
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.85rem', color: '#FBBF24', fontWeight: 600 }}>
                            GHS {u.price?.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </GlassCard>
                </div>
              )}

              {/* ── WITHDRAW TAB ── */}
              {tab === 2 && (
                <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <GlassCard>
                    <Label>Available Balance</Label>
                    <BigNumber prefix="GHS " value={(wallet?.balance || 0).toFixed(2)} color="#34D399" />
                    <div style={{ color: '#4B5563', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                      Total earned: GHS {(wallet?.totalEarnings || 0).toFixed(2)}
                    </div>
                  </GlassCard>

                  <GlassCard>
                    <Label>Request Withdrawal</Label>
                    <p style={{ color: '#6B7280', fontSize: '0.85rem', margin: '0.5rem 0 1.5rem' }}>
                      Payouts are processed via Mobile Money within 24–48 hours after admin approval.
                    </p>

                    <form onSubmit={handleWithdraw} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div>
                        <div style={{ color: '#9CA3AF', fontSize: '0.78rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                          AMOUNT (GHS)
                        </div>
                        <input
                          type="number"
                          className="withdraw-input"
                          placeholder="0.00"
                          value={withdrawAmount}
                          min="1"
                          step="0.01"
                          max={wallet?.balance || 0}
                          onChange={e => setWithdrawAmount(e.target.value)}
                        />
                      </div>

                      {/* Quick amounts */}
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {[10, 20, 50, 100].map(amt => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setWithdrawAmount(String(amt))}
                            disabled={!wallet || wallet.balance < amt}
                            style={{
                              padding: '0.4rem 0.9rem', borderRadius: '8px',
                              background: withdrawAmount == amt ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              color: !wallet || wallet.balance < amt ? '#374151' : '#D1D5DB',
                              fontSize: '0.82rem', fontWeight: 600,
                              cursor: !wallet || wallet.balance < amt ? 'not-allowed' : 'pointer',
                              fontFamily: 'inherit', transition: 'background 0.15s'
                            }}
                          >
                            GHS {amt}
                          </button>
                        ))}
                      </div>

                      <button
                        type="submit"
                        className="sub-btn"
                        disabled={withdrawing || !withdrawAmount || (wallet && parseFloat(withdrawAmount) > wallet.balance)}
                        style={{
                          background: '#F9FAFB', color: '#0D0D0F',
                          marginTop: '0.5rem', padding: '0.85rem'
                        }}
                      >
                        {withdrawing ? 'Processing...' : 'Request Payout →'}
                      </button>
                    </form>
                  </GlassCard>

                  {/* Info note */}
                  <div style={{
                    padding: '1rem 1.25rem', borderRadius: '12px',
                    background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)',
                    color: '#92400E', fontSize: '0.82rem', lineHeight: 1.6
                  }}>
                    <span style={{ color: '#FBBF24', fontWeight: 700 }}>Note: </span>
                    <span style={{ color: '#D97706' }}>
                      You earn 80% of every sale. Withdrawals require admin approval and are sent to your registered Mobile Money number.
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <MoMoModal
        isOpen={momoOpen}
        onClose={() => setMomoOpen(false)}
        onSuccess={() => { fetchAll(); showToast('Subscription activated!'); }}
        title="Monthly Subscription"
        amount={subscriptionPrice}
        mode="subscription"
      />
    </>
  );
};

export default Dashboard;
