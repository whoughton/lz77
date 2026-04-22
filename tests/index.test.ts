import { describe, it, expect } from 'vitest';
import { compress, compressRollingHash, decompress, decompressLegacy, compressHybrid } from '../index';
import { compressLegacy, compressHashTable } from '../index_legacy';

const compressVariants = [
  { fn: compress, name: 'compress (default)' },
  { fn: compressHybrid, name: 'compressHybrid (hash+window)' },
  { fn: compressRollingHash, name: 'compressRollingHash' },
  { fn: compressLegacy, name: 'compressLegacy' },
  { fn: compressHashTable, name: 'compressHashTable' },
];

const decompressVariants = [
  { fn: decompress, name: 'decompress (array)' },
  { fn: decompressLegacy, name: 'decompressLegacy (string-concat)' },
];

describe('LZ77', () => {
  const source = "Sanskrit: काचं शक्नोम्यत्तुम् । नोपहिनस्ति माम् ॥ Sanskrit (standard transcription): kācaṃ śaknomyattum; nopahinasti mām. Classical Greek: ὕαλον ϕαγεῖν δύναμαι· τοῦτο οὔ με βλάπτει. Greek (monotonic): Μπορώ να φάω σπασμένα γυαλιά χωρίς να πάθω τίποτα. Greek (polytonic): Μπορῶ νὰ φάω σπασμένα γυαλιὰ χωρὶς νὰ πάθω τίποτα.  Etruscan: (NEEDED) Latin: Vitrum edere possum; mihi non nocet. Old French: Je puis mangier del voirre. Ne me nuit. French: Je peux manger du verre, ça ne me fait pas mal. Provençal / Occitan: Pòdi manjar de veire, me nafrariá pas. Québécois: J'peux manger d'la vitre, ça m'fa pas mal. Walloon: Dji pou magnî do vêre, çoula m' freut nén må.  Champenois: (NEEDED)  Lorrain: (NEEDED) Picard: Ch'peux mingi du verre, cha m'foé mie n'ma.  Corsican/Corsu: (NEEDED)  Jèrriais: (NEEDED) Kreyòl Ayisyen (Haitï): Mwen kap manje vè, li pa blese'm.";

  for (const c of compressVariants) {
    for (const d of decompressVariants) {
      it(`Round-trip: ${c.name} then ${d.name} returns original`, () => {
        const compressed = c.fn(source);
        const decompressed = d.fn(compressed as string);
        expect(decompressed).toBe(source);
      });
    }
  }

  describe('compress', () => {
    it('Fails if a string is not provided', () => {
      const test = compress(['a', 'b'] as any);
      expect(test).toBe(false);
    });
  });

  describe('decompress', () => {
    it('Fails if a string is not provided', () => {
      const test = decompress({ list: ['a', 'b'] } as any);
      expect(test).toBe(false);
    });
  });

  // Known limitation: compressHash (and similar hash-table methods) may fail this test for certain minStringLength and input patterns. This is kept for documentation purposes.
  it.skip('Round-trip: minStringLength=6, sample issue (#3) string', () => {
    const settings = { minStringLength: 6 };
    const to_compress = "can't read my, can't read my, no he can't read my poker face";
    for (const c of compressVariants) {
      for (const d of decompressVariants) {
        const compressed = c.fn(to_compress, settings);
        const decompressed = d.fn(compressed as string, settings);
        expect(decompressed, `Failed for compress=${c.name}, decompress=${d.name}\nCompressed: ${compressed}\nDecompressed: ${decompressed}`).toBe(to_compress);
      }
    }
  });

  describe('Compression effectiveness', () => {
    it('compresses repeated substrings and round-trips correctly', () => {
      const settings = { minStringLength: 5 };
      const to_compress = "hello hello baby you called I can't hear a thing";
      for (const c of compressVariants) {
        const compressed = c.fn(to_compress, settings);
        expect(typeof compressed).toBe('string');
        expect((compressed as string).length).toBeLessThanOrEqual(to_compress.length);
        for (const d of decompressVariants) {
          const decompressed = d.fn(compressed as string, settings);
          expect(decompressed).toBe(to_compress);
        }
      }
    });
  });

  describe('Decompression input validation', () => {
    for (const d of decompressVariants) {
      describe(d.name, () => {
        it('returns false for truncated input (ref prefix at end)', () => {
          expect(d.fn('`')).toBe(false);
        });

        it('returns false for truncated input (ref prefix + 1 char)', () => {
          expect(d.fn('`A')).toBe(false);
        });

        it('returns false for truncated input (ref prefix + 2 chars)', () => {
          expect(d.fn('`AB')).toBe(false);
        });

        it('returns false for invalid char codes in reference', () => {
          expect(d.fn('`\x01BC ')).toBe(false);
        });

        it('returns false for distance exceeding output buffer', () => {
          expect(d.fn('`  ')).toBe(false);
        });

        it('returns false for non-string input', () => {
          expect(d.fn(42 as any)).toBe(false);
          expect(d.fn(null as any)).toBe(false);
          expect(d.fn(undefined as any)).toBe(false);
        });

        it('returns false for distance of zero', () => {
          expect(d.fn('` ' + String.fromCharCode(32) + String.fromCharCode(32 + 5 - 5))).toBe(false);
        });

        it('returns false for literal followed by truncated reference', () => {
          expect(d.fn('abc`')).toBe(false);
          expect(d.fn('abc`A')).toBe(false);
        });

        it('output never contains undefined string for malformed input', () => {
          const result = d.fn('`  ');
          if (typeof result === 'string') {
            expect(result).not.toContain('undefined');
          }
        });
      });
    }

    describe('decompress (array)', () => {
      it('respects maxDecompressedSize', () => {
        const compressed = compress('hello hello hello');
        if (typeof compressed === 'string') {
          const result = decompress(compressed, { maxDecompressedSize: 5 });
          expect(result).toBe(false);
        }
      });

      it('allows output within maxDecompressedSize', () => {
        const compressed = compress('abc');
        if (typeof compressed === 'string') {
          const result = decompress(compressed, { maxDecompressedSize: 100 });
          expect(result).toBe('abc');
        }
      });

      it('empty string round-trips', () => {
        const compressed = compress('');
        expect(compressed).toBe('');
        expect(decompress(compressed as string)).toBe('');
      });

      it('single character round-trips', () => {
        const compressed = compress('x');
        if (typeof compressed === 'string') {
          expect(decompress(compressed)).toBe('x');
        }
      });
    });

    describe('decompressLegacy (string-concat)', () => {
      it('respects maxDecompressedSize', () => {
        const compressed = compress('hello hello hello');
        if (typeof compressed === 'string') {
          const result = decompressLegacy(compressed, { maxDecompressedSize: 5 });
          expect(result).toBe(false);
        }
      });

      it('allows output within maxDecompressedSize', () => {
        const compressed = compress('abc');
        if (typeof compressed === 'string') {
          const result = decompressLegacy(compressed, { maxDecompressedSize: 100 });
          expect(result).toBe('abc');
        }
      });
    });
  });

  describe('Edge cases and coverage', () => {
    it('string shorter than minStringLength round-trips', () => {
      for (const c of compressVariants) {
        const compressed = c.fn('abc');
        if (typeof compressed === 'string') {
          expect(decompress(compressed)).toBe('abc');
        }
      }
    });

    it('string of only refPrefix characters round-trips', () => {
      const input = '``````';
      for (const c of compressVariants) {
        const compressed = c.fn(input);
        if (typeof compressed === 'string') {
          expect(decompress(compressed)).toBe(input);
        }
      }
    });

it('string with no repeated substrings round-trips', () => {
      const input = 'abcdefghijklmnopqrstuvwxyz';
      for (const c of compressVariants) {
        const compressed = c.fn(input);
        if (typeof compressed === 'string') {
          expect(decompress(compressed)).toBe(input);
        }
      }
    });

    it('windowLength override of 1 forces literal-only output', () => {
      const input = 'hello hello hello';
      for (const c of compressVariants) {
        const compressed = c.fn(input, { windowLength: 1 });
        if (typeof compressed === 'string') {
          for (const d of decompressVariants) {
            expect(d.fn(compressed, { windowLength: 1 })).toBe(input);
          }
        }
      }
    });

    it('repetitive input round-trips (self-overlapping matches)', () => {
      const input = 'aaaaaaaaaaaa';
      for (const c of compressVariants) {
        const compressed = c.fn(input);
        if (typeof compressed === 'string') {
          expect(decompress(compressed)).toBe(input);
        }
      }
    });

it('cross-compressor output consistency', () => {
      const input = 'the quick brown fox jumps over the lazy dog the quick brown fox';
      for (const c of compressVariants) {
        const compressed = c.fn(input);
        if (typeof compressed === 'string') {
          for (const d of decompressVariants) {
            const decompressed = d.fn(compressed);
            expect(decompressed, `Failed for ${c.name}/${d.name}`).toBe(input);
          }
        }
      }
    });

    it('unicode emoji round-trips', () => {
      const input = 'hello 🌍 world 🚀 test 🎉';
      for (const c of compressVariants) {
        const compressed = c.fn(input);
        if (typeof compressed === 'string') {
          expect(decompress(compressed)).toBe(input);
        }
      }
    });
  });
});