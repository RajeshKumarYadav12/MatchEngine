import { useState } from 'react';
import { UploadCloud, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { uploadDocument } from '../api';

export default function UploadSection({ onUploadSuccess }) {
  const [poFile, setPoFile] = useState(null);
  const [grnFile, setGrnFile] = useState(null);
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleUpload = async () => {
    if (!poFile || !grnFile || !invoiceFile) {
      setError("Please select all three files (PO, GRN, and Invoice) before submitting.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Upload the three files sequentially to avoid hitting Gemini free-tier concurrency limits
      const poData = await uploadDocument(poFile, 'po');
      const grnData = await uploadDocument(grnFile, 'grn');
      const invoiceData = await uploadDocument(invoiceFile, 'invoice');
      
      setSuccess(true);
      
      // Reset files after successful upload
      setPoFile(null);
      setGrnFile(null);
      setInvoiceFile(null);

      // Trigger the match using the poNumber from the PO upload response
      if (onUploadSuccess && poData.poNumber) {
        onUploadSuccess(poData.poNumber);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const FileUploader = ({ title, file, setFile, id }) => (
    <div className="form-group" style={{ flex: 1 }}>
      <label>{title}</label>
      <div 
        className={`file-drop-zone ${file ? 'active' : ''}`}
        onClick={() => document.getElementById(id).click()}
      >
        {file ? <FileText size={48} className="file-icon" /> : <UploadCloud size={48} className="file-icon" />}
        <p style={{fontSize: '12px', margin: '10px 0 0 0'}}>{file ? file.name : "Click to select PDF"}</p>
        <input 
          type="file" 
          id={id} 
          accept="application/pdf"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              setFile(e.target.files[0]);
              setError(null);
              setSuccess(false);
            }
          }}
          style={{ display: 'none' }} 
        />
      </div>
    </div>
  );

  return (
    <div className="upload-card glass-panel" style={{ maxWidth: '800px', width: '100%' }}>
      <h2>Simultaneous Upload & Match</h2>
      <p style={{marginBottom: '20px', color: 'var(--text-secondary)'}}>
        Select the PO, GRN, and Invoice documents. They will be parsed and matched simultaneously.
      </p>
      
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <FileUploader title="Purchase Order (PO)" file={poFile} setFile={setPoFile} id="po-upload" />
        <FileUploader title="Goods Receipt (GRN)" file={grnFile} setFile={setGrnFile} id="grn-upload" />
        <FileUploader title="Invoice" file={invoiceFile} setFile={setInvoiceFile} id="inv-upload" />
      </div>

      {error && <div className="error-text"><AlertCircle size={16} style={{display:'inline', verticalAlign:'middle'}}/> {error}</div>}
      {success && <div style={{color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '15px'}}><CheckCircle size={16} /> Upload & Parsing successful!</div>}

      <button className="btn btn-primary" onClick={handleUpload} disabled={loading || !poFile || !grnFile || !invoiceFile} style={{width: '100%'}}>
        {loading ? <div className="spinner"></div> : 'Submit and Perform Three-Way Match'}
      </button>
    </div>
  );
}
