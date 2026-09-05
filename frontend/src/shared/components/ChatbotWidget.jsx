import { useState, useEffect, useRef } from 'react';
import {
  Bot,
  X,
  Send,
  Sparkles,
  User,
  MessageSquare,
  Copy,
  Check,
  RotateCcw,
  Volume2,
  VolumeX,
  ThumbsUp,
  ThumbsDown,
  Maximize2,
  Minimize2,
  Trash2,
  Code2,
} from 'lucide-react';
import api from '../api';

const QUICK_CHIPS = [
  'How is my streak calculated?',
  'How do I start my roadmap?',
  'How does job match % work?',
  'What is Skill Twin?',
  'How do I earn badges?',
];

// ─── Code Block Renderer with Copy Button ────────────────────────────────────
function CodeBlock({ code, language = 'javascript' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2 rounded-xl border border-border bg-[#0d1117] overflow-hidden text-[11px] font-mono shadow-sm">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#161b22] border-b border-border/40 text-muted">
        <span className="flex items-center gap-1.5 text-[10.5px] font-medium text-accent-blue">
          <Code2 size={13} /> {language}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[10px] text-muted hover:text-text hover:bg-card px-2 py-0.5 rounded transition-colors"
          title="Copy code"
        >
          {copied ? <Check size={12} className="text-accent-green" /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy code'}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto text-accent-green leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// ─── Professional Message Renderer ──────────────────────────────────────────
function MessageRenderer({ content }) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === '') {
      i++;
      continue;
    }

    // --- Fenced Code Block ``` ---
    if (line.trim().startsWith('```')) {
      const langMatch = line.trim().match(/^```(\w+)?/);
      const lang = langMatch ? langMatch[1] || 'code' : 'code';
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      elements.push(
        <CodeBlock key={`code-${i}`} code={codeLines.join('\n')} language={lang} />
      );
      continue;
    }

    // --- Blockquote: > text ---
    if (line.startsWith('> ')) {
      const text = line.slice(2);
      elements.push(
        <div
          key={i}
          className="border-l-2 border-accent-blue/60 pl-2.5 my-1.5 text-[11px] text-muted italic bg-surface/40 py-1 rounded-r-md"
        >
          <InlineText text={text} />
        </div>
      );
      i++;
      continue;
    }

    // --- Heading: **text** on its own line ---
    if (/^\*\*.+\*\*$/.test(line.trim())) {
      const text = line.trim().replace(/^\*\*|\*\*$/g, '');
      elements.push(
        <p key={i} className="font-bold text-text text-[12px] mt-2 mb-0.5">
          {text}
        </p>
      );
      i++;
      continue;
    }

    // --- Numbered list: 1. text ---
    if (/^\d+\.\s/.test(line)) {
      const listItems = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        const match = lines[i].match(/^(\d+)\.\s(.+)/);
        if (match) {
          listItems.push({ num: match[1], text: match[2] });
        }
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="space-y-1 my-1.5 ml-1">
          {listItems.map((item, idx) => (
            <li key={idx} className="flex gap-2 text-[11.5px] text-text">
              <span className="flex-shrink-0 w-4 h-4 rounded-full bg-accent-blue/20 text-accent-blue text-[10px] font-bold flex items-center justify-center mt-0.5">
                {item.num}
              </span>
              <span className="leading-relaxed"><InlineText text={item.text} /></span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // --- Bullet list: - text or • text ---
    if (/^[-•]\s/.test(line)) {
      const listItems = [];
      while (i < lines.length && /^[-•]\s/.test(lines[i])) {
        listItems.push(lines[i].replace(/^[-•]\s/, ''));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="space-y-1 my-1.5 ml-1">
          {listItems.map((item, idx) => (
            <li key={idx} className="flex gap-2 text-[11.5px] text-text">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-blue flex-shrink-0 mt-1.5" />
              <span className="leading-relaxed"><InlineText text={item} /></span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // --- Markdown table: | col | col | ---
    if (line.includes('|')) {
      const tableLines = [];
      while (i < lines.length && lines[i].includes('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      const rows = tableLines
        .filter(l => !l.replace(/[|\-\s]/g, '').length === 0 && !/^[\s|:-]+$/.test(l))
        .map(l =>
          l
            .split('|')
            .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
            .map(cell => cell.trim())
        );
      if (rows.length >= 2) {
        const [header, ...body] = rows;
        elements.push(
          <div key={`table-${i}`} className="overflow-x-auto my-2 rounded-lg border border-border">
            <table className="w-full text-[11px]">
              <thead className="bg-surface">
                <tr>
                  {header.map((h, idx) => (
                    <th key={idx} className="px-2.5 py-1.5 text-left font-semibold text-accent-blue border-b border-border">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {body.map((row, rIdx) => (
                  <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-card' : 'bg-surface'}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-2.5 py-1.5 text-text">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      continue;
    }

    // --- Inline Code: `code` alone on a line ---
    if (/^`.+`$/.test(line.trim())) {
      const code = line.trim().replace(/^`|`$/g, '');
      elements.push(
        <code key={i} className="block bg-surface border border-border rounded px-2.5 py-1 text-[11px] font-mono text-accent-green my-1">
          {code}
        </code>
      );
      i++;
      continue;
    }

    // --- Normal paragraph ---
    elements.push(
      <p key={i} className="text-[11.5px] text-text leading-relaxed">
        <InlineText text={line} />
      </p>
    );
    i++;
  }

  return <div className="space-y-0.5">{elements}</div>;
}

// Renders inline markdown: **bold**, `code`
function InlineText({ text }) {
  const parts = [];
  const regex = /(\*\*.+?\*\*|`.+?`)/g;
  let last = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(<span key={key++}>{text.slice(last, match.index)}</span>);
    }
    const raw = match[0];
    if (raw.startsWith('**')) {
      parts.push(
        <strong key={key++} className="font-semibold text-text">
          {raw.slice(2, -2)}
        </strong>
      );
    } else {
      parts.push(
        <code key={key++} className="bg-surface border border-border rounded px-1 py-0.5 text-[10.5px] font-mono text-accent-green">
          {raw.slice(1, -1)}
        </code>
      );
    }
    last = match.index + raw.length;
  }

  if (last < text.length) {
    parts.push(<span key={key++}>{text.slice(last)}</span>);
  }

  return <>{parts}</>;
}

// ─── Assistant Interactive Message Component (Typewriter & Actions) ─────────
function AssistantMessage({ msg, onRegenerate, isLatest }) {
  const [displayedText, setDisplayedText] = useState(isLatest && msg.isNew ? '' : msg.content);
  const [isTyping, setIsTyping] = useState(isLatest && msg.isNew);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [feedback, setFeedback] = useState(null); // 'UP' | 'DOWN' | null

  // Typewriter Streaming Animation for newly received assistant message
  useEffect(() => {
    if (isLatest && msg.isNew && msg.content) {
      setIsTyping(true);
      const fullText = msg.content;
      let currLength = 0;
      const step = Math.max(1, Math.floor(fullText.length / 30));

      const timer = setInterval(() => {
        currLength += step;
        if (currLength >= fullText.length) {
          setDisplayedText(fullText);
          setIsTyping(false);
          clearInterval(timer);
        } else {
          setDisplayedText(fullText.slice(0, currLength));
        }
      }, 15);

      return () => clearInterval(timer);
    } else {
      setDisplayedText(msg.content);
      setIsTyping(false);
    }
  }, [msg.id, msg.content, isLatest, msg.isNew]);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      } else {
        window.speechSynthesis.cancel();
        // Plain text stripping for audio readout
        const plainText = msg.content.replace(/[*#>`|-]/g, '');
        const utterance = new SpeechSynthesisUtterance(plainText);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
      }
    }
  };

  return (
    <div className="flex gap-2.5 justify-start group animate-fade-in">
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent-blue/30 to-accent-purple/30 flex items-center justify-center text-accent-blue flex-shrink-0 mt-0.5 shadow-sm">
        <Bot size={13} />
      </div>
      <div className="max-w-[85%] space-y-1.5">
        <div className="bg-surface border border-border text-text rounded-2xl rounded-bl-none px-3.5 py-2.5 shadow-sm relative">
          <MessageRenderer content={displayedText} />
          {isTyping && (
            <span className="inline-block w-1.5 h-3 bg-accent-blue animate-pulse ml-1 align-middle" />
          )}
        </div>

        {/* ChatGPT Style Response Action Toolbar */}
        {!isTyping && (
          <div className="flex items-center gap-2 text-[10px] text-muted px-1 opacity-80 hover:opacity-100 transition-opacity">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 hover:text-accent-blue transition-colors px-1.5 py-0.5 rounded hover:bg-card"
              title="Copy message"
            >
              {copied ? <Check size={11} className="text-accent-green" /> : <Copy size={11} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            {onRegenerate && (
              <button
                onClick={onRegenerate}
                className="flex items-center gap-1 hover:text-accent-blue transition-colors px-1.5 py-0.5 rounded hover:bg-card"
                title="Regenerate response"
              >
                <RotateCcw size={11} />
                <span>Retry</span>
              </button>
            )}

            {'speechSynthesis' in window && (
              <button
                onClick={handleSpeak}
                className={`flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded hover:bg-card ${
                  isSpeaking ? 'text-accent-blue font-bold' : 'hover:text-accent-blue'
                }`}
                title="Listen to response"
              >
                {isSpeaking ? <VolumeX size={11} /> : <Volume2 size={11} />}
                <span>{isSpeaking ? 'Stop' : 'Listen'}</span>
              </button>
            )}

            <div className="flex items-center gap-1 ml-auto">
              <button
                onClick={() => setFeedback(f => f === 'UP' ? null : 'UP')}
                className={`p-1 rounded hover:bg-card transition-colors ${
                  feedback === 'UP' ? 'text-accent-green' : 'hover:text-text'
                }`}
                title="Helpful"
              >
                <ThumbsUp size={11} />
              </button>
              <button
                onClick={() => setFeedback(f => f === 'DOWN' ? null : 'DOWN')}
                className={`p-1 rounded hover:bg-card transition-colors ${
                  feedback === 'DOWN' ? 'text-accent-red' : 'hover:text-text'
                }`}
                title="Not helpful"
              >
                <ThumbsDown size={11} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const initialWelcomeMsg = {
    id: 'welcome',
    role: 'ASSISTANT',
    content:
      '**Welcome to PlaceMate AI Career Coach!** 🚀\n\nI\'m your personal placement mentor powered by AI. Here\'s how I can help you today:\n\n- **Roadmap** — step-by-step study strategy\n- **Skill Twin** — skill gap analysis & readiness score\n- **Job Matching** — resume keyword & ATS score tips\n- **Interview Prep** — technical DSA & HR question guidance\n\n> Ask me anything to get started!',
    isNew: false,
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([initialWelcomeMsg]);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query || query.trim().length === 0 || loading) return;

    const userMsg = { id: `user-${Date.now()}`, role: 'USER', content: query };
    setMessages(m => [...m, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const { data } = await api.post('/chatbot', { content: query });
      setMessages(m => [
        ...m,
        { ...data.message, isNew: true },
      ]);
    } catch (err) {
      setMessages(m => [
        ...m,
        {
          id: `err-${Date.now()}`,
          role: 'ASSISTANT',
          content:
            '**Connection Notice**\n\nI encountered a temporary issue connecting to the AI server.\n\n- Check your internet connection\n- Click **Retry** below to resend your query\n\n> I\'m ready whenever you are!',
          isNew: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = () => {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'USER');
    if (lastUserMsg) {
      handleSend(lastUserMsg.content);
    }
  };

  const handleClearChat = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setMessages([initialWelcomeMsg]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="relative flex items-center gap-2.5 px-4.5 py-3 bg-gradient-to-r from-accent-blue to-accent-purple hover:opacity-95 text-white rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 group scale-100 hover:scale-105"
          id="chatbot-trigger-btn"
        >
          <Sparkles size={20} className="animate-pulse text-amber-300" />
          <span className="text-[13.5px] font-bold tracking-wide">AI Career Coach</span>
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-accent-green rounded-full border-2 border-bg" />
        </button>
      )}

      {/* Floating / Expanded ChatGPT Window */}
      {isOpen && (
        <div
          className={`bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
            isExpanded
              ? 'fixed inset-6 sm:inset-12 z-50 w-auto h-auto'
              : 'w-[410px] h-[580px]'
          }`}
        >
          {/* ChatGPT Header */}
          <div className="p-3.5 bg-surface/90 backdrop-blur-md border-b border-border flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-blue/30 to-accent-purple/20 border border-accent-blue/30 flex items-center justify-center text-accent-blue shadow-sm">
                <Bot size={19} />
              </div>
              <div>
                <h3 className="text-[14px] font-bold text-text flex items-center gap-1.5">
                  PlaceMate AI Coach
                  <span className="text-[9px] bg-accent-blue/15 text-accent-blue font-mono px-1.5 py-0.5 rounded border border-accent-blue/20">
                    GPT-Powered
                  </span>
                </h3>
                <p className="text-[10.5px] text-accent-green flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-green inline-block animate-pulse" />
                  Interactive &amp; Online
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClearChat}
                className="p-1.5 text-muted hover:text-accent-red rounded-lg hover:bg-card transition-colors"
                title="Clear Chat Session"
              >
                <Trash2 size={16} />
              </button>
              <button
                onClick={() => setIsExpanded(v => !v)}
                className="p-1.5 text-muted hover:text-text rounded-lg hover:bg-card transition-colors"
                title={isExpanded ? 'Collapse view' : 'Expand view'}
              >
                {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button
                onClick={() => {
                  if (window.speechSynthesis) window.speechSynthesis.cancel();
                  setIsOpen(false);
                }}
                className="p-1.5 text-muted hover:text-text rounded-lg hover:bg-card transition-colors ml-1"
                aria-label="Close chatbot"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-bg/50">
            {messages.map((msg, idx) => (
              <div key={msg.id || idx}>
                {msg.role === 'USER' ? (
                  <div className="flex gap-2.5 justify-end">
                    <div className="max-w-[82%] px-3.5 py-2.5 rounded-2xl rounded-br-none bg-accent-blue text-white text-[12px] leading-relaxed shadow-sm">
                      {msg.content}
                    </div>
                    <div className="w-6 h-6 rounded-full bg-surface border border-border flex items-center justify-center text-muted flex-shrink-0 mt-0.5">
                      <User size={13} />
                    </div>
                  </div>
                ) : (
                  <AssistantMessage
                    msg={msg}
                    onRegenerate={idx === messages.length - 1 ? handleRegenerate : undefined}
                    isLatest={idx === messages.length - 1}
                  />
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 items-center text-muted text-[12px] animate-fade-in">
                <div className="w-6 h-6 rounded-full bg-accent-blue/20 flex items-center justify-center text-accent-blue flex-shrink-0">
                  <Bot size={13} />
                </div>
                <div className="bg-surface border border-border px-3.5 py-2 rounded-2xl flex items-center gap-1.5 shadow-sm">
                  <span className="text-[11px] text-muted font-medium mr-1">AI Coach is thinking</span>
                  <span className="w-1.5 h-1.5 bg-accent-blue rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-accent-blue rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-accent-blue rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick prompt chips */}
          <div className="px-3 py-2 bg-surface/60 border-t border-border/50 flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-shrink-0">
            {QUICK_CHIPS.map(chip => (
              <button
                key={chip}
                onClick={() => handleSend(chip)}
                className="whitespace-nowrap px-2.5 py-1 bg-card hover:bg-surface border border-border/80 text-[10.5px] text-muted hover:text-accent-blue rounded-full transition-colors flex-shrink-0 font-medium"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form
            onSubmit={e => { e.preventDefault(); handleSend(); }}
            className="p-3 bg-surface border-t border-border flex items-center gap-2 flex-shrink-0"
          >
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask PlaceMate AI Coach anything..."
              className="flex-1 bg-card border border-border rounded-xl px-3.5 py-2.5 text-[12.5px] text-text placeholder:text-muted focus:outline-none focus:border-accent-blue transition-colors shadow-inner"
              id="chatbot-input"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2.5 bg-accent-blue hover:bg-accent-blue/90 disabled:opacity-40 text-white rounded-xl transition-all shadow-md flex-shrink-0"
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
