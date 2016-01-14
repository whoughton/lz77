'use strict';

var expect = require('chai').expect;
var lz77 = require('../index');

describe('LZ77', function() {
	var source =     "Sanskrit: काचं शक्नोम्यत्तुम् । नोपहिनस्ति माम् ॥ Sanskrit (standard transcription): kācaṃ śaknomyattum; nopahinasti mām. Classical Greek: ὕαλον ϕαγεῖν δύναμαι· τοῦτο οὔ με βλάπτει. Greek (monotonic): Μπορώ να φάω σπασμένα γυαλιά χωρίς να πάθω τίποτα. Greek (polytonic): Μπορῶ νὰ φάω σπασμένα γυαλιὰ χωρὶς νὰ πάθω τίποτα.  Etruscan: (NEEDED) Latin: Vitrum edere possum; mihi non nocet. Old French: Je puis mangier del voirre. Ne me nuit. French: Je peux manger du verre, ça ne me fait pas mal. Provençal / Occitan: Pòdi manjar de veire, me nafrariá pas. Québécois: J'peux manger d'la vitre, ça m'fa pas mal. Walloon: Dji pou magnî do vêre, çoula m' freut nén må.  Champenois: (NEEDED)  Lorrain: (NEEDED) Picard: Ch'peux mingi du verre, cha m'foé mie n'ma.  Corsican/Corsu: (NEEDED)  Jèrriais: (NEEDED) Kreyòl Ayisyen (Haitï): Mwen kap manje vè, li pa blese'm."; 
	var compressed = "Sanskrit: काचं शक्नोम्यत्तुम् । नोपहिनस्ति माम् ॥ ` J# (standard transcription): kācaṃ śaknomyattum; nopahinasti mām. Classical Greek: ὕαλον ϕαγεῖν δύναμαι· τοῦτο οὔ με βλάπτει.` L! (monotonic): Μπορώ να φάω σπασμένα γυαλιά χωρίς να πάθω τίποτα` ]$poly` Z'ῶ νὰ` S.ὰ χωρὶς νὰ` X) Etruscan: (NEEDED) Latin: Vitrum edere possum; mihi non nocet. Old French: Je puis mangier del voirre. Ne me nuit.` C(eux` K er du verre, ça n` K fait pas mal. Provençal / Occitan: Pòdi manjar de veire,`!' afrariá pas. Québécois: J'`!)('la vit`!1\"m'fa`!(%Walloon: Dji pou magnî do vê` L oula m' freut nén må.  Champen`!* (NEEDED)  Lorrain` (&Picard: Ch'peux mingi du verre, cha m'foé mie n'ma.  Corsican/Corsu` u'Jèrria`!((Kreyòl Ayisyen (Haitï): Mwen kap manje vè, li pa blese'm.";
	
	describe('compress', function() {
		it('Compresses the provided textual content.', function() {
			let test = lz77.compress(source);

			expect(test).to.equal(compressed);
		});
		
		it('Fails if a string is not provided', function() {
			let test = lz77.compress(['a', 'b']);
			
			expect(test).to.be.false;
		});
	});

	describe('decompress', function() {
		it('Decompresses the provided content', function() {
			let test = lz77.decompress(compressed);
			
			expect(test).to.equal(source);
		});
		
		it('Fails if a string is not provided', function() {
			let test = lz77.decompress({list: ['a', 'b']});
			
			expect(test).to.be.false;
		});
	});
});