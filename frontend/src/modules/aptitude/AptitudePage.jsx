import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, X, ChevronRight, BarChart3, HelpCircle } from 'lucide-react';
import api from '../../shared/api';
import Card from '../../shared/components/Card';
import Badge from '../../shared/components/Badge';
import Button from '../../shared/components/Button';
import KpiRing from '../../shared/charts/KpiRing';

// Difficulty color
const DIFF_COLORS = { EASY: 'green', MEDIUM: 'amber', HARD: 'red' };

function OptionButton({ index, label, selected, correct, wrong, onClick, disabled }) {
  let extraClass = '';
  if (selected && correct) extraClass = 'border-accent-green bg-accent-green/10 text-accent-green';
  else if (selected && wrong) extraClass = 'border-accent-red bg-accent-red/10 text-accent-red';
  else if (!selected && correct) extraClass = 'border-accent-green/50 bg-accent-green/5 text-accent-green';

  return (
    <button
      id={`option-${index}`}
      disabled={disabled}
      onClick={() => onClick(index)}
      className={`
        w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border text-left
        transition-all duration-150 text-[13px] text-text
        ${disabled ? 'cursor-not-allowed' : 'hover:border-accent-blue/50 hover:bg-card/50 cursor-pointer'}
        ${extraClass}
      `}
    >
      <span className={`
        w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-bold
        border border-current
        ${selected && correct ? 'border-accent-green text-accent-green' : selected && wrong ? 'border-accent-red text-accent-red' : 'border-border text-muted'}
      `}>
        {['A','B','C','D'][index]}
      </span>
      {label}
      {selected && correct && <CheckCircle size={15} className="ml-auto text-accent-green" />}
      {selected && wrong && <X size={15} className="ml-auto text-accent-red" />}
    </button>
  );
}

function TopicProgress({ stats }) {
  if (!stats || !stats.topicStats || stats.topicStats.length === 0) return null;
  return (
    <Card id="aptitude-topic-progress">
      <h3 className="text-[13px] font-semibold text-text mb-4">Topic Accuracy</h3>
      <div className="space-y-2.5">
        {stats.topicStats.map(t => (
          <div key={t.topic}>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-text font-medium">{t.topic}</span>
              <span className="text-muted">{t.accuracy}% ({t.total}q)</span>
            </div>
            <div className="h-1.5 bg-border rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${t.accuracy >= 70 ? 'bg-accent-green' : t.accuracy >= 40 ? 'bg-accent-amber' : 'bg-accent-red'}`}
                style={{ width: `${t.accuracy}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function AptitudePage() {
  const [stats, setStats]     = useState(null);
  const [question, setQ]      = useState(null);
  const [loading, setLoading] = useState(true);
  const [qLoading, setQLoad]  = useState(false);
  const [selected, setSelected] = useState(null);
  const [result, setResult]   = useState(null);    // { isCorrect, correctAnswer, explanation, xpEarned }
  const [startTime, setStart] = useState(null);
  const [view, setView]       = useState('quiz');   // 'quiz' | 'stats'
  const [streak, setStreak]   = useState(0);

  const fetchStats = useCallback(async () => {
    const { data } = await api.get('/aptitude/stats');
    setStats(data);
  }, []);

  const fetchQuestion = useCallback(async () => {
    setQLoad(true);
    setSelected(null);
    setResult(null);
    try {
      const { data } = await api.get('/aptitude/question');
      setQ(data);
      setStart(Date.now());
    } finally { setQLoad(false); }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchStats(), fetchQuestion()]).finally(() => setLoading(false));
  }, []);

  const submitAnswer = async (ansIdx) => {
    if (result) return;
    setSelected(ansIdx);
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    const { data } = await api.post('/aptitude/answer', {
      questionId: question.id,
      answer: ansIdx,
      timeTaken,
    });
    setResult(data);
    if (data.isCorrect) setStreak(s => s + 1);
    else setStreak(0);
    fetchStats(); // refresh stats
  };

  const next = () => fetchQuestion();

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 rounded-full border-2 border-accent-blue border-t-transparent animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[16px] font-bold text-text">Aptitude Practice</h2>
          <p className="text-[12px] text-muted mt-0.5">Adaptive difficulty · {stats?.currentTopic || 'Practice & Learn'}</p>
        </div>
        <div className="flex items-center gap-3">
          {streak > 0 && (
            <Badge color="amber" size="sm" dot>{streak} correct streak</Badge>
          )}
          <Button
            id="aptitude-stats-toggle"
            variant="secondary"
            size="sm"
            icon={BarChart3}
            onClick={() => setView(v => v === 'quiz' ? 'stats' : 'quiz')}
          >
            {view === 'quiz' ? 'View Stats' : 'Practice'}
          </Button>
        </div>
      </div>

      {/* Overall KPI strip — uniform height & matched typography */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
          {/* Questions Attempted */}
          <Card className="flex flex-col items-center justify-center p-5 text-center min-h-[140px]">
            <span className="text-[32px] font-bold text-text leading-none mb-2">
              {stats.totalAttempted || 0}
            </span>
            <span className="text-[11px] font-medium text-muted">Questions Attempted</span>
          </Card>

          {/* Accuracy KPI Ring Card */}
          <Card className="flex flex-col items-center justify-center p-5 text-center min-h-[140px]">
            <KpiRing value={stats.overallAccuracy || 0} color="#F59E0B" size="md" label="Accuracy" />
          </Card>

          {/* Correct Questions */}
          <Card className="flex flex-col items-center justify-center p-5 text-center min-h-[140px]">
            <span className="text-[32px] font-bold text-accent-green leading-none mb-2">
              {stats.totalCorrect || 0}
            </span>
            <div className="flex items-center justify-center gap-1 text-accent-green">
              <CheckCircle size={13} className="flex-shrink-0" />
              <span className="text-[11px] font-medium text-muted">Correct</span>
            </div>
          </Card>
        </div>
      )}

      {view === 'stats' ? (
        <TopicProgress stats={stats} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Question card */}
          <div className="lg:col-span-2">
            {qLoading ? (
              <Card className="flex justify-center py-16">
                <div className="w-6 h-6 rounded-full border-2 border-accent-blue border-t-transparent animate-spin" />
              </Card>
            ) : question ? (
              <Card id="aptitude-question-card">
                {/* Meta */}
                <div className="flex items-center gap-2 mb-4">
                  <Badge color={DIFF_COLORS[question.difficulty]} size="xs">{question.difficulty}</Badge>
                  <Badge color="blue" size="xs">{question.topic}</Badge>
                  <span className="ml-auto text-[10px] text-muted">Current: {question.currentTopic}</span>
                </div>

                {/* Question */}
                <p className="text-[15px] text-text font-medium leading-relaxed mb-6">{question.content}</p>

                {/* Options */}
                <div className="space-y-2.5">
                  {(question.options || []).map((opt, i) => (
                    <OptionButton
                      key={i}
                      index={i}
                      label={opt}
                      selected={selected === i}
                      correct={result && i === result.correctAnswer}
                      wrong={result && selected === i && !result.isCorrect}
                      onClick={submitAnswer}
                      disabled={!!result}
                    />
                  ))}
                </div>

                {/* Result */}
                {result && (
                  <div className={`mt-5 rounded-xl px-4 py-3 border text-[12px] animate-fade-in
                    ${result.isCorrect ? 'bg-accent-green/10 border-accent-green/30 text-accent-green' : 'bg-accent-red/10 border-accent-red/30 text-accent-red'}`}
                  >
                    <p className="font-semibold mb-1">
                      {result.isCorrect ? 'Correct!' : 'Not quite.'} +{result.xpEarned} XP
                    </p>
                    <p className="text-text/80 leading-relaxed">{result.explanation}</p>
                  </div>
                )}

                {/* Next button */}
                <div className="flex justify-end mt-5">
                  {result ? (
                    <Button id="aptitude-next-btn" variant="primary" icon={ChevronRight} onClick={next}>
                      Next Question
                    </Button>
                  ) : (
                    <p className="text-[11px] text-muted">Select an option to submit</p>
                  )}
                </div>
              </Card>
            ) : (
              <Card className="text-center py-16">
                <p className="text-muted text-[13px]">No questions available. Add seed data first.</p>
              </Card>
            )}
          </div>

          {/* Sidebar: topic progress */}
          <TopicProgress stats={stats} />
        </div>
      )}
    </div>
  );
}
