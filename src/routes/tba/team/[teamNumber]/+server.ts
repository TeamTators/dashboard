import { TBA } from '$lib/server/structs/TBA';
import { json } from '@sveltejs/kit';

export const GET = async (event) => {
	const res = await TBA.get(`/team/${event.params.teamNumber}`, {
		updateThreshold: 1000 * 60 * 60 * 24
	});

	if (res.isErr()) {
		return json(
			{
				error: 'Failed to load team data'
			},
			{
				status: 500
			}
		);
	}

	return json({
		team: res.value
	});
};