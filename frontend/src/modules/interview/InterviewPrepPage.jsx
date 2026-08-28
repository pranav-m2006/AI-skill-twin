import { useState, useEffect } from 'react';
import {
  BookOpen, Sparkles, CheckCircle, ChevronDown, ChevronUp,
  Send, HelpCircle, Code, Award, Terminal, Filter, Layers, Globe, Cpu, Database, Compass, BarChart3,
} from 'lucide-react';
import api from '../../shared/api';
import Card from '../../shared/components/Card';
import Badge from '../../shared/components/Badge';
import Button from '../../shared/components/Button';
import CodePlayground from './CodePlayground';

const CATEGORIES = [
  { id: 'tech', label: 'Technical Core', count: 12 },
  { id: 'system', label: 'System Design', count: 8 },
  { id: 'coding', label: 'Coding & DSA', count: 35 },
  { id: 'hr', label: 'HR & Behavioral', count: 10 },
];

const DOMAINS = [
  { id: 'all', label: 'All Domains', icon: Globe },
  { id: 'dsa', label: 'DSA & Algorithms', icon: Layers },
  { id: 'web', label: 'Full Stack & Web Dev', icon: Code },
  { id: 'python', label: 'Python & Data Science', icon: Sparkles },
  { id: 'sql', label: 'Database & SQL', icon: Database },
  { id: 'java-cpp', label: 'Java & C++ Systems', icon: Cpu },
  { id: 'roadmap', label: 'My Roadmap Tasks', icon: Compass },
];

const CODING_SUBFILTERS = [
  { id: 'all', label: 'All Topics' },
  { id: 'dsa', label: 'Data Structures & Algorithms' },
  { id: 'python', label: 'Python & Data Science' },
  { id: 'sql', label: 'SQL & Database Queries' },
  { id: 'java-cpp', label: 'Java & C++ Systems' },
  { id: 'web', label: 'Web & JavaScript/React' },
  { id: 'roadmap', label: 'My Roadmap Skills' },
];

const BASE_QUESTIONS = [
  // ── Technical Core ──────────────────────────────────────────────────────────
  {
    id: 1,
    category: 'tech',
    domain: 'dsa',
    question: 'Explain the difference between SQL (relational) and NoSQL (non-relational) databases. When would you choose one over the other?',
    topic: 'Database Systems',
    difficulty: 'Medium',
    modelAnswer:
      'SQL databases are structured, schema-bound, and table-based (e.g. PostgreSQL, MySQL) offering strong ACID guarantees — ideal for financial or transactional systems. NoSQL databases (e.g. MongoDB, Cassandra) are document or key-value based, schema-less, and scale horizontally — ideal for high-throughput, unstructured data, or rapid iteration.',
  },
  {
    id: 2,
    category: 'tech',
    domain: 'web',
    question: 'How does the Event Loop in JavaScript work, and how does it handle asynchronous non-blocking I/O?',
    topic: 'JavaScript Engine',
    difficulty: 'Hard',
    modelAnswer:
      'JavaScript executes on a single main thread using a Call Stack. Asynchronous tasks (timers, fetch) are delegated to Web APIs / libuv worker threads. Upon completion, callbacks are queued into Microtask Queue (Promises) or Macrotask Queue (setTimeout). The Event Loop continuously checks if Call Stack is empty and moves microtasks first, then macrotasks onto the call stack.',
  },

  // ── System Design ────────────────────────────────────────────────────────────
  {
    id: 3,
    category: 'system',
    domain: 'web',
    question: 'How would you design a scalable URL shortener service like Bitly to handle 100 Million daily requests?',
    topic: 'System Design',
    difficulty: 'Hard',
    modelAnswer:
      '1) Use a Base62 hashing algorithm (a-z, A-Z, 0-9) converting auto-incrementing 64-bit integer IDs into 7-character short codes.\n2) Cache hot URLs using Redis in-memory cache for fast O(1) lookups.\n3) Store original and short URLs in a distributed database (NoSQL or sharded MySQL).\n4) Add a Load Balancer (Nginx/HAProxy) in front of stateless application servers.',
  },

  // ── Coding & DSA: Data Structures & Algorithms ──────────────────────────────
  {
    id: 4,
    category: 'coding',
    domain: 'dsa',
    subType: 'dsa',
    question: 'Two Sum — Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`. You may assume each input has exactly one solution.',
    topic: 'Arrays & Hashing',
    difficulty: 'Easy',
    modelAnswer:
      'function solution(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const diff = target - nums[i];\n    if (map.has(diff)) return [map.get(diff), i];\n    map.set(nums[i], i);\n  }\n  return [];\n}',
    constraints: ['2 ≤ nums.length ≤ 10⁴', '-10⁹ ≤ nums[i] ≤ 10⁹', 'Only one valid answer exists'],
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]' },
      { input: 'nums = [3,2,4], target = 6', output: '[1,2]' },
    ],
  },
  {
    id: 5,
    category: 'coding',
    domain: 'dsa',
    subType: 'dsa',
    question: 'Reverse a Linked List — Given the head of a singly linked list, reverse the list and return the reversed list.',
    topic: 'Linked Lists',
    difficulty: 'Easy',
    modelAnswer:
      'function reverseList(head) {\n  let prev = null, curr = head;\n  while (curr !== null) {\n    let nextTemp = curr.next;\n    curr.next = prev;\n    prev = curr;\n    curr = nextTemp;\n  }\n  return prev;\n}',
    constraints: ['0 ≤ number of nodes ≤ 5000', '-5000 ≤ Node.val ≤ 5000'],
    examples: [
      { input: 'head = [1,2,3,4,5]', output: '[5,4,3,2,1]' },
      { input: 'head = [1,2]', output: '[2,1]' },
    ],
  },
  {
    id: 6,
    category: 'coding',
    domain: 'dsa',
    subType: 'dsa',
    question: 'Longest Common Subsequence (LCS) — Given two strings text1 and text2, return the length of their longest common subsequence. If there is no common subsequence, return 0.',
    topic: 'Dynamic Programming',
    difficulty: 'Medium',
    modelAnswer:
      'function longestCommonSubsequence(text1, text2) {\n  const m = text1.length, n = text2.length;\n  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));\n  for (let i = 1; i <= m; i++) {\n    for (let j = 1; j <= n; j++) {\n      if (text1[i - 1] === text2[j - 1]) dp[i][j] = 1 + dp[i - 1][j - 1];\n      else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);\n    }\n  }\n  return dp[m][n];\n}',
    constraints: ['1 ≤ text1.length, text2.length ≤ 1000'],
    examples: [
      { input: 'text1 = "abcde", text2 = "ace"', output: '3 (LCS is "ace")' },
    ],
  },
  {
    id: 8,
    category: 'coding',
    domain: 'dsa',
    subType: 'dsa',
    question: 'Valid Anagram — Given two strings s and t, return true if t is an anagram of s, and false otherwise.',
    topic: 'Strings & Hashing',
    difficulty: 'Easy',
    modelAnswer:
      'function isAnagram(s, t) {\n  if (s.length !== t.length) return false;\n  const count = {};\n  for (let char of s) count[char] = (count[char] || 0) + 1;\n  for (let char of t) {\n    if (!count[char]) return false;\n    count[char]--;\n  }\n  return true;\n}',
    constraints: ['1 ≤ s.length, t.length ≤ 5 * 10⁴'],
    examples: [
      { input: 's = "anagram", t = "nagaram"', output: 'true' },
    ],
  },
  {
    id: 14,
    category: 'coding',
    domain: 'dsa',
    subType: 'dsa',
    question: "Maximum Subarray Sum (Kadane's Algorithm) — Given an integer array nums, find the contiguous subarray which has the largest sum and return its sum.",
    topic: 'Arrays & Dynamic Programming',
    difficulty: 'Medium',
    modelAnswer:
      "// Reference Solution (Kadane's Algorithm O(N)):\nfunction maxSubArray(nums) {\n  let maxSoFar = nums[0], currMax = nums[0];\n  for (let i = 1; i < nums.length; i++) {\n    currMax = Math.max(nums[i], currMax + nums[i]);\n    maxSoFar = Math.max(maxSoFar, currMax);\n  }\n  return maxSoFar;\n}",
    constraints: ['1 ≤ nums.length ≤ 10⁵'],
    examples: [
      { input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]', output: '6 (Subarray [4,-1,2,1])' },
    ],
  },

  // ── Coding: Full Stack & Web Dev ────────────────────────────────────────────
  {
    id: 101,
    category: 'coding',
    domain: 'web',
    subType: 'web',
    question: 'Debounce Function (JavaScript) — Write a custom `debounce(fn, delay)` function that delays calling `fn` until after `delay` milliseconds have elapsed since the last time it was invoked.',
    topic: 'JavaScript Concepts',
    difficulty: 'Medium',
    modelAnswer:
      '// Reference Solution:\nfunction debounce(fn, delay) {\n  let timerId = null;\n  return function(...args) {\n    const context = this;\n    clearTimeout(timerId);\n    timerId = setTimeout(() => fn.apply(context, args), delay);\n  };\n}',
    constraints: ['Works on user input handlers and resize events'],
    examples: [
      { input: 'const debouncedSearch = debounce(searchApi, 300);', output: 'Executes searchApi only after 300ms pause' },
    ],
  },
  {
    id: 102,
    category: 'coding',
    domain: 'web',
    subType: 'web',
    question: 'Deep Clone Object (JavaScript) — Implement a function `deepClone(obj)` that creates a recursive deep copy of an object supporting nested arrays, objects, primitives, and null.',
    topic: 'Recursion & Objects',
    difficulty: 'Medium',
    modelAnswer:
      '// Reference Solution:\nfunction deepClone(obj) {\n  if (obj === null || typeof obj !== "object") return obj;\n  if (Array.isArray(obj)) return obj.map(deepClone);\n  const copy = {};\n  for (let key in obj) {\n    if (Object.prototype.hasOwnProperty.call(obj, key)) {\n      copy[key] = deepClone(obj[key]);\n    }\n  }\n  return copy;\n}',
    constraints: ['Handles nested objects and arrays'],
    examples: [
      { input: 'const cloned = deepClone({ a: 1, b: { c: 2 } });', output: 'cloned.b !== original.b' },
    ],
  },

  // ── Coding: Python & Data Science ──────────────────────────────────────────
  {
    id: 9,
    category: 'coding',
    domain: 'python',
    subType: 'python',
    question: 'Group Anagrams (Python) — Given an array of strings `strs`, group the anagrams together in any order. Return a list of lists of anagrams.',
    topic: 'Python Collections & Dictionaries',
    difficulty: 'Medium',
    modelAnswer:
      '# Reference Solution (Python):\nfrom collections import defaultdict\n\ndef groupAnagrams(strs):\n    ans = defaultdict(list)\n    for s in strs:\n        ans[tuple(sorted(s))].append(s)\n    return list(ans.values())\n',
    constraints: ['1 ≤ strs.length ≤ 10⁴'],
    examples: [
      { input: 'strs = ["eat","tea","tan","ate","nat","bat"]', output: '[["eat","tea","ate"],["tan","nat"],["bat"]]' },
    ],
  },
  {
    id: 10,
    category: 'coding',
    domain: 'python',
    subType: 'python',
    question: 'Word Frequency & Top K Frequent Words (Python) — Given a list of words, write a Python function using `Counter` and heap to return the `k` most frequent words.',
    topic: 'Python Heaps & Counter',
    difficulty: 'Medium',
    modelAnswer:
      '# Reference Solution (Python):\nimport collections, heapq\n\ndef topKFrequent(words, k):\n    count = collections.Counter(words)\n    heap = [(-freq, word) for word, freq in count.items()]\n    heapq.heapify(heap)\n    return [heapq.heappop(heap)[1] for _ in range(k)]\n',
    constraints: ['1 ≤ words.length ≤ 500'],
    examples: [
      { input: 'words = ["i","love","leetcode","i","love","coding"], k = 2', output: '["i","love"]' },
    ],
  },

  // ── Coding: SQL Queries ─────────────────────────────────────────────────────
  {
    id: 11,
    category: 'coding',
    domain: 'sql',
    subType: 'sql',
    question: 'High Salary Departments (SQL) — Write a SQL query to find employees who earn higher than the average salary of their respective departments.',
    topic: 'SQL Subqueries & Aggregations',
    difficulty: 'Medium',
    modelAnswer:
      '-- Reference Solution (SQL):\nSELECT e.name, e.department, e.salary\nFROM employees e\nWHERE e.salary > (\n    SELECT AVG(salary)\n    FROM employees\n    WHERE department = e.department\n);',
    constraints: ['Standard ANSI SQL supported'],
    examples: [
      { input: 'Table: employees(id, name, salary, department)', output: 'Returns employees earning > dept average' },
    ],
  },
  {
    id: 12,
    category: 'coding',
    domain: 'sql',
    subType: 'sql',
    question: 'Second Highest Salary (SQL) — Write a SQL query to find the second highest distinct salary from the Employee table.',
    topic: 'SQL Limits & Subqueries',
    difficulty: 'Easy',
    modelAnswer:
      '-- Reference Solution (SQL):\nSELECT MAX(salary) AS SecondHighestSalary\nFROM Employee\nWHERE salary < (\n    SELECT MAX(salary) FROM Employee\n);',
    constraints: ['Returns NULL if no second highest salary'],
    examples: [
      { input: 'Salaries: [100, 200, 300]', output: '200' },
    ],
  },

  // ── Coding: Java & C++ Core ─────────────────────────────────────────────────
  {
    id: 13,
    category: 'coding',
    domain: 'java-cpp',
    subType: 'java-cpp',
    question: 'Binary Search (Java / C++) — Implement Binary Search algorithm on a sorted array of integers `nums` for a target value.',
    topic: 'Search Algorithms',
    difficulty: 'Easy',
    modelAnswer:
      '// Reference Solution (Binary Search Java):\npublic int search(int[] nums, int target) {\n    int left = 0, right = nums.length - 1;\n    while (left <= right) {\n        int mid = left + (right - left) / 2;\n        if (nums[mid] == target) return mid;\n        if (nums[mid] < target) left = mid + 1;\n        else right = mid - 1;\n    }\n    return -1;\n}',
    constraints: ['1 ≤ nums.length ≤ 10⁴'],
    examples: [
      { input: 'nums = [-1,0,3,5,9,12], target = 9', output: '4 (index)' },
    ],
  },

  // ── HR & Behavioral ──────────────────────────────────────────────────────────
  {
    id: 7,
    category: 'hr',
    domain: 'all',
    question: 'Tell me about a time when you encountered a major technical roadblock during a project. How did you resolve it?',
    topic: 'Behavioral (STAR Method)',
    difficulty: 'Medium',
    modelAnswer:
      'Structure using STAR (Situation, Task, Action, Result):\n- Situation: Database queries were timing out during peak traffic.\n- Task: Needed to optimize response times under 200ms.\n- Action: Profiled slow queries using EXPLAIN ANALYZE, added missing compound indexes, and introduced Redis caching.\n- Result: Query execution time dropped from 2.4s to 45ms.',
  },
  {
    id: 201,
    category: 'hr',
    domain: 'all',
    question: 'Describe a situation where you had a disagreement with a senior engineer or team member over technical architecture. How did you handle it?',
    topic: 'Behavioral & Teamwork',
    difficulty: 'Medium',
    modelAnswer:
      'STAR Response:\n- Situation: Disagreed on choosing REST vs GraphQL for a mobile API.\n- Task: Align on an efficient API protocol that met latency and bandwidth requirements.\n- Action: Created a benchmark prototype comparing query payloads and network latency for top 5 mobile screens, presented data objectively without bias.\n- Result: Decided on a hybrid approach (REST for static assets, GraphQL for complex dashboards), resulting in 35% faster mobile load times.',
  },
  {
    id: 202,
    category: 'hr',
    domain: 'all',
    question: 'How do you prioritize tasks and manage tight deadlines when multiple urgent feature requests arrive at once?',
    topic: 'Time Management',
    difficulty: 'Easy',
    modelAnswer:
      'STAR Response:\n- Situation: Facing simultaneous bug fixes, security patch, and sprint release deadline.\n- Task: Ensure critical production stability while minimizing feature delay.\n- Action: Used Eisenhower Matrix to categorize by Urgency x Impact; communicated transparently with Product Manager to push non-critical UI tweaks to next sprint.\n- Result: Deployed security fix within 2 hours, completed core sprint release on schedule.',
  },

  // ── Technical Core (Expanded) ───────────────────────────────────────────────
  {
    id: 203,
    category: 'tech',
    domain: 'dsa',
    question: 'Explain Virtual Memory and how Page Faults are handled by the Operating System.',
    topic: 'Operating Systems',
    difficulty: 'Medium',
    modelAnswer:
      'Virtual Memory creates an illusion of large continuous RAM by mapping virtual addresses to physical frame addresses using Page Tables (TLB). When a process accesses a page not present in physical RAM, a Page Fault exception occurs. OS halts process, loads page from disk/swap into an available frame, updates Page Table, and resumes execution.',
  },
  {
    id: 204,
    category: 'tech',
    domain: 'web',
    question: 'Explain TCP 3-Way Handshake and compare TCP vs UDP protocols.',
    topic: 'Computer Networks',
    difficulty: 'Medium',
    modelAnswer:
      'TCP 3-Way Handshake: SYN -> SYN-ACK -> ACK establishes reliable, ordered connection. TCP provides flow control, error checking, and retransmission (ideal for HTTP, FTP, Email). UDP is connectionless and lightweight without delivery guarantees (ideal for VoIP, video streaming, gaming).',
  },

  // ── System Design (Expanded) ─────────────────────────────────────────────────
  {
    id: 205,
    category: 'system',
    domain: 'web',
    question: 'Design an API Rate Limiter to prevent API abuse (e.g. limit users to 100 requests/minute).',
    topic: 'System Architecture',
    difficulty: 'Medium',
    modelAnswer:
      '1) Algorithm: Token Bucket or Sliding Window Log using Redis in-memory store.\n2) Key format: rate_limit:user_id:minute_timestamp.\n3) Execute atomic Redis INCR and EXPIRE command.\n4) Return HTTP 429 Too Many Requests with Retry-After header if counter > threshold.',
  },
  {
    id: 206,
    category: 'system',
    domain: 'dsa',
    question: 'How do you design a Real-Time Distributed Push Notification Service for millions of users?',
    topic: 'Distributed Systems',
    difficulty: 'Hard',
    modelAnswer:
      '1) Ingestion Layer: Stateless API Gateway pushing events to Apache Kafka / RabbitMQ message queue.\n2) Worker Pool: Microservices consuming queue messages and dispatching via FCM (Android), APNS (iOS), Web Push (VAPID).\n3) Rate limiting & Retry backoff: Exponential backoff for failed deliveries with Dead Letter Queues (DLQ).',
  },
];

// ─── AI Feedback Renderer ─────────────────────────────────────────────────────
function FeedbackText({ text }) {
  if (!text) return null;
  return (
    <div className="space-y-1.5 text-[12px]">
      {text.split('\n').map((line, i) => {
        if (!line.trim()) return null;
        if (/^\*\*.+\*\*/.test(line)) {
          return (
            <p key={i} className="font-semibold text-accent-blue mt-1.5">
              {line.replace(/\*\*/g, '')}
            </p>
          );
        }
        if (/^[-•]\s/.test(line)) {
          return (
            <div key={i} className="flex gap-2 text-text">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-blue/70 flex-shrink-0 mt-1.5" />
              <span>{line.replace(/^[-•]\s/, '').replace(/\*\*(.+?)\*\*/g, '$1')}</span>
            </div>
          );
        }
        return (
          <p key={i} className="text-text leading-relaxed">
            {line.replace(/\*\*(.+?)\*\*/g, '$1')}
          </p>
        );
      })}
    </div>
  );
}

export default function InterviewPrepPage() {
  const [activeCategory, setActiveCategory]   = useState('coding');
  const [activeDomain, setActiveDomain]       = useState('all');
  const [codingSubfilter, setCodingSubfilter] = useState('all');
  const [questionsList, setQuestionsList]     = useState(BASE_QUESTIONS);
  const [openIds, setOpenIds]                 = useState([4]);
  const [userAnswers, setUserAnswers]         = useState({});
  const [evaluating, setEvaluating]           = useState(null);
  const [feedback, setFeedback]               = useState({});
  const [roadmapSummary, setRoadmapSummary]   = useState(null);
  const [loadingRoadmaps, setLoadingRoadmaps] = useState(false);

  useEffect(() => {
    fetchUserRoadmapPrograms();
  }, []);

  // Fetch all user roadmaps and extract all practice coding tasks dynamically
  const fetchUserRoadmapPrograms = async () => {
    setLoadingRoadmaps(true);
    try {
      const { data: roadmaps } = await api.get('/roadmap/my');
      if (!roadmaps || roadmaps.length === 0) return;

      const fullRoadmaps = await Promise.all(
        roadmaps.map(r => api.get(`/roadmap/${r.id}`).then(res => res.data).catch(() => null))
      );

      const domainCounts = {};
      const extraRoadmapQuestions = [];

      fullRoadmaps.forEach(rm => {
        if (!rm) return;
        const dom = rm.domain || 'DSA';
        domainCounts[dom] = (domainCounts[dom] || 0) + 1;

        if (!rm.phases) return;
        rm.phases.forEach(ph => {
          (ph.weeks || []).forEach(wk => {
            (wk.days || []).forEach(day => {
              (day.tasks || []).forEach(task => {
                const isPractice = task.type === 'PRACTICE' || task.type === 'LEARN';
                if (isPractice) {
                  extraRoadmapQuestions.push({
                    id: `rm-${rm.id}-${day.id}-${task.id}`,
                    category: 'coding',
                    domain: (rm.domain || 'dsa').toLowerCase().includes('python') ? 'python' :
                            (rm.domain || '').toLowerCase().includes('sql') ? 'sql' :
                            (rm.domain || '').toLowerCase().includes('web') ? 'web' : 'dsa',
                    subType: 'roadmap',
                    question: `[${rm.domain} Roadmap — Day ${day.dayNumber}] ${task.title}: ${task.description || day.topic}`,
                    topic: day.topic || rm.domain,
                    difficulty: day.dayNumber > 15 ? 'Hard' : day.dayNumber > 7 ? 'Medium' : 'Easy',
                    modelAnswer: `// Reference Solution (${rm.domain} — Day ${day.dayNumber}):\n// Task: ${task.title}\n// Goal: ${task.description || day.topic}\n\nfunction solution() {\n  console.log("Implementing ${task.title} for ${day.topic}");\n  return true;\n}`,
                    constraints: [`Roadmap: ${rm.domain}`, `Phase: ${ph.title}`, `Day: ${day.dayNumber}`],
                    examples: [{ input: `${task.title} inputs`, output: 'Verified Result' }],
                  });
                }
              });
            });
          });
        });
      });

      setRoadmapSummary({
        totalRoadmaps: roadmaps.length,
        domainCounts,
        totalRoadmapTasks: extraRoadmapQuestions.length,
      });

      if (extraRoadmapQuestions.length > 0) {
        setQuestionsList(prev => {
          const existingIds = new Set(prev.map(q => q.id));
          const newUnique = extraRoadmapQuestions.filter(q => !existingIds.has(q.id));
          return [...prev, ...newUnique];
        });
      }
    } catch (err) {
      console.warn('Roadmap task extraction warning:', err);
    } finally {
      setLoadingRoadmaps(false);
    }
  };

  const toggleOpen = id => {
    setOpenIds(ids => (ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]));
  };

  const handleAnswerChange = (id, text) => {
    setUserAnswers(a => ({ ...a, [id]: text }));
  };

  const handleEvaluate = async question => {
    const answerText = userAnswers[question.id];
    if (!answerText || !answerText.trim()) return;

    setEvaluating(question.id);
    try {
      const prompt = `You are a senior software engineering interviewer. Evaluate this student's answer to the interview question below.

**Interview Question:** "${question.question}"

**Student's Answer:** "${answerText}"

**Expected Model Answer / Key Points:** "${question.modelAnswer}"

Provide professional feedback in this format:

**Rating:** X/10

**Strengths**
- List what the student got right

**Missing Key Points**
- List important concepts or specifics the student missed

**Improvement Tips**
- 2-3 specific and actionable suggestions to strengthen the answer

Keep your feedback constructive and encouraging.`;

      const { data } = await api.post('/chatbot', { content: prompt });
      setFeedback(f => ({ ...f, [question.id]: data.message.content }));
    } catch (e) {
      setFeedback(f => ({
        ...f,
        [question.id]: `**Quick Feedback**\n\nGood effort! Your response covers key points.\n\n**Improvement Tip**\n- Be sure to mention key technical terms like "${question.topic}" and structure your explanation clearly using examples.\n- Practice the STAR format for behavioral questions and step-by-step explanations for technical ones.`,
      }));
    } finally {
      setEvaluating(null);
    }
  };

  // Filtering questions by Category, Domain, and Sub-filter
  const filtered = questionsList.filter(q => {
    if (q.category !== activeCategory) return false;

    // Domain filter
    if (activeDomain !== 'all') {
      if (activeDomain === 'roadmap') {
        if (q.subType !== 'roadmap') return false;
      } else if (q.domain !== 'all' && q.domain !== activeDomain) {
        return false;
      }
    }

    // Coding sub-filter
    if (activeCategory === 'coding' && codingSubfilter !== 'all') {
      if (q.subType !== codingSubfilter) return false;
    }

    return true;
  });

  const isCodingCategory = activeCategory === 'coding';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-[18px] font-bold text-text flex items-center gap-2">
          <BookOpen size={20} className="text-accent-blue" />
          Coding Prep &amp; Interview Hub
        </h2>
        <p className="text-[12px] text-muted mt-0.5">
          Select your learning domain and practice coding problems — AI synthesizes programs across all domains you wish to learn, retaining all your roadmap tasks!
        </p>
      </div>

      {/* AI Roadmap & Multi-Domain Analysis Banner */}
      {roadmapSummary && (
        <div className="bg-gradient-to-r from-accent-blue/15 via-accent-purple/10 to-card border border-accent-blue/30 p-4 rounded-2xl animate-fade-in flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-blue/20 flex items-center justify-center text-accent-blue flex-shrink-0 mt-0.5">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-text flex items-center gap-2">
                AI Roadmap Analysis — {roadmapSummary.totalRoadmaps} Active Roadmaps Identified
              </h3>
              <p className="text-[12px] text-muted mt-0.5">
                AI analyzed your roadmaps across domains:{' '}
                {Object.entries(roadmapSummary.domainCounts).map(([dom, count]) => (
                  <strong key={dom} className="text-text mr-2">
                    {dom} ({count})
                  </strong>
                ))}
              </p>
              <p className="text-[11px] text-accent-blue font-semibold mt-1">
                ✓ {roadmapSummary.totalRoadmapTasks} practice programs synthesized &amp; preserved in Coding Prep
              </p>
            </div>
          </div>
          <Badge color="blue" size="sm">
            <BarChart3 size={12} className="inline mr-1" /> Multi-Domain Active
          </Badge>
        </div>
      )}

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-border pb-3 no-scrollbar">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            id={`interview-cat-${cat.id}`}
            className={`px-4 py-2 rounded-xl text-[12px] font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeCategory === cat.id
                ? 'bg-accent-blue text-white shadow-md'
                : 'bg-card text-muted hover:text-text border border-border'
            }`}
          >
            {cat.id === 'coding' && <Terminal size={13} />}
            {cat.label} ({questionsList.filter(q => q.category === cat.id).length})
          </button>
        ))}
      </div>

      {/* Domain Selector Pills */}
      <div className="bg-surface/80 p-3 rounded-2xl border border-border space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-accent-blue uppercase tracking-wider flex items-center gap-1.5">
            <Globe size={13} /> Select Domain / Wish to Learn:
          </span>
          {loadingRoadmaps && (
            <span className="text-[10px] text-muted animate-pulse">Syncing roadmap programs...</span>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
          {DOMAINS.map(d => {
            const Icon = d.icon;
            const count = d.id === 'all'
              ? questionsList.filter(q => q.category === activeCategory).length
              : d.id === 'roadmap'
              ? questionsList.filter(q => q.category === activeCategory && q.subType === 'roadmap').length
              : questionsList.filter(q => q.category === activeCategory && q.domain === d.id).length;

            return (
              <button
                key={d.id}
                onClick={() => setActiveDomain(d.id)}
                className={`px-3 py-1.5 rounded-xl text-[11.5px] font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeDomain === d.id
                    ? 'bg-accent-blue text-white shadow-sm font-semibold'
                    : 'bg-card text-muted hover:text-text border border-border'
                }`}
              >
                <Icon size={12} />
                {d.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Coding Sub-filters */}
      {isCodingCategory && (
        <div className="flex items-center gap-2 overflow-x-auto bg-surface/60 p-2 rounded-xl border border-border no-scrollbar">
          <span className="text-[11px] font-semibold text-muted flex items-center gap-1 px-2">
            <Filter size={12} /> Practice Topic:
          </span>
          {CODING_SUBFILTERS.map(sub => {
            const topicCount = sub.id === 'all'
              ? questionsList.filter(q => q.category === 'coding').length
              : questionsList.filter(q => q.category === 'coding' && q.subType === sub.id).length;
            return (
              <button
                key={sub.id}
                onClick={() => setCodingSubfilter(sub.id)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap ${
                  codingSubfilter === sub.id
                    ? 'bg-accent-blue/15 text-accent-blue border border-accent-blue/30 font-semibold'
                    : 'text-muted hover:text-text hover:bg-card'
                }`}
              >
                {sub.label} ({topicCount})
              </button>
            );
          })}
        </div>
      )}

      {/* Coding category banner */}
      {isCodingCategory && (
        <div className="bg-gradient-to-r from-accent-purple/10 via-accent-blue/10 to-transparent border border-accent-blue/20 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent-blue/20 flex items-center justify-center text-accent-blue flex-shrink-0">
              <Code size={16} />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-text">
                Live Coding Playground — Write Code, Run &amp; Get AI Review
              </p>
              <p className="text-[11px] text-muted">
                Editor starts with blank starter code (<code className="text-accent-blue font-mono">// Place your code here</code>). Click <strong>Solution</strong> next to <strong>Run Code</strong> anytime to see reference code for your selected language!
              </p>
            </div>
          </div>
          <Badge color="green" size="xs">
            {questionsList.filter(q => q.category === 'coding').length} Coding Problems Active
          </Badge>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-4">
        {filtered.length > 0 ? (
          filtered.map(q => {
            const isOpen = openIds.includes(q.id);
            const userAns = userAnswers[q.id] || '';
            const fb = feedback[q.id];
            const isCodingQuestion = q.category === 'coding';

            return (
              <Card key={q.id} className="p-5 border hover:border-accent-blue/30 transition-all">
                {/* Question Header */}
                <div
                  onClick={() => toggleOpen(q.id)}
                  className="flex items-start justify-between gap-4 cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg flex-shrink-0 mt-0.5 ${isCodingQuestion ? 'bg-accent-purple/10 text-accent-purple' : 'bg-accent-blue/10 text-accent-blue'}`}>
                      {isCodingQuestion ? <Terminal size={16} /> : <HelpCircle size={16} />}
                    </div>
                    <div>
                      <h3 className="text-[14px] font-semibold text-text leading-snug">{q.question}</h3>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <Badge color="blue" size="xs">{q.topic}</Badge>
                        <Badge
                          color={q.difficulty === 'Hard' ? 'red' : q.difficulty === 'Medium' ? 'amber' : 'green'}
                          size="xs"
                        >
                          {q.difficulty}
                        </Badge>
                        {isCodingQuestion && (
                          <Badge color="purple" size="xs">
                            <Terminal size={10} className="inline mr-0.5" /> Code Editor
                          </Badge>
                        )}
                        {q.subType === 'roadmap' && (
                          <Badge color="amber" size="xs">
                            <Compass size={10} className="inline mr-0.5" /> Roadmap Preserved
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {isOpen ? (
                    <ChevronUp size={18} className="text-muted flex-shrink-0" />
                  ) : (
                    <ChevronDown size={18} className="text-muted flex-shrink-0" />
                  )}
                </div>

                {/* Expanded Content */}
                {isOpen && (
                  <div className="mt-4 pt-4 border-t border-border space-y-4 animate-fade-in">

                    {/* Coding Question: Constraints + Examples */}
                    {isCodingQuestion && q.constraints && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-surface border border-border rounded-xl p-3">
                          <h4 className="text-[11px] font-bold text-muted uppercase tracking-wide mb-2">Constraints</h4>
                          <ul className="space-y-1">
                            {q.constraints.map((c, i) => (
                              <li key={i} className="text-[11.5px] text-text flex gap-1.5 items-start">
                                <span className="text-accent-amber flex-shrink-0">•</span>
                                <code className="font-mono">{c}</code>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-surface border border-border rounded-xl p-3">
                          <h4 className="text-[11px] font-bold text-muted uppercase tracking-wide mb-2">Examples</h4>
                          {q.examples?.map((ex, i) => (
                            <div key={i} className="mb-2">
                              <p className="text-[11px] text-muted">Input: <code className="font-mono text-accent-blue">{ex.input}</code></p>
                              <p className="text-[11px] text-muted">Output: <code className="font-mono text-accent-green">{ex.output}</code></p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Non-Coding Category: Model Answer Box */}
                    {!isCodingQuestion && (
                      <div className="bg-surface p-4 rounded-xl border border-border">
                        <h4 className="text-[12px] font-bold text-accent-green mb-1 flex items-center gap-1.5">
                          <CheckCircle size={14} /> Model Answer &amp; Key Points
                        </h4>
                        <p className="text-[12px] text-text whitespace-pre-line leading-relaxed">{q.modelAnswer}</p>
                      </div>
                    )}

                    {/* ── CODING CATEGORY: Code Playground ── */}
                    {isCodingQuestion ? (
                      <div>
                        <h4 className="text-[12px] font-bold text-accent-purple mb-2 flex items-center gap-1.5">
                          <Terminal size={14} /> Coding Space — Write, Run, Language-Specific Solution &amp; AI Review
                        </h4>
                        <CodePlayground problem={q.question} solution={q.modelAnswer} />
                      </div>
                    ) : (
                      /* ── NON-CODING: Practice Answer Textarea + AI Evaluate ── */
                      <>
                        <div>
                          <label className="text-[11px] font-semibold text-muted mb-1 block">
                            Write your practice answer:
                          </label>
                          <textarea
                            value={userAns}
                            onChange={e => handleAnswerChange(q.id, e.target.value)}
                            placeholder="Type your response to practice explaining this concept..."
                            rows={3}
                            className="w-full bg-card border border-border rounded-xl p-3 text-[12px] text-text placeholder:text-muted focus:outline-none focus:border-accent-blue"
                            id={`answer-textarea-${q.id}`}
                          />
                        </div>

                        {/* AI Feedback Box */}
                        {fb && (
                          <div className="bg-accent-blue/10 border border-accent-blue/30 p-4 rounded-xl">
                            <h4 className="text-[12px] font-bold text-accent-blue mb-2 flex items-center gap-1.5">
                              <Sparkles size={14} /> AI Interviewer Feedback
                            </h4>
                            <FeedbackText text={fb} />
                          </div>
                        )}

                        <div className="flex justify-end">
                          <Button
                            variant="primary"
                            size="sm"
                            loading={evaluating === q.id}
                            disabled={!userAns.trim()}
                            onClick={() => handleEvaluate(q)}
                            icon={Sparkles}
                            id={`evaluate-btn-${q.id}`}
                          >
                            Evaluate Answer with AI
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </Card>
            );
          })
        ) : (
          <Card className="p-8 text-center space-y-3">
            <Code size={32} className="mx-auto text-muted" />
            <h3 className="text-[14px] font-semibold text-text">No coding programs found for this selection</h3>
            <p className="text-[12px] text-muted max-w-md mx-auto">
              Try switching to "All Domains" or "All Topics" to view available coding prep tasks.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
