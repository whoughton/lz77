// LZ77: A minimal LZ77 [de]compressor (TypeScript version)

interface LZ77Settings {
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

/**
 * Compress a string using LZ77 algorithm.
 * @param source The source string to compress.
 * @param params Optional settings to override defaults.
 * @returns The compressed string, or false if input is not a string.
 */
export function compress(source: string, params?: Partial<LZ77Settings>): string | false {
  if (Object.prototype.toString.call(source) !== '[object String]') return false;
  const settings = setup(params);
  const windowLength = settings.windowLength || settings.defaultWindow;
  if (windowLength > (settings.maxWindow as number)) throw new Error('Window length too large');
  let compressed = '';
  let pos = 0;
  const lastPos = source.length - settings.minStringLength;
  while (pos < lastPos) {
    let searchStart = Math.max(pos - windowLength, 0);
    let matchLength = settings.minStringLength;
    let foundMatch = false;
    let bestMatch = {
      distance: settings.maxStringDistance as number,
      length: 0
    };
    let newCompressed: string | null = null;
    let isValidMatch: boolean;
    let realMatchLength: number;
    while ((searchStart + matchLength) < pos) {
      isValidMatch = (source.substr(searchStart, matchLength) === source.substr(pos, matchLength)) && (matchLength < (settings.maxStringLength as number));
      if (isValidMatch) {
        matchLength++;
        foundMatch = true;
      } else {
        realMatchLength = matchLength - 1;
        if (foundMatch && (realMatchLength > bestMatch.length)) {
          bestMatch.distance = pos - searchStart - realMatchLength;
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

/**
 * Decompress a string using LZ77 algorithm.
 * @param source The compressed string to decompress.
 * @param params Optional settings to override defaults.
 * @returns The decompressed string, or false if input is not a string.
 */
export function decompress(source: string, params?: Partial<LZ77Settings>): string | false {
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
        decompressed += decompressed.substr(decompressed.length - distance - length, length);
        pos += settings.minStringLength - 1;
      } else {
        decompressed += settings.refPrefix;
        pos += 2;
      }
    }
  }
  return decompressed;
} 