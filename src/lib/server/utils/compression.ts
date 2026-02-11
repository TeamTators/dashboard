/**
 * @fileoverview MessagePack + Brotli compression helpers.
 *
 * @description
 * Provides functions to compress arbitrary data to a Buffer and to decompress it back.
 */
import { encode, decode } from 'msgpackr';
import { attempt } from 'ts-utils';
import { brotliCompressSync, brotliDecompressSync } from 'zlib';

/**
 * Compress arbitrary data into a Brotli-compressed MessagePack buffer.
 *
 * @returns {ReturnType<typeof attempt>} Result wrapper containing the compressed buffer.
 */
export const compress = (data: unknown) => {
	return attempt(() => {
		const msgpacked = encode(data);
		return brotliCompressSync(msgpacked);
	});
};

/**
 * Decompress a Brotli-compressed MessagePack buffer.
 *
 * @returns {ReturnType<typeof attempt>} Result wrapper containing the decoded data.
 */
export const decompress = (compressed: Buffer) => {
	return attempt<unknown>(() => {
		const msgpacked = brotliDecompressSync(compressed);
		return decode(msgpacked);
	});
};
