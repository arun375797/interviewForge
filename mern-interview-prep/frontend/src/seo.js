import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { SUBJECT_META } from './api';

const SITE_NAME = 'thinkMern';
const DEFAULT_TITLE = 'thinkMern - MERN Interview Prep';
const DEFAULT_DESCRIPTION =
  'Prepare for MERN interviews with topic-wise JavaScript, React, Node.js, DSA, coding practice, mock interviews, and editable interview-style answers.';
const DEFAULT_KEYWORDS = [
  'MERN interview questions',
  'JavaScript interview prep',
  'React interview questions',
  'Node.js interview questions',
  'DSA practice',
  'coding interview practice',
  'full stack developer interview',
];
const FALLBACK_SITE_URL = 'https://interviewforge.vercel.app';

const INDEXABLE_ROUTES = new Set([
  '/',
  '/learn',
  '/code',
  '/practice',
  '/mock',
  '/review',
  '/flashcards',
  '/weak-spots',
  '/feynman',
  '/subject/javascript',
  '/subject/react',
  '/subject/nodejs',
  '/subject/dsa',
  '/learn/javascript',
  '/learn/react',
  '/learn/nodejs',
  '/learn/dsa',
  '/code/javascript',
  '/code/dsa',
]);

function configuredSiteUrl() {
  const envUrl = import.meta.env.VITE_SITE_URL?.trim().replace(/\/+$/, '');
  if (envUrl) return envUrl;
  if (typeof window !== 'undefined' && window.location.origin) return window.location.origin;
  return FALLBACK_SITE_URL;
}

function absoluteUrl(path = '/') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${configuredSiteUrl()}${normalizedPath}`;
}

function cleanSegment(value = '') {
  try {
    return decodeURIComponent(value)
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  } catch {
    return value;
  }
}

function subjectLabel(subject) {
  return SUBJECT_META[subject]?.label || cleanSegment(subject);
}

function subjectDescription(subject) {
  const meta = SUBJECT_META[subject];
  if (!meta) return 'Practice interview questions with concise, editable answers.';
  return `${meta.label} interview questions covering ${meta.blurb.toLowerCase()} with topic-wise answers and practice tools.`;
}

function buildJsonLd({ title, description, canonicalPath }) {
  const url = absoluteUrl(canonicalPath);
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: absoluteUrl('/'),
      description: DEFAULT_DESCRIPTION,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${absoluteUrl('/subject/javascript')}?qsearch={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'EducationalApplication',
      name: SITE_NAME,
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Web',
      url,
      description,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: SITE_NAME,
          item: absoluteUrl('/'),
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: title,
          item: url,
        },
      ],
    },
  ];
}

function routeSeo(pathname) {
  const parts = pathname.split('/').filter(Boolean);
  const [section, subject, id] = parts;
  const canonicalPath = pathname === '/' ? '/' : `/${parts.join('/')}`;
  const base = {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    keywords: DEFAULT_KEYWORDS,
    canonicalPath,
    indexable: INDEXABLE_ROUTES.has(canonicalPath),
    type: 'website',
  };

  if (pathname === '/') return base;

  if (section === 'login') {
    return {
      ...base,
      title: `Sign in | ${SITE_NAME}`,
      description: 'Sign in to continue your MERN interview preparation.',
      indexable: false,
    };
  }

  if (section === 'subject' && subject) {
    const label = subjectLabel(subject);
    return {
      ...base,
      title: `${label} Interview Questions and Answers | ${SITE_NAME}`,
      description: subjectDescription(subject),
      keywords: [...DEFAULT_KEYWORDS, `${label} interview questions`, `${label} interview answers`],
      type: 'article',
    };
  }

  if (section === 'learn') {
    const label = subject ? subjectLabel(subject) : 'MERN';
    return {
      ...base,
      title: `${label} Learning Track | ${SITE_NAME}`,
      description: subject
        ? `Learn ${label} topic by topic with interview questions, progress tracking, and editable answers.`
        : 'Choose a JavaScript, React, Node.js, or DSA learning track and build interview readiness topic by topic.',
      keywords: [...DEFAULT_KEYWORDS, `${label} learning track`, `${label} interview preparation`],
    };
  }

  if (section === 'code') {
    const label = subject ? subjectLabel(subject) : 'JavaScript and DSA';
    return {
      ...base,
      title: id ? `Coding Workspace | ${SITE_NAME}` : `${label} Coding Practice | ${SITE_NAME}`,
      description: id
        ? 'Solve coding interview questions in the browser with a timer, starter code, sample data, and saved progress.'
        : `Practice ${label} coding interview problems with runnable JavaScript, topic filters, and saved progress.`,
      keywords: [...DEFAULT_KEYWORDS, `${label} coding practice`, 'coding interview questions'],
      indexable: !id && INDEXABLE_ROUTES.has(canonicalPath),
    };
  }

  if (section === 'practice') {
    return {
      ...base,
      title: `Active Recall Practice | ${SITE_NAME}`,
      description:
        'Write your answer before revealing, rate your recall, and use interleaved practice to mix topics like a real interview.',
      keywords: [...DEFAULT_KEYWORDS, 'active recall', 'interleaved practice', 'interview practice'],
    };
  }

  if (section === 'review') {
    return {
      ...base,
      title: `Daily Spaced Repetition Review | ${SITE_NAME}`,
      description: 'Manually add questions to your daily review queue and practice spaced repetition when they are due.',
      keywords: [...DEFAULT_KEYWORDS, 'spaced repetition', 'daily review'],
    };
  }

  if (section === 'flashcards') {
    return {
      ...base,
      title: `Interview Flashcards | ${SITE_NAME}`,
      description: 'Quick flashcard drills from question key points for fast micro-reviews.',
      keywords: [...DEFAULT_KEYWORDS, 'interview flashcards', 'MERN flashcards'],
    };
  }

  if (section === 'weak-spots') {
    return {
      ...base,
      title: `Weak Spots Dashboard | ${SITE_NAME}`,
      description: 'Questions you manually mark as weak for extra review and practice.',
      keywords: [...DEFAULT_KEYWORDS, 'weak spots', 'study focus'],
      indexable: false,
    };
  }

  if (section === 'feynman') {
    return {
      ...base,
      title: `Explain Mode — Feynman Practice | ${SITE_NAME}`,
      description: 'Explain concepts out loud or in writing, then reveal the model answer and key points.',
      keywords: [...DEFAULT_KEYWORDS, 'feynman technique', 'explain interview answers'],
    };
  }

  if (section === 'mock') {
    return {
      ...base,
      title: `Timed Mock Interviews | ${SITE_NAME}`,
      description:
        'Run timed mock interviews with self-rating, follow-up prompts, and a session debrief of weak questions.',
      keywords: [...DEFAULT_KEYWORDS, 'timed mock interview', 'MERN mock interview'],
    };
  }

  if (section === 'typing') {
    return {
      ...base,
      title: `Typing Speed Practice | ${SITE_NAME}`,
      description:
        'Improve typing speed with English interview phrases and MERN stack code snippets for JavaScript, React, Node.js, Express, DSA, and MongoDB.',
      keywords: [...DEFAULT_KEYWORDS, 'typing speed practice', 'code typing drill', 'MERN typing'],
      indexable: false,
    };
  }

  if (section === 'bookmarks' || section === 'plan' || section === 'add' || section === 'admin' || section === 'ide' || section === 'notebook') {
    return {
      ...base,
      title: section === 'ide' ? `IDE Workspace | ${SITE_NAME}` : `${cleanSegment(section)} | ${SITE_NAME}`,
      description:
        section === 'ide'
          ? 'Free-play IDE for JavaScript, MongoDB queries, and Node/Express route practice.'
          : 'Private study workspace for saved progress and admin tools.',
      indexable: false,
    };
  }

  return {
    ...base,
    title: `Page Not Found | ${SITE_NAME}`,
    description: 'The requested thinkMern page could not be found.',
    indexable: false,
  };
}

function setMeta(selector, attr, value) {
  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = document.createElement('meta');
    const nameMatch = selector.match(/\[name="([^"]+)"\]/);
    const propertyMatch = selector.match(/\[property="([^"]+)"\]/);
    if (nameMatch) tag.setAttribute('name', nameMatch[1]);
    if (propertyMatch) tag.setAttribute('property', propertyMatch[1]);
    document.head.appendChild(tag);
  }
  tag.setAttribute(attr, value);
}

function setLink(rel, href) {
  let tag = document.head.querySelector(`link[rel="${rel}"]`);
  if (!tag) {
    tag = document.createElement('link');
    tag.setAttribute('rel', rel);
    document.head.appendChild(tag);
  }
  tag.setAttribute('href', href);
}

function applySeo(seo) {
  const title = seo.title || DEFAULT_TITLE;
  const description = seo.description || DEFAULT_DESCRIPTION;
  const canonicalUrl = absoluteUrl(seo.canonicalPath || '/');
  const imageUrl = absoluteUrl('/og-image.svg');
  const robots = seo.indexable ? 'index,follow,max-image-preview:large' : 'noindex,nofollow';

  document.title = title;
  setMeta('meta[name="description"]', 'content', description);
  setMeta('meta[name="keywords"]', 'content', seo.keywords.join(', '));
  setMeta('meta[name="robots"]', 'content', robots);
  setMeta('meta[name="googlebot"]', 'content', robots);

  setMeta('meta[property="og:site_name"]', 'content', SITE_NAME);
  setMeta('meta[property="og:title"]', 'content', title);
  setMeta('meta[property="og:description"]', 'content', description);
  setMeta('meta[property="og:type"]', 'content', seo.type || 'website');
  setMeta('meta[property="og:url"]', 'content', canonicalUrl);
  setMeta('meta[property="og:image"]', 'content', imageUrl);
  setMeta('meta[property="og:image:alt"]', 'content', `${SITE_NAME} MERN interview prep`);

  setMeta('meta[name="twitter:card"]', 'content', 'summary_large_image');
  setMeta('meta[name="twitter:title"]', 'content', title);
  setMeta('meta[name="twitter:description"]', 'content', description);
  setMeta('meta[name="twitter:image"]', 'content', imageUrl);

  setLink('canonical', canonicalUrl);

  let script = document.head.querySelector('script[type="application/ld+json"][data-seo]');
  if (!script) {
    script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-seo', 'true');
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(buildJsonLd({ ...seo, title, description }), null, 2);
}

export default function RouteSeo() {
  const location = useLocation();
  const seo = useMemo(() => routeSeo(location.pathname), [location.pathname]);

  useEffect(() => {
    applySeo(seo);
  }, [seo]);

  return null;
}
