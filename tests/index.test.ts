import { describe, it, expect } from 'vitest';
import { compress, decompress } from '../index';

describe('LZ77', () => {
  const source = "Sanskrit: काचं शक्नोम्यत्तुम् । नोपहिनस्ति माम् ॥ Sanskrit (standard transcription): kācaṃ śaknomyattum; nopahinasti mām. Classical Greek: ὕαλον ϕαγεῖν δύναμαι· τοῦτο οὔ με βλάπτει. Greek (monotonic): Μπορώ να φάω σπασμένα γυαλιά χωρίς να πάθω τίποτα. Greek (polytonic): Μπορῶ νὰ φάω σπασμένα γυαλιὰ χωρὶς νὰ πάθω τίποτα.  Etruscan: (NEEDED) Latin: Vitrum edere possum; mihi non nocet. Old French: Je puis mangier del voirre. Ne me nuit. French: Je peux manger du verre, ça ne me fait pas mal. Provençal / Occitan: Pòdi manjar de veire, me nafrariá pas. Québécois: J'peux manger d'la vitre, ça m'fa pas mal. Walloon: Dji pou magnî do vêre, çoula m' freut nén må.  Champenois: (NEEDED)  Lorrain: (NEEDED) Picard: Ch'peux mingi du verre, cha m'foé mie n'ma.  Corsican/Corsu: (NEEDED)  Jèrriais: (NEEDED) Kreyòl Ayisyen (Haitï): Mwen kap manje vè, li pa blese'm.";

  it('Round-trip: compress then decompress returns original', () => {
    const compressedRoundTrip = compress(source);
    const decompressedRoundTrip = decompress(compressedRoundTrip as string);
    expect(decompressedRoundTrip).toBe(source);
  });

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
}); 