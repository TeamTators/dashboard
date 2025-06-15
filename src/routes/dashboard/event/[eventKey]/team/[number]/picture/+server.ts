import { json, error, fail } from '@sveltejs/kit';
import fs from 'fs/promises';
import path from 'path';
import { Permissions } from '$lib/server/structs/permissions';
import { ServerCode } from 'ts-utils/status';
import { Logs } from '$lib/server/structs/log.js';

const UPLOAD_DIR = path.resolve(process.cwd(), './static/uploads');

export async function POST(event) {
	if (!event.locals.account) throw fail(ServerCode.unauthorized);
	const roles = await Permissions.allAccountRoles(event.locals.account);
	if (roles.isErr()) throw fail(ServerCode.internalServerError);
	if (!Permissions.isEntitled(roles.value, 'view-tba-info')) throw fail(ServerCode.forbidden);

	const request = event.request;
	const formData = await request.formData();
	const file = formData.get('filepond') as File;

	if (!file) {
		return json({ error: 'No file uploaded' }, { status: 400 });
	}

	const arrayBuffer = await file.arrayBuffer();
	const buffer = Buffer.from(arrayBuffer);
	const fileId = `${Date.now()}-${file.name}`;
	const filePath = path.join(UPLOAD_DIR, fileId);
	await fs.mkdir(UPLOAD_DIR, { recursive: true });

	await fs.writeFile(filePath, buffer);

	return json({ fileId });
}

// export async function GET({ params }) {
//     const { fileId } = params;
//     const filePath = path.join(UPLOAD_DIR, fileId);

//     try {
//         const file = await fs.readFile(filePath);
//         return new Response(file, {
//             headers: {
//                 'Content-Type': 'application/octet-stream',
//                 'Content-Disposition': `inline; filename="${fileId}"`
//             }
//         });
//     } catch {
//         throw error(404, 'File not found');
//     }
// }
