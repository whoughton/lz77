// lz77 - BSD 2-Clause License - Copyright (c) 2024 Weston Houghton
// Compare two saved benchmark JSON files produced by: npm run bench -- --json --label <name>
//
// Usage:
//   npm run bench:compare -- bench-before.json bench-after.json

import { readFileSync } from 'node:fs';

interface BenchEntry {
  name:  string;
  unit:  string;
  value: number;
  range: string;
  extra?: string;
}

const [,, fileA, fileB] = process.argv;

if (!fileA || !fileB) {
  process.stderr.write('Usage: bench-compare.ts <before.json> <after.json>\n');
  process.exit(1);
}

const before: BenchEntry[] = JSON.parse(readFileSync(fileA, 'utf-8'));
const after: BenchEntry[]  = JSON.parse(readFileSync(fileB, 'utf-8'));

const afterMap = new Map(after.map(r => [r.name, r]));

// Thresholds (ops/sec is bigger-is-better)
const WARN_THRESHOLD    = 0.10; // 10% slower → ⚠
const FAILURE_THRESHOLD = 0.20; // 20% slower → ✗

let hasFailure = false;
let hasWarning = false;

interface Row {
  benchmark:  string;
  before:     string;
  after:      string;
  delta:      string;
  status:     string;
}

const rows: Row[] = before.map(ra => {
  const rb = afterMap.get(ra.name);
  if (!rb) {
    return { benchmark: ra.name, before: `${ra.value} ops/sec`, after: '(missing)', delta: 'N/A', status: '?' };
  }

  // ops/sec: higher is better, so regression = after < before
  const delta = (rb.value - ra.value) / ra.value;
  const sign  = delta >= 0 ? '+' : '';
  const deltaStr = `${sign}${(delta * 100).toFixed(1)}%`;

  let status = '✓';
  if (delta < -FAILURE_THRESHOLD) { status = '✗'; hasFailure = true; }
  else if (delta < -WARN_THRESHOLD) { status = '⚠'; hasWarning = true; }

  return {
    benchmark: ra.name,
    before:    `${ra.value.toLocaleString()} ops/sec`,
    after:     `${rb.value.toLocaleString()} ops/sec`,
    delta:     deltaStr,
    status,
  };
});

// Print missing benchmarks in after file
for (const rb of after) {
  if (!before.find(ra => ra.name === rb.name)) {
    rows.push({ benchmark: rb.name, before: '(missing)', after: `${rb.value.toLocaleString()} ops/sec`, delta: 'N/A', status: '?' });
  }
}

console.log(`\nBenchmark comparison: ${fileA} → ${fileB}\n`);
console.table(rows);

if (hasFailure) {
  console.error(`\n✗  One or more benchmarks regressed by more than ${FAILURE_THRESHOLD * 100}%.`);
  process.exit(1);
} else if (hasWarning) {
  console.warn(`\n⚠  One or more benchmarks regressed by more than ${WARN_THRESHOLD * 100}%.`);
} else {
  console.log(`\n✓  No significant regressions detected.`);
}
