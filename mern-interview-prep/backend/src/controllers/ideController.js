const {
  ensureSandboxSeeded,
  resetSandbox,
  runMongoQuery,
  runExpressCode,
  getSandboxInfo,
} = require('../utils/ideSandbox');

async function getInfo(_req, res) {
  try {
    await ensureSandboxSeeded();
    res.json(getSandboxInfo());
  } catch (err) {
    res.status(500).json({ message: err.message || 'Could not load IDE sandbox' });
  }
}

async function runCode(req, res) {
  const { mode, code, testRequest } = req.body || {};
  if (!mode || !code || typeof code !== 'string') {
    return res.status(400).json({ message: 'mode and code are required' });
  }
  if (code.length > 20000) {
    return res.status(400).json({ message: 'Code is too long (max 20,000 characters)' });
  }

  try {
    if (mode === 'mongodb') {
      const result = await runMongoQuery(code);
      return res.json(result);
    }
    if (mode === 'express') {
      const result = await runExpressCode(code, testRequest);
      return res.json(result);
    }
    return res.status(400).json({ message: 'Unsupported IDE mode. Use mongodb or express.' });
  } catch (err) {
    return res.json({
      ok: false,
      error: err && err.stack ? err.stack : String(err),
      logs: [],
    });
  }
}

async function resetData(_req, res) {
  try {
    await resetSandbox();
    res.json({ ok: true, message: 'IDE sandbox data reset to sample documents.' });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Could not reset sandbox' });
  }
}

module.exports = { getInfo, runCode, resetData };
