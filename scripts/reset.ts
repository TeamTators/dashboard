import { Struct } from 'drizzle-struct';
import { openStructs } from '../src/lib/server/cli/struct';

export default async () => {
	await openStructs();
	await Promise.all(Array.from(Struct.structs).map(([, s]) => s.clear()));

	console.log('Structs cleared');
	process.exit(0);
};
