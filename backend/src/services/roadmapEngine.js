'use strict';
/**
 * roadmapEngine.js — PlaceMate AI
 *
 * Generates multi-week Phase → Week → Day roadmaps for every supported domain.
 * Structure: Phase → Week (always 7 days) → Day (with real topic + time split).
 *
 * Supports: Java, Python, C++, JavaScript, React, Node.js, Full Stack, DSA, SQL,
 *           ML, Data Science, Cybersecurity, Cloud & DevOps, System Design,
 *           Flutter/Mobile, Aptitude.
 *
 * Supports custom duration (e.g. 3 weeks = 21 days) and prompt-based duration parsing.
 */

const prisma = require('../config/prisma');
const { awardRoadmapBadges } = require('./badgeEngine');

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const DAILY_SPLIT = {
  learn:    0.45,
  practice: 0.35,
  aptitude: 0.12,
  revision: 0.08,
};

const XP_PER_DAY = 50;
const XP_ASSESSMENT_DAY = 150;

// Domain → baseline total days range [min, max] at 2hrs/day
const DOMAIN_RANGES = {
  java:          { min: 45, max: 90  },
  python:        { min: 30, max: 75  },
  cpp:           { min: 45, max: 90  },
  javascript:    { min: 30, max: 60  },
  react:         { min: 30, max: 60  },
  nodejs:        { min: 30, max: 60  },
  fullstack:     { min: 60, max: 120 },
  dsa:           { min: 45, max: 90  },
  sql:           { min: 21, max: 45  },
  ml:            { min: 60, max: 120 },
  datascience:   { min: 60, max: 120 },
  cybersecurity: { min: 30, max: 75  },
  cloud:         { min: 30, max: 75  },
  systemdesign:  { min: 21, max: 45  },
  flutter:       { min: 30, max: 60  },
  aptitude:      { min: 21, max: 60  },
};

// Rich domain templates containing 6-8 weeks of structured daily topics
const DOMAIN_TEMPLATES = {
  java: {
    phases: [
      {
        title: 'Phase 1: Java Fundamentals & OOP',
        weeks: [
          {
            title: 'Week 1 — Java Syntax & Basics',
            days: [
              'Java JVM architecture, JDK/JRE setup, Hello World',
              'Primitive data types, variables, type casting',
              'Operators, expressions, control flow (if/switch)',
              'Loops — for, while, do-while, break/continue',
              'Arrays — 1D/2D array creation & traversal',
              'Methods — parameters, return types, overloading',
              'Weekly assessment + Java basics revision',
            ],
          },
          {
            title: 'Week 2 — Object-Oriented Programming',
            days: [
              'Classes, objects, constructor initialization',
              'this keyword, access modifiers (private/public)',
              'Encapsulation — getters, setters, immutability',
              'Inheritance — extends keyword, super method',
              'Polymorphism — method overriding vs overloading',
              'Abstract classes & interfaces in Java',
              'Weekly assessment + OOP problem set',
            ],
          },
        ],
      },
      {
        title: 'Phase 2: Collections & Modern Java',
        weeks: [
          {
            title: 'Week 3 — Java Collections Framework',
            days: [
              'ArrayList & LinkedList — usage & performance',
              'HashSet & TreeSet — set operations & hashing',
              'HashMap & TreeMap — key-value store mechanics',
              'Iterators, ListIterator & enhanced for-loop',
              'Generics — bounded & unbounded type parameters',
              'Exception handling — try-catch-finally, custom exceptions',
              'Weekly assessment + Collections coding practice',
            ],
          },
          {
            title: 'Week 4 — Streams & Functional Programming',
            days: [
              'Lambda expressions & functional interfaces',
              'Stream API — filter, map, reduce pipelines',
              'Collectors — groupingBy, joining, summarizing',
              'Optional class — handling null safely',
              'File I/O — java.nio, BufferedReader/Writer',
              'Multithreading — Thread, Runnable, Synchronized',
              'Weekly assessment + Functional Java project',
            ],
          },
        ],
      },
      {
        title: 'Phase 3: Spring Boot & Interview Readiness',
        weeks: [
          {
            title: 'Week 5 — Spring Boot Basics & REST APIs',
            days: [
              'Spring Boot overview & dependency injection',
              'Creating REST Controllers (@GetMapping, @PostMapping)',
              'Spring Data JPA & Hibernate entity mappings',
              'DTO pattern & input validation with `@Valid`',
              'JUnit 5 & Mockito unit testing fundamentals',
              'Build tool overview — Maven & Gradle scripts',
              'Weekly assessment + Spring Boot mini REST API',
            ],
          },
          {
            title: 'Week 6 — Java Placement & Interview Prep',
            days: [
              'Core Java interview questions (JVM memory, GC)',
              'Collections & Hashmap internal working questions',
              'Concurrency & thread safety interview problems',
              'Object-oriented design patterns (Factory, Singleton)',
              'Popular LeetCode Java algorithms practice',
              'Java timed mock technical interview round',
              'Final assessment & roadmap completion',
            ],
          },
        ],
      },
    ],
  },

  python: {
    phases: [
      {
        title: 'Phase 1: Python Fundamentals',
        weeks: [
          {
            title: 'Week 1 — Syntax & Data Structures',
            days: [
              'Python installation, variables, print/input',
              'Data types: int, float, str, bool, type conversion',
              'Strings — slicing, formatting, built-in methods',
              'Lists — indexing, slicing, appending, sorting',
              'Tuples & Sets — immutability, set math ops',
              'Dictionaries — keys, values, dictionary methods',
              'Weekly assessment + core syntax revision',
            ],
          },
          {
            title: 'Week 2 — Control Flow & Functions',
            days: [
              'Conditionals — if, elif, else, ternary ops',
              'Loops — for, while, range, enumerate, zip',
              'Functions — def, return, default parameters',
              '*args and **kwargs parameter unpacking',
              'Scope — local, global, non-local variables',
              'Lambda functions, map, filter, list comprehensions',
              'Weekly assessment + functional Python practice',
            ],
          },
        ],
      },
      {
        title: 'Phase 2: OOP & Libraries',
        weeks: [
          {
            title: 'Week 3 — Object-Oriented Python',
            days: [
              'Classes, objects, __init__ constructor, self',
              'Instance attributes vs Class attributes',
              'Inheritance — single, multiple, super() call',
              'Encapsulation & property decorators (@property)',
              'Polymorphism & dunder methods (__str__, __repr__)',
              'Exception handling — try, except, else, finally',
              'Weekly assessment + OOP project script',
            ],
          },
          {
            title: 'Week 4 — Modules, Packages & Data Handling',
            days: [
              'File I/O — reading/writing text & CSV files',
              'JSON processing — json.loads, json.dumps',
              'NumPy arrays, vector operations, slicing',
              'Pandas DataFrames — filtering, grouping, aggregation',
              'Virtual environments (venv) & pip package manager',
              'HTTP requests using `requests` library & REST APIs',
              'Weekly assessment + Data automation project',
            ],
          },
        ],
      },
      {
        title: 'Phase 3: Advanced Python & Interview Prep',
        weeks: [
          {
            title: 'Week 5 — Advanced Features',
            days: [
              'Decorators — wrapping functions & class decorators',
              'Generators & yield statement — memory efficiency',
              'Context managers — `with` statement, __enter__/__exit__',
              'Multiprocessing vs Threading in Python (GIL)',
              'Asyncio — async/await, event loop execution',
              'PyTest unit testing & mocking external APIs',
              'Weekly assessment + advanced Python review',
            ],
          },
          {
            title: 'Week 6 — Python Interview Prep',
            days: [
              'Top Python interview questions & memory management',
              'Algorithm coding challenges in Python',
              'Data structures implementations in Python',
              'Code refactoring & PEP8 style guidelines',
              'Python system design & script optimization',
              'Full timed Python mock interview',
              'Final assessment day & completion',
            ],
          },
        ],
      },
    ],
  },

  cpp: {
    phases: [
      {
        title: 'Phase 1: C++ Core Syntax & Memory',
        weeks: [
          {
            title: 'Week 1 — C++ Syntax & Control Flow',
            days: [
              'C++ environment setup, g++ compiler, main function',
              'Variables, data types, cin/cout formatting',
              'Operators, Type casting, Constants (const, constexpr)',
              'Control statements — if/else, switch case',
              'Loops — for, while, do-while, range-based for',
              'Functions — pass by value vs pass by reference',
              'Weekly assessment + syntax practice set',
            ],
          },
          {
            title: 'Week 2 — Arrays, Pointers & Memory',
            days: [
              'Arrays & C-style Strings — 1D/2D arrays',
              'Pointers basics — memory addresses & dereferencing',
              'Pointer arithmetic & array pointer relation',
              'Dynamic memory allocation — new and delete',
              'References vs Pointers in C++',
              'Structures (struct) & Enums',
              'Weekly assessment + Memory management practice',
            ],
          },
        ],
      },
      {
        title: 'Phase 2: OOP & Standard Template Library (STL)',
        weeks: [
          {
            title: 'Week 3 — Object-Oriented C++',
            days: [
              'Classes, Objects, Constructors & Destructors',
              'Copy Constructors & Deep vs Shallow Copy',
              'Encapsulation & Access specifiers',
              'Inheritance — public/protected/private modes',
              'Polymorphism — Function Overriding & Virtual Functions',
              'Abstract classes & Pure Virtual Functions',
              'Weekly assessment + C++ OOP project',
            ],
          },
          {
            title: 'Week 4 — C++ STL Containers & Algorithms',
            days: [
              'std::vector — dynamic array operations & capacity',
              'std::list, std::deque & std::forward_list',
              'std::map & std::unordered_map — hash tables',
              'std::set & std::unordered_set — unique collections',
              'std::stack, std::queue, std::priority_queue',
              'STL Algorithms — sort, binary_search, find, transform',
              'Weekly assessment + STL problem solving',
            ],
          },
        ],
      },
      {
        title: 'Phase 3: Advanced C++ & Competitive Coding',
        weeks: [
          {
            title: 'Week 5 — Smart Pointers & Templates',
            days: [
              'Function Templates & Class Templates',
              'Smart Pointers — std::unique_ptr, std::shared_ptr',
              'Move Semantics & rvalue references (std::move)',
              'RAII principle & Exception Handling in C++',
              'Lambda expressions & Functors (std::function)',
              'File I/O — std::fstream, reading/writing files',
              'Weekly assessment + Modern C++ review',
            ],
          },
          {
            title: 'Week 6 — C++ Interview Prep',
            days: [
              'Memory leak detection & debugging C++',
              'Popular LeetCode DSA solutions in C++',
              'C++ Low-level system interview questions',
              'Object-oriented design in C++',
              'Time & Space complexity optimization in C++',
              'Timed C++ technical interview simulation',
              'Final assessment & course completion',
            ],
          },
        ],
      },
    ],
  },

  javascript: {
    phases: [
      {
        title: 'Phase 1: Modern JS Core',
        weeks: [
          {
            title: 'Week 1 — Syntax & Data Types',
            days: [
              'Variables (var, let, const), Scope differences',
              'Data types, Type coercion, Equality (== vs ===)',
              'Strings, Template literals, String methods',
              'Arrays — indexing, methods (push, pop, splice)',
              'Objects — literal syntax, property access, methods',
              'Control flow — if/else, switch, ternary, loops',
              'Weekly assessment + Core JS practice',
            ],
          },
          {
            title: 'Week 2 — Functions & Scope',
            days: [
              'Function declarations vs Arrow functions',
              'Rest/Spread operators & Parameter destructuring',
              'Lexical Scope, Closures & Execution Context',
              'Higher Order Functions — map, filter, reduce',
              'Array iteration methods — forEach, find, some, every',
              'Callbacks & Asynchronous Execution introduction',
              'Weekly assessment + Closure problem set',
            ],
          },
        ],
      },
      {
        title: 'Phase 2: Async JS & Web APIs',
        weeks: [
          {
            title: 'Week 3 — Promises & Async/Await',
            days: [
              'Promises — creation, resolve/reject, chaining',
              'Promise.all, Promise.race, Promise.allSettled',
              'Async / Await syntax & try-catch error handling',
              'Fetch API — HTTP GET/POST JSON requests',
              'Event Loop — Call Stack, Web APIs, Microtask Queue',
              'Local Storage, Session Storage & Cookies',
              'Weekly assessment + Async API Integration app',
            ],
          },
          {
            title: 'Week 4 — DOM & Events',
            days: [
              'DOM selection — querySelector, getElementById',
              'DOM manipulation — innerHTML, textContent, style',
              'Event Listeners — click, submit, keydown events',
              'Event Delegation & Event Bubbling/Capturing',
              'Form Handling & Input Validation',
              'Modules — ES Modules (import/export) vs CommonJS',
              'Weekly assessment + Interactive Web App',
            ],
          },
        ],
      },
      {
        title: 'Phase 3: JS Design & Interview Prep',
        weeks: [
          {
            title: 'Week 5 — Advanced JS Concepts',
            days: [
              'Prototypes, Prototype Chain & Prototypal Inheritance',
              'The `this` keyword & explicit binding (call, apply, bind)',
              'Classes — constructor, extends, super, static methods',
              'Performance — Debounce, Throttle, Memoization',
              'Garbage Collection & Memory Leaks in JS',
              'JavaScript Unit Testing basics (Jest/Vitest)',
              'Weekly assessment + Advanced JS challenge',
            ],
          },
          {
            title: 'Week 6 — JS Interview Prep',
            days: [
              'Top JavaScript technical interview questions',
              'Polyfills writing — Array.map, Promise, bind',
              'Frontend System Design & State management concepts',
              'Coding challenges — Flatten array, Deep clone',
              'Machine Coding round simulation (Vanilla JS)',
              'Timed Technical Interview Mock',
              'Final assessment day & completion',
            ],
          },
        ],
      },
    ],
  },

  react: {
    phases: [
      {
        title: 'Phase 1: React Fundamentals',
        weeks: [
          {
            title: 'Week 1 — Components & JSX',
            days: [
              'React overview, Vite setup, Folder structure',
              'JSX syntax rules & embedding expressions',
              'Functional Components & Props passing',
              'Rendering lists with keys & Conditional rendering',
              'Handling Events & Synthetic Event object',
              'Styling components — CSS Modules, Tailwind CSS',
              'Weekly assessment + UI Component mini project',
            ],
          },
          {
            title: 'Week 2 — State & Core Hooks',
            days: [
              'useState hook — state management & updater function',
              'useEffect hook — side effects, dependency array',
              'Component Lifecycle — mount, update, unmount',
              'Controlled components & Form handling',
              'useRef hook — DOM reference & mutable values',
              'Lifting state up & Prop Drilling avoidance',
              'Weekly assessment + Stateful React app',
            ],
          },
        ],
      },
      {
        title: 'Phase 2: Routing, Context & Data',
        weeks: [
          {
            title: 'Week 3 — React Router & Navigation',
            days: [
              'React Router v6 setup, Routes & Route elements',
              'Link, NavLink & Dynamic Route Parameters (useParams)',
              'Programmatic navigation with useNavigate hook',
              'Nested Routes, Outlet & Layout components',
              'Data fetching with useEffect & Axios',
              'Handling loading states, error states & empty states',
              'Weekly assessment + Multi-page React Application',
            ],
          },
          {
            title: 'Week 4 — Context API & State Management',
            days: [
              'Context API — createContext, Provider, useContext',
              'Global state management (Auth, Theme Context)',
              'useReducer hook — managing complex state transitions',
              'Zustand / Redux Toolkit state store basics',
              'Custom Hooks creation for reusable logic',
              'React Query / TanStack Query for server state',
              'Weekly assessment + E-Commerce / Dashboard app',
            ],
          },
        ],
      },
      {
        title: 'Phase 3: Optimization & Interview Prep',
        weeks: [
          {
            title: 'Week 5 — Performance & Architecture',
            days: [
              'React.memo, useMemo & useCallback optimizations',
              'Code Splitting — React.lazy & Suspense fallback',
              'Error Boundaries & Fallback UI components',
              'Forms with React Hook Form & Zod schema validation',
              'React Accessibility (a11y) & keyboard navigation',
              'React Testing Library — component testing',
              'Weekly assessment + Production-ready app build',
            ],
          },
          {
            title: 'Week 6 — React Interview Prep',
            days: [
              'React core concept interview Q&A (Virtual DOM, Reconciliation)',
              'Machine coding prep — Accordion, Modal, Carousel, Autocomplete',
              'System design for React applications',
              'State management comparison & best practices',
              'Live coding interview practice',
              'Timed React Mock Technical Interview',
              'Final assessment & course completion',
            ],
          },
        ],
      },
    ],
  },

  dsa: {
    phases: [
      {
        title: 'Phase 1: Basic Data Structures',
        weeks: [
          {
            title: 'Week 1 — Arrays & Strings',
            days: [
              'Array basics, indexing, memory representation',
              'Two-pointer technique (Pair sum, Reverse array)',
              'Sliding Window pattern (Fixed & Variable length)',
              'Prefix Sum array & Subarray problem solving',
              'Strings manipulation & Pattern matching',
              'String problem set — Anagrams, Palindromes',
              'Weekly assessment + Arrays/Strings practice',
            ],
          },
          {
            title: 'Week 2 — Searching & Sorting',
            days: [
              'Linear search & Binary search basics',
              'Binary search variations — Lower/Upper bound',
              'Search in rotated sorted array & Matrix search',
              'Bubble, Selection & Insertion sort algorithms',
              'Merge Sort — Divide and Conquer approach',
              'Quick Sort & Heap Sort analysis',
              'Weekly assessment + Searching/Sorting practice',
            ],
          },
        ],
      },
      {
        title: 'Phase 2: Core Data Structures',
        weeks: [
          {
            title: 'Week 3 — Linked Lists & Stacks',
            days: [
              'Singly Linked List — Insertion, Deletion, Search',
              'Doubly & Circular Linked List implementation',
              'Reversing Linked List & Fast/Slow pointer (Cycle detection)',
              'Stack DS — LIFO operations & Array/LinkedList implementation',
              'Stack applications — Balanced parentheses, Next Greater Element',
              'Min Stack implementation & Monotonic stack pattern',
              'Weekly assessment + Stack/LinkedList problem set',
            ],
          },
          {
            title: 'Week 4 — Queues, Trees & BST',
            days: [
              'Queue DS — FIFO, Circular queue, Deque',
              'Binary Tree — Construction & Traversals (Inorder, Preorder, Postorder)',
              'Tree Level-order traversal & Height/Diameter of tree',
              'Binary Search Tree (BST) — Search, Insert, Delete',
              'BST properties — Lowest Common Ancestor (LCA), Validate BST',
              'Heaps & Priority Queue — Min-heap, Max-heap operations',
              'Weekly assessment + Trees problem set',
            ],
          },
        ],
      },
      {
        title: 'Phase 3: Advanced Algorithms & Interview Prep',
        weeks: [
          {
            title: 'Week 5 — Graphs & Recursion',
            days: [
              'Graph representation — Adjacency Matrix & List',
              'Graph Traversal — Breadth First Search (BFS)',
              'Graph Traversal — Depth First Search (DFS)',
              'Dijkstra Algorithm & Shortest Path in Graphs',
              'Recursion & Backtracking — Subsets, Permutations',
              'Backtracking classics — N-Queens, Sudoku Solver',
              'Weekly assessment + Graph algorithms practice',
            ],
          },
          {
            title: 'Week 6 — Dynamic Programming & Placement Prep',
            days: [
              'Dynamic Programming — Memoization vs Tabulation',
              '1D DP classics — Fibonacci, Climbing Stairs, House Robber',
              '2D DP classics — Unique Paths, Minimum Path Sum',
              'Knapsack Problem variations & Coin Change',
              'String DP — Longest Common Subsequence (LCS)',
              'Timed LeetCode Blind 75 problem solving',
              'Final mock DSA coding interview round',
            ],
          },
        ],
      },
    ],
  },

  sql: {
    phases: [
      {
        title: 'Phase 1: SQL Basics & Queries',
        weeks: [
          {
            title: 'Week 1 — Data Definition & Selection',
            days: [
              'Relational Database Concepts, RDBMS architecture',
              'DDL — CREATE TABLE, ALTER, DROP, TRUNCATE',
              'DML — INSERT, UPDATE, DELETE data rows',
              'SELECT queries, Column aliasing, DISTINCT values',
              'Filtering data with WHERE clause, AND, OR, NOT, IN, BETWEEN',
              'LIKE operator, Wildcards & NULL handling (IS NULL)',
              'Weekly assessment + Basic SQL query practice',
            ],
          },
          {
            title: 'Week 2 — Aggregations & Joins',
            days: [
              'Aggregate functions — COUNT, SUM, AVG, MIN, MAX',
              'GROUP BY clause & Aggregating data',
              'HAVING clause vs WHERE clause filtering',
              'ORDER BY, LIMIT, OFFSET pagination',
              'INNER JOIN — joining multiple tables on keys',
              'LEFT JOIN, RIGHT JOIN, FULL OUTER JOIN mechanics',
              'Weekly assessment + SQL Joins exercise',
            ],
          },
        ],
      },
      {
        title: 'Phase 2: Advanced SQL & Database Design',
        weeks: [
          {
            title: 'Week 3 — Subqueries, CTEs & Window Functions',
            days: [
              'Subqueries in WHERE, FROM, and SELECT clauses',
              'Correlated subqueries & EXISTS operator',
              'Common Table Expressions (WITH clause CTEs)',
              'Window Functions — ROW_NUMBER(), RANK(), DENSE_RANK()',
              'Aggregate Window functions (SUM OVER, AVG OVER)',
              'String & Date functions in SQL (CONCAT, DATE_ADD)',
              'Weekly assessment + Complex SQL query challenges',
            ],
          },
        ],
      },
    ],
  },
};

// Map domain aliases to standard keys
function normalizeDomainKey(domain) {
  const d = (domain || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (d.includes('java') && !d.includes('script')) return 'java';
  if (d.includes('python')) return 'python';
  if (d.includes('cpp') || d.includes('cplusplus') || d === 'c') return 'cpp';
  if (d.includes('javascript') || d === 'js') return 'javascript';
  if (d.includes('react')) return 'react';
  if (d.includes('node') || d.includes('express')) return 'javascript'; // fallback to JS/Node
  if (d.includes('sql') || d.includes('data') && d.includes('base')) return 'sql';
  if (d.includes('dsa') || d.includes('algo') || d.includes('structure')) return 'dsa';
  return DOMAIN_TEMPLATES[d] ? d : 'dsa';
}

// ─────────────────────────────────────────────
// Utility: compute total days given requested duration
// ─────────────────────────────────────────────
function computeTotalDays(domain, dailyHours, level, durationWeeks, customGoal) {
  if (durationWeeks && durationWeeks > 0) {
    return Math.min(52, Math.max(1, durationWeeks)) * 7;
  }

  if (customGoal) {
    const text = customGoal.toLowerCase();
    const weekMatch = text.match(/(\d+)\s*week/);
    if (weekMatch) {
      const w = parseInt(weekMatch[1], 10);
      if (w >= 1 && w <= 52) return w * 7;
    }
    const dayMatch = text.match(/(\d+)\s*day/);
    if (dayMatch) {
      const d = parseInt(dayMatch[1], 10);
      if (d >= 1 && d <= 365) return Math.ceil(d / 7) * 7;
    }
    const monthMatch = text.match(/(\d+)\s*month/);
    if (monthMatch) {
      const m = parseInt(monthMatch[1], 10);
      if (m >= 1 && m <= 12) return m * 4 * 7;
    }
  }

  const key = normalizeDomainKey(domain);
  const range = DOMAIN_RANGES[key] || { min: 21, max: 42 };
  const baselineHours = 2;
  const midDays = Math.round((range.min + range.max) / 2);
  let scaledDays = Math.round(midDays * (baselineHours / Math.max(dailyHours, 0.5)));

  if (level === 'INTERMEDIATE') scaledDays = Math.round(scaledDays * 0.8);
  if (level === 'ADVANCED')     scaledDays = Math.round(scaledDays * 0.6);

  return Math.max(7, Math.ceil(scaledDays / 7) * 7);
}

// ─────────────────────────────────────────────
// Utility: compute time splits for a day given dailyHours
// ─────────────────────────────────────────────
function computeTimeSplit(dailyHours) {
  const total = Math.round(dailyHours * 60);
  return {
    learnMinutes:    Math.round(total * DAILY_SPLIT.learn),
    practiceMinutes: Math.round(total * DAILY_SPLIT.practice),
    aptitudeMinutes: Math.round(total * DAILY_SPLIT.aptitude),
    revisionMinutes: Math.round(total * DAILY_SPLIT.revision),
  };
}

// ─────────────────────────────────────────────
// Utility: get template for domain
// ─────────────────────────────────────────────
function getTemplate(domain) {
  const key = normalizeDomainKey(domain);
  return DOMAIN_TEMPLATES[key] || DOMAIN_TEMPLATES['dsa'];
}

// ─────────────────────────────────────────────
// getResourcesForTopic
// ─────────────────────────────────────────────
function getResourcesForTopic(topic, domain) {
  const resources = [];
  const domLower = (domain || '').toLowerCase();

  if (domLower.includes('dsa') || domLower.includes('algorithm')) {
    resources.push({ title: 'LeetCode Problem Set', url: 'https://leetcode.com/problemset/all/', type: 'practice' });
    resources.push({ title: 'GeeksforGeeks DSA Guide', url: 'https://www.geeksforgeeks.org/data-structures/', type: 'article' });
  } else if (domLower.includes('java') && !domLower.includes('script')) {
    resources.push({ title: 'Oracle Java Documentation', url: 'https://docs.oracle.com/en/java/', type: 'documentation' });
    resources.push({ title: 'Baeldung Java Tutorials', url: 'https://www.baeldung.com/', type: 'article' });
  } else if (domLower.includes('python')) {
    resources.push({ title: 'Python Official Docs', url: 'https://docs.python.org/3/', type: 'documentation' });
    resources.push({ title: 'Real Python Tutorials', url: 'https://realpython.com/', type: 'article' });
  } else if (domLower.includes('react')) {
    resources.push({ title: 'React Official Docs', url: 'https://react.dev/', type: 'documentation' });
    resources.push({ title: 'Scrimba Learn React', url: 'https://scrimba.com/learn/learnreact', type: 'course' });
  } else if (domLower.includes('sql')) {
    resources.push({ title: 'SQLZoo Practice', url: 'https://sqlzoo.net/', type: 'practice' });
    resources.push({ title: 'Mode SQL Tutorial', url: 'https://mode.com/sql-tutorial/', type: 'course' });
  }

  resources.push({
    title: `Search Tutorials for: ${topic}`,
    url: `https://www.google.com/search?q=${encodeURIComponent(domain + ' ' + topic + ' tutorial')}`,
    type: 'search',
  });

  return resources;
}

// ─────────────────────────────────────────────
// buildDayTasks — returns task objects for a day
// ─────────────────────────────────────────────
function buildDayTasks(dayId, topic, timeSplit, isAssessmentDay) {
  if (isAssessmentDay) {
    return [
      { dayId, title: 'Weekly Assessment Quiz', type: 'APTITUDE', description: 'Timed quiz covering the week\'s topics', isCompleted: false },
      { dayId, title: 'Review & revise weak areas', type: 'REVISION', description: 'Go back over any concepts you found difficult this week', isCompleted: false },
      { dayId, title: 'Summarise learnings', type: 'REVISION', description: 'Write key takeaways from this week\'s roadmap progress', isCompleted: false },
    ];
  }
  return [
    { dayId, title: `Learn: ${topic}`, type: 'LEARN', description: `Study core concepts of ${topic} (${timeSplit.learnMinutes} min)`, isCompleted: false },
    { dayId, title: `Practice: ${topic} exercises`, type: 'PRACTICE', description: `Solve hands-on practice problems (${timeSplit.practiceMinutes} min)`, isCompleted: false },
    { dayId, title: 'Aptitude challenge', type: 'APTITUDE', description: `Adaptive aptitude practice (${timeSplit.aptitudeMinutes} min)`, isCompleted: false },
    { dayId, title: 'Daily revision & notes', type: 'REVISION', description: `Revise today's learning (${timeSplit.revisionMinutes} min)`, isCompleted: false },
  ];
}

// ─────────────────────────────────────────────
// fetchAiLanguageCurriculum — AI Real-Time Language Roadmap Generator
// ─────────────────────────────────────────────
async function fetchAiLanguageCurriculum({ domain, level, totalDays, customGoal }) {
  const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const totalWeeks = Math.ceil(totalDays / 7);
  const prompt = `Generate a structured, real-time learning curriculum for programming language / tech stack: "${domain}" (Level: ${level}, Total Weeks: ${totalWeeks}).
${customGoal ? `Goal: "${customGoal}".` : ''}

Return ONLY a valid JSON array of Phase objects with 7 daily topic strings per week.
Exact JSON format required:
[
  {
    "phaseNumber": 1,
    "title": "Phase 1: ${domain} Core Foundations",
    "description": "Fundamental concepts, syntax, and setup for ${domain}",
    "weeks": [
      {
        "weekNumber": 1,
        "title": "Week 1 — Environment Setup & Core Syntax",
        "days": [
          "${domain} environment setup & first program",
          "Data types, variables, and type conversion in ${domain}",
          "Operators, expressions, and control flow (if/switch)",
          "Looping structures, iteration & recursion",
          "Functions, methods & scope management",
          "Built-in collections & memory data structures",
          "Weekly assessment + fundamental practice exercises"
        ]
      }
    ]
  }
]`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'groq/compound-mini',
        messages: [
          { role: 'system', content: 'You are an expert software engineering curriculum designer. Respond ONLY with valid JSON array.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
      }),
    });
    clearTimeout(timeoutId);

    const json = await res.json();
    let text = json.choices?.[0]?.message?.content || '';
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    if (!text) return null;
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch (err) {
    console.warn('[AI Roadmap Service Warning] Failed to fetch AI roadmap curriculum:', err.message);
    return null;
  }
}

// ─────────────────────────────────────────────
// generateRoadmap — main public API
// Creates a full Roadmap in the DB for a user.
// ─────────────────────────────────────────────
async function generateRoadmap(userId, { domain, level = 'BEGINNER', dailyHours = 2, durationWeeks, customGoal, role }) {
  const totalDays = computeTotalDays(domain, dailyHours, level, durationWeeks, customGoal);
  const timeSplit = computeTimeSplit(dailyHours);

  const startDate = new Date();
  const estimatedEndDate = new Date(startDate);
  estimatedEndDate.setDate(estimatedEndDate.getDate() + totalDays);

  const roadmapTitle = customGoal ? customGoal.slice(0, 60) : `${domain} (${totalDays / 7} Weeks)`;

  const roadmap = await prisma.roadmap.create({
    data: {
      userId,
      domain: domain || 'Placement Prep',
      level,
      dailyHours,
      totalDays,
      estimatedEndDate,
      status: 'ACTIVE',
    },
  });

  // Try real-time AI curriculum generation
  const aiPhases = await fetchAiLanguageCurriculum({ domain, level, totalDays, customGoal });

  if (aiPhases && aiPhases.length > 0) {
    let globalDayNumber = 1;

    for (const phaseDef of aiPhases) {
      const phase = await prisma.roadmapPhase.create({
        data: {
          roadmapId: roadmap.id,
          phaseNumber: phaseDef.phaseNumber || 1,
          title: phaseDef.title || `Phase: ${domain}`,
          description: phaseDef.description || `Core concepts of ${domain}`,
        },
      });

      for (const weekDef of (phaseDef.weeks || [])) {
        const week = await prisma.roadmapWeek.create({
          data: {
            phaseId: phase.id,
            weekNumber: weekDef.weekNumber || globalDayNumber,
            title: weekDef.title || `Week ${weekDef.weekNumber}`,
            isAssessment: false,
          },
        });

        const dayTopics = weekDef.days || [];
        for (let d = 0; d < 7; d++) {
          if (globalDayNumber > totalDays) break;

          const isAssessmentDay = (d === 6);
          const isFinalDay = (globalDayNumber === totalDays);
          let dayTopic = dayTopics[d] || `${domain} Practice Topic ${globalDayNumber}`;
          if (isAssessmentDay) dayTopic = `Weekly Assessment & Revision (${weekDef.title || 'Week'})`;

          const dayTitle = `Day ${globalDayNumber} — ${dayTopic}`;
          const xpReward = isAssessmentDay || isFinalDay ? XP_ASSESSMENT_DAY : XP_PER_DAY;
          const scheduledDate = new Date(startDate);
          scheduledDate.setDate(scheduledDate.getDate() + globalDayNumber - 1);

          const day = await prisma.roadmapDay.create({
            data: {
              weekId: week.id,
              dayNumber: globalDayNumber,
              title: dayTitle,
              topic: dayTopic,
              ...timeSplit,
              xpReward,
              status: 'PENDING',
              completionPct: 0,
              scheduledDate,
              resources: JSON.stringify(getResourcesForTopic(dayTopic, domain)),
            },
          });

          await prisma.dayTask.createMany({
            data: buildDayTasks(day.id, dayTopic, timeSplit, isAssessmentDay),
          });

          globalDayNumber++;
        }
      }
    }
  } else {
    // Fallback to template-based generation
    const template = getTemplate(domain);
    const allTemplateDays = [];
    for (const p of template.phases) {
      for (const w of p.weeks) {
        for (const d of w.days) {
          allTemplateDays.push(d);
        }
      }
    }

    const totalWeeksNeeded = Math.ceil(totalDays / 7);
    let globalDayNumber = 1;
    let topicIndex = 0;

    const weeksPerPhase1 = Math.max(1, Math.floor(totalWeeksNeeded / 3));
    const weeksPerPhase2 = Math.max(1, Math.floor((totalWeeksNeeded - weeksPerPhase1) / 2));
    const weeksPerPhase3 = Math.max(1, totalWeeksNeeded - weeksPerPhase1 - weeksPerPhase2);

    const phaseStructure = [
      { number: 1, title: `Phase 1: ${domain} Foundations`, weekCount: weeksPerPhase1 },
      { number: 2, title: `Phase 2: Core Concepts & Practice`, weekCount: weeksPerPhase2 },
      { number: 3, title: `Phase 3: Advanced Topics & Interview Prep`, weekCount: weeksPerPhase3 },
    ];

    let currentWeekNumber = 1;

    for (const phaseDef of phaseStructure) {
      if (currentWeekNumber > totalWeeksNeeded) break;

      const phase = await prisma.roadmapPhase.create({
        data: {
          roadmapId: roadmap.id,
          phaseNumber: phaseDef.number,
          title: phaseDef.title,
          description: `${phaseDef.title} for ${domain}`,
        },
      });

      for (let w = 0; w < phaseDef.weekCount; w++) {
        if (currentWeekNumber > totalWeeksNeeded) break;

      const weekTitle = `Week ${currentWeekNumber} — ${domain} Module ${currentWeekNumber}`;
      const week = await prisma.roadmapWeek.create({
        data: {
          phaseId: phase.id,
          weekNumber: currentWeekNumber,
          title: weekTitle,
          isAssessment: false,
        },
      });

      for (let d = 0; d < 7; d++) {
        if (globalDayNumber > totalDays) break;

        const isAssessmentDay = (d === 6);
        const isFinalDay = (globalDayNumber === totalDays);

        let dayTopic = allTemplateDays[topicIndex % allTemplateDays.length];
        if (isAssessmentDay) dayTopic = `Weekly Assessment & Revision (Week ${currentWeekNumber})`;
        topicIndex++;

        const dayTitle = `Day ${globalDayNumber} — ${dayTopic}`;
        const xpReward = isAssessmentDay || isFinalDay ? XP_ASSESSMENT_DAY : XP_PER_DAY;

        const scheduledDate = new Date(startDate);
        scheduledDate.setDate(scheduledDate.getDate() + globalDayNumber - 1);

        const day = await prisma.roadmapDay.create({
          data: {
            weekId: week.id,
            dayNumber: globalDayNumber,
            title: dayTitle,
            topic: dayTopic,
            ...timeSplit,
            xpReward,
            status: 'PENDING',
            completionPct: 0,
            scheduledDate,
            resources: JSON.stringify(getResourcesForTopic(dayTopic, domain)),
          },
        });

        await prisma.dayTask.createMany({
          data: buildDayTasks(day.id, dayTopic, timeSplit, isAssessmentDay),
        });

        globalDayNumber++;
      }

      currentWeekNumber++;
    }
  }
  }

  return prisma.roadmap.findUnique({
    where: { id: roadmap.id },
    include: {
      phases: {
        include: {
          weeks: {
            include: { days: { include: { tasks: true }, orderBy: { dayNumber: 'asc' } } },
            orderBy: { weekNumber: 'asc' },
          },
        },
        orderBy: { phaseNumber: 'asc' },
      },
    },
  });
}

// ─────────────────────────────────────────────
// completeDay — marks a day complete
// ─────────────────────────────────────────────
async function completeDay(userId, dayId, { completionPct = 100 } = {}) {
  const day = await prisma.roadmapDay.findUnique({
    where: { id: dayId },
    include: { tasks: true, week: { include: { phase: { include: { roadmap: true } } } } },
  });

  if (!day) throw new Error(`Roadmap day #${dayId} not found`);
  if (day.week.phase.roadmap.userId !== userId) throw new Error('Unauthorised');

  const updatedDay = await prisma.roadmapDay.update({
    where: { id: dayId },
    data: {
      status: 'COMPLETED',
      completionPct: completionPct,
      completedAt: new Date(),
    },
  });

  await prisma.dayTask.updateMany({
    where: { dayId: dayId },
    data: { isCompleted: true, completedAt: new Date() },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { xp: { increment: day.xpReward || 50 } },
  });

  try {
    await prisma.xpEvent.create({
      data: {
        userId,
        amount: day.xpReward || 50,
        reason: `Completed Day ${day.dayNumber}: ${day.title}`,
      },
    });
  } catch (e) {
    console.warn('XP event log skipped:', e.message);
  }

  const roadmapId = day.week.phase.roadmapId;
  const allDays = await prisma.roadmapDay.findMany({
    where: { week: { phase: { roadmapId } } },
  });

  const completedDaysCount = allDays.filter(d => d.id === dayId || d.status === 'COMPLETED').length;
  const isAllComplete = completedDaysCount >= allDays.length;

  const newRoadmap = await prisma.roadmap.update({
    where: { id: roadmapId },
    data: {
      completedDays: completedDaysCount,
      status: isAllComplete ? 'COMPLETED' : 'ACTIVE',
      actualEndDate: isAllComplete ? new Date() : null,
    },
  });

  const progressPct = allDays.length > 0 ? Math.round((completedDaysCount / allDays.length) * 100) : 0;
  await awardRoadmapBadges(userId, progressPct);

  return {
    day: updatedDay,
    roadmap: newRoadmap,
    completedDaysCount,
    totalDays: allDays.length,
    roadmapProgressPct: progressPct,
  };
}

// ─────────────────────────────────────────────
// rescheduleFromDay
// ─────────────────────────────────────────────
async function rescheduleFromDay(roadmapId, fromDayNumber) {
  const pendingDays = await prisma.roadmapDay.findMany({
    where: {
      week: { phase: { roadmapId } },
      dayNumber: { gte: fromDayNumber },
      status: { in: ['PENDING', 'MISSED'] },
    },
    orderBy: { dayNumber: 'asc' },
  });

  const today = new Date();
  for (let i = 0; i < pendingDays.length; i++) {
    const newDate = new Date(today);
    newDate.setDate(newDate.getDate() + i);
    await prisma.roadmapDay.update({
      where: { id: pendingDays[i].id },
      data: { scheduledDate: newDate },
    });
  }

  if (pendingDays.length > 0) {
    const lastDate = new Date(today);
    lastDate.setDate(lastDate.getDate() + pendingDays.length - 1);
    await prisma.roadmap.update({
      where: { id: roadmapId },
      data: { estimatedEndDate: lastDate },
    });
  }
}

module.exports = {
  generateRoadmap,
  completeDay,
  rescheduleFromDay,
  computeTotalDays,
  getTemplate,
  DOMAIN_RANGES,
  DOMAIN_TEMPLATES,
};
