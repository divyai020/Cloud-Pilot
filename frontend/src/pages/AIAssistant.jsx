import React, { useState, useRef, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import {
  Sparkles, Send, User, RotateCcw, Copy,
  ThumbsUp, ThumbsDown, Zap, TrendingDown,
  Shield, Server, BarChart2, ChevronRight, CheckCheck,
} from 'lucide-react';
import { askAssistant } from '../services/assistantService';

/* ── Canned AI responses keyed by topic ── */
const AI_RESPONSES = {
  cost: `Based on your current infrastructure scan, I found **3 cost optimisation opportunities**:

1. **EC2 Right-sizing** — Your i-001 instance (t3.xlarge) is running at ~18% average CPU. Downsizing to **t3.medium** saves ₹4,200/month with no performance impact.

2. **S3 Intelligent Tiering** — 60% of objects in your customer-data-backup bucket haven't been accessed in 90+ days. Enabling Intelligent-Tiering saves ~₹1,800/month automatically.

3. **Reserved Instances** — Switching RDS db.t3.large to a 1-year Reserved Instance saves **38%** — approximately ₹7,100/month.

**Total estimated savings: ₹13,100/month (₹1,57,200/year).**

Want me to generate a Simulator scenario for any of these?`,

  security: `I ran a quick security posture check and found **2 medium-risk items** and **1 high-risk item**:

🔴 **High** — Security Group sg-web-01 has port **22 (SSH) open to 0.0.0.0/0**. Restrict this to your office IP immediately.

🟡 **Medium** — S3 bucket customer-data-backup has **server-access logging disabled**. Enable it for SOC 2 / PCI-DSS compliance.

🟡 **Medium** — IAM user dev-deploy has not rotated access keys in **187 days** (recommended: every 90 days).

**Recommended next step:** I can walk you through remediating the SSH exposure in under 2 minutes.`,

  forecast: `Based on your spend trajectory and historical patterns, here is my projection for the next 3 months:

| Month | Projected Spend | vs. Today |
|---|---|---|
| November | ₹51,200 | +5.6% |
| December | ₹56,800 | +17.1% |
| January | ₹49,400 | +1.9% |

**Key drivers of the December spike:**
- Seasonal traffic increase (~35% more EC2 usage)
- RDS storage auto-expand expected around 18 Dec
- CloudFront data transfer peaks during holiday campaigns

**My recommendation:** Pre-warm Auto Scaling groups and consider a Compute Savings Plan before Nov 15 to lock in a 22% discount on the surge.`,

  resources: `Here is a live summary of your cloud inventory:

**Compute:** 4 EC2 instances — 2 healthy (t3.large, ap-south-1a/1b), 1 underutilised, 1 stopped
**Database:** RDS MySQL db.t3.large — Multi-AZ Active, 68% storage used (340 GB / 500 GB)
**Storage:** S3 — 4,200 GB across 3 buckets. Lifecycle policies active on 2 of 3.
**Serverless:** 4 Lambda functions — avg 18,200 invocations/month, p99 latency: 312ms
**Networking:** ALB with 3 target groups, all healthy. NAT Gateway — ₹3,400/month egress

**1 item needs attention:** Stopped EC2 instance i-web-staging has been idle for 23 days and is still incurring EBS charges (~₹380/month). Want me to recommend a cleanup plan?`,

  greeting: `Hello! 👋 I'm doing great and all your cloud systems are running smoothly today.
  
Your active infrastructure is healthy with an overall score of **94%**. What would you like to review?
- 💰 **Check cost savings** or potential overspending
- 🔒 **Inspect security risks** and open ports
- 📈 **Forecast next month's bill**
- 🖥️ **Review EC2 and RDS resources**`,

  default: `I'm analyzing your current cloud telemetry. Here is what I can help you with:

- 💰 **Cost Optimization** — Analyze underutilized EC2 instances, unattached EBS volumes, and S3 lifecycle savings.
- 🔒 **Security Audits** — Find open ingress rules (e.g., port 22/3389 exposed) and missing access logging.
- 📈 **Spend Forecasting** — Linear regression projection for your next month's cloud bill.
- 🖥️ **Resource Inventory** — Detailed breakdown of your compute, database, and storage assets.

Ask me a question like *"Where can I save money?"* or click any of the suggestion chips below!`
};

/* Detect topic from user message */
const detectTopic = (msg) => {
  const m = msg.toLowerCase().trim();
  if (m.match(/^(hi|hello|hey|howdy|sup|greetings|how are you|how r u|how do you do)/i) || m === 'hi' || m === 'hello') return 'greeting';
  if (m.includes('cost') || m.includes('sav') || m.includes('bill') || m.includes('spend') || m.includes('optim') || m.includes('money') || m.includes('price')) return 'cost';
  if (m.includes('secur') || m.includes('vulnerab') || m.includes('compliance') || m.includes('risk') || m.includes('threat') || m.includes('ssh') || m.includes('port') || m.includes('firewall')) return 'security';
  if (m.includes('forecast') || m.includes('predict') || m.includes('next month') || m.includes('project') || m.includes('trend')) return 'forecast';
  if (m.includes('resource') || m.includes('ec2') || m.includes('rds') || m.includes('s3') || m.includes('lambda') || m.includes('inventor') || m.includes('server') || m.includes('database')) return 'resources';
  return 'default';
};

/* Render markdown-lite: bold, inline code, tables, lists */
const applyInline = (text) => {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('`') && part.endsWith('`')) return <code key={i} className="ai-inline-code">{part.slice(1, -1)}</code>;
    return part;
  });
};

const renderText = (text) => {
  const lines = text.split('\n');
  const out = [];
  let tableRows = [];
  let inTable = false;

  const flushTable = () => {
    if (tableRows.length) {
      out.push(<div key={`table-${out.length}`} className="ai-table">{tableRows}</div>);
      tableRows = [];
      inTable = false;
    }
  };

  lines.forEach((line, li) => {
    if (line.startsWith('|')) {
      const cells = line.split('|').filter(Boolean).map(c => c.trim());
      if (cells.every(c => /^-+$/.test(c))) return; // skip separator
      const isHeader = !inTable;
      inTable = true;
      tableRows.push(
        <div key={li} className={`ai-table-row ${isHeader ? 'header' : ''}`}>
          {cells.map((c, ci) => <span key={ci} className="ai-table-cell">{applyInline(c)}</span>)}
        </div>
      );
    } else {
      flushTable();
      if (/^\d+\./.test(line)) {
        out.push(<div key={li} className="ai-list-item">{applyInline(line)}</div>);
      } else if (line.startsWith('- ') || line.startsWith('• ')) {
        out.push(<div key={li} className="ai-bullet"><span className="ai-bullet-dot" />{applyInline(line.slice(2))}</div>);
      } else if (!line.trim()) {
        out.push(<div key={li} className="ai-spacer" />);
      } else {
        out.push(<div key={li}>{applyInline(line)}</div>);
      }
    }
  });
  flushTable();
  return out;
};

/* Quick suggestion chips */
const SUGGESTIONS = [
  { icon: TrendingDown, label: 'Find cost savings',  color: '#10B981', msg: 'Where can I save money on my current infrastructure?' },
  { icon: Shield,       label: 'Security check',     color: '#EF4444', msg: 'Run a security posture check on my cloud resources' },
  { icon: BarChart2,    label: 'Spend forecast',     color: '#B28DFF', msg: 'Forecast my cloud spend for the next 3 months' },
  { icon: Server,       label: 'Resource summary',   color: '#38BDF8', msg: 'Give me a summary of all my cloud resources' },
];

const mkMsg = (role, text, metadata = {}) => ({
  id: Date.now() + Math.random(),
  role,
  text,
  ts: new Date(),
  ...metadata
});

const AIAssistant = () => {
  const [messages,  setMessages]  = useState([mkMsg('assistant', AI_RESPONSES.default)]);
  const [input,     setInput]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [copiedId,  setCopiedId]  = useState(null);
  const [reactions, setReactions] = useState({});
  const [expandedContext, setExpandedContext] = useState({});
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const toggleContext = (msgId) => {
    setExpandedContext(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;
    const userPrompt = text.trim();
    setMessages(prev => [...prev, mkMsg('user', userPrompt)]);
    setInput('');
    setLoading(true);

    try {
      const backendResult = await askAssistant(userPrompt);
      if (backendResult && (backendResult.answer || backendResult.response)) {
        const reply = backendResult.answer || backendResult.response;
        setMessages(prev => [
          ...prev,
          mkMsg('assistant', reply, {
            retrievedContext: backendResult.retrieved_context || [],
            category: backendResult.category || 'GENERAL',
            generationMode: backendResult.generation_mode || 'rag',
            sources: backendResult.sources || []
          })
        ]);
      } else {
        const topic = detectTopic(userPrompt);
        setMessages(prev => [...prev, mkMsg('assistant', AI_RESPONSES[topic])]);
      }
    } catch {
      const topic = detectTopic(userPrompt);
      setMessages(prev => [...prev, mkMsg('assistant', AI_RESPONSES[topic])]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleReset = () => {
    setMessages([mkMsg('assistant', AI_RESPONSES.default)]);
    setReactions({});
    setInput('');
    inputRef.current?.focus();
  };

  const fmt = (d) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main ai-assistant-main">

        {/* Header */}
        <div className="ai-page-header">
          <div className="ai-header-left">
            <div className="ai-header-icon"><Sparkles size={20} color="#B28DFF" /></div>
            <div>
              <h1 className="ai-page-title">AI Assistant</h1>
              <p className="ai-page-sub">Ask anything about your AWS infrastructure • Grounded with Live RAG</p>
            </div>
          </div>
          <button className="ai-reset-btn" onClick={handleReset}>
            <RotateCcw size={14} /> New Chat
          </button>
        </div>

        {/* Chat container */}
        <div className="ai-chat-wrap">

          {/* Suggestion chips — only on fresh chat */}
          {messages.length === 1 && (
            <div className="ai-suggestions-row">
              {SUGGESTIONS.map((s) => {
                const Icon = s.icon;
                return (
                  <button key={s.label} className="ai-suggestion-chip" onClick={() => sendMessage(s.msg)}>
                    <Icon size={15} color={s.color} style={{ flexShrink: 0 }} />
                    <span>{s.label}</span>
                    <ChevronRight size={12} color="#475569" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Message list */}
          <div className="ai-messages-list">
            {messages.map((msg) => (
              <div key={msg.id} className={`ai-message-row ${msg.role}`}>
                <div className={`ai-avatar ${msg.role}`}>
                  {msg.role === 'assistant' ? <Sparkles size={15} color="#B28DFF" /> : <User size={15} color="#94A3B8" />}
                </div>
                <div className="ai-bubble-col">
                  <div className={`ai-bubble ${msg.role}`}>
                    <div className="ai-bubble-text">{renderText(msg.text)}</div>

                    {/* RAG Context Evidence Drawer */}
                    {msg.role === 'assistant' && msg.retrievedContext && msg.retrievedContext.length > 0 && (
                      <div className="ai-rag-evidence-container" style={{ marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '8px' }}>
                        <button
                          type="button"
                          onClick={() => toggleContext(msg.id)}
                          style={{
                            background: 'rgba(178, 141, 255, 0.08)',
                            border: '1px solid rgba(178, 141, 255, 0.25)',
                            color: '#B28DFF',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <Zap size={12} />
                          {expandedContext[msg.id] ? 'Hide' : 'Show'} Grounded Cloud Telemetry ({msg.retrievedContext.length} Sources)
                        </button>

                        {expandedContext[msg.id] && (
                          <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {msg.retrievedContext.map((c, cIdx) => (
                              <div
                                key={cIdx}
                                style={{
                                  background: 'rgba(15, 23, 42, 0.6)',
                                  border: '1px solid rgba(255, 255, 255, 0.06)',
                                  borderRadius: '6px',
                                  padding: '8px 10px',
                                  fontSize: '11px',
                                  color: '#CBD5E1'
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#94A3B8' }}>
                                  <span style={{ fontWeight: 600, textTransform: 'uppercase', color: '#38BDF8' }}>
                                    {c.source_type} {c.resource_id ? `• ${c.resource_id}` : ''}
                                  </span>
                                  {c.score && (
                                    <span style={{ color: '#10B981', fontWeight: 600 }}>
                                      Relevance: {Math.round(c.score * 100)}%
                                    </span>
                                  )}
                                </div>
                                <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '10.5px', color: '#E2E8F0', maxHeight: '100px', overflowY: 'auto' }}>
                                  {c.content}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {msg.role === 'assistant' && (
                    <div className="ai-bubble-actions">
                      <span className="ai-msg-time">{fmt(msg.ts)}</span>
                      {msg.generationMode && (
                        <span style={{ fontSize: '10px', color: '#B28DFF', background: 'rgba(178,141,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                          {msg.generationMode === 'llm' ? '🤖 Gemini LLM' : '⚡ Grounded RAG'}
                        </span>
                      )}
                      <button className="ai-action-btn" onClick={() => handleCopy(msg.id, msg.text)}>
                        {copiedId === msg.id ? <CheckCheck size={13} color="#10B981" /> : <Copy size={13} />}
                      </button>
                      <button className={`ai-action-btn ${reactions[msg.id] === 'up' ? 'reacted' : ''}`} onClick={() => setReactions(p => ({ ...p, [msg.id]: 'up' }))}>
                        <ThumbsUp size={13} />
                      </button>
                      <button className={`ai-action-btn ${reactions[msg.id] === 'down' ? 'reacted' : ''}`} onClick={() => setReactions(p => ({ ...p, [msg.id]: 'down' }))}>
                        <ThumbsDown size={13} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="ai-message-row assistant">
                <div className="ai-avatar assistant"><Sparkles size={15} color="#B28DFF" /></div>
                <div className="ai-bubble-col">
                  <div className="ai-bubble assistant ai-typing-bubble">
                    <span className="ai-typing-dot" />
                    <span className="ai-typing-dot" />
                    <span className="ai-typing-dot" />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input */}
        <div className="ai-input-wrap">
          <div className="ai-input-box">
            <Zap size={15} color="#4B5563" className="ai-input-icon" />
            <textarea
              ref={inputRef}
              className="ai-textarea"
              placeholder="Ask about costs, security, forecasts, resources…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <button
              className={`ai-send-btn ${input.trim() && !loading ? 'active' : ''}`}
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
            >
              <Send size={15} />
            </button>
          </div>
          <p className="ai-input-hint">
            Press <kbd>Enter</kbd> to send &nbsp;·&nbsp; <kbd>Shift+Enter</kbd> for new line
          </p>
        </div>

      </main>
    </div>
  );
};

export default AIAssistant;
