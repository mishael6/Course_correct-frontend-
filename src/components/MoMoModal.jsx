import { useState, useEffect, useRef } from 'react';
import api from '../api';

const NETWORKS = [
  { id: 'mtn', label: 'MTN MoMo', color: '#FFCC00', bg: '#18160A' },
  { id: 'vodafone', label: 'Vodafone Cash', color: '#E60000', bg: '#180A0A' },
  { id: 'airteltigo', label: 'AirtelTigo Money', color: '#E87722', bg: '#18110A' },
];

const POLL_INTERVAL = 4000;  // 4s
const MAX_POLLS = 30;        // give up after 2 minutes

/**
 * MoMoModal — reusable checkout modal
 *
 * Props:
 *   isOpen         boolean
 *   onClose        () => void
 *   onSuccess      () => void
 *   title          string — document title or "Monthly Subscription"
 *   amount         number
 *   mode           'per-paper' | 'subscription'
 *   uploadId       string — required if mode === 'per-paper'
 */
const MoMoModal = ({ isOpen, onClose, onSuccess, title, amount, mode, uploadId }) => {
  const [step, setStep] = useState('select'); // select | pending | success | failed
  const [network, setNetwork] = useState('mtn');
  const [loading, setLoading] = useState(false);
  const [payloqaPaymentId, setPayloqaPaymentId] = useState(null);
  const [error, setError] = useState('');
  const [pollCount, setPollCount] = useState(0);
  const pollRef = useRef(null);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setStep('select');
      setNetwork('mtn');
      setLoading(false);
      setError('');
      setPayloqaPaymentId(null);
      setPollCount(0);
    }
    return () => clearInterval(pollRef.current);
  }, [isOpen]);

  // Poll payment status once we have a payloqaPaymentId
  useEffect(() => {
    if (!payloqaPaymentId || step !== 'pending') return;

    pollRef.current = setInterval(async () => {
      setPollCount(c => {
        if (c >= MAX_POLLS) {
          clearInterval(pollRef.current);
          setStep('failed');
          setError('Payment timed out. Please try again.');
          return c;
        }
        return c + 1;
      });

      try {
        const res = await api.get(`/payments/status/${payloqaPaymentId}`);
        const { status } = res.data;

        if (status === 'completed') {
          clearInterval(pollRef.current);
          setStep('success');
          setTimeout(() => { onSuccess?.(); onClose(); }, 2500);
        } else if (status === 'failed' || status === 'cancelled') {
          clearInterval(pollRef.current);
          setStep('failed');
          setError('Payment failed or was cancelled. Please try again.');
        }
      } catch {
        // ignore poll errors, keep trying
      }
    }, POLL_INTERVAL);

    return () => clearInterval(pollRef.current);
  }, [payloqaPaymentId, step]);

  const handlePay = async () => {
    setLoading(true);
    setError('');
    try {
      let res;
      if (mode === 'subscription') {
        res = await api.post('/payments/subscription', { network });
      } else {
        res = await api.post('/payments/initiate', { uploadId, network });
      }
      setPayloqaPaymentId(res.data.payloqaPaymentId);
      setStep('pending');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initiate payment. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        .momo-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(0,0,0,0.75);
          display: flex; align-items: center; justify-content: center;
          padding: 1rem;
          backdrop-filter: blur(4px);
          animation: fadeIn 0.2s ease;
        }
        .momo-modal {
          background: #111113;
          border: 1px solid #27272A;
          border-radius: 20px;
          padding: 2rem;
          width: 100%;
          max-width: 420px;
          animation: slideUp 0.25s ease;
        }
        .net-btn {
          width: 100%;
          padding: 0.9rem 1.1rem;
          border-radius: 12px;
          border: 2px solid transparent;
          display: flex; align-items: center; gap: 0.75rem;
          cursor: pointer;
          font-family: 'Outfit', sans-serif;
          font-weight: 600; font-size: 0.9rem;
          transition: all 0.15s;
          margin-bottom: 0.5rem;
        }
        .net-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
        .pay-btn {
          width: 100%; padding: 0.9rem;
          background: #EAB308; color: #09090B;
          border: none; border-radius: 12px;
          font-family: 'Outfit', sans-serif;
          font-weight: 700; font-size: 0.95rem;
          cursor: pointer; margin-top: 1rem;
          transition: opacity 0.2s;
        }
        .pay-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .pay-btn:hover:not(:disabled) { opacity: 0.88; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner-ring {
          width: 48px; height: 48px;
          border: 3px solid #27272A;
          border-top-color: #EAB308;
          border-radius: 50%;
          animation: spin 0.9s linear infinite;
          margin: 0 auto 1.25rem;
        }
      `}</style>

      <div className="momo-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="momo-modal">

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#52525B', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                {mode === 'subscription' ? 'Subscribe' : 'Purchase'}
              </div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '1.1rem', color: '#F4F4F5', lineHeight: 1.3 }}>
                {title}
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", color: '#EAB308', fontWeight: 700, fontSize: '1.3rem', marginTop: '0.25rem' }}>
                GHS {amount?.toFixed(2)}
                {mode === 'subscription' && <span style={{ fontSize: '0.75rem', color: '#52525B', fontWeight: 400 }}>/month</span>}
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#52525B', fontSize: '1.3rem', cursor: 'pointer', padding: '0.25rem', lineHeight: 1 }}>✕</button>
          </div>

          {/* ── Step: Select network ── */}
          {step === 'select' && (
            <>
              <div style={{ fontSize: '0.8rem', color: '#71717A', fontWeight: 600, marginBottom: '0.75rem', letterSpacing: '0.04em' }}>
                SELECT YOUR NETWORK
              </div>

              {NETWORKS.map(n => (
                <button
                  key={n.id}
                  className="net-btn"
                  onClick={() => setNetwork(n.id)}
                  style={{
                    background: network === n.id ? n.bg : 'rgba(255,255,255,0.02)',
                    borderColor: network === n.id ? n.color + '55' : '#27272A',
                    color: network === n.id ? '#F4F4F5' : '#71717A',
                  }}
                >
                  <span className="net-dot" style={{ background: n.color }} />
                  {n.label}
                  {network === n.id && <span style={{ marginLeft: 'auto', color: n.color, fontSize: '1rem' }}>✓</span>}
                </button>
              ))}

              {error && (
                <div style={{ background: '#450A0A', border: '1px solid #7F1D1D', borderRadius: '10px', padding: '0.75rem 1rem', color: '#FCA5A5', fontSize: '0.83rem', marginTop: '0.75rem' }}>
                  {error}
                </div>
              )}

              <button className="pay-btn" onClick={handlePay} disabled={loading}>
                {loading ? 'Sending prompt...' : `Pay GHS ${amount?.toFixed(2)} via MoMo`}
              </button>

              <p style={{ textAlign: 'center', color: '#3F3F46', fontSize: '0.75rem', marginTop: '0.75rem' }}>
                You'll receive a MoMo prompt on your registered phone number
              </p>
            </>
          )}

          {/* ── Step: Pending ── */}
          {step === 'pending' && (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div className="spinner-ring" />
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '1.1rem', color: '#F4F4F5', marginBottom: '0.5rem' }}>
                Waiting for payment...
              </div>
              <div style={{ color: '#52525B', fontSize: '0.85rem', lineHeight: 1.6 }}>
                Approve the MoMo prompt on your phone.<br />
                This page will update automatically.
              </div>
              <div style={{ marginTop: '1.25rem', color: '#3F3F46', fontSize: '0.75rem', fontFamily: "'DM Mono', monospace" }}>
                {MAX_POLLS - pollCount > 0 ? `Checking... (${Math.ceil((MAX_POLLS - pollCount) * POLL_INTERVAL / 1000)}s remaining)` : 'Timing out...'}
              </div>
            </div>
          )}

          {/* ── Step: Success ── */}
          {step === 'success' && (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '1.2rem', color: '#4ADE80', marginBottom: '0.5rem' }}>
                Payment Successful!
              </div>
              <div style={{ color: '#52525B', fontSize: '0.85rem' }}>
                {mode === 'subscription'
                  ? 'Your subscription is now active. Enjoy unlimited access!'
                  : 'Go to your dashboard to download the document.'}
              </div>
            </div>
          )}

          {/* ── Step: Failed ── */}
          {step === 'failed' && (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '1.1rem', color: '#F87171', marginBottom: '0.5rem' }}>
                Payment Failed
              </div>
              <div style={{ color: '#52525B', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                {error || 'Something went wrong. Please try again.'}
              </div>
              <button
                onClick={() => { setStep('select'); setError(''); setPollCount(0); }}
                style={{
                  padding: '0.7rem 1.5rem', background: 'rgba(255,255,255,0.06)',
                  border: '1px solid #27272A', borderRadius: '10px',
                  color: '#A1A1AA', fontFamily: 'inherit', fontWeight: 600,
                  fontSize: '0.88rem', cursor: 'pointer'
                }}
              >
                Try Again
              </button>
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default MoMoModal;