import type { RequestHandler } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = path.resolve('static/uploads'); // Store files in the `static/uploads` folder

export const POST: RequestHandler = async ({ request }) => {
	const formData = await request.formData();
	const file = formData.get('file'); // Assuming 'files[]' is the field name used
	console.log('File:', file);

	if (file instanceof File) {
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);
		const storageKey = `TEST-${Date.now()}-${file.name}`;
		const uploadPath = path.join(UPLOAD_DIR, storageKey);
		fs.writeFileSync(uploadPath, buffer);
		console.log(`Saved file to ${uploadPath}`);
	}

	return new Response(
		JSON.stringify({
			uploadedFiles:
				file && file instanceof File
					? [
							{
								name: file.name,
								url: path.join(UPLOAD_DIR, `${Date.now()}-${file.name}`)
							}
						]
					: []
		}),
		{ headers: { 'Content-Type': 'application/json' } }
	);
};
