import { FIRST } from '$lib/server/structs/FIRST.js';
import { Scouting } from '$lib/server/structs/scouting.js';
import { Event } from '$lib/server/utils/tba.js';
import { fail, redirect } from '@sveltejs/kit';
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

    const s = sections.find(s => s.id === event.params.section)

    if (!s) throw fail(404);

    const e = (await Event.getEvent(eventKey)).unwrap();
    const teams = (await e.getTeams()).unwrap();
    const team = teams.find((t) => t.tba.team_number === parseInt(event.params.team));
    if (!team) throw fail(404);

    const info = (
        await Scouting.PIT.getScoutingInfoFromSection(
            parseInt(event.params.team),
            s,
            event.params.sessionId
        )
    ).unwrap();

    const pictures = (
        await FIRST.getTeamPictures(parseInt(event.params.team), event.params.eventKey)
    ).unwrap();
    return {
        section: s.safe(),
        eventKey,
        sections: sections.map((s) => s.safe()),
        teams: teams.map((t) => t.tba),
        team: team.tba,
        sectionIndex: parseInt(section),
        event: e.tba,
        questions: info.questions.map((q) => q.safe()),
        answers: info.answers.map((a) => ({
            answer: a.answer.safe(),
            account: a.account?.safe()
        })),
        groups: info.groups.map((g) => g.safe()),
        pictures: pictures.map((p) => p.safe()),
        session: event.params.sessionId,
    };
};
