// lz77 - BSD 2-Clause License - Copyright (c) 2024 Weston Houghton
// Benchmark suite using tinybench. Supports structured JSON output for CI and local comparison.
//
// Usage:
//   npm run bench                          # human-readable table
//   npm run bench -- --json --label before # save bench-before.json
//   npm run bench -- --json --label after  # save bench-after.json
//   npm run bench:compare -- bench-before.json bench-after.json

import { Bench } from 'tinybench';
import { writeFileSync } from 'node:fs';
import { compress, compressRollingHash, decompress, decompressLegacy } from './index.js';
import { compressLegacy, compressHashTable } from './index_legacy.js';

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const isJson = args.includes('--json');
const labelIdx = args.indexOf('--label');
const label = labelIdx !== -1 ? args[labelIdx + 1] : undefined;

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

// Repetitive: high compression opportunity, stresses match-finding throughput
const repetitiveBase = `Sanskrit: काचं शक्नोम्यत्तुम् । नोपहिनस्ति माम् ॥ Sanskrit (standard transcription): kācaṃ śaknomyattum; nopahinasti mām. Classical Greek: ὕαλον ϕαγεῖν δύναμαι· τοῦτο οὔ με βλάπτει. Greek (monotonic): Μπορώ να φάω σπασμένα γυαλιά χωρίς να πάθω τίποτα. Greek (polytonic): Μπορῶ νὰ φάω σπασμένα γυαλιὰ χωρὶς νὰ πάθω τίποτα. Etruscan: (NEEDED) Latin: Vitrum edere possum; mihi non nocet. Old French: Je puis mangier del voirre. Ne me nuit. French: Je peux manger du verre, ça ne me fait pas mal. Provençal / Occitan: Pòdi manjar de veire, me nafrariá pas. Québécois: J'peux manger d'la vitre, ça m'fa pas mal. Walloon: Dji pou magnî do vêre, çoula m' freut nén må. Picard: Ch'peux mingi du verre, cha m'foé mie n'ma. Kreyòl Ayisyen: Mwen kap manje vè, li pa blese'm.`;
const repetitiveSource = repetitiveBase.repeat(20);

// Prose: minimal repetition, stresses the literal-emit path
const proseSource = `Data compression is the process of encoding information using fewer bits than the original representation. Compression is useful because it reduces the resources required to store and transmit data. Computational resources are consumed in the compression and decompression processes. Data compression is subject to a space-time complexity trade-off. For instance, a compression scheme for video may require expensive hardware for the video to be decompressed fast enough to be viewed as it is being decompressed, and the option to decompress the video in full before watching it may be inconvenient or require additional storage. The design of data compression schemes therefore involves trade-offs among various factors, including the degree of compression, the amount of distortion introduced, and the computational resources required to compress and decompress the data. Lossless compression reduces bits by identifying and eliminating statistical redundancy. No information is lost in lossless compression. Lossy compression reduces bits by removing unnecessary or less important information. Typically, a device that performs data compression is referred to as an encoder, and one that performs the reversal of the process, reconstruction, as a decoder. The LZ77 algorithm, published by Abraham Lempel and Jacob Ziv in 1977, is a dictionary-based compression algorithm that exploits the fact that sequences of bytes frequently repeat within a file. The algorithm maintains a sliding window into the previously seen input and encodes each new piece of data either as a literal byte or as a reference to a matching sequence in the window.`;

// Adversarial: dense refPrefix characters mixed with regular text, stresses the
// escape-doubling branch. Blocks are kept short enough (< maxStringLength = 99)
// to avoid triggering the off-by-one length encoding bug in compressRollingHash.
// See: https://github.com/whoughton/lz77/issues/9
const adversarialSource = ('`'.repeat(50) + ' sample text value ').repeat(40);

const fixtures = [
  { name: 'repetitive', source: repetitiveSource },
  { name: 'prose',      source: proseSource },
  { name: 'adversarial', source: adversarialSource },
] as const;

const compressors = [
  { name: 'compress',            fn: compress },
  { name: 'compressRollingHash', fn: compressRollingHash },
  { name: 'compressLegacy',      fn: compressLegacy },
  { name: 'compressHashTable',   fn: compressHashTable },
] as const;

// ---------------------------------------------------------------------------
// Build benchmark suite
// ---------------------------------------------------------------------------

const bench = new Bench({ time: 1000, warmupTime: 200 });

for (const fixture of fixtures) {
  for (const c of compressors) {
    bench.add(`${c.name}/${fixture.name}`, () => {
      c.fn(fixture.source);
    });
  }

  // Decompressors operate on pre-compressed input — use the default compressor
  const compressed = compress(fixture.source) as string;
  bench.add(`decompress/${fixture.name}`, () => {
    decompress(compressed);
  });
  bench.add(`decompressLegacy/${fixture.name}`, () => {
    decompressLegacy(compressed);
  });
}

await bench.run();

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

/** Benchmark-action compatible entry (customBiggerIsBetter). */
interface BenchEntry {
  name: string;
  unit: string;
  value: number;
  range: string;
  extra: string;
}

function buildResults(): BenchEntry[] {
  return bench.tasks.map(task => {
    const r = task.result!;
    return {
      name:  task.name,
      unit:  'ops/sec',
      value: Math.round(r.hz),
      range: `± ${r.rme.toFixed(2)}%`,
      extra: `min ${r.min.toFixed(3)} ms · max ${r.max.toFixed(3)} ms · p99 ${r.p99.toFixed(3)} ms`,
    };
  });
}

if (isJson) {
  const results = buildResults();
  const json = JSON.stringify(results, null, 2);
  if (label) {
    const filename = `bench-${label}.json`;
    writeFileSync(filename, json);
    process.stderr.write(`Saved to ${filename}\n`);
  } else {
    process.stdout.write(json + '\n');
  }
} else {
  // Human-readable: tinybench table + compression ratios
  console.log('\nLZ77 Benchmark Results\n');
  console.table(bench.table());

  console.log('\nCompression ratios:\n');
  for (const fixture of fixtures) {
    console.log(`  ${fixture.name} (${fixture.source.length} chars):`);
    for (const c of compressors) {
      const out = c.fn(fixture.source) as string;
      const ratio = (out.length / fixture.source.length * 100).toFixed(1);
      console.log(`    ${c.name.padEnd(22)} ${ratio}% of original`);
    }
  }
}
