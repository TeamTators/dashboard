import path from 'path';
import { fileTree, type FileTree } from '../src/lib/server/utils/files.ts';
import fs from 'fs/promises';

export default async () => {
	const res = await fileTree(path.resolve(process.cwd(), 'src', 'routes')).unwrap();

	const paths = new Set<string>();

	const walk = (tree: FileTree) => {
		if (tree.type === 'file') {
			// Replace all [anything] with *
			// Replace all [...anything] with **
			paths.add(
				'/' +
					path.dirname(
						path.relative(
							path.resolve(process.cwd(), 'src', 'routes'),
							tree.fullPath.replace(/\/\[(.*?)\]/g, '/*/').replace(/\/\.\.\.(.*?)\//g, '/**/')
						)
					)
			);
		} else {
			for (const child of tree.children || []) {
				walk(child);
			}
		}
	};

	walk(res);

	paths.delete('/.');

	fs.mkdir(path.resolve(process.cwd(), 'private'), { recursive: true }).catch(() => {});

	await fs.writeFile(
		path.resolve(process.cwd(), 'private', 'route-tree.txt'),
		Array.from(paths).sort().join('\n'),
		'utf-8'
	);
};
