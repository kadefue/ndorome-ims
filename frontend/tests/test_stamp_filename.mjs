import { stampFilename } from '../src/pdfHelper.mjs';

function assertEqual(a, b, msg) {
  if (a !== b) {
    console.error('ASSERT FAIL:', msg, '\n  expected:', b, '\n  got:     ', a);
    process.exit(1);
  }
}

(async function run() {
  const base1 = 'report.pdf';
  const d1 = new Date('2026-03-14T09:05:07');
  const out1 = stampFilename(base1, d1);
  assertEqual(out1, 'report_20260314_090507.pdf', 'stamp for report.pdf');

  const base2 = 'my report';
  const d2 = new Date('2026-12-01T23:59:59');
  const out2 = stampFilename(base2, d2);
  assertEqual(out2, 'my report_20261201_235959.pdf', 'stamp for filename without .pdf');

  const base3 = 'Purchase Orders (all).pdf';
  const d3 = new Date('2024-01-02T03:04:05');
  const out3 = stampFilename(base3, d3);
  assertEqual(out3, 'Purchase Orders (all)_20240102_030405.pdf', 'stamp preserves name and inserts ts');

  console.log('All tests passed');
})();
