// lz77 - BSD 2-Clause License - Copyright (c) 2024 Weston Houghton
// Legacy LZ77 compress implementation for benchmarking
//
// Note: compressHashTable intentionally omits the overlap guard (candidatePos + matchLength < pos)
// that the index.ts compressors include. This allows overlapping back-references, which produces
// better compression ratios on highly repetitive input. The decompressor handles overlapping
// matches correctly, so round-trips are safe. This also means compressHashTable may produce
// different compressed output than compressHash/compressRollingHash for the same input.

import { setup, encodeRefInt, encodeRefLength, escapeTail } from './index';

export function compressHashTable(source: string, params?: Parameters<typeof setup>[0]): string | false {
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
      const hash = source.substring(pos, pos + minLen);
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
      if (candidates.length) {
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
    compressed += newCompressed;
  }
  return compressed + escapeTail(source, pos, settings);
}

export function compressLegacy(source: string, params?: Parameters<typeof setup>[0]): string | false {
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
      isValidMatch = (source.substring(searchStart, searchStart + matchLength) === source.substring(pos, pos + matchLength)) && (matchLength < settings.maxStringLength);
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
  return compressed + escapeTail(source, pos, settings);
}