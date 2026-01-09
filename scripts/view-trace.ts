import { Struct } from 'drizzle-struct/back-end';
import { Scouting } from '../src/lib/server/structs/scouting';
import { DB } from '../src/lib/server/db';
import { Trace } from 'tatorscout/trace';


const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
/**
 * Compresses a number into a 2-character base-52 string
 * Used for efficient storage of trace coordinates and timestamps
 * 
 * @param {number} num - Integer to compress (0-999)
 * @returns {string} 2-character compressed representation
 * @throws {Error} If input is not an integer
 * 
 * @example
 * ```typescript
 * compressNum(0)   // "AA"
 * compressNum(1)   // "AB" 
 * compressNum(52)  // "BA"
 * compressNum(999) // "SL"
 * ```
 */
const compressNum = (num: number) => {
    if (!Number.isInteger(num)) throw new Error(`Expected integer, got ${num}`);
    if (num < 0) num = 0;
    if (num > 999) num = 999;

    const base = chars.length;
    
    // Convert to base-52, ensuring exactly 2 characters
    const firstChar = chars[Math.floor(num / base)];
    const secondChar = chars[num % base];
    
    return firstChar + secondChar; // Always 2 characters: AA, AB, AC, ..., tZ
}

/**
 * Decompresses a 2-character base-52 string back to a number
 * Inverse operation of compressNum
 * 
 * @param {string} str - 2-character compressed string
 * @returns {number} Original number (0-999)
 * @throws {Error} If string is not exactly 2 characters or contains invalid characters
 * 
 * @example
 * ```typescript
 * decompressNum("AA") // 0
 * decompressNum("AB") // 1
 * decompressNum("BA") // 52
 * ```
 */
const decompressNum = (str: string) => {
    if (str.length !== 2) {
        throw new Error(`Expected 2 characters, got ${str.length}: ${str}`);
    }
    
    const base = chars.length;
    const firstCharIndex = chars.indexOf(str[0]);
    const secondCharIndex = chars.indexOf(str[1]);
    
    if (firstCharIndex === -1 || secondCharIndex === -1) {
        throw new Error(`Invalid characters in compressed string: ${str}`);
    }
    
    return firstCharIndex * base + secondCharIndex;
}

const c = (n: number) => {
    n = Math.min(Math.max(n, 0), 1);
    if (n === 1) return '999';
    if (n === 0) return '000';
    const [,str] = n.toString().split('.');
    return str.slice(0, 3);
}

const d = (num: number): number => {
    if (num.toString().length < 3) {
        return parseInt(num.toString().padStart(3, '0')) / 1000;
    } else {
        return num / 1000;
    }
};


export default async () => {
    // await Struct.buildAll(DB).unwrap();

    // const scoutings = await Scouting.MatchScouting.all({
    //     type: 'all',
    // }).unwrap();

    // const diff: {
    //     og: [number, number];
    //     new: [number, number];
    // }[] = [];

    // for (const s of scoutings) {
    //     const parsed = Trace.parse(s.data.trace).unwrap();
    //     const unparsed = parsed.serialize();
    //     const reparsed = Trace.parse(unparsed).unwrap();

    //     for (let i = 0; i < parsed.points.length; i++) {
    //         const p1 = parsed.points[i];
    //         const p2 = reparsed.points[i];

    //         const [, x1, y1] = p1;
    //         const [, x2, y2] = p2;

    //         if (x1 !== x2 || y1 !== y2) {
    //             diff.push({
    //                 og: [x1, y1],
    //                 new: [x2, y2],
    //             });
    //         }
    //     }
    // }

    // console.log('Differences:', diff);

    // console.log('Compression tests:');
    // for (let i = 0; i <= 999; i += 1) {
    //     const compressed = compressNum(i);
    //     const decompressed = decompressNum(compressed);
    //     console.log(`Original: ${i}, Compressed: "${compressed}", Decompressed: ${decompressed}`);
    // }

    for (let i = 0; i < 1; i += 0.001) {
        const converted = c(i);
        const compressed = compressNum(parseInt(converted));
        const decompressed = decompressNum(compressed);
        const final = d(decompressed);

        console.log(i, converted, compressed, decompressed, final);
    }
};