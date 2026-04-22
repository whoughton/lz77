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
  refIntCeilCode: number;
  maxStringDistance: number;
  minStringLength: number;
  maxStringLength: number;
  defaultWindow: number;
  maxWindow: number;
  windowLength?: number;
  maxDecompressedSize?: number;
}

const defaultSettings: LZ77Settings = {
  refPrefix: '`',
  refIntBase: 96,
  refIntFloorCode: ' '.charCodeAt(0),
  refIntCeilCode: 0,
  maxStringDistance: 0,
  minStringLength: 5,
  maxStringLength: 0,
  defaultWindow: 144,
  maxWindow: 0,
  windowLength: undefined,
  maxDecompressedSize: undefined
};

function setup(params: Partial<LZ77Settings> = {}): LZ77Settings {
  const settings: LZ77Settings = { ...defaultSettings, ...params };
  if (settings.refPrefix.length !== 1) {
    throw new Error('refPrefix must be a single character');
  }
  settings.refIntCeilCode = settings.refIntFloorCode + settings.refIntBase - 1;
  settings.maxStringDistance = Math.pow(settings.refIntBase, 2) - 1;
  settings.maxStringLength = Math.pow(settings.refIntBase, 1) - 2 + settings.minStringLength;
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

function decodeRefInt(data: string, width: number, settings: LZ77Settings): number | null {
  if (data.length < width) return null;
  let value = 0;
  let charCode;
  for (let i = 0; i < width; i++) {
    value *= settings.refIntBase;
    charCode = data.charCodeAt(i);
    if (charCode >= settings.refIntFloorCode && charCode <= settings.refIntCeilCode) {
      value += charCode - settings.refIntFloorCode;
    } else {
      return null;
    }
  }
  return value;
}

function decodeRefLength(data: string, settings: LZ77Settings): number | null {
  const refInt = decodeRefInt(data, 1, settings);
  if (refInt === null) return null;
  return refInt + settings.minStringLength;
}

// Helper: Rabin-Karp rolling hash for substrings of length minStringLength
function rollingHash(str: string, pos: number, len: number, prevHash?: number, prevChar?: string, nextChar?: string, basePower?: number): number {
  const base = 256;
  const mod = 2 ** 31 - 1;
  if (prevHash === undefined) {
    let hash = 0;
    for (let i = 0; i < len; i++) {
      hash = (hash * base + str.charCodeAt(pos + i)) % mod;
    }
    return hash;
  } else {
    if (prevChar === undefined || nextChar === undefined) {
      throw new Error('Rolling hash update requires prevChar and nextChar');
    }
    // Use modular multiplication to avoid precision loss for large basePower values.
    // Instead of (prevChar * basePower) % mod, compute (prevChar mod mod) * (basePower mod mod) mod mod
    // using Number arithmetic since both operands are < mod after reduction.
    const power = basePower ?? Math.pow(base, len - 1);
    const powerMod = power % mod;
    const prevCharMod = prevChar.charCodeAt(0) % mod;
    // Multiply using Number — both factors < mod < 2^31, product < 2^62 which is safe
    const subtrahend = (prevCharMod * powerMod) % mod;
    let hash = (prevHash - subtrahend + mod) % mod;
    hash = (hash * base + nextChar.charCodeAt(0)) % mod;
    return hash;
  }
}

// Helper: Hash a substring of length minStringLength (for hash-table, non-rolling version)
function hashSubstring(str: string, pos: number, len: number): string {
  return str.substring(pos, pos + len);
}

/**
 * Compress a string using LZ77 algorithm.
 * @param source The source string to compress.
 * @param params Optional settings to override defaults.
 * @returns The compressed string, or false if input is not a string.
 */
export function compressHash(source: string, params?: Partial<LZ77Settings>): string | false {
  if (typeof source !== 'string') return false;
  const settings = setup(params);
  const windowLength = settings.windowLength || settings.defaultWindow;
  if (windowLength > settings.maxWindow) throw new Error('Window length too large');
  const compressed: string[] = [];
  let pos = 0;
  const lastPos = source.length - settings.minStringLength;
  const hashTable: Map<string, number[]> = new Map();
  const minLen = settings.minStringLength;
  const maxLen = settings.maxStringLength;
  while (pos < lastPos) {
    const windowStart = Math.max(pos - windowLength, 0);
    let bestMatch = { distance: settings.maxStringDistance, length: 0 };
    let newCompressed: string | null = null;
    if (pos + minLen <= source.length) {
      const hash = hashSubstring(source, pos, minLen);
      const candidates = hashTable.get(hash);
      if (candidates) {
        for (let i = candidates.length - 1; i >= 0; i--) {
          const candidatePos = candidates[i];
          if (candidatePos < windowStart) break;
          let matchLength = minLen;
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
        candidates.push(pos);
      } else {
        hashTable.set(hash, [pos]);
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
    compressed.push(newCompressed);
  }
  return compressed.join('') + source.slice(pos).replace(/`/g, '``');
}

/**
 * Decompress a string using LZ77 algorithm.
 * @param source The compressed string to decompress.
 * @param params Optional settings to override defaults.
 * @returns The decompressed string, or false if input is invalid or malformed.
 */
export function decompress(source: string, params?: Partial<LZ77Settings>): string | false {
  if (typeof source !== 'string') return false;
  const settings = setup(params);
  const maxSize = settings.maxDecompressedSize ?? Infinity;
  let out: string[] = [];
  let pos = 0;
  while (pos < source.length) {
    const currentChar = source.charAt(pos);
    if (currentChar !== settings.refPrefix) {
      if (out.length >= maxSize) return false;
      out.push(currentChar);
      pos++;
    } else {
      if (pos + 1 >= source.length) return false;
      const nextChar = source.charAt(pos + 1);
      if (nextChar !== settings.refPrefix) {
        if (pos + 3 >= source.length) return false;
        const distance = decodeRefInt(source.substring(pos + 1, pos + 3), 2, settings);
        const length = decodeRefLength(source.charAt(pos + 3), settings);
        if (distance === null || length === null) return false;
        if (distance > out.length || distance < 1) return false;
        if (out.length + length > maxSize) return false;
        const start = out.length - distance;
        for (let i = 0; i < length; i++) {
          out.push(out[start + i]);
        }
        pos += 4;
      } else {
        if (out.length >= maxSize) return false;
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
  if (typeof source !== 'string') return false;
  const settings = setup(params);
  const maxSize = settings.maxDecompressedSize ?? Infinity;
  let decompressed = '';
  let pos = 0;
  while (pos < source.length) {
    const currentChar = source.charAt(pos);
    if (currentChar !== settings.refPrefix) {
      if (decompressed.length >= maxSize) return false;
      decompressed += currentChar;
      pos++;
    } else {
      if (pos + 1 >= source.length) return false;
      const nextChar = source.charAt(pos + 1);
      if (nextChar !== settings.refPrefix) {
        if (pos + 3 >= source.length) return false;
        const distance = decodeRefInt(source.substring(pos + 1, pos + 3), 2, settings);
        const length = decodeRefLength(source.charAt(pos + 3), settings);
        if (distance === null || length === null) return false;
        if (distance > decompressed.length || distance < 1) return false;
        if (decompressed.length + length > maxSize) return false;
        const start = decompressed.length - distance;
        for (let i = 0; i < length; i++) {
          decompressed += decompressed.charAt(start + i);
        }
        pos += 4;
      } else {
        if (decompressed.length >= maxSize) return false;
        decompressed += settings.refPrefix;
        pos += 2;
      }
    }
  }
  return decompressed;
}

// Export the rolling hash version as compressRollingHash
export function compressRollingHash(source: string, params?: Partial<LZ77Settings>): string | false {
  if (typeof source !== 'string') return false;
  const settings = setup(params);
  const windowLength = settings.windowLength || settings.defaultWindow;
  if (windowLength > settings.maxWindow) throw new Error('Window length too large');
  const compressed: string[] = [];
  let pos = 0;
  const lastPos = source.length - settings.minStringLength;
  const hashTable: Map<number, number[]> = new Map();
  const minLen = settings.minStringLength;
  const maxLen = settings.maxStringLength;
  const basePower = Math.pow(256, minLen - 1) % (2 ** 31 - 1);
  let prevHash: number | undefined = undefined;
  while (pos < lastPos) {
    const windowStart = Math.max(pos - windowLength, 0);
    let bestMatch = { distance: settings.maxStringDistance, length: 0 };
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
          source.charAt(pos + minLen - 1),
          basePower
        );
      }
      prevHash = hash;
      const candidates = hashTable.get(hash);
      if (candidates) {
        for (let i = candidates.length - 1; i >= 0; i--) {
          const candidatePos = candidates[i];
          if (candidatePos < windowStart) break;
          let matchLength = minLen;
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
        candidates.push(pos);
      } else {
        hashTable.set(hash, [pos]);
      }
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
    compressed.push(newCompressed);
  }
  return compressed.join('') + source.slice(pos).replace(/`/g, '``');
}

/**
 * LZ77 compressor using hash table match search.
 * Finds all matches via hash table indexing for O(N) amortized performance.
 */
export function compressHybrid(source: string, params?: Partial<LZ77Settings>): string | false {
  if (typeof source !== 'string') return false;
  const settings = setup(params);
  const windowLength = settings.windowLength || settings.defaultWindow;
  if (windowLength > settings.maxWindow) throw new Error('Window length too large');
  const compressed: string[] = [];
  let pos = 0;
  const lastPos = source.length - settings.minStringLength;
  const hashTable: Map<string, number[]> = new Map();
  const minLen = settings.minStringLength;
  const maxLen = settings.maxStringLength;
  while (pos < lastPos) {
    const windowStart = Math.max(pos - windowLength, 0);
    let bestMatch = { distance: settings.maxStringDistance, length: 0 };
    let newCompressed: string | null = null;
    if (pos + minLen <= source.length) {
      const hash = hashSubstring(source, pos, minLen);
      const candidates = hashTable.get(hash);
      if (candidates) {
        for (let i = candidates.length - 1; i >= 0; i--) {
          const candidatePos = candidates[i];
          if (candidatePos < windowStart) break;
          let matchLength = minLen;
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
        candidates.push(pos);
      } else {
        hashTable.set(hash, [pos]);
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
    compressed.push(newCompressed);
  }
  return compressed.join('') + source.slice(pos).replace(/`/g, '``');
}

// Make compressHybrid the default compress
export { compressHybrid as compress };

export { setup, encodeRefInt, encodeRefLength, decodeRefInt, decodeRefLength };
