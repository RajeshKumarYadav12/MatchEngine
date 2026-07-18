import { useState, useEffect } from 'react';
import { Search, FileSearch } from 'lucide-react';
import { getMatchResult } from '../api';

export default function MatchViewer({ externalPoNumber }) {
  const [poNumber, setPoNumber] = useState(externalPoNumber || '');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (externalPoNumber) {
      setPoNumber(externalPoNumber);
      handleSearch(externalPoNumber);
    }
  }, [externalPoNumber]);

  const handleSearch = async (searchPo = poNumber) => {
    if (!searchPo) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await getMatchResult(searchPo);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch match result");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="match-card glass-panel">
      <h2>Three-Way Match Status</h2>
      
      <div className="form-group" style={{ flexDirection: 'row', gap: '1rem', alignItems: 'flex-end' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label>PO Number</label>
          <input 
            type="text" 
            placeholder="e.g. CI4PO05788" 
            value={poNumber}
            onChange={(e) => setPoNumber(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <button className="btn btn-primary" onClick={() => handleSearch()} disabled={loading}>
          {loading ? <div className="spinner"></div> : <Search size={20} />}
        </button>
      </div>

      {error && <div className="error-text">{error}</div>}

      {!result && !loading && !error && (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
          <FileSearch size={48} style={{ opacity: 0.5, margin: '0 auto 1rem' }} />
          <p>Search for a PO number to view match results</p>
        </div>
      )}

      {result && (
        <div style={{ marginTop: '1.5rem', animation: 'fadeInUp 0.4s ease-out' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>{result.poNumber}</h3>
            <span className={`status-badge status-${result.status}`}>
              {result.status.replace('_', ' ')}
            </span>
          </div>

          <div className="doc-stats">
            <div className="stat-box">
              <span>PO Docs</span>
              <strong>{result.currentDocuments.po}</strong>
            </div>
            <div className="stat-box">
              <span>GRN Docs</span>
              <strong>{result.currentDocuments.grn}</strong>
            </div>
            <div className="stat-box">
              <span>Invoices</span>
              <strong>{result.currentDocuments.invoice}</strong>
            </div>
          </div>

          {result.reasons && result.reasons.length > 0 && (
            <div style={{ marginTop: '2rem' }}>
              <h4 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Mismatch Reasons</h4>
              <ul className="reasons-list">
                {result.reasons.map((reason, idx) => (
                  <li key={idx}>{reason}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
