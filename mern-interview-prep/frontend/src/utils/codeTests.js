function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function normalizeOutput(value) {
  if (value === undefined) return undefined;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  }
  return value;
}

export function buildTestCases(codePrompt) {
  if (!codePrompt) return [];
  const cases = [];
  if (codePrompt.sampleInput !== undefined && codePrompt.expectedOutput !== undefined) {
    cases.push({
      label: 'Sample',
      input: codePrompt.sampleInput,
      expected: codePrompt.expectedOutput,
    });
  }
  return cases;
}

export async function runTestCases(code, testCases, runFn) {
  const results = [];
  for (const testCase of testCases) {
    const wrappedCode = wrapCodeForInput(code, testCase.input);
    const output = await runFn(wrappedCode);
    const actual = output.ok ? normalizeOutput(output.result) : null;
    const expected = testCase.expected;
    const passed = output.ok && deepEqual(actual, expected);
    results.push({
      ...testCase,
      passed,
      actual: output.ok ? output.result : null,
      error: output.ok ? null : output.error,
    });
  }
  return results;
}

function wrapCodeForInput(userCode, input) {
  const inputJson = JSON.stringify(input);
  if (/return\s+\w+\s*\(/.test(userCode) && !/sampleInput/.test(userCode)) {
    return `${userCode}\n\nconst __testInput = ${inputJson};\nconst __fnMatch = ${userCode}.match(/function\\s+(\\w+)/);\nconst __fnName = __fnMatch ? __fnMatch[1] : null;\nif (__fnName && typeof eval(__fnName) === 'function') {\n  return eval(__fnName)(__testInput);\n}\nreturn undefined;`;
  }
  return userCode.replace(
    /const sampleInput = [\s\S]*?;\s*\nreturn/,
    `const sampleInput = ${inputJson};\nreturn`
  );
}

export function testSummary(results) {
  const passed = results.filter((r) => r.passed).length;
  return { passed, total: results.length, allPassed: passed === results.length && results.length > 0 };
}
