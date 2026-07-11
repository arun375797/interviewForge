export function normalizeSubtopics(page) {
  if (!page) return [];
  if (Array.isArray(page.subtopics)) {
    return page.subtopics.map((item) => String(item || '').trim()).filter(Boolean);
  }
  if (page.subtopic) {
    return [String(page.subtopic).trim()].filter(Boolean);
  }
  return [];
}

export function buildIndexGroups(pages) {
  const sorted = [...pages].sort((a, b) => a.pageNumber - b.pageNumber);
  const groupMap = new Map();

  for (const page of sorted) {
    const topicLabel = page.topic || 'Untitled';
    const key = topicLabel.trim().toLowerCase();
    if (!groupMap.has(key)) {
      groupMap.set(key, { key, topic: topicLabel, pages: [] });
    }
    groupMap.get(key).pages.push({
      ...page,
      subtopics: normalizeSubtopics(page),
    });
  }

  return Array.from(groupMap.values())
    .map((group) => {
      const entries = [];
      for (const item of group.pages) {
        const subs = item.subtopics;
        if (subs.length) {
          for (const sub of subs) {
            entries.push({
              type: 'subtopic',
              label: sub,
              pageId: item._id,
              pageNumber: item.pageNumber,
            });
          }
        } else {
          entries.push({
            type: 'page',
            label: group.topic,
            pageId: item._id,
            pageNumber: item.pageNumber,
          });
        }
      }

      const hasSubtopics = group.pages.some((item) => item.subtopics.length > 0);
      const isExpandable = hasSubtopics || group.pages.length > 1;

      return {
        ...group,
        entries,
        isExpandable,
        minPage: Math.min(...group.pages.map((item) => item.pageNumber)),
      };
    })
    .sort((a, b) => a.minPage - b.minPage);
}

export function filterIndexGroups(groups, query) {
  const q = query.trim().toLowerCase();
  if (!q) return groups;

  return groups
    .map((group) => {
      const topicMatch = group.topic.toLowerCase().includes(q);
      const matchingEntries = group.entries.filter((entry) =>
        entry.label.toLowerCase().includes(q)
      );

      if (topicMatch) return group;
      if (matchingEntries.length) {
        return { ...group, entries: matchingEntries, isExpandable: true };
      }
      return null;
    })
    .filter(Boolean);
}

export function sanitizeSubtopics(values) {
  return values.map((item) => String(item || '').trim()).filter(Boolean);
}
