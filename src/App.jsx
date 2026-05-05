import React, { useState, useCallback } from 'react';
import { scanText } from './api';
import './App.css';

const SAMPLES = {
  email: `To: hr@company.com\nFrom: admin@internal.org\n\nEmployee records:\nName: Priya Sharma\nPhone: 9876543210\nEmail: priya.sharma@corp.com\nAadhaar: 2345 6789 0123\nPAN: ABCDE1234F\n\nThis document is confidential.`,
  aadhaar: `Customer Export - Restricted\nAadhaar: 5678 1234 9012\nPAN: PQRST5678Y\nCC: 4111111111111111`,
  api: `api_key = sk-prod-xyz987abc123secret\ntoken: eyJhbGciOiJIUzI1NiJ9.test\npassword = MyS3cur3P@ss123!\ndb_host = 192.168.1.100`,
  clean: `Q3 Performance Report\n\nOur product lines showed strong growth. Customer satisfaction reached 94%. The engineering team launched three features ahead of schedule.`,
};

const RISK_ICONS = { CRITICAL: '⛔', HIGH: '⚠️', MEDIUM: '🔔', SAFE: '✅' };
const RISK_TITLES = { CRITICAL: 'CRITICAL RISK DETECTED', HIGH: 'HIGH RISK DETECTED', MEDIUM: 'MEDIUM RISK DETECTED', SAFE: 'NO THREATS FOUND' };

export default function App() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ total: 0, threats: 0, high: 0, clean: 0 });

  const handleScan = useCallback(async () => {
    if (!text.trim()) return;
    setLoading(true); setResult(null); setAiText(''); setAiLoading(false);
    try {
      const data = await scanText(text);
      setResult(data);
      setStats(s => ({ total: s.total+1, threats: s.threats+data.total_findings, high: s.high+(['CRITICAL','HIGH'].includes(data.risk_level)?1:0), clean: s.clean+(data.safe?1:0) }));
      setLogs(l => [{ time: new Date().toLocaleTimeString(), risk: data.risk_level, count: data.total_findings }, ...l.slice(0,14)]);
      if (!data.safe) { setAiLoading(true); callAI(data); }
    } catch (err) { alert('Could not connect to backend API.'); }
    finally { setLoading(false); }
  }, [text]);

  const callAI = async (data) => {
    try {
      const types = [...new Set(data.findings.map(f => f.type))].join(', ');
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, messages: [{ role: 'user', content: `Cybersecurity expert. Scan found ${data.total_findings} items: ${types}. Risk: ${data.risk_level}. In 2 sentences: explain danger and give one fix.` }] }),
      });
      const json = await resp.json();
      setAiText(json?.content?.[0]?.text || '');
    } catch(e) { setAiText(''); } finally { setAiLoading(false); }
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="logo">
          <div className="logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#0a0e1a">
              <path d="M12 1L3 5v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V5L12 1zm0 4l5 2.2V11c0 3.5-2.4 6.8-5 7.9-2.6-1.1-5-4.4-5-7.9V7.2L12 5z"/>
            </svg>
          </div>
          <span className="logo-name"><span className="accent">Data</span>Guard AI</span>
        </div>
        <div className="status-pill"><div className="pulse-dot"></div>System Active</div>
      </header>

      <div className="main">
        <div className="left">
          <div className="sec-title">Load Sample Data</div>
          <div className="sample-row">
            {Object.entries({ email:'Email leak', aadhaar:'Aadhaar/PAN', api:'API key leak', clean:'Clean text' }).map(([k,v]) => (
              <button key={k} className="s-btn" onClick={() => setText(SAMPLES[k])}>{v}</button>
            ))}
          </div>
          <div className="sec-title">Paste Text to Scan</div>
          <div className="scan-box">
            <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Paste any text — emails, config files, documents — DataGuard AI detects PAN, Aadhaar, phone numbers, API keys, passwords, credit cards..." />
            <div className="scan-footer">
              <button className="btn-primary" onClick={handleScan} disabled={loading||!text.trim()}>{loading?'Scanning...':'Scan Now'}</button>
              <button className="btn-ghost" onClick={() => { setText(''); setResult(null); setAiText(''); }}>Clear</button>
              <span className="char-count">{text.length} chars</span>
            </div>
          </div>

          {loading && <div className="spinner-wrap"><div className="spinner"></div><div className="spin-text">Scanning for sensitive data...</div></div>}

          {result && !loading && (
            <div className="result-area">
              <div className={`risk-bar risk-${result.risk_level}`}>
                <span className="r-icon">{RISK_ICONS[result.risk_level]}</span>
                <div><div className="r-title">{RISK_TITLES[result.risk_level]}</div><div className="r-sub">{result.total_findings} finding(s) · ID: {result.scan_id?.slice(0,8)}</div></div>
              </div>
              <div className="sec-title" style={{marginTop:14}}>Findings</div>
              <div className="findings-list">
                {result.safe ? (
                  <div className="safe-box"><div style={{fontSize:28,marginBottom:8}}>🛡️</div><div className="safe-title">All Clear</div><div className="safe-sub">No sensitive data detected</div></div>
                ) : result.findings.map(f => (
                  <div key={f.id} className="f-card">
                    <div className="f-top"><span className="f-name">{f.type}</span><span className={`badge sev-${f.severity}`}>{f.severity}</span></div>
                    <div className="f-val">{f.masked_value}</div>
                  </div>
                ))}
              </div>
              {aiLoading && <div className="ai-loading">AI analyzing risk context...</div>}
              {aiText && <div className="ai-box"><div className="ai-label">AI Risk Assessment</div><div className="ai-text">{aiText}</div></div>}
            </div>
          )}
        </div>

        <div className="right">
          <div className="sec-title">Session Stats</div>
          <div className="stats-grid">
            <div className="stat"><div className="snum blue">{stats.total}</div><div className="slbl">Scans</div></div>
            <div className="stat"><div className="snum red">{stats.threats}</div><div className="slbl">Threats</div></div>
            <div className="stat"><div className="snum warn">{stats.high}</div><div className="slbl">High Risk</div></div>
            <div className="stat"><div className="snum green">{stats.clean}</div><div className="slbl">Clean</div></div>
          </div>
          <div className="sec-title">Scan History</div>
          <div className="log-list">
            {logs.length===0 ? <div className="empty-log">No scans yet</div> : logs.map((l,i) => (
              <div key={i} className="log-item">
                <div className="log-top"><span className="log-src">Manual Scan</span><span className={`log-dot dot-${l.risk}`}></span></div>
                <div className="log-meta">{l.time} · {l.count} finding(s) · {l.risk}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
