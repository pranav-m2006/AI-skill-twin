import { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, Sparkles, User, MessageSquare } from 'lucide-react';
import api from '../api';

const QUICK_CHIPS = [
  'How is my streak calculated?',
  'How do I start my roadmap?',
  'How does job match % work?',
  'What is Skill Twin?',
  'How do I earn badges?',
];

// ─── Professional Message Renderer ──────────────────────────────────────────
// Parses markdown-like syntax into structured, readable React elements.
function MessageRenderer({ content }) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Skip blank lines (but add spacing)
    if (line.trim() === '') {
      i++;
      continue;
    }

    // --- Blockquote: > text ---
    if (line.startsWith('> ')) {
      const text = line.slice(2);
      elements.push(
        <div
          key={i}
          className="border-l-2 border-accent-blue/60 pl-2.5 my-1.5 text-[11px] text-muted italic"
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

    // --- Code block: `code` alone on a line ---
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
  // Split on **bold** and `code`
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
// ─────────────────────────────────────────────────────────────────────────────

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Always start fresh on each login — never load previous chat history
      setMessages([
        {
          id: 'welcome',
          role: 'ASSISTANT',
          content:
            '**Welcome to PlaceMate AI Career Coach!**\n\nI\'m your personal placement mentor. Here\'s what I can help with:\n\n- **Roadmap** — creating and following your study plan\n- **Skill Twin** — understanding your skill gaps\n- **Job Matching** — improving your match percentage\n- **Interview Prep** — technical and behavioral tips\n- **Resume** — ATS scoring and optimization\n\n> Ask me anything to get started!',
        },
      ]);
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
      setMessages(m => [...m, data.message]);
    } catch (err) {
      setMessages(m => [
        ...m,
        {
          id: `err-${Date.now()}`,
          role: 'ASSISTANT',
          content:
            '**Connection Issue**\n\nSorry, I encountered an issue processing your request.\n\n- Check your internet connection\n- Try asking your question again\n\n> I\'m here to help whenever you\'re ready!',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="relative flex items-center gap-2 px-4 py-3 bg-accent-blue hover:bg-accent-blue/90 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 group"
          id="chatbot-trigger-btn"
        >
          <Sparkles size={20} className="animate-pulse" />
          <span className="text-[13px] font-semibold">AI Career Coach</span>
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent-green rounded-full border-2 border-bg" />
        </button>
      )}

      {/* Floating Chat Window */}
      {isOpen && (
        <div className="w-[400px] h-[560px] bg-card border border-border rounded-2xl shadow-card flex flex-col overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="p-4 bg-surface border-b border-border flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-blue/30 to-accent-purple/20 flex items-center justify-center text-accent-blue">
                <Bot size={18} />
              </div>
              <div>
                <h3 className="text-[14px] font-bold text-text">PlaceMate AI Coach</h3>
                <p className="text-[10px] text-accent-green flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-green inline-block animate-pulse" />
                  Online &amp; Ready
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-muted hidden sm:block">
                <MessageSquare size={11} className="inline mr-0.5" />
                {messages.filter(m => m.role === 'USER').length} msgs
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-muted hover:text-text rounded-lg hover:bg-card transition-colors ml-2"
                aria-label="Close chatbot"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === 'USER' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'ASSISTANT' && (
                  <div className="w-6 h-6 rounded-full bg-accent-blue/20 flex items-center justify-center text-accent-blue flex-shrink-0 mt-0.5">
                    <Bot size={13} />
                  </div>
                )}
                <div
                  className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl ${
                    msg.role === 'USER'
                      ? 'bg-accent-blue text-white rounded-br-none text-[12px] leading-relaxed'
                      : 'bg-surface border border-border text-text rounded-bl-none'
                  }`}
                >
                  {msg.role === 'USER' ? (
                    <span className="text-[12px] leading-relaxed">{msg.content}</span>
                  ) : (
                    <MessageRenderer content={msg.content} />
                  )}
                </div>
                {msg.role === 'USER' && (
                  <div className="w-6 h-6 rounded-full bg-surface border border-border flex items-center justify-center text-muted flex-shrink-0 mt-0.5">
                    <User size={13} />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 items-center text-muted text-[12px]">
                <div className="w-6 h-6 rounded-full bg-accent-blue/20 flex items-center justify-center text-accent-blue flex-shrink-0">
                  <Bot size={13} />
                </div>
                <div className="bg-surface border border-border px-3.5 py-2 rounded-2xl flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-accent-blue rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-accent-blue rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-accent-blue rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick prompt chips */}
          <div className="px-3 py-2 bg-surface/50 border-t border-border/50 flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-shrink-0">
            {QUICK_CHIPS.map(chip => (
              <button
                key={chip}
                onClick={() => handleSend(chip)}
                className="whitespace-nowrap px-2.5 py-1 bg-card hover:bg-surface border border-border/80 text-[10px] text-muted hover:text-accent-blue rounded-full transition-colors flex-shrink-0"
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
              placeholder="Ask AI Career Coach..."
              className="flex-1 bg-card border border-border rounded-xl px-3 py-2 text-[12px] text-text placeholder:text-muted focus:outline-none focus:border-accent-blue transition-colors"
              id="chatbot-input"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2.5 bg-accent-blue hover:bg-accent-blue/90 disabled:opacity-50 text-white rounded-xl transition-all"
              aria-label="Send message"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
