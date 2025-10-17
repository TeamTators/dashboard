import { Potato } from '$lib/server/structs/potato.js';

export const load = async (event) => {
	const limit = Math.abs(parseInt(event.url.searchParams.get('limit') || '100'));
	const page = Math.abs(parseInt(event.url.searchParams.get('page') || '1'));

	const offset = (page - 1) * limit;

	const logs = (
		await Potato.Log.all({
			type: 'array',
			limit,
			offset
		})
	).unwrap();

	const count = (
		await Potato.Log.all({
			type: 'count'
		})
	).unwrap();

	return {
		logs: logs.map((l) => l.safe()),
		limit,
		page,
		count
	};
};
