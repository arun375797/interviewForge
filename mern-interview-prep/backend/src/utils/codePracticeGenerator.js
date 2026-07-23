const CODE_SUBJECTS = ['javascript', 'dsa', 'nodejs', 'react'];
const { findCuratedCodeQuestion, getCodeTopicOrder, TOPIC_ORDER } = require('./curatedCodeQuestions');

const CODE_KEYWORD_RE =
  /(implement|write|program|code|function|algorithm|find|reverse|sort|search|sum|count|remove|check|print|return|array|string|number|palindrome|anagram|prime|fibonacci|factorial|duplicate|maximum|minimum|largest|smallest|merge|stack|queue|tree|graph|traversal|binary|linear|matrix|two sum|parentheses|bracket|vowel|flatten|loop|while|for\s*loop|even|odd)/i;

const CODE_THEORY_RE =
  /\bevent\s*loop\b|\beventloop\b|phases?\s+in\s+(an?\s+)?event\s*loop|\bwhat\s+is\b|\bdefine\b|\bexplain\b|\bdifference\s+between\b|\badvantages?\b|\bdisadvantages?\b|\bapplications?\b|\btypes?\s+of\b|\bwhy\b|\bwhen\s+to\s+use\b|\btime\s+complexity\b|\bspace\s+complexity\b|\buse\s+case\b|\buse\s+of\b|\busage\b|\breal-world\b|\bsuitable\b|\boverflow\b|\bunderflow\b|stackoverflow|heapoverflow|\bconcept\b|\bclarity\b|\bstable\s+sorting\b|\bworst-case\b|\bbest-case\b|practical\s+implementation\s+of\s+(array|stack|queue|linked\s*list)$/i;

const FALLBACK_TOPIC_ORDER = {
  'Loops & Control Flow Practice': 101,
  'Array Basics & Traversal': 102,
  'Array Reverse & Transformation': 103,
  'Array Duplicates & Frequency': 104,
  'Array Searching & Selection': 105,
  'Array Methods: Map, Filter & Reduce': 106,
  'Set & Map Practice': 107,
  'Sorting & Merge Problems': 108,
  'String Reverse & Palindrome': 109,
  'String Frequency & Anagram': 110,
  'Math & Number Problems': 111,
  'Function & Recursion Problems': 112,
  'Object, JSON & Class Problems': 113,
  'Binary & Linear Search': 114,
  'Stack Problems': 115,
  'Queue Problems': 116,
  'Linked List Problems': 117,
  'Tree Problems': 118,
  'Graph BFS & DFS': 119,
  'Matrix & Grid Problems': 120,
  'Heap & Priority Queue Problems': 121,
};

const CODE_TOPIC_ORDER = { ...FALLBACK_TOPIC_ORDER, ...TOPIC_ORDER };

function inferCodeTopic(question, originalTopic = '', subject = '') {
  const q = question.toLowerCase();
  const text = `${question} ${originalTopic}`.toLowerCase();

  if (/heap|priority\s*queue/.test(text)) return 'Heap & Priority Queue Problems';
  if (/graph|bfs|dfs|breadth|depth|dijkstra/.test(text)) return 'Graph BFS & DFS';
  if (/tree|bst|binary tree|inorder|preorder|postorder|traversal/.test(text)) return 'Tree Problems';
  if (/linked\s*list/.test(text)) return 'Linked List Problems';
  if (/stack|parentheses|bracket/.test(text)) return 'Stack Problems';
  if (/queue|deque/.test(text)) return 'Queue Problems';
  if (/matrix|2d\s*array|transpose/.test(text)) return 'Matrix & Grid Problems';
  if (/binary\s*search|linear\s*search|\bsearch\b/.test(text)) {
    return 'Binary & Linear Search';
  }
  if (/sort|bubble|selection|insertion|quick|merge\s*sort|merge.*sorted|sorted.*merge/.test(text)) {
    return 'Sorting & Merge Problems';
  }
  if (/palindrome|reverse\s+string|string.*reverse/.test(q)) {
    return 'String Reverse & Palindrome';
  }
  if (/string|anagram|vowel|character|substring|frequency|occurrence/.test(q)) {
    return 'String Frequency & Anagram';
  }
  if (/loop|while|for\s*loop/.test(q) && !/array|duplicate|filter|map|reduce|set|collection/.test(q)) {
    return 'Loops & Control Flow Practice';
  }
  if (/filter|reduce|for\s*each|foreach|\bmap\b/.test(q)) {
    return 'Array Methods: Map, Filter & Reduce';
  }
  if (/\bset\b|\bmap\b|weakmap|weakset|collection/.test(q)) {
    return 'Set & Map Practice';
  }
  if (/prime|fibonacci|factorial|even|odd|number|sum\s+(of\s+)?numbers?|till\s+\d+|from\s+\d+\s+to\s+\d+/.test(q)) {
    return 'Math & Number Problems';
  }
  if (/duplicate|unique|frequency|occurrence|count.*array|array.*count/.test(text)) {
    return 'Array Duplicates & Frequency';
  }
  if (/two\s*sum|pair.*sum|largest|smallest|second|third|max|min|find/.test(text)) {
    return 'Array Searching & Selection';
  }
  if (/reverse.*array|array.*reverse|flatten|nested|transform/.test(text)) {
    return 'Array Reverse & Transformation';
  }
  if (/array|subarray/.test(text)) {
    return 'Array Basics & Traversal';
  }
  if (/loop|while|for\s*loop|control|condition|if\s*\(/.test(text)) {
    return 'Loops & Control Flow Practice';
  }
  if (/class|object|json|constructor|prototype|oop|encapsulation|inheritance/.test(text)) {
    return 'Object, JSON & Class Problems';
  }
  if (/function|recursion|recursive|closure|currying/.test(text)) {
    return 'Function & Recursion Problems';
  }
  return subject === 'dsa' ? 'Array Basics & Traversal' : 'Loops & Control Flow Practice';
}

function cleanTitle(question) {
  return question
    .replace(/\s+/g, ' ')
    .replace(/\s*[-–—]\s*p$/i, '')
    .trim();
}

function jsValue(value) {
  return JSON.stringify(value, null, 2);
}

function starter(functionName, sampleInput, hint = '') {
  return `function ${functionName}(input) {
  // Write your solution here.${hint ? `\n  // ${hint}` : ''}
  return input;
}

const sampleInput = ${jsValue(sampleInput)};
return ${functionName}(sampleInput);`;
}

function challenge({
  question,
  topic,
  subject,
  functionName,
  task,
  sampleInput,
  expectedOutput,
  hint = '',
}) {
  const codeTopic = inferCodeTopic(question, topic, subject);
  return {
    title: cleanTitle(question),
    topic: codeTopic,
    originalTopic: topic,
    topicOrder: CODE_TOPIC_ORDER[codeTopic] || 99,
    language: 'javascript',
    task,
    sampleInput,
    expectedOutput,
    starterCode: starter(functionName, sampleInput, hint),
  };
}

function curatedStarter(item) {
  const functionName = item.functionName || 'solve';
  const provided = String(item.starterCode || '').trim();
  if (provided) {
    if (/const\s+sampleInput\b|return\s+/.test(provided)) return provided;
    return `${provided}

const sampleInput = ${jsValue(item.sampleInput)};
return typeof ${functionName} === 'function' ? ${functionName}(sampleInput) : sampleInput;`;
  }
  return starter(functionName, item.sampleInput, item.hint);
}

function curatedChallenge(item) {
  return {
    title: item.title,
    topic: item.topic,
    originalTopic: item.topic,
    topicOrder: item.topicOrder || getCodeTopicOrder(item.topic) || CODE_TOPIC_ORDER[item.topic] || 99,
    language: 'javascript',
    task: item.task,
    sampleInput: item.sampleInput,
    expectedOutput: item.expectedOutput,
    constraints: item.constraints || [],
    hint: item.hint || '',
    starterCode: curatedStarter(item),
  };
}

const TEMPLATES = [
  {
    re: /sum.*(till|to)\s*\d+|sum.*using\s+(while|for)|sum of numbers till/i,
    build: (doc) =>
      challenge({
        question: doc.question,
        topic: doc.topic,
        subject: doc.subject,
        functionName: 'sumUntil',
        task: 'Return the sum of all numbers from 1 up to the given number.',
        sampleInput: 100,
        expectedOutput: 5050,
        hint: 'Use a loop and accumulate the total.',
      }),
  },
  {
    re: /\beven\b.*(while|for|from|to)|print.*\beven\b|\beven\s+num/i,
    build: (doc) =>
      challenge({
        question: doc.question,
        topic: doc.topic,
        subject: doc.subject,
        functionName: 'evenNumbersInRange',
        task: 'Return all even numbers from start to end, inclusive.',
        sampleInput: { start: 20, end: 30 },
        expectedOutput: [20, 22, 24, 26, 28, 30],
        hint: 'Return an array instead of printing values one by one.',
      }),
  },
  {
    re: /two\s*sum|pair.*sum|sum.*target/i,
    build: (doc) =>
      challenge({
        question: doc.question,
        topic: doc.topic,
        functionName: 'twoSum',
        task: 'Return the indexes of two numbers whose sum equals the target.',
        sampleInput: { nums: [2, 7, 11, 15], target: 9 },
        expectedOutput: [0, 1],
        hint: 'Return the indexes, not the values.',
      }),
  },
  {
    re: /reverse.*array|revers an array|reverse an array/i,
    build: (doc) =>
      challenge({
        question: doc.question,
        topic: doc.topic,
        functionName: 'reverseArray',
        task: 'Return the array in reverse order without changing the expected values.',
        sampleInput: [1, 2, 3, 4, 5],
        expectedOutput: [5, 4, 3, 2, 1],
      }),
  },
  {
    re: /remove.*duplicate|duplicate.*array|unique.*array/i,
    build: (doc) =>
      challenge({
        question: doc.question,
        topic: doc.topic,
        functionName: 'removeDuplicates',
        task: 'Return a new array with duplicate values removed while keeping the first occurrence order.',
        sampleInput: [1, 5, 2, 2, 7, 5],
        expectedOutput: [1, 5, 2, 7],
      }),
  },
  {
    re: /(second|2nd).*largest|third.*largest|3rd.*largest/i,
    build: (doc) => {
      const isThird = /third|3rd/i.test(doc.question);
      return challenge({
        question: doc.question,
        topic: doc.topic,
        functionName: isThird ? 'thirdLargest' : 'secondLargest',
        task: `Return the ${isThird ? 'third' : 'second'} largest distinct number from the array.`,
        sampleInput: [12, 35, 1, 10, 34, 1],
        expectedOutput: isThird ? 12 : 34,
        hint: 'Treat duplicate values as one distinct value.',
      });
    },
  },
  {
    re: /(largest|maximum|max).*array|array.*(largest|maximum|max)/i,
    build: (doc) =>
      challenge({
        question: doc.question,
        topic: doc.topic,
        functionName: 'findLargest',
        task: 'Return the largest number from the array.',
        sampleInput: [3, 9, 2, 14, 7],
        expectedOutput: 14,
      }),
  },
  {
    re: /(smallest|minimum|min).*array|array.*(smallest|minimum|min)/i,
    build: (doc) =>
      challenge({
        question: doc.question,
        topic: doc.topic,
        functionName: 'findSmallest',
        task: 'Return the smallest number from the array.',
        sampleInput: [3, 9, 2, 14, 7],
        expectedOutput: 2,
      }),
  },
  {
    re: /sum.*prime|prime.*sum/i,
    build: (doc) =>
      challenge({
        question: doc.question,
        topic: doc.topic,
        functionName: 'sumPrimes',
        task: 'Return the sum of all prime numbers in the array.',
        sampleInput: [2, 3, 4, 5, 6, 7, 8],
        expectedOutput: 17,
      }),
  },
  {
    re: /nested.*array|flatten/i,
    build: (doc) =>
      challenge({
        question: doc.question,
        topic: doc.topic,
        functionName: 'flattenAndSum',
        task: 'Flatten the nested array and return the sum of all numeric values.',
        sampleInput: [1, [2, 3], [4, [5]]],
        expectedOutput: 15,
      }),
  },
  {
    re: /sum.*array|array.*sum|sum of numbers/i,
    build: (doc) =>
      challenge({
        question: doc.question,
        topic: doc.topic,
        functionName: 'sumArray',
        task: 'Return the sum of numeric values in the array. Ignore non-number values.',
        sampleInput: [10, '5', 20, true, 3],
        expectedOutput: 33,
      }),
  },
  {
    re: /filter/i,
    build: (doc) =>
      challenge({
        question: doc.question,
        topic: doc.topic,
        functionName: 'filterEvenNumbers',
        task: 'Return only the even numbers from the array.',
        sampleInput: [1, 2, 3, 4, 5, 6],
        expectedOutput: [2, 4, 6],
      }),
  },
  {
    re: /\bmap\b|double.*array/i,
    build: (doc) =>
      challenge({
        question: doc.question,
        topic: doc.topic,
        functionName: 'doubleNumbers',
        task: 'Return a new array where every number is doubled.',
        sampleInput: [1, 2, 3, 4],
        expectedOutput: [2, 4, 6, 8],
      }),
  },
  {
    re: /reduce/i,
    build: (doc) =>
      challenge({
        question: doc.question,
        topic: doc.topic,
        functionName: 'sumWithReduce',
        task: 'Use a reduce-style approach to return the sum of all numbers.',
        sampleInput: [4, 8, 15, 16],
        expectedOutput: 43,
      }),
  },
  {
    re: /palindrome/i,
    build: (doc) =>
      challenge({
        question: doc.question,
        topic: doc.topic,
        functionName: 'isPalindrome',
        task: 'Return true if the string reads the same forward and backward.',
        sampleInput: 'madam',
        expectedOutput: true,
      }),
  },
  {
    re: /anagram/i,
    build: (doc) =>
      challenge({
        question: doc.question,
        topic: doc.topic,
        functionName: 'areAnagrams',
        task: 'Return true if both strings contain the same characters with the same frequencies.',
        sampleInput: { first: 'listen', second: 'silent' },
        expectedOutput: true,
      }),
  },
  {
    re: /reverse.*string|string.*reverse/i,
    build: (doc) =>
      challenge({
        question: doc.question,
        topic: doc.topic,
        functionName: 'reverseString',
        task: 'Return the string in reverse order.',
        sampleInput: 'javascript',
        expectedOutput: 'tpircsavaj',
      }),
  },
  {
    re: /vowel/i,
    build: (doc) =>
      challenge({
        question: doc.question,
        topic: doc.topic,
        functionName: 'countVowels',
        task: 'Return the number of vowels in the string.',
        sampleInput: 'Interview Forge',
        expectedOutput: 6,
      }),
  },
  {
    re: /factorial/i,
    build: (doc) =>
      challenge({
        question: doc.question,
        topic: doc.topic,
        functionName: 'factorial',
        task: 'Return the factorial of the given non-negative integer.',
        sampleInput: 5,
        expectedOutput: 120,
      }),
  },
  {
    re: /fibonacci/i,
    build: (doc) =>
      challenge({
        question: doc.question,
        topic: doc.topic,
        functionName: 'fibonacci',
        task: 'Return the nth Fibonacci number using zero-based indexing.',
        sampleInput: 7,
        expectedOutput: 13,
      }),
  },
  {
    re: /prime/i,
    build: (doc) =>
      challenge({
        question: doc.question,
        topic: doc.topic,
        functionName: 'isPrime',
        task: 'Return true if the number is prime, otherwise false.',
        sampleInput: 29,
        expectedOutput: true,
      }),
  },
  {
    re: /binary\s*search/i,
    build: (doc) =>
      challenge({
        question: doc.question,
        topic: doc.topic,
        functionName: 'binarySearch',
        task: 'Return the index of the target in the sorted array. Return -1 if it is not found.',
        sampleInput: { nums: [1, 3, 5, 7, 9, 11], target: 7 },
        expectedOutput: 3,
      }),
  },
  {
    re: /linear\s*search|search.*array/i,
    build: (doc) =>
      challenge({
        question: doc.question,
        topic: doc.topic,
        functionName: 'linearSearch',
        task: 'Return the index of the target in the array. Return -1 if it is not found.',
        sampleInput: { nums: [9, 4, 6, 2], target: 6 },
        expectedOutput: 2,
      }),
  },
  {
    re: /merge.*sorted|sorted.*merge/i,
    build: (doc) =>
      challenge({
        question: doc.question,
        topic: doc.topic,
        functionName: 'mergeSortedArrays',
        task: 'Merge both sorted arrays and return one sorted array.',
        sampleInput: { first: [1, 3, 5], second: [2, 4, 6] },
        expectedOutput: [1, 2, 3, 4, 5, 6],
      }),
  },
  {
    re: /sort|bubble|selection|insertion|quick|merge\s*sort/i,
    build: (doc) =>
      challenge({
        question: doc.question,
        topic: doc.topic,
        functionName: 'sortAscending',
        task: 'Return the numbers sorted in ascending order.',
        sampleInput: [5, 1, 4, 2, 8],
        expectedOutput: [1, 2, 4, 5, 8],
      }),
  },
  {
    re: /parentheses|bracket/i,
    build: (doc) =>
      challenge({
        question: doc.question,
        topic: doc.topic,
        functionName: 'isValidParentheses',
        task: 'Return true if all brackets are balanced and correctly nested.',
        sampleInput: '{[()]}',
        expectedOutput: true,
      }),
  },
  {
    re: /stack/i,
    build: (doc) =>
      challenge({
        question: doc.question,
        topic: doc.topic,
        functionName: 'runStack',
        task: 'Process stack operations. push adds a value, pop removes the top value, and peek returns the top value. Return the result of the final peek.',
        sampleInput: [
          ['push', 10],
          ['push', 20],
          ['pop'],
          ['peek'],
        ],
        expectedOutput: 10,
      }),
  },
  {
    re: /queue|deque/i,
    build: (doc) =>
      challenge({
        question: doc.question,
        topic: doc.topic,
        functionName: 'runQueue',
        task: 'Process queue operations. enqueue adds to the rear, dequeue removes from the front, and front returns the current first value. Return the result of the final front operation.',
        sampleInput: [
          ['enqueue', 'A'],
          ['enqueue', 'B'],
          ['dequeue'],
          ['front'],
        ],
        expectedOutput: 'B',
      }),
  },
  {
    re: /linked\s*list/i,
    build: (doc) =>
      challenge({
        question: doc.question,
        topic: doc.topic,
        functionName: 'reverseLinkedListValues',
        task: 'Treat the input array as linked-list node values and return the values after reversing the list.',
        sampleInput: [1, 2, 3, 4],
        expectedOutput: [4, 3, 2, 1],
      }),
  },
  {
    re: /tree.*traversal|inorder|preorder|postorder/i,
    build: (doc) =>
      challenge({
        question: doc.question,
        topic: doc.topic,
        functionName: 'inorderTraversal',
        task: 'Return the inorder traversal of the binary tree represented by nested objects.',
        sampleInput: {
          value: 2,
          left: { value: 1, left: null, right: null },
          right: { value: 3, left: null, right: null },
        },
        expectedOutput: [1, 2, 3],
      }),
  },
  {
    re: /graph|bfs|breadth/i,
    build: (doc) =>
      challenge({
        question: doc.question,
        topic: doc.topic,
        functionName: 'bfs',
        task: 'Return the BFS traversal order from the start node.',
        sampleInput: {
          graph: { A: ['B', 'C'], B: ['D'], C: [], D: [] },
          start: 'A',
        },
        expectedOutput: ['A', 'B', 'C', 'D'],
      }),
  },
  {
    re: /dfs|depth/i,
    build: (doc) =>
      challenge({
        question: doc.question,
        topic: doc.topic,
        functionName: 'dfs',
        task: 'Return the DFS traversal order from the start node.',
        sampleInput: {
          graph: { A: ['B', 'C'], B: ['D'], C: [], D: [] },
          start: 'A',
        },
        expectedOutput: ['A', 'B', 'D', 'C'],
      }),
  },
  {
    re: /matrix|2d\s*array|transpose/i,
    build: (doc) =>
      challenge({
        question: doc.question,
        topic: doc.topic,
        functionName: 'transposeMatrix',
        task: 'Return the transpose of the matrix.',
        sampleInput: [
          [1, 2, 3],
          [4, 5, 6],
        ],
        expectedOutput: [
          [1, 4],
          [2, 5],
          [3, 6],
        ],
      }),
  },
];

function getCodeChallenge(doc) {
  const curated = findCuratedCodeQuestion(doc.subject, doc.question);
  if (curated) return curatedChallenge(curated);

  if (doc.codeOnly) {
    const title = cleanTitle(doc.question);
    return {
      title,
      topic: doc.topic || 'Code Practice',
      originalTopic: doc.topic || 'Code Practice',
      topicOrder: doc.topicOrder || CODE_TOPIC_ORDER[doc.topic] || 99,
      language: 'javascript',
      task: (doc.answer && String(doc.answer).trim()) || title,
      sampleInput: '',
      expectedOutput: '',
      constraints: [],
      hint: doc.notes || '',
      starterCode: `// ${title}\n`,
    };
  }

  if (!CODE_SUBJECTS.includes(doc.subject)) return null;
  const questionText = doc.question;
  if (CODE_THEORY_RE.test(questionText)) return null;
  if (!CODE_KEYWORD_RE.test(questionText)) return null;
  const match = TEMPLATES.find((template) => template.re.test(questionText));
  return match ? match.build(doc) : null;
}

function isCodePracticeQuestion(doc) {
  return Boolean(getCodeChallenge(doc));
}

function toCodeQuestion(doc) {
  const codePrompt = getCodeChallenge(doc);
  if (!codePrompt) return null;
  const plain = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  const safeQuestion = { ...plain };
  const hasSavedCode = Boolean(safeQuestion.savedCode);
  delete safeQuestion.savedCode;
  return {
    ...safeQuestion,
    codePrompt,
    hasSavedCode,
  };
}

module.exports = {
  CODE_SUBJECTS,
  CODE_KEYWORD_RE,
  getCodeChallenge,
  isCodePracticeQuestion,
  toCodeQuestion,
};
