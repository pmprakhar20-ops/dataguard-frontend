import React, { useState, useCallback } from 'react';
import styled, { keyframes, createGlobalStyle } from 'styled-components';
import { scanText } from './api';

// ── Animations ────────────────────────────────────────────────────────────────
const pulse = keyframes`0%,100%{opacity:1}50%{opacity:0.3}`;
const spin = keyframes`to{transform:rotate(360deg)}`;
const blink = keyframes`0%,100%{opacity:1}50%{opacity:0.4}`;
const fadeIn = keyframes`from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}`;

// ── Styled Components ─────────────────────────────────────────────────────────
const Topbar = styled.div`
  background: var(--surface); border-bottom: 1px solid var(--border);
  padding: 14px 24px; display: flex; align-items: center; justify-content: space-between;
  position: sticky; top: 0; z-index: 100;
`;
const LogoWrap = styled.div`display:flex;align-items:center;gap:10px`;
const LogoIcon = styled.div`
  width:32px;height:32px;background:var(--accent);border-radius:6px;
  display:flex;align-items:center;justify-content:center;flex-shrink:0;
`;
const LogoName = styled.div`
  font-size:16px;font-weight:700;letter-spacing:0.5px;
  span{color:var(--accent)}
`;
const StatusPill = styled.div`
  background:#0d2a1a;border:1px solid var(--success);color:var(--success);
  font-size:11px;font-family:var(--mono);padding:4px 12px;border-radius:20px;
  display:flex;align-items:center;gap:6px;flex-shrink:0;
`;
const PulseDot = styled.div`
  width:7px;height:7px;background:var(--success);border-radius:50%;
  animation:${pulse} 1.5s infinite;
`;
const Main = styled.div`
  display:grid;grid-template-columns:1fr 300px;min-height:calc(100vh - 61px);
  @media(max-width:768px){grid-template-columns:1fr}
`;
const Left = styled.div`padding:22px;border-right:1px solid var(--border);@media(max-width:768px){border-right:none}`;
const Right = styled.div`padding:22px;background:var(--surface);@media(max-width:768px){border-top:1px solid var(--border)}`;
const SecTitle = styled.div`
  font-size:10px;font-family:var(--mono);color:var(--muted);
  text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px;
`;
const SampleRow = styled.div`display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px`;
const SampleBtn = styled.button`
  background:var(--surface2);border:1px solid var(--border);color:var(--muted);
  font-size:11px;font-family:var(--mono);padding:5px 11px;border-radius:20px;cursor:pointer;
  transition:all 0.15s;
  &:hover{border-color:var(--accent);color:var(--accent)}
`;
const ScanBox = styled.div`
  background:var(--surface2);border:1px solid var(--border);border-radius:10px;
  overflow:hidden;margin-bottom:16px;
`;
const TextArea = styled.textarea`
  width:100%;background:transparent;border:none;color:var(--text);
  font-family:var(--mono);font-size:12px;padding:14px;resize:none;outline:none;
  line-height:1.7;min-height:160px;
  &::placeholder{color:var(--muted)}
`;
const ScanFooter = styled.div`
  padding:10px 14px;border-top:1px solid var(--border);background:var(--surface3);
  display:flex;align-items:center;gap:8px;
`;
const BtnPrimary = styled.button`
  background:var(--accent);color:#000;font-weight:700;font-size:13px;border:none;
  border-radius:6px;padding:9px 22px;cursor:pointer;transition:all 0.2s;
  &:hover{background:var(--accent2);transform:translateY(-1px)}
  &:disabled{opacity:0.4;cursor:not-allowed;transform:none}
`;
const BtnGhost = styled.button`
  background:transparent;color:var(--muted);font-size:12px;border:1px solid var(--border);
  border-radius:6px;padding:9px 14px;cursor:pointer;
  &:hover{color:var(--text)}
`;
const CharCount = styled.span`margin-left:auto;font-size:10px;font-family:var(--mono);color:var(--muted)`;
const SpinWrap = styled.div`text-align:center;padding:28px`;
const Spinner = styled.div`
  width:28px;height:28px;border:2px solid var(--border);border-top-color:var(--accent);
  border-radius:50%;animation:${spin} 0.7s linear infinite;margin:0 auto 10px;
`;
const SpinText = styled.div`font-size:11px;font-family:var(--mono);color:var(--accent)`;
const ResultWrap = styled.div`animation:${fadeIn} 0.3s ease`;

const riskColors = {
  CRITICAL: { bg: '#1f0508', border: 'var(--danger)', color: 'var(--danger)' },
  HIGH:     { bg: '#1f1000', border: 'var(--warn)',   color: 'var(--warn)'   },
  MEDIUM:   { bg: '#1a1800', border: '#ffd32a',       color: '#ffd32a'       },
  SAFE:     { bg: '#071a0d', border: 'var(--success)', color: 'var(--success)'},
};
const RiskBar = styled.div`
  border-radius:8px;padding:12px 16px;margin-bottom:14px;
  display:flex;align-items:center;gap:10px;border-left:4px solid;
  background:${p => riskColors[p.risk]?.bg || '#071a0d'};
  border-color:${p => riskColors[p.risk]?.border || 'var(--success)'};
`;
const RiskIcon = styled.div`font-size:22px`;
const RiskTitle = styled.div`
  font-size:13px;font-weight:700;font-family:var(--mono);letter-spacing:0.5px;
  color:${p => riskColors[p.risk]?.color || 'var(--success)'};
`;
const RiskSub = styled.div`font-size:11px;color:var(--muted);margin-top:2px`;
const FindingsList = styled.div`display:flex;flex-direction:column;gap:7px`;
const FindingCard = styled.div`
  background:var(--surface2);border:1px solid var(--border);border-radius:8px;
  padding:11px 13px;animation:${fadeIn} 0.3s ease;
`;
const FindingTop = styled.div`display:flex;align-items:center;justify-content:space-between;margin-bottom:5px`;
const FindingName = styled.div`font-size:12px;font-weight:600;color:var(--text)`;
const sevColors = {
  CRITICAL: { bg: '#2a0508', color: 'var(--danger)', border: 'var(--danger)' },
  HIGH:     { bg: '#2a1200', color: 'var(--warn)',   border: 'var(--warn)'   },
  MEDIUM:   { bg: '#1a1a00', color: '#ffd32a',       border: '#ffd32a'       },
};
const Badge = styled.span`
  font-size:9px;font-family:var(--mono);padding:2px 7px;border-radius:10px;font-weight:700;
  background:${p => sevColors[p.sev]?.bg || '#0d1f0d'};
  color:${p => sevColors[p.sev]?.color || 'var(--success)'};
  border:1px solid ${p => sevColors[p.sev]?.border || 'var(--success)'};
`;
const FindingVal = styled.div`
  font-size:11px;font-family:var(--mono);color:var(--muted);
  background:var(--surface3);padding:3px 7px;border-radius:4px;
  margin-top:4px;word-break:break-all;
`;
const SafeBox = styled.div`
  text-align:center;padding:28px;background:var(--surface2);
  border:1px solid var(--border);border-radius:8px;
`;
const AIBox = styled.div`
  background:var(--surface2);border:1px solid var(--border);border-radius:8px;
  padding:13px;margin-top:13px;animation:${fadeIn} 0.4s ease;
`;
const AILabel = styled.div`
  font-size:9px;font-family:var(--mono);color:var(--accent);
  text-transform:uppercase;letter-spacing:1px;margin-bottom:7px;
`;
const AIText = styled.div`font-size:12px;line-height:1.75;color:var(--text)`;
const AILoading = styled.div`
  font-size:11px;font-family:var(--mono);color:var(--accent);
  animation:${blink} 1s infinite;padding:8px 0;
`;
const StatsGrid = styled.div`display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:18px`;
const StatCard = styled.div`
  background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:11px;
`;
const StatNum = styled.div`
  font-size:20px;font-weight:700;font-family:var(--mono);
  color:${p => p.c === 'blue' ? 'var(--accent)' : p.c === 'red' ? 'var(--danger)' : p.c === 'warn' ? 'var(--warn)' : 'var(--success)'};
`;
const StatLabel = styled.div`font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:0.8px;margin-top:2px`;
const LogWrap = styled.div`max-height:300px;overflow-y:auto;display:flex;flex-direction:column;gap:5px`;
const LogItem = styled.div`
  background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:9px 11px;
`;
const LogTop = styled.div`display:flex;align-items:center;justify-content:space-between`;
const LogSrc = styled.div`font-size:11px;font-family:var(--mono);color:var(--text)`;
const LogDot = styled.div`
  width:7px;height:7px;border-radius:50%;flex-shrink:0;
  background:${p => (p.risk === 'SAFE') ? 'var(--success)' : (p.risk === 'MEDIUM') ? 'var(--warn)' : 'var(--danger)'};
`;
const LogMeta = styled.div`font-size:10px;color:var(--muted);font-family:var(--mono);margin-top:3px`;
const Empty = styled.div`text-align:center;padding:20px;font-size:11px;color:var(--muted);font-family:var(--mono)`;

// ── Sample Data ───────────────────────────────────────────────────────────────
const SAMPLES = {
  email: `To: hr@company.com\nFrom: admin@internal.org\n\nEmployee records attached.\nName: Priya Sharma\nPhone: 9876543210\nEmail: priya.sharma@corp.com\nAadhaar: 2345 6789 0123\nPAN: ABCDE1234F\n\nThis document is confidential. Internal use only.`,
  aadhaar: `Customer Export - Restricted\nID: 10045\nAadhaar: 5678 1234 9012\nPAN: PQRST5678Y\nCC: 4111111111111111\nFor internal use only.`,
  api: `# Config Dump\napi_key = sk-prod-xyz987abc123secret\ntoken: eyJhbGciOiJIUzI1NiJ9.test\npassword = MyS3cur3P@ss123!\ndb_host = 192.168.1.100\ncontact: devops@startup.io`,
  clean: `Q3 Performance Report\n\nOur product lines showed strong growth this quarter. Customer satisfaction scores reached an all-time high of 94%. The engineering team launched three major features ahead of schedule.`,
};

// ── App Component ─────────────────────────────────────────────────────────────
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
    setLoading(true);
    setResult(null);
    setAiText('');
    setAiLoading(false);
    try {
      const data = await scanText(text);
      setResult(data);
      setStats(s => ({
        total: s.total + 1,
        threats: s.threats + data.total_findings,
        high: s.high + (['CRITICAL', 'HIGH'].includes(data.risk_level) ? 1 : 0),
        clean: s.clean + (data.safe ? 1 : 0),
      }));
      setLogs(l => [{ time: new Date().toLocaleTimeString(), risk: data.risk_level, count: data.total_findings }, ...l.slice(0, 14)]);

      if (!data.safe) {
        setAiLoading(true);
        await callAI(data);
      }
    } catch (err) {
      alert('Could not connect to backend. Make sure the API server is running on port 8000.');
    } finally {
      setLoading(false);
    }
  }, [text]);

  const callAI = async (data) => {
    try {
      const types = [...new Set(data.findings.map(f => f.type))].join(', ');
      const prompt = `You are a concise cybersecurity expert. A data leakage scan found ${data.total_findings} item(s): ${types}. Risk level: ${data.risk_level}. In exactly 2 sentences: explain the specific danger and give one concrete fix. Be direct, no fluff.`;
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, messages: [{ role: 'user', content: prompt }] }),
      });
      const json = await resp.json();
      setAiText(json?.content?.[0]?.text || '');
    } catch (e) {
      setAiText('');
    } finally {
      setAiLoading(false);
    }
  };

  const riskIcons = { CRITICAL: '⛔', HIGH: '⚠️', MEDIUM: '🔔', SAFE: '✅' };
  const riskTitles = { CRITICAL: 'CRITICAL RISK DETECTED', HIGH: 'HIGH RISK DETECTED', MEDIUM: 'MEDIUM RISK', SAFE: 'NO THREATS FOUND' };

  return (
    <>
      <Topbar>
        <LogoWrap>
          <LogoIcon>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#0a0e1a">
              <path d="M12 1L3 5v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V5L12 1zm0 4l5 2.2V11c0 3.5-2.4 6.8-5 7.9-2.6-1.1-5-4.4-5-7.9V7.2L12 5z"/>
            </svg>
          </LogoIcon>
          <LogoName><span>Data</span>Guard AI</LogoName>
        </LogoWrap>
        <StatusPill><PulseDot />System Active</StatusPill>
      </Topbar>

      <Main>
        <Left>
          <SecTitle>Load Sample Data</SecTitle>
          <SampleRow>
            {Object.keys(SAMPLES).map(k => (
              <SampleBtn key={k} onClick={() => setText(SAMPLES[k])}>
                {k === 'email' ? 'Email leak' : k === 'aadhaar' ? 'Aadhaar / PAN' : k === 'api' ? 'API key leak' : 'Clean text'}
              </SampleBtn>
            ))}
          </SampleRow>

          <SecTitle>Paste Text to Scan</SecTitle>
          <ScanBox>
            <TextArea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Paste any text here — emails, documents, config files, logs — DataGuard AI will detect PAN, Aadhaar, emails, phone numbers, API keys, passwords, credit cards and more..."
            />
            <ScanFooter>
              <BtnPrimary onClick={handleScan} disabled={loading || !text.trim()}>
                {loading ? 'Scanning...' : 'Scan Now'}
              </BtnPrimary>
              <BtnGhost onClick={() => { setText(''); setResult(null); setAiText(''); }}>Clear</BtnGhost>
              <CharCount>{text.length} chars</CharCount>
            </ScanFooter>
          </ScanBox>

          {loading && (
            <SpinWrap>
              <Spinner />
              <SpinText>Scanning for sensitive data patterns...</SpinText>
            </SpinWrap>
          )}

          {result && !loading && (
            <ResultWrap>
              <RiskBar risk={result.risk_level}>
                <RiskIcon>{riskIcons[result.risk_level]}</RiskIcon>
                <div>
                  <RiskTitle risk={result.risk_level}>{riskTitles[result.risk_level]}</RiskTitle>
                  <RiskSub>{result.total_findings} finding(s) detected · Scan ID: {result.scan_id?.slice(0, 8)}</RiskSub>
                </div>
              </RiskBar>

              <SecTitle>Detected Findings</SecTitle>
              <FindingsList>
                {result.safe ? (
                  <SafeBox>
                    <div style={{ fontSize: 30, marginBottom: 8 }}>🛡️</div>
                    <div style={{ fontSize: 13, color: 'var(--success)', fontWeight: 600 }}>All Clear</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>No sensitive data detected</div>
                  </SafeBox>
                ) : (
                  result.findings.map(f => (
                    <FindingCard key={f.id}>
                      <FindingTop>
                        <FindingName>{f.type}</FindingName>
                        <Badge sev={f.severity}>{f.severity}</Badge>
                      </FindingTop>
                      <FindingVal>{f.masked_value}</FindingVal>
                    </FindingCard>
                  ))
                )}
              </FindingsList>

              {aiLoading && <AILoading>AI analyzing risk context...</AILoading>}
              {aiText && (
                <AIBox>
                  <AILabel>AI Risk Assessment</AILabel>
                  <AIText>{aiText}</AIText>
                </AIBox>
              )}
            </ResultWrap>
          )}
        </Left>

        <Right>
          <SecTitle>Session Stats</SecTitle>
          <StatsGrid>
            <StatCard><StatNum c="blue">{stats.total}</StatNum><StatLabel>Total Scans</StatLabel></StatCard>
            <StatCard><StatNum c="red">{stats.threats}</StatNum><StatLabel>Threats</StatLabel></StatCard>
            <StatCard><StatNum c="warn">{stats.high}</StatNum><StatLabel>High Risk</StatLabel></StatCard>
            <StatCard><StatNum c="green">{stats.clean}</StatNum><StatLabel>Clean</StatLabel></StatCard>
          </StatsGrid>

          <SecTitle>Scan History</SecTitle>
          <LogWrap>
            {logs.length === 0 ? (
              <Empty>No scans yet</Empty>
            ) : (
              logs.map((l, i) => (
                <LogItem key={i}>
                  <LogTop>
                    <LogSrc>Manual Scan</LogSrc>
                    <LogDot risk={l.risk} />
                  </LogTop>
                  <LogMeta>{l.time} · {l.count} finding(s) · {l.risk}</LogMeta>
                </LogItem>
              ))
            )}
          </LogWrap>
        </Right>
      </Main>
    </>
  );
}
