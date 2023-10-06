
/**
 * A function for converting hex <-> dec w/o loss of precision.
 * https://www.danvk.org/hex2dec.html
 *
 * The problem is that parseInt("0x12345...") isn't precise enough to convert
 * 64-bit integers correctly.
 *
 * Internally, this uses arrays to encode decimal digits starting with the least
 * significant:
 * 8 = [8]
 * 16 = [6, 1]
 * 1024 = [4, 2, 0, 1]
 */

// Adds two arrays for the given base (10 or 16), returning the result.
// This turns out to be the only "primitive" operation we need.
function add(x: number[], y: number[], base: number) {
    let z = [];
    let n = Math.max(x.length, y.length);
    let carry = 0;
    let i = 0;
    while (i < n || carry) {
        let xi = i < x.length ? x[i] : 0;
        let yi = i < y.length ? y[i] : 0;
        let zi = carry + xi + yi;
        z.push(zi % base);
        carry = Math.floor(zi / base);
        i++;
    }
    return z;
}

// Returns a*x, where x is an array of decimal digits and a is an ordinary
// JavaScript number. base is the number base of the array x.
function multiplyByNumber(num: number, x: number[], base: number) {
    if (num < 0) return [];
    if (num == 0) return [];

    let result: number[] = [];
    let power = x;
    while (true) {
        if (num & 1) {
            result = add(result, power, base);
        }
        num = num >> 1;
        if (num === 0) break;
        power = add(power, power, base);
    }

    return result;
}

function parseToDigitsArray(str: string, base: number) {
    let digits = str.split('');
    let ary = [];
    for (let i = digits.length - 1; i >= 0; i--) {
        let n = parseInt(digits[i], base);
        if (isNaN(n)) return null;
        ary.push(n);
    }
    return ary;
}

function convertBase(str: string, fromBase: number, toBase: number) {
    let digits = parseToDigitsArray(str, fromBase);
    if (digits === null) return null;

    let outArray: number[] = [];
    let power = [1];
    for (let i = 0; i < digits.length; i++) {
        // inletiant: at this point, fromBase^i = power
        if (digits[i]) {
            outArray = add(outArray, multiplyByNumber(digits[i], power, toBase), toBase);
        }
        power = multiplyByNumber(fromBase, power, toBase);
    }

    let out = '';
    for (let i = outArray.length - 1; i >= 0; i--) {
        out += outArray[i].toString(toBase);
    }
    return out;
}

export const decToHex = (decStr: string) => {
    let hex = convertBase(decStr, 10, 16);
    return hex ? hex.toUpperCase() : null;
}

export const hexToDec = (hexStr: string) => {
    if (hexStr.substring(0, 2) === '0x') hexStr = hexStr.substring(2);
    hexStr = hexStr.toLowerCase();
    return convertBase(hexStr, 16, 10);
}

