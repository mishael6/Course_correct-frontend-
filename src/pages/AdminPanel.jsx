import { useState, useEffect, useCallback } from 'react';
import api from '../api';

// ─── Micro components ─────────────────────────────────────────────────────────
const Badge = ({ status }) => {
  const map = {
    pending:  { bg: '#FEF9C3', color: '#854D0E', border: '#FDE68A' },
    approved: { bg: '#DCFCE7', color: '#14532D', border: '#BBF7D0' },
    rejected: { bg: '#FEE2E2', color: '#7F1D1D', border: '#FECACA' },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{
      padding: '3px 10px', borderRadius: '999px', fontSize: '0.72rem',
      fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
      background: s.bg, color: s.color, border: `1px solid ${s.border}`
    }}>{status}</span>
  );
};

const StatCard = ({ label, value, accent, sub }) => (
  <div style={{
    background: '#fff', border: '1px solid #E8E8E4', borderRadius: '14px',
    padding: '1.5rem 1.75rem', boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
  }}>
    <div style={{ fontSize: '0.72rem', color: '#9A9A9A', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{label}</div>
    <div style={{ fontSize: '2.2rem', fontWeight: 800, color: accent || '#111', lineHeight: 1, fontFamily: 'monospace' }}>{value}</div>
    {sub && <div style={{ fontSize: '0.75rem', color: '#9A9A9A', marginTop: '0.4rem' }}>{sub}</div>}
  </div>
);

const TABS = ['Pending Uploads', 'Pending Withdrawals'];

// ─── PDF Preview Modal ────────────────────────────────────────────────────────
const PreviewModal = ({ url, title, uploadId, onClose }) => {
  if (!url) return null;

  // Try Google Docs viewer as fallback for cross-origin PDFs
  const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;

  const handleDownload = async () => {
    try {
      // Get the download URL from the API 
      const res = await api.get(`/admin/uploads/${uploadId}/download`);
      const { fileUrl } = res.data;
      
      // Create a temporary download link
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = `${title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download PDF');
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(4px)',
      display: 'flex', flexDirection: 'column',
      animation: 'fadeIn 0.2s ease'
    }}>
      {/* Header */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #E8E8E4',
        padding: '0.85rem 1.5rem', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center', flexShrink: 0
      }}>
        <div>
          <div style={{ fontSize: '0.72rem', color: '#9A9A9A', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Reviewing document
          </div>
          <div style={{ fontWeight: 700, color: '#111', fontSize: '0.95rem', marginTop: '2px' }}>{title}</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            onClick={handleDownload}
            style={{
              padding: '0.5rem 1rem', background: '#EAB308',
              borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700,
              color: '#111', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
              fontFamily: 'inherit'
            }}
          >
            Download PDF ↓
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem 1rem', background: '#111', border: 'none',
              borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600,
              color: '#fff', cursor: 'pointer', fontFamily: 'inherit'
            }}
          >
            Close ✕
          </button>
        </div>
      </div>

      {/* Viewer area */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <iframe
          src={googleViewerUrl}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title={title}
          allow="autoplay"
        />
        {/* Fallback message in case iframe blocks */}
        <div style={{
          position: 'absolute', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '0.6rem 1.25rem',
          borderRadius: '999px', fontSize: '0.78rem', fontWeight: 500,
          pointerEvents: 'none', whiteSpace: 'nowrap'
        }}>
          If the preview doesn't load, click "Download PDF" above to view it
        </div>
      </div>
    </div>
  );
};

// ─── Action Button ────────────────────────────────────────────────────────────
const ActionBtn = ({ label, color, bg, hoverBg, loading, onClick, style = {} }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={loading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '0.5rem 1rem', border: 'none', borderRadius: '8px',
        fontWeight: 700, fontSize: '0.82rem',
        cursor: loading ? 'not-allowed' : 'pointer',
        background: hovered && !loading ? hoverBg : bg,
        color, transition: 'background 0.15s',
        opacity: loading ? 0.6 : 1, whiteSpace: 'nowrap',
        fontFamily: 'inherit', ...style
      }}
    >
      {loading ? '...' : label}
    </button>
  );
};

// ─── Main AdminPanel ──────────────────────────────────────────────────────────
const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [uploads, setUploads] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);
  const [preview, setPreview] = useState(null); // { url, title }

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [uploadsRes, withdrawalsRes, statsRes] = await Promise.all([
        api.get('/admin/uploads/pending'),
        api.get('/admin/withdrawals/pending'),
        api.get('/admin/stats'),
      ]);
      setUploads(uploadsRes.data);
      setWithdrawals(withdrawalsRes.data);
      setStats(statsRes.data);
    } catch (err) {
      showToast('Failed to fetch data', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUploadStatus = async (id, status) => {
    setActionLoading(id + status);
    try {
      await api.put(`/admin/uploads/${id}/status`, { status });
      setUploads(prev => prev.filter(u => u._id !== id));
      setStats(prev => prev ? {
        ...prev,
        pendingUploads: prev.pendingUploads - 1,
        approvedUploads: status === 'approved' ? prev.approvedUploads + 1 : prev.approvedUploads,
        rejectedUploads: status === 'rejected' ? prev.rejectedUploads + 1 : prev.rejectedUploads,
      } : prev);
      showToast(`Upload ${status} successfully`);
    } catch {
      showToast('Action failed', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveWithdrawal = async (id) => {
    setActionLoading(id);
    try {
      await api.put(`/admin/withdrawals/${id}/approve`);
      setWithdrawals(prev => prev.filter(w => w._id !== id));
      setStats(prev => prev ? { ...prev, pendingWithdrawals: prev.pendingWithdrawals - 1 } : prev);
      showToast('Withdrawal approved');
    } catch {
      showToast('Action failed', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 999,
          padding: '0.85rem 1.5rem', borderRadius: '10px', fontWeight: 600,
          fontSize: '0.88rem', boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          background: toast.type === 'error' ? '#FEE2E2' : '#DCFCE7',
          color: toast.type === 'error' ? '#7F1D1D' : '#14532D',
          border: `1px solid ${toast.type === 'error' ? '#FECACA' : '#BBF7D0'}`,
        }}>
          {toast.msg}
        </div>
      )}

      {/* PDF Preview Modal */}
      {preview && <PreviewModal url={preview.url} title={preview.title} uploadId={preview.uploadId} onClose={() => setPreview(null)} />}

      <div style={{ minHeight: '100vh', background: '#F8F8F5', padding: '2rem 1.5rem' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

          {/* Header */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#111', margin: 0, letterSpacing: '-0.02em' }}>
              Admin Panel
            </h1>
            <p style={{ color: '#6B6B6B', margin: '0.3rem 0 0', fontSize: '0.9rem' }}>
              Review uploads and manage withdrawals
            </p>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <StatCard label="Total Uploads" value={stats?.totalUploads ?? '—'} accent="#111" />
            <StatCard label="Pending" value={stats?.pendingUploads ?? '—'} accent="#EAB308" sub="Awaiting review" />
            <StatCard label="Approved" value={stats?.approvedUploads ?? '—'} accent="#16A34A" sub="Live on marketplace" />
            <StatCard label="Rejected" value={stats?.rejectedUploads ?? '—'} accent="#DC2626" />
            <StatCard label="Withdrawals" value={stats?.pendingWithdrawals ?? '—'} accent="#7C3AED" sub="Pending payout" />
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', background: '#F0F0EC', borderRadius: '12px', padding: '0.3rem', width: 'fit-content' }}>
            {TABS.map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveTab(i)}
                style={{
                  padding: '0.6rem 1.2rem', border: 'none',
                  background: activeTab === i ? '#fff' : 'transparent',
                  fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                  color: activeTab === i ? '#111' : '#6B6B6B',
                  borderRadius: '9px', fontFamily: 'inherit',
                  boxShadow: activeTab === i ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s'
                }}
              >
                {tab}
                {i === 0 && uploads.length > 0 && (
                  <span style={{ marginLeft: '6px', background: '#EAB308', color: '#111', borderRadius: '999px', padding: '1px 7px', fontSize: '0.7rem' }}>
                    {uploads.length}
                  </span>
                )}
                {i === 1 && withdrawals.length > 0 && (
                  <span style={{ marginLeft: '6px', background: '#7C3AED', color: '#fff', borderRadius: '999px', padding: '1px 7px', fontSize: '0.7rem' }}>
                    {withdrawals.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#9A9A9A' }}>Loading...</div>
          ) : (
            <>
              {/* ── Pending Uploads ── */}
              {activeTab === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {uploads.length === 0 ? (
                    <EmptyState message="No pending uploads — all caught up!" />
                  ) : uploads.map(upload => (
                    <div key={upload._id} style={{
                      background: '#fff', border: '1px solid #E8E8E4',
                      borderRadius: '14px', padding: '1.25rem 1.5rem',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        {/* Icon */}
                        <div style={{
                          width: '44px', height: '44px', borderRadius: '10px',
                          background: '#FEF9C3', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', flexShrink: 0, fontSize: '1.3rem'
                        }}>📄</div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: '180px' }}>
                          <div style={{ fontWeight: 700, color: '#111', fontSize: '0.95rem' }}>{upload.title}</div>
                          <div style={{ color: '#6B6B6B', fontSize: '0.8rem', marginTop: '2px' }}>
                            {upload.courseCode} · {upload.institution} · {upload.year}
                          </div>
                          <div style={{ color: '#9A9A9A', fontSize: '0.75rem', marginTop: '2px' }}>
                            By {upload.uploader?.name} ({upload.uploader?.email})
                          </div>
                        </div>

                        {/* Price + badge */}
                        <div style={{ textAlign: 'right', minWidth: '80px' }}>
                          <div style={{ fontWeight: 800, color: '#111', fontSize: '1rem', fontFamily: 'monospace' }}>
                            GHS {upload.price?.toFixed(2)}
                          </div>
                          <div style={{ marginTop: '4px' }}>
                            <Badge status={upload.status} />
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, flexWrap: 'wrap' }}>
                          {/* Preview button */}
                          {upload.fileUrl && (
                            <ActionBtn
                              label="Preview PDF"
                              color="#1D4ED8"
                              bg="#EFF6FF"
                              hoverBg="#DBEAFE"
                              onClick={() => setPreview({ url: upload.fileUrl, title: upload.title, uploadId: upload._id })}
                            />
                          )}
                          <ActionBtn
                            label="Approve"
                            color="#14532D" bg="#DCFCE7" hoverBg="#BBF7D0"
                            loading={actionLoading === upload._id + 'approved'}
                            onClick={() => handleUploadStatus(upload._id, 'approved')}
                          />
                          <ActionBtn
                            label="Reject"
                            color="#7F1D1D" bg="#FEE2E2" hoverBg="#FECACA"
                            loading={actionLoading === upload._id + 'rejected'}
                            onClick={() => handleUploadStatus(upload._id, 'rejected')}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Pending Withdrawals ── */}
              {activeTab === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {withdrawals.length === 0 ? (
                    <EmptyState message="No pending withdrawals." />
                  ) : withdrawals.map(w => (
                    <div key={w._id} style={{
                      background: '#fff', border: '1px solid #E8E8E4',
                      borderRadius: '14px', padding: '1.25rem 1.5rem',
                      display: 'flex', alignItems: 'center', gap: '1rem',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)', flexWrap: 'wrap'
                    }}>
                      <div style={{
                        width: '44px', height: '44px', borderRadius: '10px',
                        background: '#F5F3FF', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', flexShrink: 0, fontSize: '1.3rem'
                      }}>💸</div>

                      <div style={{ flex: 1, minWidth: '180px' }}>
                        <div style={{ fontWeight: 700, color: '#111', fontSize: '0.95rem' }}>{w.user?.name}</div>
                        <div style={{ color: '#6B6B6B', fontSize: '0.8rem', marginTop: '2px' }}>
                          {w.user?.email} · {w.user?.phone}
                        </div>
                        <div style={{ color: '#9A9A9A', fontSize: '0.75rem', marginTop: '2px' }}>
                          Requested {new Date(w.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', minWidth: '100px' }}>
                        <div style={{ fontWeight: 800, color: '#111', fontSize: '1.1rem', fontFamily: 'monospace' }}>
                          GHS {w.amount?.toFixed(2)}
                        </div>
                        <Badge status={w.status} />
                      </div>

                      <ActionBtn
                        label="Approve Payout"
                        color="#14532D" bg="#DCFCE7" hoverBg="#BBF7D0"
                        loading={actionLoading === w._id}
                        onClick={() => handleApproveWithdrawal(w._id)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

const EmptyState = ({ message }) => (
  <div style={{
    textAlign: 'center', padding: '4rem',
    background: '#fff', borderRadius: '14px',
    border: '1px dashed #E8E8E4', color: '#9A9A9A'
  }}>
    <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✅</div>
    <p style={{ margin: 0, fontWeight: 500 }}>{message}</p>
  </div>
);

export default AdminPanel;
