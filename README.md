## LZ77
![CI](https://github.com/whoughton/lz77/actions/workflows/ci.yml/badge.svg)

A TypeScript/ESM implementation of LZ77, usable for Node.js and modern browsers.

### What is LZ77
LZ77 and LZ78 are the two lossless data compression algorithms published in papers by Abraham Lempel and Jacob Ziv in 1977 and 1978. They are also known as LZ1 and LZ2 respectively. These two algorithms form the basis for many variations including LZW, LZSS, LZMA and others. Besides their academic influence, these algorithms formed the basis of several ubiquitous compression schemes, including GIF and the DEFLATE algorithm used in PNG.

They are both theoretically dictionary coders. LZ77 maintains a sliding window during compression. This was later shown to be equivalent to the explicit dictionary constructed by LZ78—however, they are only equivalent when the entire data is intended to be decompressed. LZ78 decompression allows random access to the input as long as the entire dictionary is available, while LZ77 decompression must always start at the beginning of the input

*I used some existing source as a reference, but I do not know where from at this stage, if anyone notices it, please let me know.*

#### ESM/TypeScript Example

```ts
import { compress, decompress } from 'lz77';

const original: string = 'your string here';
const compressed: string | false = compress(original);
const decompressed: string | false = decompress(compressed as string);

console.log(decompressed); // should equal original
```

#### API
- `compress(source: string, params?: Partial<LZ77Settings>): string | false`
- `decompress(source: string, params?: Partial<LZ77Settings>): string | false`

### LZ77Settings (Configuration)

You can customize the behavior of compression and decompression by passing a partial `LZ77Settings` object as the second argument to `compress` or `decompress`. Most users will not need to change these, but advanced users can tune window size, match length, and other parameters.

**Available options (with defaults):**

```ts
interface LZ77Settings {
  refPrefix: string;         // Default: '`'   (backtick, used as reference marker)
  refIntBase: number;        // Default: 96    (base for encoding reference integers)
  refIntFloorCode: number;   // Default: 32    (char code for ' ')
  minStringLength: number;   // Default: 5     (minimum match length)
  defaultWindow: number;     // Default: 144   (sliding window size)
  // Advanced/derived:
  refIntCeilCode?: number;
  maxStringDistance?: number;
  maxStringLength?: number;
  maxWindow?: number;
  windowLength?: number;
}
```

**Example: Customizing settings**

```ts
import { compress, decompress } from 'lz77';

const customSettings = {
  minStringLength: 4,
  defaultWindow: 256,
};

const compressed = compress('your string here', customSettings);
const decompressed = decompress(compressed as string, customSettings);
```

If you omit settings, the library uses safe and compatible defaults. Only override if you know what you're doing!

#### TypeScript Support
- This library is written in TypeScript and ships with type definitions.
- You can use it seamlessly in both TypeScript and modern JavaScript projects.

#### More LZ77 information:
* [Docs & Info](https://whoughton.github.io/lz77/)
* [GitHub](https://github.com/whoughton/lz77)
* [Wikipedia](http://en.wikipedia.org/wiki/LZ77_and_LZ78)

### Usage

```js
import { compress, decompress } from 'lz77';

const original = 'your string here';
const compressed = compress(original);
const decompressed = decompress(compressed);

console.log(decompressed); // should equal original
```

### API Documentation

You can generate and view the latest API documentation using [TypeDoc](https://typedoc.org/):

```sh
npm run docs
```

This will generate HTML documentation in the `docs/` directory. Open `docs/index.html` in your browser to view the API docs for all exported functions and types.

> **Note:** This implementation is lossless and round-trip safe: `decompress(compress(input)) === input` for all valid input. However, the exact compressed output may differ from previous versions or other LZ77 implementations, as there are multiple valid ways to encode the same data.
>
> **Compression output length:** The optimized version may produce compressed outputs of different lengths compared to the legacy version. This is due to differences in how matches are found and selected, which is normal for LZ77. All outputs are valid and will decompress to the original input.

### Browser Usage

You can use this library directly in the browser after bundling with Vite:

#### 1. Build the browser bundles

```sh
npm run build:bundle
```
This will create:
- `dist/lz77.es.js` (ESM, for modern browsers/imports)
- `dist/lz77.umd.js` (UMD, for legacy browsers or global usage)

#### 2. Usage in HTML

**Modern browsers (ESM):**
```html
<script type="module">
  import { compress, decompress } from './dist/lz77.es.js';
  const compressed = compress('hello world');
  const decompressed = decompress(compressed);
  console.log(decompressed);
</script>
```

**Legacy/global usage (UMD):**
```html
<script src="./dist/lz77.umd.js"></script>
<script>
  // window.LZ77 is available
  const compressed = LZ77.compress('hello world');
  const decompressed = LZ77.decompress(compressed);
  console.log(decompressed);
</script>
```

> **Interchangeable compress methods:** All compress methods (`compress`, `compressRollingHash`, `compressLegacy`, `compressHashTable`) produce valid LZ77 output and are fully compatible with the single `decompress` function. You can use any compress method and decompress the result with `decompress`.

> **Performance note:** In JavaScript, the substring hash table method (`compress`) is generally faster than the rolling hash (Rabin-Karp, `compressRollingHash`) method, even for very large inputs. This is because JavaScript engines highly optimize string operations, making direct substring hashing extremely efficient. Benchmarks in this repository confirm that the rolling hash does not outperform the substring hash table approach in practice. The rolling hash version is included mainly for reference and educational purposes.

- The legacy compressor is fully correct but slow; hash table/optimized methods (compress, compressHashTable) are fast but may miss rare edge cases (see below).
- The compress (default) method is now always fully correct and round-trip safe (uses compressHybrid internally). compressHash is available for advanced users who want maximum speed and are willing to accept rare edge cases. Debug output has been removed in the latest version.


