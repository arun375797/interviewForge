const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const files = [
  { key: 'js', path: 'c:\\Users\\arun3\\Documents\\js questions all.pdf' },
  { key: 'react', path: 'c:\\Users\\arun3\\Documents\\react all questoins.pdf' },
  { key: 'node', path: 'c:\\Users\\arun3\\Documents\\node js full question.pdf' },
  { key: 'dsa', path: 'c:\\Users\\arun3\\Documents\\dsa full question.pdf' },
];

(async () => {
  for (const file of files) {
    console.log(`Extracting ${file.key}...`);
    const dataBuffer = fs.readFileSync(file.path);
    const parser = new PDFParse({ data: dataBuffer });
    const result = await parser.getText();
    const outPath = path.join(__dirname, `${file.key}.txt`);
    fs.writeFileSync(outPath, result.text, 'utf8');
    console.log(`${file.key}: ${result.text.length} chars -> ${outPath}`);
    await parser.destroy();
  }
  console.log('Done');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
