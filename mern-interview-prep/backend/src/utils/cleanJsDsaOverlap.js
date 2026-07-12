/**
 * Clean JS ↔ DSA crossover in parsed-questions.json
 *
 * Conservative rules:
 * - Anything already under a real DSA topic stays, unless it is clearly JS/Node/React language
 * - Clear JS-language items leave DSA → JavaScript (or other subject)
 * - Pure algorithm items in JavaScript move → DSA
 * - JS API drills (map/filter/reduce/forEach) stay in JavaScript
 * - Do not mass-delete DSA topic content
 */
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../../data/parsed-questions.json');
const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));

const DSA_KEEP_TOPICS = new Set(
  (data.dsa?.topics || [])
    .map((t) => t.name)
    .filter((n) => !/cross-topic|overlap|other programming/i.test(n))
);

function isNoise(q) {
  const t = String(q || '').trim();
  if (!t) return true;
  if (/^https?:\/\//i.test(t) && /github\.com/i.test(t)) return true;
  if (/^\(?\s*[A-Z][a-z]+(\s+[A-Z][a-z]+)?\s*\)?$/.test(t) && t.length < 40) return true;
  if (/^(pending:|feedback|do more workout|need to practice|need improvement|learn proper|learn correct|need to understand)/i.test(t))
    return true;
  if (/unity-specific|ondisable|dontdestroyonload/i.test(t)) return true;
  if (/strings?\s*are\s*immutable\s*in\s*python/i.test(t)) return true;
  return false;
}

function isDsaQuestion(q) {
  const t = String(q || '').toLowerCase();
  return (
    /\b(big\s*-?\s*o|asymptotic|time\s*complexity|space\s*complexity|o\(1\)|o\(n\)|o\(log)/i.test(t) ||
    /\b(linked\s*list|doubly\s*linked|circular\s*linked|binary\s*search|binary\s*tree|bst\b|avl\b|heap\b|min\s*heap|max\s*heap|trie\b|graph\b|adjacency|vertex|vertices)\b/i.test(
      t
    ) ||
    /\b(stack\b|queue\b|deque|priority\s*queue|hash\s*table|hashing|hashmap|hash\s*map|collision)\b/i.test(t) ||
    /\b(bfs\b|dfs\b|dijkstra|bellman|floyd|kruskal|prim\b|topolog|shortest\s*path|spanning\s*tree|union\s*find|disjoint)\b/i.test(
      t
    ) ||
    /\b(recursion|backtrack|dynamic\s*programming|(?<![a-z])dp(?![a-z])|memoization|knapsack|tabulation)\b/i.test(t) ||
    /\b(merge\s*sort|quick\s*sort|bubble\s*sort|insertion\s*sort|selection\s*sort|heap\s*sort|radix|counting\s*sort|bucket\s*sort|sorting\s*algorithm)\b/i.test(
      t
    ) ||
    /\b(two\s*pointer|sliding\s*window|kadane|prefix\s*sum|subarray|subset\s*sum)\b/i.test(t) ||
    /\b(inorder|preorder|postorder|level\s*order|traversal|balanced\s*tree|height\s*of|lowest\s*common|(?<![a-z])lca(?![a-z]))\b/i.test(
      t
    ) ||
    /\b(data\s*structures?|algorithms?|load\s*factor|underflow|overflow|palindrome|anagram|fibonacci|factorial)\b/i.test(t) ||
    /\b(leetcode|interviewbit|geeksforgeeks|hackerrank)\b/i.test(t) ||
    /\b(infix|postfix|prefix\s*expression|balanced?\s*parenthes|reverse\s*(a\s+)?linked|detect\s*cycle|floyd.?warshall)\b/i.test(
      t
    ) ||
    /\b(static|dynamic)\s*memory\s*allocation\b/i.test(t) ||
    /\b(malloc|memory\s*pool|memory\s*padding|virtual\s*memory|nibble|kibibyte)\b/i.test(t) ||
    /\breverse\s+integer\b/i.test(t) ||
    /\bfizz\s*b(?:u|i)zz\b/i.test(t) ||
    /\bminimum\s*spanning|graph\s*vs\s*tree\b/i.test(t)
  );
}

function isJsLanguageQuestion(q) {
  const t = String(q || '').toLowerCase();
  return (
    /\b(javascript|(?<![a-z])js(?![a-z])|ecmascript|(?<![a-z])es6(?![a-z])|es2015)\b/i.test(t) ||
    /\b(hoist(ing)?|closure|prototype\s*chain|promises?|async\/?await|callback\s*hell|event\s*loop|tdz|temporal\s*dead)\b/i.test(
      t
    ) ||
    /\b(debounc\w*|throttl\w*|iife|destructur\w*|spread\s*operator|rest\s*operator|arrow\s*function|generator\s*function)\b/i.test(
      t
    ) ||
    /\b(execution\s*context|micro\s*tasks?|macro\s*tasks?|use\s*strict|typeof|type\s*coercion|nullish|optional\s*chaining)\b/i.test(
      t
    ) ||
    /\b(localstorage|sessionstorage|(?<![a-z])dom(?![a-z])|(?<![a-z])bom(?![a-z])|event\s*delegat\w*|event\s*propagat\w*|garbage\s*collect\w*|garrabage)\b/i.test(
      t
    ) ||
    /\b(weakset|weak\s*map|proxy\s*object|replaceall|flatmap|structured\s*clone|object\.entries|array\.from)\b/i.test(t) ||
    /\b(typed\s*arrays?\s*in\s*js|memory\s*leakage\s*in\s*js|immutable\s*in\s*(js|javascript|javascrip)|why\s*string\s*is\s*immutable|is\s*string\s*(mutable|immutable)|string\s*(mutable|immutable).*javascrip)\b/i.test(
      t
    ) ||
    /\bjavascrip\b/i.test(t) ||
    /\b(html\s*tag|dom\s*structure|clustering\s+in\s+node|node\.?js|express\b|middleware|react\b|redux|jsx|mongoose|mongodb)\b/i.test(
      t
    ) ||
    /\bhow\s*to\s*prevent\s*memory\s*leak/i.test(t) ||
    /\bgarbage\s*collector\b/i.test(t) ||
    /\b(call\(\)|apply\(\)|bind\(\)|this\s*keyword|lexical\s*scope|illegal\s*shadow)\b/i.test(t) ||
    /\bmicro\s*and\s*macro\s*task\b/i.test(t) ||
    /\bmicro\s*task\s*queue\b/i.test(t)
  );
}

function isJsApiPractice(q) {
  const t = String(q || '').toLowerCase();
  if (/\b(linked\s*list|binary\s*search|stack\b|queue\b|tree\b|graph\b|heap\b|trie\b|complexity|big\s*-?\s*o)\b/i.test(t)) {
    return false;
  }
  return (
    /\b(using\s+)?(map|filter|reduce|foreach)\b/i.test(t) ||
    /\b(array\s*vs\s*set|isarray|create\s*array|array\s*empty|jagged\s*array|typed\s*array|array\s*buffer|array\s*operators|array\.reduce|array\.isarray)\b/i.test(
      t
    ) ||
    /\b(add\s+into\s+another\s+array\s+without\s+push|flip\s+sign.*foreach)\b/i.test(t)
  );
}

function classifyOutOfDsa(q) {
  const t = q.toLowerCase();
  if (/\b(react|redux|jsx|usestate|useeffect)\b/i.test(t)) return 'react';
  if (/\b(mongo|mongoose)\b/i.test(t)) return 'mongodb';
  if (/\b(node\.?js|express|middleware|clustering\s+in\s+node)\b/i.test(t)) return 'nodejs';
  return 'javascript';
}

function dsaTopicFor(q) {
  const t = q.toLowerCase();
  const rules = [
    [/complex|big\s*-?\s*o|asymptotic|time\s*&?\s*space/i, 'COMPLEXITY ANALYSIS & ASYMPTOTIC NOTATIONS'],
    [/linked\s*list/i, 'LINKED LIST'],
    [/binary\s*search\s*tree|\bbst\b/i, 'BINARY SEARCH TREE (BST)'],
    [/binary\s*tree|tree\b|inorder|preorder|postorder|traversal/i, 'TREES & BINARY TREES'],
    [/heap|priority\s*queue/i, 'HEAP & PRIORITY QUEUE'],
    [/trie\b/i, 'TRIE'],
    [/graph|bfs|dfs|dijkstra|spanning|topolog|shortest/i, 'GRAPHS & GRAPH ALGORITHMS'],
    [/stack\b|parenthes|infix|postfix/i, 'STACK'],
    [/queue|deque/i, 'QUEUE, DEQUE & CIRCULAR QUEUE'],
    [/hash|collision|load\s*factor/i, 'HASHING & HASH TABLES'],
    [/sort(ing)?/i, 'SORTING ALGORITHMS'],
    [/binary\s*search|searching/i, 'SEARCHING & BINARY SEARCH'],
    [/recur|backtrack/i, 'RECURSION & BACKTRACKING'],
    [/two\s*pointer|sliding\s*window|kadane/i, 'TWO POINTER, SLIDING WINDOW & COMMON PATTERNS'],
    [/string|palindrome|anagram|character/i, 'STRINGS & CHARACTER ENCODING'],
    [/array|matrix|subarray|fizz|reverse\s*integer/i, 'ARRAYS, MATRIX & SUBARRAYS'],
    [/memory|malloc|virtual\s*memory|nibble|byte/i, 'MEMORY MANAGEMENT & ALLOCATION'],
    [/leetcode|roadmap|resource/i, 'LEETCODE / PRACTICE ROADMAP & RESOURCES'],
    [/data\s*structure|algorithm|scalability/i, 'DSA BASICS, ALGORITHMS & DATA STRUCTURE CLASSIFICATION'],
  ];
  for (const [re, name] of rules) {
    if (re.test(t)) return name;
  }
  return 'DSA BASICS, ALGORITHMS & DATA STRUCTURE CLASSIFICATION';
}

function jsTopicFor(q) {
  const names = new Set(data.javascript.topics.map((t) => t.name));
  const t = q.toLowerCase();
  const rules = [
    [/promise|async|await|callback/i, 'Promises, Async/Await, Fetch & Callbacks'],
    [/event\s*loop|micro\s*task|macro\s*task|timer|garbage|memory\s*leak|debounc|throttl/i, 'Event Loop, Timers, Runtime & Memory'],
    [/dom|bom|localstorage|sessionstorage|browser|event\s*delegat|event\s*propagat|html\s*tag/i, 'DOM, BOM, Browser APIs & Events'],
    [/scope|hoist|tdz|shadow|lexical/i, 'Variables, Scope, Hoisting & TDZ'],
    [/closure|prototype|this\b|curry|hof|iife|call\(|apply\(|bind\(/i, 'Functions, This, Closure, Currying & HOF'],
    [/array|set\b|map\b|collection|foreach|reduce|filter|typed\s*array/i, 'Arrays, Set, Map & Collection Problems'],
    [/string|number|math|regex|immutable|replaceall/i, 'Strings, Numbers, Math & Regex'],
    [/object|json|destructur|spread|rest|copy|immutab/i, 'Objects, JSON, Destructuring, Copying & Immutability'],
    [/class|oop|constructor|inherit/i, 'Classes, OOP, Constructor, Prototype & Inheritance'],
    [/module|ecmascript|es6|modern\s*js|generator/i, 'Modules, ECMAScript & Modern JS Features'],
    [/type|operator|coercion|typeof|bitwise/i, 'Data Types, Type Conversion & Operators'],
    [/loop|condition|switch|while|for\b/i, 'Control Flow, Loops & Conditions'],
    [/error|aggregateerror/i, 'Error Handling'],
  ];
  for (const [re, name] of rules) {
    if (re.test(t) && names.has(name)) return name;
  }
  return names.has('JavaScript — Cross-topic review') ? 'JavaScript — Cross-topic review' : data.javascript.topics[0].name;
}

function ensureTopic(subjectKey, topicName) {
  const subject = data[subjectKey];
  let topic = subject.topics.find((t) => t.name === topicName);
  if (!topic) {
    topic = { order: 99, name: topicName, count: 0, questions: [] };
    subject.topics.push(topic);
  }
  return topic;
}

function hasQuestion(subjectKey, question) {
  const needle = question.trim().toLowerCase();
  return data[subjectKey].topics.some((t) => t.questions.some((q) => q.trim().toLowerCase() === needle));
}

function addQuestion(subjectKey, topicName, question) {
  if (isNoise(question) || hasQuestion(subjectKey, question)) return false;
  ensureTopic(subjectKey, topicName).questions.push(question);
  return true;
}

const stats = { fromDsaToJs: 0, fromDsaToOther: 0, fromJsToDsa: 0, dropped: 0 };

// Pass 1: only remove clear JS-language / noise from DSA
for (const topic of data.dsa.topics) {
  const keep = [];
  for (const q of topic.questions) {
    if (isNoise(q)) {
      stats.dropped += 1;
      continue;
    }

    const jsLang = isJsLanguageQuestion(q);
    if (!jsLang) {
      keep.push(q);
      continue;
    }

    // JS-language framed — move out of DSA (even if topic was Linked List etc.)
    const target = classifyOutOfDsa(q);
    const topicName = target === 'javascript' ? jsTopicFor(q) : `${data[target].label} — Cross-topic review`;
    if (addQuestion(target, topicName, q)) {
      if (target === 'javascript') stats.fromDsaToJs += 1;
      else stats.fromDsaToOther += 1;
    } else {
      stats.dropped += 1;
    }
  }
  topic.questions = keep;
}

// Pass 2: move pure DSA out of JavaScript (not API drills / language)
for (const topic of data.javascript.topics) {
  // Don't strip core language topics aggressively — only Practical + Cross + maybe Arrays
  const allowMove =
    /practical\s*coding|algorithm\s*questions|cross-topic|arrays,\s*set,\s*map|strings,\s*numbers|code\s*output/i.test(
      topic.name
    );

  const keep = [];
  for (const q of topic.questions) {
    if (isNoise(q)) {
      stats.dropped += 1;
      continue;
    }
    if (!allowMove) {
      keep.push(q);
      continue;
    }
    if (isJsApiPractice(q) || isJsLanguageQuestion(q)) {
      keep.push(q);
      continue;
    }
    if (isDsaQuestion(q)) {
      if (addQuestion('dsa', dsaTopicFor(q), q)) stats.fromJsToDsa += 1;
      else stats.dropped += 1;
      continue;
    }
    keep.push(q);
  }
  topic.questions = keep;
}

for (const key of Object.keys(data)) {
  data[key].topics = data[key].topics
    .map((t) => ({ ...t, count: t.questions.length }))
    .filter((t) => t.count > 0)
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
    .map((t, i) => ({ ...t, order: i + 1 }));
  data[key].topicCount = data[key].topics.length;
  data[key].questionCount = data[key].topics.reduce((s, t) => s + t.count, 0);
}

fs.writeFileSync(DATA_PATH, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
console.log('Wrote', DATA_PATH);
console.log(stats);
for (const key of ['javascript', 'dsa']) {
  console.log(`\n${key}: ${data[key].questionCount}`);
  for (const t of data[key].topics) console.log(`  [${t.order}] ${t.name} (${t.count})`);
}

const leftover = [];
for (const t of data.dsa.topics) {
  for (const q of t.questions) {
    if (isJsLanguageQuestion(q)) leftover.push(`${t.name} | ${q}`);
  }
}
console.log('\nJS-language still in DSA:', leftover.length);
if (leftover.length) console.log(leftover.join('\n'));
