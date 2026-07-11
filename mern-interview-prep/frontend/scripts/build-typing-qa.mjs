import { createRequire } from 'node:module';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MERN_TYPING_TEMPLATES, TOPIC_FILTERS } from './mern-typing-templates.mjs';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const OUT_DIR = path.resolve(__dirname, '..', 'src', 'data', 'typing');
const TARGET = 100;

const { CODE_PRACTICE_QUESTIONS } = require(
  path.join(ROOT, 'backend', 'src', 'utils', 'curatedCodeQuestions.js')
);
const { buildFullSolution } = require(
  path.join(ROOT, 'backend', 'src', 'utils', 'codeSolutionBodies.js')
);

const CATEGORIES = [
  'english',
  'javascript',
  'react',
  'nodejs',
  'express',
  'dsa',
  'mongodb',
];

function normalizeQuestion(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function makeEntry({ category, topic, question, explanation, text, label, source }) {
  return {
    category,
    topic,
    question,
    explanation,
    text,
    label,
    source: source || 'thinkmern-question-bank',
  };
}

function buildCuratedEntries(category) {
  const subject = category === 'dsa' ? 'dsa' : 'javascript';
  const items = CODE_PRACTICE_QUESTIONS.filter((item) => item.subjects.includes(subject));
  const entries = [];

  for (const item of items) {
    const text = buildFullSolution(item);
    if (!text) continue;
    entries.push(
      makeEntry({
        category,
        topic: item.topic,
        question: `${item.title}: ${item.task}`,
        explanation: item.hint || `Return the expected output for the sample input.`,
        text,
        label: item.title,
        source: 'curated-code-practice',
      })
    );
    if (entries.length >= TARGET) break;
  }

  return entries;
}

function matchTemplate(question, category) {
  const templates = MERN_TYPING_TEMPLATES.filter((item) => item.category === category);
  return templates.find((template) => template.patterns.some((pattern) => pattern.test(question)));
}

function collectParsedQuestions(parsed, filter) {
  const results = [];
  const subjects = [filter.subject];
  if (filter.altSubject) subjects.push(filter.altSubject);

  for (const subjectKey of subjects) {
    const subject = parsed[subjectKey];
    if (!subject) continue;
    for (const topic of subject.topics || []) {
      const topicMatches =
        filter.topics.some((pattern) => pattern.test(topic.name)) ||
        (filter.altTopics && filter.altTopics.some((pattern) => pattern.test(topic.name)));
      if (!topicMatches) continue;
      for (const question of topic.questions || []) {
        const clean = normalizeQuestion(question);
        if (clean.length < 8) continue;
        results.push({ subject: subjectKey, topic: topic.name, question: clean });
      }
    }
  }
  return results;
}

function buildTemplateEntries(category, parsedQuestions) {
  const templates = MERN_TYPING_TEMPLATES.filter((item) => item.category === category);
  const entries = [];
  const seen = new Set();

  for (const item of parsedQuestions) {
    const template = matchTemplate(item.question, category);
    if (!template) continue;
    const key = `${category}:${template.question}`;
    if (seen.has(key)) continue;
    seen.add(key);
    entries.push(
      makeEntry({
        category,
        topic: item.topic,
        question: item.question,
        explanation: template.explanation,
        text: template.answer,
        label: template.topic,
        source: `parsed-questions/${item.subject}`,
      })
    );
    if (entries.length >= TARGET) break;
  }

  let templateIndex = 0;
  while (entries.length < TARGET && templates.length) {
    const template = templates[templateIndex % templates.length];
    templateIndex += 1;
    const key = `${category}:template:${template.question}:${templateIndex}`;
    if (seen.has(key)) continue;
    seen.add(key);
    entries.push(
      makeEntry({
        category,
        topic: template.topic,
        question: template.question,
        explanation: template.explanation,
        text: template.answer,
        label: `${template.topic} ${templateIndex}`,
        source: 'thinkmern-practical-templates',
      })
    );
  }

  return entries.slice(0, TARGET);
}

async function main() {
  const parsed = JSON.parse(
    await readFile(path.join(ROOT, 'backend', 'data', 'parsed-questions.json'), 'utf8')
  );

  await mkdir(OUT_DIR, { recursive: true });
  const manifest = {};

  for (const category of CATEGORIES) {
    let entries = [];

    if (category === 'javascript' || category === 'dsa') {
      entries = buildCuratedEntries(category);
    } else {
      const filter = TOPIC_FILTERS[category];
      const parsedQuestions = collectParsedQuestions(parsed, filter);
      entries = buildTemplateEntries(category, parsedQuestions);
    }

    const filePath = path.join(OUT_DIR, `${category}.json`);
    await writeFile(filePath, `${JSON.stringify(entries, null, 2)}\n`, 'utf8');
    manifest[category] = entries.length;
    console.log(`Wrote ${entries.length} Q&A drills -> ${path.relative(process.cwd(), filePath)}`);
  }

  await writeFile(
    path.join(OUT_DIR, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  console.log('Done.', manifest);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
