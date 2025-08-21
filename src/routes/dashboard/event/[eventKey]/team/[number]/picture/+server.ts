import { json, error, fail } from '@sveltejs/kit';
import fs from 'fs/promises';
import path from 'path';
import { Permissions } from '$lib/server/structs/permissions';
import { ServerCode } from 'ts-utils/status';
import { Logs } from '$lib/server/structs/log.js';
import { Account } from '$lib/server/structs/account.js';

const UPLOAD_DIR = path.resolve(process.cwd(), './static/uploads');

export async function POST(event) {
	console.log('Received POST request to upload files');
	if (!event.locals.account) throw fail(ServerCode.unauthorized);

	if (!(await Account.isAdmin(event.locals.account))) {
		throw fail(ServerCode.forbidden, {
			message: 'You do not have permission to upload files.'
		});
	}

	const request = event.request;
	const formData = await request.formData();
	const file = formData.get('file'); // Assuming 'files[]' is the field name used

	if (!file) {
		return json({ error: 'No file uploaded' }, { status: 400 });
	}

	await fs.mkdir(UPLOAD_DIR, { recursive: true });

	let fileId: string;

	if (file instanceof File) {
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);
		fileId = `${Date.now()}-${file.name}`;
		const filePath = path.join(UPLOAD_DIR, fileId);
		await fs.writeFile(filePath, buffer);
		console.log(`Saved file to ${filePath}`);
	} else {
		return json({ error: 'Invalid file uploaded' }, { status: 400 });
	}

	return json({ url: fileId });
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
