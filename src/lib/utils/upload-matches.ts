import { attempt, attemptAsync, type Result } from 'ts-utils/check';
import { notify } from "$lib/utils/prompts";
import { TraceSchema } from 'tatorscout/trace';
import { z } from 'zod';
import { loadFiles } from '$lib/utils/downloads';

const CACHE_VERSION = 'v2';

export const MatchSchema = z.object({
	trace: TraceSchema,
	eventKey: z.string(),
	match: z.number().int(),
	team: z.number().int(),
	compLevel: z.enum(['pr', 'qm', 'qf', 'sf', 'f']),
	flipX: z.boolean(),
	flipY: z.boolean(),
	checks: z.array(z.string()),
	comments: z.record(z.string()),
	scout: z.string(),
	prescouting: z.boolean(),
	practice: z.boolean(),
	alliance: z.union([z.literal('red'), z.literal('blue'), z.literal(null)]),
	group: z.number().int(),
	sliders: z.record(
		z.string(),
		z.object({
			value: z.number().int().min(0).max(5),
			text: z.string(),
			color: z.string()
		})
	)
});
export type MatchSchemaType = z.infer<typeof MatchSchema>;

const post = async (url: string, body: unknown) => {
	return attemptAsync(async () => {
		const res = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(body)
		});

		if (!res.ok) throw new Error('Failed to post data');
		return res.json();
	});
};

export const downloadUrl = async (text: string, filename: string) => {
	return attempt(() => {
        const url = window.URL.createObjectURL(new Blob([text]));
		console.log(url);
		const element = document.createElement('a');
		element.setAttribute('href', url);
		element.setAttribute('download', filename);
		element.style.display = 'none';
		document.body.appendChild(element);
		element.click();
		document.body.removeChild(element);
	});
};

export const loadFileContents = (): Promise<
	Result<
		{
			name: string;
			text: string;
		}[]
	>
> => {
	return attemptAsync(async () => {
		const res = await loadFiles();
		if (res.isOk()) {
			const files = Array.from(res.value);

			const contents = await Promise.all(
				files.map(async (file) => {
					const text = await file.text();
					if (!text) {
						throw new Error(`File ${file.name} is empty`);
					}
					return { name: file.name, text };
				})
			);

			return contents;
		}
		throw res.error;
	});
};

const downloadMatch = (data: MatchSchemaType) => {
    return downloadUrl(
        JSON.stringify(data),
        `${data.eventKey}:${data.compLevel}:${data.match}:${data.team}.${CACHE_VERSION}.match`
    );
};

export const uploadMatch = () => {
    return attemptAsync(async () => {
        const matches = (await loadFileContents()).unwrap();
        // it would probably be a good idea to have this filter,
        // but because we are dealing with duplicates and files save as .txt,
        // I'm getting rid of it.
        // .filter((f) => f.name.endsWith(`.${CACHE_VERSION}.match`));
        return Promise.all(
            matches.map(async (m) => {
                const parsed = MatchSchema.safeParse(JSON.parse(m.text));
                if (parsed.success) {
                    return (await submitMatch(parsed.data, false)).unwrap();
                }
            })
        );
    });
};

export const submitMatch = (data: MatchSchemaType, download: boolean) => {
    return attemptAsync(async () => {
        if (download) (await downloadMatch(data)).unwrap();
        const res = await post('/event-server/submit-match', data);
        if (res.isOk()) {
            notify({
                title: 'Match Submitted',
                message: `Match ${data.eventKey}:${data.compLevel}${data.match} submitted successfully!`,
                color: 'success',
                autoHide: 3000
            });
        } else {
            notify({
                title: 'Match Submission Failed',
                message: `Match ${data.eventKey}:${data.compLevel}${data.match} failed to submit!`,
                color: 'danger',
                autoHide: 3000
            });
        }
    });
};