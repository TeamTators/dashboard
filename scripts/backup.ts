import path from 'path';
import fs from 'fs';
import { openStructs } from '../src/lib/server/cli/struct';
import { DB } from '../src/lib/server/db';
import { Struct } from 'drizzle-struct/back-end';
import AdmZip from 'adm-zip';
import { prompt } from '../src/lib/server/cli/utils';
import { toSnakeCase } from 'ts-utils/text';

export const BACKUP_DIR = path.join(process.cwd(), 'backups');

export default async (name?: string) => {
	if (!fs.existsSync(BACKUP_DIR)) {
		await fs.promises.mkdir(BACKUP_DIR, { recursive: true });
	}

	try {
		(await openStructs()).unwrap();
		(await Struct.buildAll(DB)).unwrap();
	} catch (error) {
		if (error instanceof Error) {
			if (!error.message.includes('already been built')) {
				throw error;
			}
		}
	}

	if (!name) {
		name =
			(
				await prompt({
					message: 'Enter the name of the backup'
				})
			).unwrap() || 'unnamed';
	}

	const promises: Promise<unknown>[] = [];

	const filename = Date.now() + '-' + toSnakeCase(name);

	Struct.each((s) => promises.push(s.backup(path.join(BACKUP_DIR, filename))));

	// console.log(
	await Promise.all(promises);
	// );

	const zip = new AdmZip();
	const files = fs.readdirSync(path.join(BACKUP_DIR, filename));

	for (const file of files) {
		zip.addLocalFile(path.join(BACKUP_DIR, filename, file));
	}

	await new Promise((res) => zip.writeZip(path.join(BACKUP_DIR, `${filename}.zip`), res));

	await fs.promises.rm(path.join(BACKUP_DIR, filename), { recursive: true });
};
