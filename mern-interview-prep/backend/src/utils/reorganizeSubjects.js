/**
 * Rebuild parsed-questions.json so subjects are clean:
 * javascript | mongodb | react | nodejs | dsa
 *
 * Moves misfiled topics/questions out of JS (and overlap buckets)
 * into the right subject, then writes the file in place.
 *
 * Usage: node src/utils/reorganizeSubjects.js
 */
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../../data/parsed-questions.json');
const BACKUP_PATH = path.join(__dirname, '../../data/parsed-questions.backup.json');

const SUBJECT_META = {
  javascript: { label: 'JavaScript', color: '#CA8A04' },
  mongodb: { label: 'MongoDB', color: '#0F766E' },
  react: { label: 'React', color: '#0891B2' },
  nodejs: { label: 'Node.js', color: '#16A34A' },
  dsa: { label: 'DSA', color: '#DB2777' },
};

/** Topics that should be redistributed (not kept as-is). */
const REDISTRIBUTE_TOPICS = new Set([
  'Node.js, Express & Backend',
  'MongoDB & Database',
  'React, Redux, Frontend & CSS',
  'DSA / Computer Science Fundamentals',
  'JavaScript / Backend / Non-React Overlap Found in Files',
  'Database, ODM, MongoDB & Query Topics',
  'JavaScript Overlap / General JS Concepts Found in File',
  'React / Frontend / Browser Storage / Other Web Topics',
  'OTHER PROGRAMMING / JAVASCRIPT OVERLAP',
  'JavaScript — Moved from other subjects',
  'React — Moved from other subjects',
  'Node.js — Moved from other subjects',
  'DSA — Moved from other subjects',
]);

/** Specific Mongo topics first; Basics is the fallback (last). */
const MONGO_TOPIC_RULES = [
  {
    name: 'Aggregation Pipeline',
    re: /aggregat|pipeline|\$match|\$group|\$lookup|\$project|\$unwind|\$facet|\$fill|\$sort|\$limit|\$skip|\$addFields|\$setUnion|\$pop|\$pull|single\s*purpose\s*aggr|\bgroup\b/i,
  },
  {
    name: 'CRUD, Queries & Operators',
    re: /\b(find|update|insert|delete|crud|query|distinct|bulk\s*write|upsert|projection|cursor|elemmatch|addtoset)\b|\$eq|\$gt|\$lt|\$in|\$nin|\$or|\$and|\$ne|\$exists|\$type|\$regex|\$elemmatch|\$expr|\$set|\$unset|\$inc|\$push|\$addtoset|\$all/i,
  },
  {
    name: 'Indexing & Query Performance',
    re: /\b(index|indexing|compound|multikey|ttl|hashed|covered|explain|profiler)\b/i,
  },
  {
    name: 'Schema Design, Relationships & Modeling',
    re: /\b(schema|embed|referenc|relationship|normalize|denormal|data\s*modeling|relations|one-to-|many-to-)\b/i,
  },
  {
    name: 'Transactions, CAP, ACID & Consistency',
    re: /\b(transaction|acid|cap|consistency|atomicity|isolation|durability|partition\s*tolerance)\b/i,
  },
  {
    name: 'Replication, Sharding & Operations',
    re: /\b(replica|sharding|shard|backup|atlas|journal|capped\s*collection|clustered\s*collection)\b|shading\s*vs\s*replication/i,
  },
  {
    name: 'SQL-style & Interview Query Practice',
    re: /\b(salary|employee|dept|department|avg\s*age|hr\s*depart)\b/i,
  },
  {
    name: 'MongoDB Basics, Documents & BSON',
    re: /\b(mongo|mongodb|bson|document|collections?|nosql|gridfs|objectid|odm|mongoose|utilities)\b/i,
  },
];

function scoreSubject(text) {
  const q = String(text || '').toLowerCase();
  const scores = { mongodb: 0, react: 0, nodejs: 0, dsa: 0, javascript: 0 };

  const bump = (subject, weight, patterns) => {
    for (const re of patterns) {
      if (re.test(q)) scores[subject] += weight;
    }
  };

  bump('mongodb', 8, [
    /\bmongo(db)?\b/,
    /\bbson\b/,
    /\bgridfs\b/,
    /\bmongoose\b/,
    /\bodm\b/,
    /\bobjectid\b/,
    /\bnosql\b/,
    /\bttl(\s*index)?\b/,
    /\bhashed\s*index\b/,
    /\bcovered\s*quer/,
    /\baggregation\s*pipeline\b/,
    /\bcapped\s*collection\b/,
    /\bclustered\s*collection\b/,
    /\breplica\s*set\b/,
    /\bsharding\b/,
    /\bmax\s*size\s*of\s*mongo/,
    /\$lookup/,
    /\$facet/,
    /\$fill/,
    /\$expr/,
    /\$elemmatch/i,
    /\$addtoset/i,
    /\$setunion/i,
    /\$exists/,
    /\$match/,
    /\$group/,
    /\$unwind/,
    /\$project/,
    /\$all\b/,
    /\$in\b/,
    /\$pop/,
    /\$pull/,
  ]);
  bump('mongodb', 5, [
    /\bcompound\s*index\b/,
    /\bmultikey\s*index\b/,
    /\bindexing\b/,
    /\bdrawbacks?\s*of\s*indexing\b/,
    /\bsingle\s*purpose\s*aggr/,
    /\bdatabase\s*profiler\b/,
    /\bpartition\s*tolerance\b/,
    /\b(cap|acid)\b/,
    /\bavg\s*(age|salary)\b/,
    /\bemployee/,
    /\bsalary/,
    /\bembedded\s*data\b/,
    /\bbulk\s*write\b/,
    /\bdistinct\b/,
    /\belemmatch\b/i,
    /\baddtoset\b/i,
    /\baggregate\b/,
    /\bcollections?\b/,
    /\bdata\s*modeling\b/,
    /\bone-to-one\b/,
    /\bjournaling\b/,
    /\bupsert\b/,
    /\borm\b/,
  ]);

  bump('react', 8, [
    /\breact\b/,
    /\bredux\b/,
    /\bjsx\b/,
    /\buse(state|effect|ref|memo|callback|reducer|context|selector|dispatch|imperativehandle)\b/i,
    /\bvirtual\s*dom\b/,
    /\breact\s*router\b/,
    /\brender\s*props\b/,
    /\berror\s*boundar/,
    /\breact\s*fiber\b/,
    /\bredux\s*thunk\b/,
    /\bconnect\s*function\b/,
  ]);
  bump('react', 3, [
    /\bcontrolled\b.*\buncontrolled\b|\buncontrolled\b.*\bcontrolled\b/,
    /\bdangerouslySetInnerHTML\b/i,
    /\bbootstrap\b/,
    /\bflex\s*vs\s*grid\b/,
    /\bcss\s*media\b/,
    /\bmixins\b/,
  ]);

  bump('nodejs', 8, [
    /\bnode\.?js\b/,
    /\bexpress\b/,
    /\bmiddle\s*ware\b/,
    /\bres\.(send|json|write|status)\b/,
    /\breq\.(body|params|query)\b/,
    /\bapp\.(get|post|use|all|listen|set)\b/,
    /\bworker\s*threads?\b/,
    /\bchild[_\s-]*process\b/,
    /\bclusters?\b|\bclsutering\b|\bclustering\b/,
    /\bevent\s*emitter\b|\beventemitter\b/,
    /\blibuv\b/,
    /\bmorgan\b/,
    /\b(spawn|fork)\b/,
    /\bstream(s)?\b/,
    /\bpiping\b/,
    /\bapp\.locals\b/,
    /\bfs\.(link|unlink|read|write)\b/,
    /\breactor\s*pattern\b/,
    /\bcontent\s*negotiation\b/,
    /\bcloudinary\b/,
    /\b__dirname\b/,
    /\bpackage\.json\b/,
    /\bdevdependencies\b/,
    /\b\.env\b/,
    /\bcron-?job\b/,
    /\bview\s*engine\b/,
    /\bprocess\s*module\b/,
    /\bos\s*module\b/,
    /\boperating\s*system\b/,
  ]);
  bump('nodejs', 4, [
    /\bcors\b/,
    /\bpre[\s-]*flight\b/,
    /\bhttp\b/,
    /\brest\s*api\b/,
    /\bjwt\b/,
    /\bsessions?\s*&?\s*cookies?\b/,
    /\bpath\s*params?\b/,
    /\bquery\s*params?\b/,
    /\bpagination\b/,
    /\bstatus\s*code\b/,
    /\b(put|patch|options)\b/,
    /\bidempotency\b/,
    /\bbuffer\s*class\b/,
    /\bmvc\b/,
  ]);

  bump('dsa', 8, [
    /\b(big\s*-?\s*o|asymptotic|time\s*complexity|space\s*complexity)\b/,
    /\b(linked\s*list|binary\s*search|binary\s*tree|bst|heap|trie|graph|stack|queue|deque)\b/,
    /\b(bfs|dfs|dijkstra|recursion|backtracking|sorting|hash\s*table|hashing)\b/,
    /\b(minimum\s*spanning|load\s*factor|underflow|overflow)\b/,
    /\bleetcode\.com\b/,
    /\bbalance[d]?\s*parenthes/,
    /\bdata\s*structures?\b/,
    /\balgorithms?\b/,
  ]);

  bump('javascript', 8, [
    /promise/,
    /async/,
    /await/,
    /callback/,
    /debounc/,
    /throttl/,
    /garbage\s*collect|garrabage\s*collect/,
    /\bhoisting\b/,
    /\bclosure\b/,
    /\bprototype\b/,
    /\bevent\s*loop\b/,
    /\btdz\b/,
    /\biife\b/,
    /destructur/,
    /\bspread\b/,
    /\brest\s*operator\b/,
    /\blocalstorage\b/,
    /\bsessionstorage\b/,
    /\bevent\s*delegation\b/,
    /\bevent\s*propagation\b/,
    /\bflatmap\b/,
    /\bweakset\b/,
    /\bweak\s*map\b/,
    /\bproxy\s*object\b/,
    /\barrow\s*function\b/,
    /\bgenerator\s*function\b/,
    /\bexecution\s*context\b/,
    /\bmicro\s*tasks?\b/,
    /\bmacro\s*tasks?\b/,
    /\breplaceall\b/,
    /\bdesign\s*patterns?\b/,
    /\bmap\s*vs\s*set\b/,
    /\bset,\s*map\b/,
    /\baggregateerror\b/,
    /\bbrowser\s*(storage|cache|apis?)\b/,
    /\bmodules?\s*and\s*namespaces\b/,
  ]);
  bump('javascript', 3, [
    /\bdom\b/,
    /\bbom\b/,
    /\bcookie\b/,
    /\bform\s*submit\b/,
    /\bhtml\s*form\b/,
    /\bform\s*data\b/,
    /\ba\s*href\b/,
    /\brender\s*dynamic\b/,
  ]);

  // Pure CSS without React signals → javascript frontend fundamentals
  if (/\b(flex|grid|css|mixin)\b/i.test(q) && scores.react < 3) {
    scores.javascript += 2;
  }

  // JS memory / debounce topics must not stick on Mongo because of "collection"
  if (/garbage\s*collect|garrabage\s*collect|debounc|throttl|promise|map\s*vs\s*set|set,\s*map|collections\s+and\s+generators|generators/i.test(q)) {
    scores.mongodb = 0;
    scores.javascript += 6;
  }
  if (/`?os`?\s*module|operating\s*system|system\s*resource|cpu\s*info|form\s*submit|two\s*buttons|form\s*data|content\s*types|render\s*dynamic/i.test(q)) {
    scores.mongodb = 0;
    scores.nodejs += 5;
    scores.javascript += 2;
  }

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (ranked[0][1] === 0) return null;
  if (ranked[0][1] === ranked[1][1]) {
    const prefer = ['mongodb', 'react', 'nodejs', 'dsa', 'javascript'];
    for (const key of prefer) {
      if (scores[key] === ranked[0][1]) return key;
    }
  }
  return ranked[0][0];
}

function topicBiasFallback(topicName, sourceSubject) {
  const name = topicName || '';
  if (/^MongoDB & Database$/i.test(name) || /^Database, ODM, MongoDB/i.test(name)) return 'mongodb';
  if (/^React, Redux/i.test(name)) return 'react';
  if (/^Node\.js, Express/i.test(name)) return 'nodejs';
  if (/^DSA \//i.test(name)) return 'dsa';
  if (/JavaScript Overlap|General JS|Non-React Overlap|Browser Storage|Other Programming/i.test(name)) {
    return 'javascript';
  }
  if (/React \//i.test(name)) return 'javascript';
  return sourceSubject === 'react' || sourceSubject === 'nodejs' || sourceSubject === 'dsa' || sourceSubject === 'javascript'
    ? 'javascript'
    : sourceSubject;
}

function mongoTopicFor(question) {
  for (const topic of MONGO_TOPIC_RULES) {
    if (topic.re.test(question)) return topic.name;
  }
  return 'MongoDB Basics, Documents & BSON';
}

function findExistingTopic(subject, question, topicMap) {
  const existing = [...topicMap.keys()].filter((n) => !/Moved from other/i.test(n));
  const ql = question.toLowerCase();
  return (
    existing.find((name) => {
      const n = name.toLowerCase();
      if (/promise|async|callback|micro\s*task|macro\s*task/.test(ql) && /promise|async|callback|event loop|timer|runtime|memory/.test(n))
        return true;
      if (/debounce|throttl|garbage\s*collect|memory/.test(ql) && /event loop|timer|runtime|memory|performance/.test(n)) return true;
      if (/middleware|express|jwt|cluster|worker|stream|cors|http|rest|env|fs\.|package/.test(ql) && /express|middleware|worker|stream|auth|http|rest|module|security|practical/.test(n))
        return true;
      if (/hook|redux|router|jsx|component|render props|profiler|context/.test(ql) && /hook|redux|router|component|jsx|performance|context|pattern/.test(n))
        return true;
      if (/stack|queue|tree|graph|hash|sort|array|linked|trie|heap|complexity|big/.test(ql) && /stack|queue|tree|graph|hash|sort|array|linked|trie|heap|complexity|basics/.test(n))
        return true;
      if (/storage|localstorage|sessionstorage|dom|bom|browser|cookie/.test(ql) && /dom|bom|browser|storage|event/.test(n)) return true;
      if (/closure|prototype|this\b|curry|hof|iife|function/.test(ql) && /function|closure|prototype|class|oop/.test(n)) return true;
      if (/scope|hoist|tdz|shadow/.test(ql) && /scope|hoist|tdz|variable/.test(n)) return true;
      return false;
    }) || null
  );
}

function isNoiseQuestion(q) {
  const t = String(q || '').trim();
  if (!t) return true;
  if (/^https?:\/\//i.test(t) && /github\.com/i.test(t)) return true;
  if (/^\(?\s*[A-Z][a-z]+(\s+[A-Z][a-z]+)?\s*\)?$/.test(t) && t.length < 40) {
    if (!/\b(Js|React|Node|Mongo|Stack|Queue|Array|Promise|Hook)\b/i.test(t)) return true;
  }
  if (
    /^(concepts|basics|action|actions|connect|boilerplate|core principle|advanced & project-level|core & must-know basics|by understanding the concept)/i.test(
      t
    )
  ) {
    return true;
  }
  if (/^date:\s*/i.test(t)) return true;
  if (/^\d+$/.test(t)) return true;
  if (/^and also the page is reloading$/i.test(t)) return true;
  if (/^app is not (fully )?mob optimised$/i.test(t)) return true;
  return false;
}

function rebuild() {
  const sourcePath = fs.existsSync(BACKUP_PATH) ? BACKUP_PATH : DATA_PATH;
  const raw = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
  console.log('Reading from', sourcePath);

  /** @type {Map<string, Map<string, {order:number, questions:string[]}>>} */
  const buckets = new Map();
  for (const key of Object.keys(SUBJECT_META)) {
    buckets.set(key, new Map());
  }

  const ensureTopic = (subject, topicName, orderHint = 999) => {
    const map = buckets.get(subject);
    if (!map.has(topicName)) {
      map.set(topicName, { order: orderHint, questions: [] });
    }
    return map.get(topicName);
  };

  // Seed clean topics first (preserve order)
  for (const [subjectKey, subject] of Object.entries(raw)) {
    if (!buckets.has(subjectKey)) continue;
    for (const topic of subject.topics) {
      if (REDISTRIBUTE_TOPICS.has(topic.name)) continue;
      const slot = ensureTopic(subjectKey, topic.name, topic.order);
      for (const q of topic.questions) {
        if (!isNoiseQuestion(q)) slot.questions.push(q);
      }
    }
  }

  const stats = { mongodb: 0, react: 0, nodejs: 0, dsa: 0, javascript: 0, dropped: 0 };

  const hasQuestion = (subject, question) => {
    const needle = question.trim().toLowerCase();
    for (const slot of buckets.get(subject).values()) {
      if (slot.questions.some((q) => q.trim().toLowerCase() === needle)) return true;
    }
    return false;
  };

  const addQuestion = (subject, topicName, question, orderHint = 80) => {
    if (hasQuestion(subject, question)) return;
    ensureTopic(subject, topicName, orderHint).questions.push(question);
    stats[subject] = (stats[subject] || 0) + 1;
  };

  for (const [subjectKey, subject] of Object.entries(raw)) {
    for (const topic of subject.topics) {
      if (!REDISTRIBUTE_TOPICS.has(topic.name)) continue;

      for (const q of topic.questions) {
        if (isNoiseQuestion(q)) {
          stats.dropped += 1;
          continue;
        }

        let target = scoreSubject(q);
        if (!target) target = topicBiasFallback(topic.name, subjectKey);
        if (!SUBJECT_META[target]) target = 'javascript';

        let topicName;
        if (target === 'mongodb') {
          topicName = mongoTopicFor(q);
        } else {
          topicName =
            findExistingTopic(target, q, buckets.get(target)) ||
            `${SUBJECT_META[target].label} — Cross-topic review`;
        }

        addQuestion(target, topicName, q, target === 'mongodb' ? 10 : 90);
      }
    }
  }

  const out = {};
  for (const [key, meta] of Object.entries(SUBJECT_META)) {
    const topicMap = buckets.get(key);
    const topics = [...topicMap.entries()]
      .map(([name, slot]) => ({
        order: slot.order,
        name,
        count: slot.questions.length,
        questions: slot.questions,
      }))
      .filter((t) => t.count > 0)
      .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
      .map((t, idx) => ({ ...t, order: idx + 1 }));

    const questionCount = topics.reduce((sum, t) => sum + t.count, 0);
    out[key] = {
      label: meta.label,
      color: meta.color,
      topicCount: topics.length,
      questionCount,
      topics,
    };
  }

  fs.writeFileSync(DATA_PATH, `${JSON.stringify(out, null, 2)}\n`, 'utf8');

  console.log('Wrote', DATA_PATH);
  for (const [key, subject] of Object.entries(out)) {
    console.log(`  ${key}: ${subject.questionCount} questions across ${subject.topicCount} topics`);
    for (const t of subject.topics) {
      console.log(`    [${t.order}] ${t.name} (${t.count})`);
    }
  }
  console.log('Redistributed/dropped:', stats);
}

rebuild();
