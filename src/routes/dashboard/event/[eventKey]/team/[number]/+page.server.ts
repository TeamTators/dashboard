import { FIRST } from '$lib/server/structs/FIRST.js';
import { Scouting } from '$lib/server/structs/scouting.js';
import { and, eq } from 'drizzle-orm';
import * as TBA from '$lib/server/utils/tba';
import { fail, redirect } from '@sveltejs/kit';
import { ServerCode } from 'ts-utils/status';
import { TBAEvent, TBATeam } from '$lib/utils/tba.js';
import terminal from '$lib/server/utils/terminal';

export const load = async (event) => {
	if (!event.locals.account) throw redirect(ServerCode.temporaryRedirect, '/account/sign-in');
	const eventKey = event.params.eventKey;
	const number = parseInt(event.params.number);

	const e = await TBA.Event.getEvent(eventKey);
	if (e.isErr()) {
		terminal.error(e.error);
		throw fail(ServerCode.notFound, {
			message: 'Event not found'
		});
	}

	const teams = await e.value.getTeams();
	if (teams.isErr()) {
		terminal.error(teams.error);
		throw fail(ServerCode.internalServerError, {
			message: 'Failed to get teams'
		});
	}

	const team = teams.value.find((t) => t.tba.team_number === number);
	if (!team) {
		throw fail(ServerCode.notFound, {
			message: 'Team not found'
		});
	}

	const [scouting, comments, pitScouting, pictures] = await Promise.all([
		Scouting.getTeamScouting(team.tba.team_number, e.value.tba.key),
		Scouting.getTeamComments(team.tba.team_number, e.value.tba.key),
		Scouting.PIT.getScoutingInfo(team.tba.team_number, e.value.tba.key),
		FIRST.getTeamPictures(team.tba.team_number, e.value.tba.key)
	]);

	if (scouting.isErr()) {
		terminal.error(scouting.error);
		throw fail(ServerCode.internalServerError);
	}

	if (comments.isErr()) {
		terminal.error(comments.error);
		throw fail(ServerCode.internalServerError);
	}

	if (pitScouting.isErr()) {
		terminal.error(pitScouting.error);
		throw fail(ServerCode.internalServerError);
	}

	if (pictures.isErr()) {
		terminal.error(pictures.error);
		throw fail(ServerCode.internalServerError);
	}

	return {
		team: team.tba,
		teams: teams.value.map((t) => t.tba),
		event: e.value.tba,
		scouting: scouting.value.map((s) => s.safe()),
		comments: comments.value.map((c) => c.safe()),
		answers: pitScouting.value.answers.map((a) => a.safe()),
		questions: pitScouting.value.questions.map((q) => q.safe()),
		groups: pitScouting.value.groups.map((g) => g.safe()),
		sections: pitScouting.value.sections.map((s) => s.safe()),
		pictures: pictures.value.map((p) => p.safe())
	};
};
