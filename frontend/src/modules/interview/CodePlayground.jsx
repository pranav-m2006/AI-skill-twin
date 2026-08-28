import { useState, useRef } from 'react';
import {
  Play, Sparkles, RotateCcw, Copy, CheckCheck, ChevronDown,
  Terminal, Clock, AlertTriangle, Code2, Loader2, Send, CheckCircle, Award,
  BookOpen, Eye, X, Check, Globe,
} from 'lucide-react';
import api from '../../shared/api';
import Button from '../../shared/components/Button';

// ─── Language definitions ─────────────────────────────────────────────────────
const LANGUAGE_DEFS = [
  { id: 'javascript', label: 'JavaScript (Node.js)', icon: '🟨' },
  { id: 'typescript', label: 'TypeScript',           icon: '🟪' },
  { id: 'python',     label: 'Python 3',             icon: '🐍' },
  { id: 'sql',        label: 'SQL (Database)',       icon: '🗄️' },
  { id: 'java',       label: 'Java (JDK)',           icon: '☕' },
  { id: 'cpp',        label: 'C++',                  icon: '⚡' },
  { id: 'c',          label: 'C (GCC)',              icon: '💻' },
  { id: 'go',         label: 'Go (Golang)',          icon: '🐹' },
  { id: 'rust',       label: 'Rust',                 icon: '🦀' },
  { id: 'csharp',     label: 'C# (.NET)',            icon: '🔷' },
  { id: 'php',        label: 'PHP',                  icon: '🐘' },
  { id: 'ruby',       label: 'Ruby',                 icon: '💎' },
];

// ─── Starter Code ("Place your code here") ─────────────────────────────────────
const STARTERS = {
  javascript: `// Place your code here
function solution() {
  // Write your code implementation here
}

// console.log("Result:", solution());
`,

  typescript: `// Place your code here
function solution(): any {
  // Write your code implementation here
}

// console.log("Result:", solution());
`,

  python: `# Place your code here
def solution():
    # Write your code implementation here
    pass

# print("Result:", solution())
`,

  sql: `-- Place your code here
-- Write your SQL query below:
SELECT * 
FROM employees;
`,

  java: `// Place your code here
import java.util.*;

public class Main {
    public static void main(String[] args) {
        // Write your code implementation here
        System.out.println("Place your code here");
    }
}
`,

  cpp: `// Place your code here
#include <iostream>
using namespace std;

int main() {
    // Write your code implementation here
    cout << "Place your code here" << endl;
    return 0;
}
`,

  c: `// Place your code here
#include <stdio.h>

int main() {
    // Write your code implementation here
    printf("Place your code here\\n");
    return 0;
}
`,

  go: `// Place your code here
package main
import "fmt"

func main() {
    // Write your code implementation here
    fmt.Println("Place your code here")
}
`,

  rust: `// Place your code here
fn main() {
    // Write your code implementation here
    println!("Place your code here");
}
`,

  csharp: `// Place your code here
using System;

class Program {
    static void Main() {
        // Write your code implementation here
        Console.WriteLine("Place your code here");
    }
}
`,

  php: `<?php
// Place your code here
function solution() {
    // Write your code implementation here
}

echo "Place your code here";
`,

  ruby: `# Place your code here
def solution
  # Write your code implementation here
end

puts "Place your code here"
`,
};

// ─── Helper: Clean Executable Code Only ──────────────────────────────────────
function cleanExecutableCode(rawCode) {
  if (!rawCode) return '';
  return rawCode
    .split('\n')
    .filter(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('// Reference Solution') ||
          trimmed.startsWith('# Reference Solution') ||
          trimmed.startsWith('-- Reference Solution') ||
          trimmed.startsWith('// Problem:') ||
          trimmed.startsWith('# Problem:') ||
          trimmed.startsWith('-- Problem:') ||
          trimmed.startsWith('// Implementation Strategy') ||
          trimmed.startsWith('# Implementation Strategy')) {
        return false;
      }
      return true;
    })
    .join('\n')
    .trim();
}

function getLanguageSolution(langId, problemTitle, baseSolution) {
  if (!baseSolution && !problemTitle) {
    return '// Code implementation';
  }

  const cleanBase = cleanExecutableCode(baseSolution || '');

  if (langId === 'python') {
    if (cleanBase.includes('def ') || cleanBase.includes('import ')) return cleanBase;
    return `def solution():\n    # Write Python logic here\n    pass`;
  }

  if (langId === 'sql') {
    if (cleanBase.toUpperCase().includes('SELECT') || cleanBase.toUpperCase().includes('WITH')) return cleanBase;
    return `SELECT * FROM employees;`;
  }

  if (langId === 'java') {
    if (cleanBase.includes('class ') || cleanBase.includes('public static')) return cleanBase;
    return `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Solution");\n    }\n}`;
  }

  if (langId === 'cpp') {
    if (cleanBase.includes('int main') || cleanBase.includes('#include')) return cleanBase;
    return `#include <iostream>\nusing namespace std;\n\nint main() {\n    return 0;\n}`;
  }

  return cleanBase || `function solution() {\n  return true;\n}`;
}

// ─── AI Feedback Renderer ─────────────────────────────────────────────────────
function AIFeedbackRenderer({ content }) {
  if (!content) return null;
  return (
    <div className="space-y-1.5 text-[12px]">
      {content.split('\n').map((line, i) => {
        if (!line.trim()) return null;
        if (/^\*\*.+\*\*/.test(line) || /^#{1,3}\s/.test(line)) {
          const text = line.replace(/^#{1,3}\s/, '').replace(/\*\*/g, '');
          return <p key={i} className="font-semibold text-accent-blue text-[13px] mt-2 mb-0.5">{text}</p>;
        }
        if (/^[-•]\s/.test(line)) {
          return (
            <div key={i} className="flex gap-2 text-text">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-blue/70 flex-shrink-0 mt-1.5" />
              <span>{line.replace(/^[-•]\s/, '').replace(/\*\*(.+?)\*\*/g, '$1')}</span>
            </div>
          );
        }
        if (/^\d+\.\s/.test(line)) {
          const m = line.match(/^(\d+)\.\s(.+)/);
          if (m) return (
            <div key={i} className="flex gap-2 text-text">
              <span className="w-4 h-4 rounded-full bg-accent-blue/20 text-accent-blue text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{m[1]}</span>
              <span>{m[2].replace(/\*\*(.+?)\*\*/g, '$1')}</span>
            </div>
          );
        }
        if (/^>/.test(line)) {
          return (
            <div key={i} className="border-l-2 border-accent-blue/50 pl-2.5 text-muted italic text-[11px]">
              {line.replace(/^>\s?/, '')}
            </div>
          );
        }
        return <p key={i} className="text-text leading-relaxed">{line.replace(/\*\*(.+?)\*\*/g, '$1')}</p>;
      })}
    </div>
  );
}

// ─── Code Editor with Line Numbers ───────────────────────────────────────────
function CodeEditor({ value, onChange }) {
  const textareaRef = useRef(null);
  const linesRef    = useRef(null);
  const lineCount   = value.split('\n').length;

  const syncScroll = () => {
    if (linesRef.current && textareaRef.current) {
      linesRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleKeyDown = e => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const s   = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const next = value.substring(0, s) + '  ' + value.substring(end);
      onChange(next);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = s + 2;
        }
      }, 0);
    }
  };

  return (
    <div className="relative flex rounded-xl overflow-hidden border border-border bg-[#0d1117] font-mono text-[13px]">
      <div
        ref={linesRef}
        aria-hidden="true"
        className="select-none overflow-hidden bg-[#161b22] border-r border-white/5
                   text-right py-3 pl-2 pr-3 text-[11px] text-white/25 leading-6
                   min-w-[42px] pointer-events-none"
      >
        {Array.from({ length: lineCount }, (_, i) => <div key={i}>{i + 1}</div>)}
      </div>

      <textarea
        ref={textareaRef}
        id="code-editor-textarea"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onScroll={syncScroll}
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        className="flex-1 bg-transparent text-[#e6edf3] py-3 px-4 focus:outline-none
                   resize-none leading-6 w-full"
        style={{ minHeight: '300px', tabSize: 2, caretColor: '#58a6ff' }}
        aria-label="Code editor"
      />
    </div>
  );
}

// ─── Main CodePlayground ──────────────────────────────────────────────────────
export default function CodePlayground({ problem, solution }) {
  const [langId,           setLangId]           = useState('javascript');
  const [code,             setCode]             = useState(STARTERS.javascript);
  const [running,          setRunning]          = useState(false);
  const [submitting,       setSubmitting]       = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [output,           setOutput]           = useState(null);
  const [analyzing,        setAnalyzing]        = useState(false);
  const [aiFeedback,       setAiFeedback]       = useState(null);
  const [copied,           setCopied]           = useState(false);
  const [langMenu,         setLangMenu]         = useState(false);
  const [langSearch,       setLangSearch]       = useState('');
  const [showSolutionModal, setShowSolutionModal] = useState(false);
  const [loadedSolution,   setLoadedSolution]   = useState(false);

  const selectedDef = LANGUAGE_DEFS.find(l => l.id === langId) || LANGUAGE_DEFS[0];
  const activeLanguageSolution = getLanguageSolution(langId, problem, solution);

  const filteredLangs = LANGUAGE_DEFS.filter(l =>
    l.label.toLowerCase().includes(langSearch.toLowerCase()) ||
    l.id.toLowerCase().includes(langSearch.toLowerCase())
  );

  const switchLanguage = lang => {
    setLangId(lang.id);
    setCode(STARTERS[lang.id] || `// Place your code here\n`);
    setOutput(null);
    setSubmissionResult(null);
    setAiFeedback(null);
    setLangMenu(false);
    setLangSearch('');
  };

  const runCode = async () => {
    setRunning(true);
    setOutput(null);
    setSubmissionResult(null);

    try {
      const startTime = Date.now();
      const { data } = await api.post('/code/run', {
        language: langId,
        code,
      });
      const clientTime = Date.now() - startTime;

      setOutput({
        stdout:   data.stdout   || '',
        stderr:   data.stderr   || '',
        exitCode: data.exitCode ?? 0,
        time:     data.time     ?? clientTime,
      });
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Unknown error';
      setOutput({
        stdout:   '',
        stderr:   `Failed to reach code execution service.\n${msg}`,
        exitCode: 1,
        time:     null,
      });
    } finally {
      setRunning(false);
    }
  };

  const submitCode = async () => {
    setSubmitting(true);
    setSubmissionResult(null);
    try {
      const { data } = await api.post('/code/submit', {
        language: langId,
        code,
      });
      setSubmissionResult(data);
      if (data.status === 'ACCEPTED') {
        setOutput({
          stdout: data.stdout || '✓ All test cases passed! Solution Accepted.',
          stderr: '',
          exitCode: 0,
          time: data.time,
        });
      } else {
        setOutput({
          stdout: data.stdout || '',
          stderr: data.stderr || 'Solution failed test case evaluation.',
          exitCode: 1,
          time: data.time,
        });
      }
    } catch (err) {
      setSubmissionResult({
        status: 'WRONG_ANSWER',
        message: 'Failed to submit solution.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const analyzeCode = async () => {
    setAnalyzing(true);
    setAiFeedback(null);

    const executionContext = output
      ? `\n\n**Execution Result:**\nStdout: ${output.stdout || '(none)'}\nStderr: ${output.stderr || '(none)'}\nExit code: ${output.exitCode}`
      : '';

    const prompt = `Analyze the following ${selectedDef.label} code and give a professional code review:

\`\`\`${langId}
${code}
\`\`\`
${executionContext}

Respond in EXACTLY this format:

**Time Complexity**
- Big-O for best, average, worst case with explanation

**Space Complexity**
- Auxiliary space used with explanation

**Correctness & Edge Cases**
- Is the logic correct?
- What edge cases are handled or missing?

**Bugs / Issues Found**
- Any errors, off-by-one issues, or runtime risks

**Optimization Suggestions**
- 2–3 specific improvements

**Overall Rating: X/10**
- One-line justification`;

    try {
      const { data } = await api.post('/chatbot', { content: prompt });
      setAiFeedback(data.message.content);
    } catch {
      setAiFeedback(
        '**Analysis Unavailable**\n\nCould not reach AI service right now.\n\n**Quick Manual Checklist:**\n- Is the time complexity optimal for the given constraints?\n- Are all edge cases handled?\n- Check for off-by-one errors'
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const loadSolutionToEditor = () => {
    if (activeLanguageSolution) {
      setCode(activeLanguageSolution);
      setLoadedSolution(true);
      setShowSolutionModal(false);
      setTimeout(() => setLoadedSolution(false), 3000);
    }
  };

  const isSuccess = output && output.exitCode === 0 && !output.stderr;

  return (
    <div className="space-y-3 animate-fade-in">
      {problem && (
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-[11px] font-bold text-accent-blue mb-1 uppercase tracking-wide flex items-center gap-1.5">
            <Code2 size={12} /> Problem Context
          </p>
          <p className="text-[12px] text-text leading-relaxed">{problem}</p>
        </div>
      )}

      {/* Submission Result Notification Banner */}
      {submissionResult && (
        <div className={`p-4 rounded-xl border flex items-center justify-between animate-fade-in ${
          submissionResult.status === 'ACCEPTED'
            ? 'bg-accent-green/10 border-accent-green/30 text-accent-green'
            : 'bg-accent-red/10 border-accent-red/30 text-accent-red'
        }`}>
          <div className="flex items-center gap-3">
            {submissionResult.status === 'ACCEPTED' ? <CheckCircle size={22} /> : <AlertTriangle size={22} />}
            <div>
              <h4 className="text-[14px] font-bold flex items-center gap-2">
                {submissionResult.status === 'ACCEPTED' ? '🎉 Solution Accepted!' : '❌ Submission Failed'}
                {submissionResult.xpEarned > 0 && (
                  <span className="text-[11px] bg-accent-green/20 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <Award size={12} /> +{submissionResult.xpEarned} XP
                  </span>
                )}
              </h4>
              <p className="text-[12px] opacity-90 mt-0.5">{submissionResult.message}</p>
            </div>
          </div>
          <div className="text-right text-[11px] opacity-80">
            <p>Passed: {submissionResult.passCount}/{submissionResult.totalCount} Test Cases</p>
            {submissionResult.time != null && <p>Runtime: {submissionResult.time} ms</p>}
          </div>
        </div>
      )}

      {/* Loaded Solution Alert Banner */}
      {loadedSolution && (
        <div className="p-3 bg-accent-green/10 border border-accent-green/30 rounded-xl text-[12px] font-semibold text-accent-green flex items-center gap-2 animate-fade-in">
          <Check size={16} /> {selectedDef.label} reference solution loaded into code editor!
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">

        {/* Multi-language selector */}
        <div className="relative">
          <button
            id="lang-selector-btn"
            onClick={() => setLangMenu(v => !v)}
            className="flex items-center gap-2 px-3 py-2 bg-card border border-border
                       rounded-lg text-[12px] font-medium text-text
                       hover:border-accent-blue/50 transition-colors"
          >
            <span>{selectedDef.icon}</span>
            {selectedDef.label}
            <ChevronDown
              size={13}
              className={`text-muted transition-transform ${langMenu ? 'rotate-180' : ''}`}
            />
          </button>

          {langMenu && (
            <div className="absolute top-full left-0 mt-1 bg-card border border-border
                            rounded-xl shadow-lg z-30 min-w-[240px] max-h-[320px] overflow-hidden flex flex-col">
              <div className="p-2 border-b border-border bg-surface">
                <input
                  id="search-language-input"
                  type="text"
                  placeholder="Search language (e.g. py, sql, cpp)..."
                  value={langSearch}
                  onChange={e => setLangSearch(e.target.value)}
                  className="w-full bg-card border border-border rounded-lg px-2.5 py-1.5 text-[11px] text-text focus:outline-none focus:border-accent-blue"
                  autoFocus
                />
              </div>
              <div className="overflow-y-auto max-h-[260px]">
                {filteredLangs.length === 0 ? (
                  <p className="p-3 text-[11px] text-muted text-center">No languages match "{langSearch}"</p>
                ) : (
                  filteredLangs.map(lang => (
                    <button
                      key={lang.id}
                      onClick={() => switchLanguage(lang)}
                      className={`w-full text-left px-4 py-2.5 text-[12px] hover:bg-surface
                                  transition-colors flex items-center gap-2
                                  ${lang.id === langId
                                    ? 'text-accent-blue font-semibold bg-accent-blue/10'
                                    : 'text-text'}`}
                    >
                      <span>{lang.icon}</span>
                      {lang.label}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action buttons: Copy | Reset | Run Code | Solution | Submit Solution | AI Review */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={copyCode}
            title="Copy code"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px]
                       text-muted hover:text-text bg-card border border-border transition-colors"
          >
            {copied
              ? <CheckCheck size={13} className="text-accent-green" />
              : <Copy size={13} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>

          <button
            onClick={() => { setCode(STARTERS[langId] || ''); setOutput(null); setSubmissionResult(null); setAiFeedback(null); }}
            title="Reset to starter code"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px]
                       text-muted hover:text-text bg-card border border-border transition-colors"
          >
            <RotateCcw size={13} /> Reset
          </button>

          <Button
            variant="secondary"
            size="sm"
            icon={running ? Loader2 : Play}
            loading={running}
            disabled={running || submitting}
            onClick={runCode}
            id="run-code-btn"
          >
            Run Code
          </Button>

          {/* Solution button right next to Run Code */}
          <button
            onClick={() => setShowSolutionModal(true)}
            id="view-solution-btn"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold
                       text-accent-green bg-accent-green/10 border border-accent-green/30
                       hover:bg-accent-green/20 transition-all shadow-sm"
          >
            <Eye size={13} /> Solution ({selectedDef.label.split(' ')[0]})
          </button>

          <Button
            variant="primary"
            size="sm"
            icon={submitting ? Loader2 : Send}
            loading={submitting}
            disabled={running || submitting}
            onClick={submitCode}
            id="submit-code-btn"
          >
            Submit Solution
          </Button>

          <Button
            variant="purple"
            size="sm"
            icon={analyzing ? Loader2 : Sparkles}
            loading={analyzing}
            disabled={analyzing}
            onClick={analyzeCode}
            id="analyze-code-btn"
          >
            AI Review
          </Button>
        </div>
      </div>

      {/* Code Editor */}
      <CodeEditor value={code} onChange={setCode} />

      {/* Solution Modal / Panel */}
      {showSolutionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-card border border-border rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle size={18} className="text-accent-green" />
                <div>
                  <h3 className="text-[15px] font-bold text-text">
                    Reference Solution ({selectedDef.icon} {selectedDef.label})
                  </h3>
                  <p className="text-[11px] text-muted">
                    Solution automatically adjusts when you change language in the selector
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSolutionModal(false)}
                className="text-muted hover:text-text p-1 rounded-lg hover:bg-surface"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-[#0d1117] border border-border rounded-xl p-4 font-mono text-[12.5px] text-[#e6edf3] whitespace-pre-wrap max-h-[350px] overflow-y-auto">
                {activeLanguageSolution}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button
                onClick={() => setShowSolutionModal(false)}
                className="px-4 py-2 text-[12px] font-semibold text-muted hover:text-text"
              >
                Close
              </button>
              <Button
                variant="primary"
                size="sm"
                icon={Copy}
                onClick={loadSolutionToEditor}
                id="copy-solution-to-editor-btn"
              >
                Load {selectedDef.label.split(' ')[0]} Solution into Editor
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Output Panel */}
      {output !== null && (
        <div className="rounded-xl border border-border overflow-hidden animate-fade-in">
          <div className={`flex items-center justify-between px-4 py-2.5 border-b ${
            isSuccess
              ? 'bg-accent-green/10 border-accent-green/20'
              : 'bg-accent-red/10 border-accent-red/20'
          }`}>
            <div className="flex items-center gap-2">
              <Terminal size={14} className={isSuccess ? 'text-accent-green' : 'text-accent-red'} />
              <span className={`text-[12px] font-semibold ${isSuccess ? 'text-accent-green' : 'text-accent-red'}`}>
                {isSuccess ? '✓ Program executed successfully' : '✗ Execution failed / errors detected'}
              </span>
            </div>
            {output.time != null && (
              <span className="text-[10px] text-muted flex items-center gap-1">
                <Clock size={11} /> {output.time} ms
              </span>
            )}
          </div>

          <div className="bg-[#0d1117] p-4 font-mono text-[12.5px] max-h-[260px] overflow-y-auto">
            {output.stdout ? (
              <>
                <p className="text-white/30 text-[10px] mb-2 uppercase tracking-widest">stdout</p>
                <pre className="text-[#7ee787] whitespace-pre-wrap leading-relaxed">
                  {output.stdout}
                </pre>
              </>
            ) : null}

            {output.stderr ? (
              <div className={output.stdout ? 'mt-4' : ''}>
                <p className="text-accent-red/50 text-[10px] mb-2 uppercase tracking-widest flex items-center gap-1">
                  <AlertTriangle size={10} /> stderr / error output
                </p>
                <pre className="text-[#ff7b72] whitespace-pre-wrap leading-relaxed">
                  {output.stderr}
                </pre>
              </div>
            ) : null}

            {!output.stdout && !output.stderr && (
              <p className="text-white/30 italic">No output produced.</p>
            )}
          </div>
        </div>
      )}

      {/* AI Analysis Panel */}
      {aiFeedback && (
        <div className="rounded-xl border border-accent-purple/30
                        bg-gradient-to-b from-accent-purple/5 to-card
                        overflow-hidden animate-fade-in">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-accent-purple/20">
            <Sparkles size={15} className="text-accent-purple" />
            <span className="text-[13px] font-semibold text-accent-purple">AI Code Analysis</span>
            <span className="ml-auto text-[10px] text-muted bg-card px-2 py-0.5 rounded-full border border-border">
              PlaceMate AI
            </span>
          </div>
          <div className="p-4">
            <AIFeedbackRenderer content={aiFeedback} />
          </div>
        </div>
      )}
    </div>
  );
}
