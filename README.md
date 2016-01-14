## LZ77

A javascript implementation of LZ77, usable for node, require.js/AMD, and browsers…

### What is LZ77
LZ77 and LZ78 are the two lossless data compression algorithms published in papers by Abraham Lempel and Jacob Ziv in 1977 and 1978. They are also known as LZ1 and LZ2 respectively. These two algorithms form the basis for many variations including LZW, LZSS, LZMA and others. Besides their academic influence, these algorithms formed the basis of several ubiquitous compression schemes, including GIF and the DEFLATE algorithm used in PNG.

They are both theoretically dictionary coders. LZ77 maintains a sliding window during compression. This was later shown to be equivalent to the explicit dictionary constructed by LZ78—however, they are only equivalent when the entire data is intended to be decompressed. LZ78 decompression allows random access to the input as long as the entire dictionary is available, while LZ77 decompression must always start at the beginning of the input

*I used some existing source as a reference, but I do not know where from at this stage, if anyone notices it, please let me know.*

### [View the annotated source](http://whoughton.github.io/lz77/docs/)

#### More LZ77 information:
* [Docs & Info](http://whoughton.github.io/lz77/)
* [Wikipedia](http://en.wikipedia.org/wiki/LZ77_and_LZ78)


