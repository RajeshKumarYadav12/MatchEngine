import { useState } from 'react'
import UploadSection from './components/UploadSection'
import MatchViewer from './components/MatchViewer'
import { Activity } from 'lucide-react'

function App() {
  const [recentPo, setRecentPo] = useState('');

  return (
    <div className="app-container">
      <header>
        <h1 className="gradient-text" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem'}}>
          <Activity size={36} color="var(--accent-primary)" />
          MatchEngine
        </h1>
        <p>Intelligent Three-Way Match for PO, GRN, and Invoices using Gemini AI</p>
      </header>

      <div className="main-content">
        <div>
          <UploadSection onUploadSuccess={(poNum) => setRecentPo(poNum)} />
        </div>
        <div>
          <MatchViewer externalPoNumber={recentPo} />
        </div>
      </div>
    </div>
  )
}

export default App
