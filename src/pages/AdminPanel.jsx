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

const TABS = ['Pending Uploads', 'Pending Withdrawals', 'File Recovery'];

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
  const [recoveryStatus, setRecoveryStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [uploadsRes, withdrawalsRes, statsRes, recoveryRes] = await Promise.all([
        api.get('/admin/uploads/pending'),
        api.get('/admin/withdrawals/pending'),
        api.get('/admin/stats'),
        api.get('/admin/recovery/status').catch(() => ({ data: null })),
      ]);
      setUploads(uploadsRes.data);
      setWithdrawals(withdrawalsRes.data);
      setStats(statsRes.data);
      setRecoveryStatus(recoveryRes.data);
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

  const handleViewPDF = async (uploadId, title) => {
    try {
      // Get the proper download URL from the API
      const res = await api.get(`/admin/uploads/${uploadId}/download`);
      const { fileUrl } = res.data;
      // Open in new tab
      window.open(fileUrl, '_blank');
    } catch (err) {
      console.error('Failed to get PDF URL:', err);
      showToast('Failed to open PDF', 'error');
    }
  };

  const handleRecoverFile = async (uploadId) => {
    setActionLoading('recover-' + uploadId);
    try {
      await api.post(`/admin/recovery/${uploadId}`);
      await fetchData();
      showToast('File recovered successfully');
    } catch (err) {
      showToast('Recovery failed', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRecoverAll = async () => {
    setActionLoading('recover-all');
    try {
      await api.post('/admin/recovery-all/run');
      await fetchData();
      showToast('Batch recovery completed');
    } catch (err) {
      showToast('Batch recovery failed', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        
        /* Mobile: < 640px */
        @media (max-width: 639px) {
          .admin-root { padding: 1rem 0.75rem !important; }
          .admin-stats { grid-template-columns: 1fr !important; gap: 0.75rem !important; }
          .admin-header h1 { font-size: 1.4rem !important; }
          .admin-header p { font-size: 0.8rem !important; }
          .admin-tabs { flex-wrap: wrap !important; }
          .admin-tab { padding: 0.5rem 0.9rem !important; font-size: 0.75rem !important; }
          .upload-card { flex-direction: column; align-items: flex-start !important; padding: 0.9rem 1rem !important; }
          .upload-icon { width: 36px !important; height: 36px !important; }
          .upload-actions { width: 100%; flex-direction: column !important; }
          .action-btn { width: 100%; padding: 0.6rem 0.8rem !important; font-size: 0.75rem !important; }
        }
        
        /* Tablet: 640px - 1023px */
        @media (min-width: 640px) and (max-width: 1023px) {
          .admin-root { padding: 1.5rem 1rem !important; }
          .admin-stats { grid-template-columns: repeat(2, 1fr) !important; gap: 1rem !important; }
          .admin-header h1 { font-size: 1.6rem !important; }
        }
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
                {i === 2 && recoveryStatus?.filesRecoverable > 0 && (
                  <span style={{ marginLeft: '6px', background: '#F59E0B', color: '#fff', borderRadius: '999px', padding: '1px 7px', fontSize: '0.7rem' }}>
                    {recoveryStatus.filesRecoverable}
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
                          {(upload.fileUrl || upload.filePath) && (
                            <ActionBtn
                              label="View PDF"
                              color="#1D4ED8"
                              bg="#EFF6FF"
                              hoverBg="#DBEAFE"
                              onClick={() => handleViewPDF(upload._id, upload.title)}
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

              {/* ── File Recovery ── */}
              {activeTab === 2 && recoveryStatus && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* Recovery Stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                    <StatCard label="Total Approved" value={recoveryStatus.totalApproved} accent="#111" />
                    <StatCard label="Files Existing" value={recoveryStatus.filesExisting} accent="#16A34A" />
                    <StatCard label="Can Recover" value={recoveryStatus.filesRecoverable} accent="#F59E0B" />
                  </div>

                  {/* Batch Recovery Button */}
                  {recoveryStatus.filesRecoverable > 0 && (
                    <div style={{
                      background: '#FEF3C7', border: '1px solid #FCD34D',
                      borderRadius: '12px', padding: '1.25rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      flexWrap: 'wrap', gap: '1rem'
                    }}>
                      <div>
                        <div style={{ fontWeight: 700, color: '#78350F', fontSize: '0.95rem' }}>
                          🔄 {recoveryStatus.filesRecoverable} file(s) missing
                        </div>
                        <div style={{ color: '#92400E', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                          Click below to restore all from Cloudinary backup
                        </div>
                      </div>
                      <ActionBtn
                        label="Recover All"
                        color="#92400E"
                        bg="#FCD34D"
                        hoverBg="#FBB040"
                        loading={actionLoading === 'recover-all'}
                        onClick={handleRecoverAll}
                      />
                    </div>
                  )}

                  {/* Recovery Details */}
                  {recoveryStatus.uploads.length === 0 ? (
                    <EmptyState message="No approved uploads to monitor." />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {recoveryStatus.uploads.map(file => (
                        <div key={file.id} style={{
                          background: '#fff', border: '1px solid #E8E8E4',
                          borderRadius: '10px', padding: '1rem 1.25rem',
                          display: 'flex', alignItems: 'center', gap: '1rem',
                          flexWrap: 'wrap'
                        }}>
                          {/* Icon */}
                          <div style={{
                            width: '36px', height: '36px', borderRadius: '8px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, fontSize: '1rem',
                            background: file.fileExists ? '#DCFCE7' : '#FEE2E2'
                          }}>
                            {file.fileExists ? '✅' : '⚠️'}
                          </div>

                          {/* Info */}
                          <div style={{ flex: 1, minWidth: '200px' }}>
                            <div style={{ fontWeight: 700, color: '#111', fontSize: '0.9rem' }}>
                              {file.title}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#9A9A9A', marginTop: '2px' }}>
                              {file.fileExists ? '📁 On disk' : '☁️ Missing locally'}
                              {file.hasBackup && ' · 🔒 Backed up'}
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div style={{
                            padding: '4px 10px', borderRadius: '999px', fontSize: '0.7rem',
                            fontWeight: 600, textTransform: 'uppercase',
                            background: file.fileExists ? '#DCFCE7' : '#FEE2E2',
                            color: file.fileExists ? '#14532D' : '#7F1D1D',
                            border: `1px solid ${file.fileExists ? '#BBF7D0' : '#FECACA'}`
                          }}>
                            {file.fileExists ? 'Safe' : file.hasBackup ? 'Recoverable' : 'Lost'}
                          </div>

                          {/* Action */}
                          {file.canRecover && (
                            <ActionBtn
                              label="Recover"
                              color="#F59E0B"
                              bg="#FEF3C7"
                              hoverBg="#FCD34D"
                              loading={actionLoading === 'recover-' + file.id}
                              onClick={() => handleRecoverFile(file.id)}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
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
