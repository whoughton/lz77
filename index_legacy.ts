// lz77 - BSD 2-Clause License - Copyright (c) 2024 Weston Houghton
// Legacy LZ77 compress implementation for benchmarking

interface LZ77Settings {
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
  windowLength: undefined
};

function setup(params: Partial<LZ77Settings> = {}): LZ77Settings {
  const settings: LZ77Settings = { ...defaultSettings, ...params };
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

// Helper: Hash a substring of length minStringLength (for hash-table, non-rolling version)
function hashSubstring(str: string, pos: number, len: number): string {
  return str.substr(pos, len);
}

export function compressHashTable(source: string, params?: Partial<LZ77Settings>): string | false {
  if (typeof source !== 'string') return false;
  const settings = setup(params);
  const windowLength = settings.windowLength || settings.defaultWindow;
  if (windowLength > settings.maxWindow) throw new Error('Window length too large');
  let compressed = '';
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
      const candidates2 = hashTable.get(hash);
      if (!candidates2) {
        hashTable.set(hash, [pos]);
      } else {
        candidates2.push(pos);
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

export function compressLegacy(source: string, params?: Partial<LZ77Settings>): string | false {
  if (typeof source !== 'string') return false;
  const settings = setup(params);
  const windowLength = settings.windowLength || settings.defaultWindow;
  if (windowLength > settings.maxWindow) throw new Error('Window length too large');
  let compressed = '';
  let pos = 0;
  const lastPos = source.length - settings.minStringLength;
  while (pos < lastPos) {
    let searchStart = Math.max(pos - windowLength, 0);
    let matchLength = settings.minStringLength;
    let foundMatch = false;
    let bestMatch = {
      distance: settings.maxStringDistance,
      length: 0
    };
    let newCompressed: string | null = null;
    let isValidMatch: boolean;
    let realMatchLength: number;
    while ((searchStart + matchLength) < pos) {
      isValidMatch = (source.substr(searchStart, matchLength) === source.substr(pos, matchLength)) && (matchLength < settings.maxStringLength);
      if (isValidMatch) {
        matchLength++;
        foundMatch = true;
      } else {
        realMatchLength = matchLength - 1;
        if (foundMatch && (realMatchLength > bestMatch.length)) {
          bestMatch.distance = pos - searchStart;
          bestMatch.length = realMatchLength;
        }
        matchLength = settings.minStringLength;
        searchStart++;
        foundMatch = false;
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