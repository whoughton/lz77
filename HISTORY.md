## LZ77
*https://github.com/whoughton/lz77*

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

