import { compress, compressRollingHash, decompress, decompressLegacy, compressHybrid } from './index.js';
import { compressLegacy, compressHashTable } from './index_legacy.js';

const source = `Sanskrit: काचं शक्नोम्यत्तुम् । नोपहिनस्ति माम् ॥ Sanskrit (standard transcription): kācaṃ śaknomyattum; nopahinasti mām. Classical Greek: ὕαλον ϕαγεῖν δύναμαι· τοῦτο οὔ με βλάπτει. Greek (monotonic): Μπορώ να φάω σπασμένα γυαλιά χωρίς να πάθω τίποτα. Greek (polytonic): Μπορῶ νὰ φάω σπασμένα γυαλιὰ χωρὶς νὰ πάθω τίποτα.  Etruscan: (NEEDED) Latin: Vitrum edere possum; mihi non nocet. Old French: Je puis mangier del voirre. Ne me nuit. French: Je peux manger du verre, ça ne me fait pas mal. Provençal / Occitan: Pòdi manjar de veire, me nafrariá pas. Québécois: J'peux manger d'la vitre, ça m'fa pas mal. Walloon: Dji pou magnî do vêre, çoula m' freut nén må.  Champenois: (NEEDED)  Lorrain: (NEEDED) Picard: Ch'peux mingi du verre, cha m'foé mie n'ma.  Corsican/Corsu: (NEEDED)  Jèrriais: (NEEDED) Kreyòl Ayisyen (Haitï): Mwen kap manje vè, li pa blese'm.`.repeat(50);

const largeSource = source.repeat(10); // 50*10 = 500x original text

function benchWithSource(src: string, labelPrefix = '') {
  function bench(fn: (s: string) => string | false, label: string) {
    const t0 = performance.now();
    const result = fn(src);
    const t1 = performance.now();
    const compressedLength = (result as string).length;
    const originalLength = src.length;
    const ratio = compressedLength / originalLength;
    const savings = 100 * (1 - ratio);
    console.log(`${labelPrefix}${label}: ${(t1 - t0).toFixed(2)} ms, output length: ${compressedLength}`);
    console.log(`  Compression ratio: ${(ratio * 100).toFixed(2)}% of original, savings: ${savings.toFixed(2)}%`);
    return result as string;
  }

  function benchDecompress(compressed: string, label: string) {
    // Array-based (new)
    let t0 = performance.now();
    let result = decompress(compressed);
    let t1 = performance.now();
    let ok = result === src;
    console.log(`${labelPrefix}${label} decompress (array): ${(t1 - t0).toFixed(2)} ms, round-trip correct: ${ok}`);

    // Legacy (string-concat)
    t0 = performance.now();
    result = decompressLegacy(compressed);
    t1 = performance.now();
    ok = result === src;
    console.log(`${labelPrefix}${label} decompress (legacy): ${(t1 - t0).toFixed(2)} ms, round-trip correct: ${ok}`);
  }

  console.log(`\n${labelPrefix}Benchmarking LZ77 compressions...`);
  const compressedLegacy = bench(compressLegacy, 'Legacy (O(N^2))');
  const compressedHashTable = bench(compressHashTable, 'Hash Table (substring)');
  const compressedRollingHash = bench(compress, 'Hash Table (rolling hash)');
  const compressedRolling = bench(compressRollingHash, 'Rolling Hash (Rabin-Karp)');
  const compressedHybrid = bench(compressHybrid, 'Hybrid (hash+window)');

  console.log(`\n${labelPrefix}Benchmarking decompression...`);
  benchDecompress(compressedLegacy, 'Legacy (O(N^2))');
  benchDecompress(compressedHashTable, 'Hash Table (substring)');
  benchDecompress(compressedRollingHash, 'Hash Table (rolling hash)');
  benchDecompress(compressedRolling, 'Rolling Hash (Rabin-Karp)');
  benchDecompress(compressedHybrid, 'Hybrid (hash+window)');
}

benchWithSource(source, 'SMALL: ');
benchWithSource(largeSource, 'LARGE: '); 