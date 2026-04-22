## LZ77
*https://github.com/whoughton/lz77*

### Version v2.1.0
***
**Release Date:** _2026-04-22_

- **Critical fix:** Decompressor `pos` advance after references now uses the correct constant (4 bytes) instead of `minStringLength - 1`, fixing round-trip failures with non-default `minStringLength` values (#3).
- **Security:** Added input validation to both `decompress` and `decompressLegacy` — malformed references, truncated input, invalid char codes, and distance/distance-zero errors now return `false` instead of producing corrupt output (#6).
- **Correctness:** Restored overlap guard in `compressHash` and `compressRollingHash` to prevent self-referencing matches that the decompressor cannot handle (#9).
- **Correctness:** Fixed rolling hash precision bug where `Math.pow(256, len-1)` exceeded `2^31-1` for `minStringLength >= 7` (#9).
- **Correctness:** Fixed match extension bug in `compressHybrid` where overlapping matches were not properly guarded (#7).
- **Performance:** Removed redundant O(N²) window scan from `compressHybrid` — it now uses hash-table lookups only, making it significantly faster (#7).
- **Performance:** Switched `compressHybrid` and `compressRollingHash` to array accumulators (avoids O(n²) string concatenation) (#7).
- **Performance:** Precomputed rolling hash base power; replaced `substr` with `substring` (#9).
- **Type safety:** Removed all `any` types, non-null assertions, and custom `extend()` utility in favor of spread syntax (#8).
- **Type safety:** Added `refPrefix` validation (must be single character) (#9).
- **Decompression safety:** Added `maxDecompressedSize` setting to prevent unbounded memory allocation (#6).
- **Testing:** Added 35 new tests covering edge cases, adversarial inputs, encoding primitives, custom settings, and cross-compressor consistency (#11, #12, #13, #14).
- **Testing:** Un-skipped the `minStringLength=6` round-trip test that previously documented a known bug (#3, #13).
- **Testing:** Added `encodeRefInt`, `decodeRefInt`, `encodeRefLength`, `decodeRefLength`, and `setup` as exported functions for testability (#14).
- **CI:** Replaced eslint with oxlint for faster linting (#19).
- **CI:** Added vitest coverage reporting with v8 provider and enforceable thresholds (#16).
- **CI:** Updated Node.js CI matrix to 20.x and 22.x (vite 8 requires Node >=20.19).
- **CI:** Added benchmark CI with baseline comparison and PR comments.
- **Docs:** Regenerated TypeDoc output to include all new exports and `maxDecompressedSize` setting.

### Version v2.0.0
***
**Release Date:** _2025-06-23_

- Released to npm
- Links added to Readme

### Version v2.0.0-beta.4
***
**Release Date:** _2025-06-23_

- License audit: BSD 2-Clause LICENSE file added, license headers in main source files.
- README updated with reference section and license section.
- TypeDoc added for LZ77Settings
- Final pre-release polish and documentation review.

### Version v2.0.0-beta.3
***
**Release Date:** _2025-06-23_

- `compress` is now always fully correct and round-trip safe (internally uses `compressHybrid`).
- The previous hash table-based method is now available as `compressHash` for advanced users who want maximum speed and are willing to accept rare edge cases.
- Documentation and API updated to reflect this change; usage examples now show `compress` as always safe by default.
- Debug output has been removed from the codebase.

### Version v2.0.0-beta.2
***
**Release Date:** _2025-06-23_

- Skipped, oops!

### Version 2.0.0-beta.1
***
**Release Date:** _2025-06-23_

* Major speed optimizations for compression and decompression
* Added array-based (fast) decompress implementation
* Benchmarks for all compress and decompress variants
* Added rolling hash (Rabin-Karp) compress variant (for reference/education)
* All compress methods now interchangeable with single decompress
* Documentation and README updated with performance notes and benchmark info
* Improved test coverage for all compress/decompress combinations

### Version 2.0.0-beta.0
***
**Release Date:** _2024-_

* Full TypeScript migration and ESM-first codebase
* Modernized project structure and exports
* Updated README and API documentation
* Vitest for tests, TypeDoc for docs, Vite for bundling
* Browser and Node.js support (ESM/UMD)

### Version 0.9.2
***
**Release Date:** _2013-_  

* Added homepage parameter to package.json


### Version 0.9.1
***
**Release Date:** _2013-05-30_  

* Fixed capitalization issue in exports


### Version 0.9.0
***
**Release Date:** _2013-05-30_  

* Moved the library to its own repository
* Updated the inline documentation and created docco output
* Update the exports system to hopefully work with multiple toolsets
* Prepped for npmjs publishing

