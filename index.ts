// lz77 - BSD 2-Clause License - Copyright (c) 2024 Weston Houghton
// LZ77: A minimal LZ77 [de]compressor (TypeScript version)

/**
 * Configuration options for LZ77 compression and decompression.
 * Pass a partial of this object as the second argument to compress or decompress to override defaults.
 *
 * @property refPrefix - Reference marker character (default: '`')
 * @property refIntBase - Base for encoding reference integers (default: 96)
 * @property refIntFloorCode - Char code for lowest reference int (default: 32, i.e. ' ')
 * @property minStringLength - Minimum match length (default: 5)
 * @property defaultWindow - Sliding window size (default: 144)
 * @property refIntCeilCode - (Advanced) Highest char code for reference int (computed)
 * @property maxStringDistance - (Advanced) Maximum match distance (computed)
 * @property maxStringLength - (Advanced) Maximum match length (computed)
 * @property maxWindow - (Advanced) Maximum window size (computed)
 * @property windowLength - (Advanced) Override window size (optional)
 */
export interface LZ77Settings {
  refPrefix: string;
  refIntBase: number;
  refIntFloorCode: number;
  refIntCeilCode?: number;
  maxStringDistance?: number;
  minStringLength: number;
  maxStringLength?: number;
  defaultWindow: number;
  maxWindow?: number;
  windowLength?: number;
}

const defaultSettings: LZ77Settings = {
  refPrefix: '`',
  refIntBase: 96,
  refIntFloorCode: ' '.charCodeAt(0),
  refIntCeilCode: undefined,
  maxStringDistance: undefined,
  minStringLength: 5,
  maxStringLength: undefined,
  defaultWindow: 144,
  maxWindow: undefined,
  windowLength: undefined
};

type AnyObject = Record<string, any>;

const each = (obj: any, iterator: (val: any, key: any, obj: any) => void, context?: any): void => {
  if (obj === null) return;
  if (Array.prototype.forEach && obj.forEach === Array.prototype.forEach) {
    obj.forEach(iterator, context);
  } else if (obj.length === +obj.length) {
    for (let i = 0, l = obj.length; i < l; i++) {
      iterator.call(context, obj[i], i, obj);
    }
  } else {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        iterator.call(context, obj[key], key, obj);
      }
    }
  }
};

const extend = (obj: AnyObject, ...sources: AnyObject[]): AnyObject => {
  each(sources, (source) => {
    if (source) {
      for (const prop in source) {
        obj[prop] = source[prop];
      }
    }
  });
  return obj;
};

function setup(params: Partial<LZ77Settings> = {}): LZ77Settings {
  const settings = extend({}, defaultSettings, params) as LZ77Settings;
  settings.refIntCeilCode = settings.refIntFloorCode + settings.refIntBase - 1;
  settings.maxStringDistance = Math.pow(settings.refIntBase, 2) - 1;
  settings.maxStringLength = Math.pow(settings.refIntBase, 1) - 1 + settings.minStringLength;
  settings.maxWindow = settings.maxStringDistance + settings.minStringLength;
  return settings;
}

function encodeRefInt(value: number, width: number, settings: LZ77Settings): string {
  if (value >= 0 && value < Math.pow(settings.refIntBase, width) - 1) {
    let encoded = '';
    while (value > 0) {
      encoded = String.fromCharCode((value % settings.refIntBase) + settings.refIntFloorCode) + encoded;
      value = Math.floor(value / settings.refIntBase);
    }
    const missingLength = width - encoded.length;
    for (let i = 0; i < missingLength; i++) {
      encoded = String.fromCharCode(settings.refIntFloorCode) + encoded;
    }
    return encoded;
  } else {
    throw new Error('Reference int out of range: ' + value + ' (width = ' + width + ')');
  }
}

function encodeRefLength(length: number, settings: LZ77Settings): string {
  return encodeRefInt(length - settings.minStringLength, 1, settings);
}

function decodeRefInt(data: string, width: number, settings: LZ77Settings): number {
  let value = 0;
  let charCode;
  for (let i = 0; i < width; i++) {
    value *= settings.refIntBase;
    charCode = data.charCodeAt(i);
    if (charCode >= settings.refIntFloorCode && charCode <= (settings.refIntCeilCode as number)) {
      value += charCode - settings.refIntFloorCode;
    } else {
      throw new Error('Invalid char code in reference int: ' + charCode);
    }
  }
  return value;
}

function decodeRefLength(data: string, settings: LZ77Settings): number {
  return decodeRefInt(data, 1, settings) + settings.minStringLength;
}

// Helper: Rabin-Karp rolling hash for substrings of length minStringLength
function rollingHash(str: string, pos: number, len: number, prevHash?: number, prevChar?: string, nextChar?: string): number {
  const base = 256;
  const mod = 2 ** 31 - 1;
  if (prevHash === undefined) {
    // Compute hash from scratch
    let hash = 0;
    for (let i = 0; i < len; i++) {
      hash = (hash * base + str.charCodeAt(pos + i)) % mod;
    }
    return hash;
  } else {
    // Rolling update: remove prevChar, add nextChar
    let hash = prevHash;
    hash = (hash - (prevChar!.charCodeAt(0) * Math.pow(base, len - 1)) % mod + mod) % mod;
    hash = (hash * base + nextChar!.charCodeAt(0)) % mod;
    return hash;
  }
}

// Helper: Hash a substring of length minStringLength (for hash-table, non-rolling version)
function hashSubstring(str: string, pos: number, len: number): string {
  return str.substr(pos, len);
}

/**
 * Compress a string using LZ77 algorithm.
 * @param source The source string to compress.
 * @param params Optional settings to override defaults.
 * @returns The compressed string, or false if input is not a string.
 */
export function compressHash(source: string, params?: Partial<LZ77Settings>): string | false {
  if (Object.prototype.toString.call(source) !== '[object String]') return false;
  const settings = setup(params);
  const windowLength = settings.windowLength || settings.defaultWindow;
  if (windowLength > (settings.maxWindow as number)) throw new Error('Window length too large');
  let compressed = '';
  let pos = 0;
  const lastPos = source.length - settings.minStringLength;
  const hashTable: Map<string, number[]> = new Map();
  const minLen = settings.minStringLength;
  const maxLen = settings.maxStringLength as number;
  while (pos < lastPos) {
    const windowStart = Math.max(pos - windowLength, 0);
    let bestMatch = { distance: settings.maxStringDistance as number, length: 0 };
    let newCompressed: string | null = null;
    if (pos + minLen <= source.length) {
      const hash = hashSubstring(source, pos, minLen);
      const candidates = hashTable.get(hash) || [];
      for (let i = candidates.length - 1; i >= 0; i--) {
        const candidatePos = candidates[i];
        if (candidatePos < windowStart) break;
        let matchLength = minLen;
        // Prevent matches from extending past the current position (no overlap beyond pos)
        while (
          matchLength < maxLen &&
          source.charAt(candidatePos + matchLength) === source.charAt(pos + matchLength) &&
          candidatePos + matchLength < pos
        ) {
          matchLength++;
        }
        if (matchLength > bestMatch.length) {
          bestMatch.distance = pos - candidatePos;
          bestMatch.length = matchLength;
        }
      }
      if (!hashTable.has(hash)) hashTable.set(hash, []);
      hashTable.get(hash)!.push(pos);
    }
    if (bestMatch.length) {
      newCompressed = settings.refPrefix + encodeRefInt(bestMatch.distance, 2, settings) + encodeRefLength(bestMatch.length, settings);
      pos += bestMatch.length;
    } else {
      if (source.charAt(pos) !== settings.refPrefix) {
        newCompressed = source.charAt(pos);
      } else {
        newCompressed = settings.refPrefix + settings.refPrefix;
      }
      pos++;
    }
    compressed += newCompressed;
  }
  return compressed + source.slice(pos).replace(/`/g, '``');
}

/**
 * Decompress a string using LZ77 algorithm.
 * @param source The compressed string to decompress.
 * @param params Optional settings to override defaults.
 * @returns The decompressed string, or false if input is not a string.
 */
export function decompress(source: string, params?: Partial<LZ77Settings>): string | false {
  if (Object.prototype.toString.call(source) !== '[object String]') return false;
  let out: string[] = [];
  let pos = 0;
  let currentChar: string, nextChar: string, distance: number, length: number;
  const settings = setup(params);
  while (pos < source.length) {
    currentChar = source.charAt(pos);
    if (currentChar !== settings.refPrefix) {
      out.push(currentChar);
      pos++;
    } else {
      nextChar = source.charAt(pos + 1);
      if (nextChar !== settings.refPrefix) {
        distance = decodeRefInt(source.substr(pos + 1, 2), 2, settings);
        length = decodeRefLength(source.charAt(pos + 3), settings);
        const start = out.length - distance;
        for (let i = 0; i < length; i++) {
          out.push(out[start + i]);
        }
        pos += settings.minStringLength - 1;
      } else {
        out.push(settings.refPrefix);
        pos += 2;
      }
    }
  }
  return out.join('');
}

/**
 * Legacy decompress: string concatenation version (for benchmarking)
 */
export function decompressLegacy(source: string, params?: Partial<LZ77Settings>): string | false {
  if (Object.prototype.toString.call(source) !== '[object String]') return false;
  let decompressed = '';
  let pos = 0;
  let currentChar: string, nextChar: string, distance: number, length: number;
  const settings = setup(params);
  while (pos < source.length) {
    currentChar = source.charAt(pos);
    if (currentChar !== settings.refPrefix) {
      decompressed += currentChar;
      pos++;
    } else {
      nextChar = source.charAt(pos + 1);
      if (nextChar !== settings.refPrefix) {
        distance = decodeRefInt(source.substr(pos + 1, 2), 2, settings);
        length = decodeRefLength(source.charAt(pos + 3), settings);
        const start = decompressed.length - distance;
        for (let i = 0; i < length; i++) {
          decompressed += decompressed.charAt(start + i);
        }
        pos += settings.minStringLength - 1;
      } else {
        decompressed += settings.refPrefix;
        pos += 2;
      }
    }
  }
  return decompressed;
}

// Export the rolling hash version as compressRollingHash
export function compressRollingHash(source: string, params?: Partial<LZ77Settings>): string | false {
  if (Object.prototype.toString.call(source) !== '[object String]') return false;
  const settings = setup(params);
  const windowLength = settings.windowLength || settings.defaultWindow;
  if (windowLength > (settings.maxWindow as number)) throw new Error('Window length too large');
  let compressed = '';
  let pos = 0;
  const lastPos = source.length - settings.minStringLength;
  const hashTable: Map<number, number[]> = new Map();
  const minLen = settings.minStringLength;
  const maxLen = settings.maxStringLength as number;
  let prevHash: number | undefined = undefined;
  while (pos < lastPos) {
    const windowStart = Math.max(pos - windowLength, 0);
    let bestMatch = { distance: settings.maxStringDistance as number, length: 0 };
    let newCompressed: string | null = null;
    let hash: number | undefined = undefined;
    if (pos + minLen <= source.length) {
      if (prevHash === undefined) {
        hash = rollingHash(source, pos, minLen);
      } else {
        hash = rollingHash(
          source,
          pos,
          minLen,
          prevHash,
          source.charAt(pos - 1),
          source.charAt(pos + minLen - 1)
        );
      }
      prevHash = hash;
      const candidates = hashTable.get(hash) || [];
      for (let i = candidates.length - 1; i >= 0; i--) {
        const candidatePos = candidates[i];
        if (candidatePos < windowStart) break;
        let matchLength = minLen;
        while (
          matchLength < maxLen &&
          source.charAt(candidatePos + matchLength) === source.charAt(pos + matchLength)
        ) {
          matchLength++;
        }
        if (matchLength > bestMatch.length) {
          bestMatch.distance = pos - candidatePos;
          bestMatch.length = matchLength;
        }
      }
      if (!hashTable.has(hash)) hashTable.set(hash, []);
      hashTable.get(hash)!.push(pos);
    } else {
      prevHash = undefined;
    }
    if (bestMatch.length) {
      newCompressed = settings.refPrefix + encodeRefInt(bestMatch.distance, 2, settings) + encodeRefLength(bestMatch.length, settings);
      pos += bestMatch.length;
      prevHash = undefined;
    } else {
      if (source.charAt(pos) !== settings.refPrefix) {
        newCompressed = source.charAt(pos);
      } else {
        newCompressed = settings.refPrefix + settings.refPrefix;
      }
      pos++;
    }
    compressed += newCompressed;
  }
  return compressed + source.slice(pos).replace(/`/g, '``');
}

/**
 * Hybrid LZ77 compressor: uses hash table for fast match search, but falls back to full window scan for correctness.
 * This ensures full LZ77 round-trip safety, with performance close to the hash table method for most inputs.
 */
export function compressHybrid(source: string, params?: Partial<LZ77Settings>): string | false {
  if (Object.prototype.toString.call(source) !== '[object String]') return false;
  const settings = setup(params);
  const windowLength = settings.windowLength || settings.defaultWindow;
  if (windowLength > (settings.maxWindow as number)) throw new Error('Window length too large');
  let compressed = '';
  let pos = 0;
  const lastPos = source.length - settings.minStringLength;
  const hashTable: Map<string, number[]> = new Map();
  const minLen = settings.minStringLength;
  const maxLen = settings.maxStringLength as number;
  while (pos < lastPos) {
    const windowStart = Math.max(pos - windowLength, 0);
    let bestMatch = { distance: settings.maxStringDistance as number, length: 0 };
    let newCompressed: string | null = null;
    if (pos + minLen <= source.length) {
      // Hash table search
      const hash = hashSubstring(source, pos, minLen);
      const candidates = hashTable.get(hash) || [];
      for (let i = candidates.length - 1; i >= 0; i--) {
        const candidatePos = candidates[i];
        if (candidatePos < windowStart) break;
        let matchLength = minLen;
        while (
          candidatePos + matchLength < pos &&
          matchLength < maxLen &&
          source.substr(candidatePos, matchLength) === source.substr(pos, matchLength)
        ) {
          matchLength++;
        }
        // After loop, matchLength is one past the last valid match
        let realMatchLength = matchLength - 1;
        if (realMatchLength >= minLen && realMatchLength > bestMatch.length) {
          bestMatch.distance = pos - candidatePos;
          bestMatch.length = realMatchLength;
        }
      }
      if (!hashTable.has(hash)) hashTable.set(hash, []);
      hashTable.get(hash)!.push(pos);
    }
    // Always do the window scan for longest match
    for (let candidatePos = windowStart; candidatePos < pos; candidatePos++) {
      let matchLength = minLen;
      while (
        candidatePos + matchLength < pos &&
        matchLength < maxLen &&
        source.substr(candidatePos, matchLength) === source.substr(pos, matchLength)
      ) {
        matchLength++;
      }
      let realMatchLength = matchLength - 1;
      if (realMatchLength >= minLen && realMatchLength > bestMatch.length) {
        bestMatch.distance = pos - candidatePos;
        bestMatch.length = realMatchLength;
      }
    }
    if (bestMatch.length) {
      newCompressed = settings.refPrefix + encodeRefInt(bestMatch.distance, 2, settings) + encodeRefLength(bestMatch.length, settings);
      pos += bestMatch.length;
    } else {
      if (source.charAt(pos) !== settings.refPrefix) {
        newCompressed = source.charAt(pos);
      } else {
        newCompressed = settings.refPrefix + settings.refPrefix;
      }
      pos++;
    }
    compressed += newCompressed;
  }
  return compressed + source.slice(pos).replace(/`/g, '``');
}

// Make compressHybrid the default compress
export { compressHybrid as compress };
