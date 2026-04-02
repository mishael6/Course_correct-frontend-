import { useState, useEffect } from 'react';
import { PaymentWidget } from '@payloqa/payment-widget';
import '@payloqa/payment-widget/styles';
import api from '../api';

const MoMoModal = ({ isOpen, onClose, onSuccess, title, amount, mode, uploadId }) => {
  const [transactionId, setTransactionId] = useState(null);
  const [widgetOpen, setWidgetOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTransactionId(null);
      setWidgetOpen(false);
      setError('');
    }
  }, [isOpen]);

  const handleOpenWidget = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/payments/create-pending', {
        type: mode === 'subscription' ? 'subscription' : 'per-paper',
        uploadId: uploadId || undefined
      });
      setTransactionId(res.data.transactionId);
      setWidgetOpen(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start payment. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (result) => {
    console.log('Payment successful:', result);
    setWidgetOpen(false);
    onSuccess?.();
    onClose();
  };

  if (!isOpen) return null;

  const paymentConfig = {
    apiKey: import.meta.env.VITE_PAYLOQA_API_KEY,
    platformId: import.meta.env.VITE_PAYLOQA_PLATFORM_ID,
    amount: amount,
    currency: 'GHS',
    primaryColor: '#EAB308',
    displayMode: 'modal',
    webhookUrl: `${import.meta.env.VITE_API_URL?.replace('/api', '')}/api/payments/webhook`,
    orderId: transactionId || 'pending',
    metadata: {
      transaction_id: transactionId || '',
      type: mode,
      upload_id: uploadId || '',
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Outfit:wght@400;500;600;700&display=swap');
        .momo-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(0,0,0,0.7);
          display: flex; align-items: center; justify-content: center;
          padding: 1rem; backdrop-filter: blur(4px);
          animation: fadeIn 0.2s ease;
        }
        .momo-modal {
          background: #111113; border: 1px solid #27272A;
          border-radius: 20px; padding: 2rem;
          width: 100%; max-width: 400px;
          animation: slideUp 0.25s ease;
        }
        .pay-btn {
          width: 100%; padding: 0.9rem;
          background: #EAB308; color: #09090B; border: none;
          border-radius: 12px; font-family: 'Outfit', sans-serif;
          font-weight: 700; font-size: 0.95rem; cursor: pointer;
          margin-top: 1rem; transition: opacity 0.2s;
        }
        .pay-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .pay-btn:hover:not(:disabled) { opacity: 0.88; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      <div className="momo-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="momo-modal">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#52525B', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                {mode === 'subscription' ? 'Subscribe' : 'Purchase'}
              </div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '1.1rem', color: '#F4F4F5', lineHeight: 1.3 }}>
                {title}
              </div>
              <div style={{ fontFamily: "monospace", color: '#EAB308', fontWeight: 700, fontSize: '1.3rem', marginTop: '0.25rem' }}>
                GHS {amount?.toFixed(2)}
                {mode === 'subscription' && <span style={{ fontSize: '0.75rem', color: '#52525B', fontWeight: 400 }}>/month</span>}
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#52525B', fontSize: '1.3rem', cursor: 'pointer', padding: '0.25rem', lineHeight: 1 }}>✕</button>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #27272A', borderRadius: '12px', padding: '1rem', marginBottom: '1.25rem' }}>
            {mode === 'subscription' ? (
              <ul style={{ margin: 0, padding: '0 0 0 1.1rem', color: '#71717A', fontSize: '0.85rem', lineHeight: 2 }}>
                <li>Unlimited document downloads</li>
                <li>Access to all approved papers</li>
                <li>Valid for 30 days</li>
              </ul>
            ) : (
              <ul style={{ margin: 0, padding: '0 0 0 1.1rem', color: '#71717A', fontSize: '0.85rem', lineHeight: 2 }}>
                <li>Permanent access to this document</li>
                <li>Download anytime from your dashboard</li>
              </ul>
            )}
          </div>

          {error && (
            <div style={{ background: '#450A0A', border: '1px solid #7F1D1D', borderRadius: '10px', padding: '0.75rem 1rem', color: '#FCA5A5', fontSize: '0.83rem', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <button className="pay-btn" onClick={handleOpenWidget} disabled={loading}>
            {loading ? 'Preparing payment...' : `Pay GHS ${amount?.toFixed(2)} via MoMo`}
          </button>

          <p style={{ textAlign: 'center', color: '#3F3F46', fontSize: '0.75rem', marginTop: '0.75rem' }}>
            Powered by Payloqa · Mobile Money
          </p>
        </div>
      </div>

      {transactionId && (
        <PaymentWidget
          config={paymentConfig}
          isOpen={widgetOpen}
          onClose={() => setWidgetOpen(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
};

export default MoMoModal;