import { Scouting } from '$lib/server/structs/scouting';
import { Event } from '$lib/server/utils/tba.js';
import { dateTime } from 'ts-utils/clock';

export const GET = async (event) => {
	// auth(event);
	const comments = await Scouting.TeamComments.get(
		{ eventKey: event.params.eventKey },
		{
			type: 'stream'
		}
	)
		.await()
		.unwrap();

	const e = await Event.getEvent(event.params.eventKey).unwrap();
	const teams = await e.getTeams().unwrap();

	const headers = ['Team Number', 'Team Name', 'Comment', 'Type', 'Account', 'Date', 'Match'];

	const res = await Promise.all(
		comments.map(async (c) => {
			const row = [
				c.data.team,
				teams.find((t) => t.tba.team_number === c.data.team)?.tba.nickname,
				c.data.comment,
				c.data.type,
				c.data.scoutUsername,
				dateTime(new Date(c.data.updated))
			];

			const scouting = await Scouting.MatchScouting.fromId(c.data.matchScoutingId).unwrap();

			if (scouting) {
				row.push(scouting.data.compLevel + ' ' + scouting.data.matchNumber);
			} else {
				row.push('N/A');
			}
			return row;
		})
	);

	res.unshift(headers);

	return new Response(
		JSON.stringify({
			comments: res
		})
	);
};
