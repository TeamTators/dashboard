import { Scouting } from '$lib/server/structs/scouting.js';
import { Event } from '$lib/server/utils/tba.js';
import { redirect } from '@sveltejs/kit';
import { ServerCode } from 'ts-utils/status';

export const load = async (event) => {
	if (!event.locals.account) throw redirect(ServerCode.temporaryRedirect, '/account/sign-in');
	const { eventKey, section } = event.params;

	const sections = (
		await Scouting.PIT.Sections.fromProperty('eventKey', eventKey, {
			type: 'stream'
		}).await()
	)
		.unwrap()
		.sort((a, b) => a.data.order - b.data.order);

	const s = sections[parseInt(section)];

	if (!s) throw redirect(ServerCode.permanentRedirect, `/status/404?url=${event.url.href}`);

	const e = (await Event.getEvent(eventKey)).unwrap();
	const teams = (await e.getTeams()).unwrap();
	const team = teams.find((t) => t.tba.team_number === parseInt(event.params.team));
	if (!team) throw redirect(ServerCode.permanentRedirect, `/status/404?url=${event.url.href}`);

	const info = (await Scouting.PIT.getScoutingInfoFromSection(parseInt(event.params.team), s)).unwrap();
	return {
		section: s.safe(),
		eventKey,
		sections: sections.map((s) => s.safe()),
		teams: teams.map((t) => t.tba),
		team: team.tba,
		sectionIndex: parseInt(section),
		event: e.tba,
		questions: info.questions.map(q => q.safe()),
		answers: info.answers.map(a => a.safe()),
		groups: info.groups.map(g => g.safe()),
	};
};
