import { DB } from '$lib/server/db/index.js';
import { Account } from '$lib/server/structs/account.js';
import { Scouting } from '$lib/server/structs/scouting.js';
import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { ServerCode } from 'ts-utils/status';

export const load = async (event) => {
	if (!event.locals.account) throw redirect(ServerCode.temporaryRedirect, '/account/sign-in');

	const section = await Scouting.PIT.Sections.fromId(event.params.section).unwrap();
	if (!section) throw fail(ServerCode.notFound);

	// const sessions = await Scouting.PIT.AnswerSessions.fromProperty('section', event.params.section, {
	// 	type: 'all',
	// }).unwrap();

	const sessions = (
		await DB.select()
			.from(Scouting.PIT.AnswerSessions.table)
			.innerJoin(
				Account.Account.table,
				eq(Account.Account.table.id, Scouting.PIT.AnswerSessions.table.createdBy)
			)
			.where(eq(Scouting.PIT.AnswerSessions.table.archived, false))
	).map((s) =>
		Scouting.PIT.AnswerSessions.Generator({
			...s.pit_answer_sessions,
			createdBy: s.account.username
		})
	);

	const archived = (
		await DB.select()
			.from(Scouting.PIT.AnswerSessions.table)
			.innerJoin(
				Account.Account.table,
				eq(Account.Account.table.id, Scouting.PIT.AnswerSessions.table.createdBy)
			)
			.where(eq(Scouting.PIT.AnswerSessions.table.archived, true))
	).map((s) =>
		Scouting.PIT.AnswerSessions.Generator({
			...s.pit_answer_sessions,
			createdBy: s.account.username
		})
	);

	if (section.data.allowMultiple && sessions.length) {
		return {
			sessions: sessions.map((d) => d.safe()),
			archived: archived.map((d) => d.safe()),
			...event.params
		};
	} else {
		const [session] = sessions;
		let id = '';
		if (!session) {
			const s = await Scouting.PIT.AnswerSessions.new({
				section: section.data.id,
				createdBy: event.locals.account.data.id,
				answers: 0
			}).unwrap();
			id = s.id;
		} else {
			id = session.id;
		}

		throw redirect(
			ServerCode.seeOther,
			`/dashboard/event/${event.params.eventKey}/pit-scouting/${event.params.section}/team/${event.params.team}/${id}`
		);
	}
};

export const actions = {
	'new-session': async (event) => {
		if (!event.locals.account) throw redirect(ServerCode.temporaryRedirect, '/account/sign-in');
		const s = await Scouting.PIT.AnswerSessions.new({
			section: event.params.section,
			createdBy: event.locals.account.data.id,
			answers: 0
		}).unwrap();
		throw redirect(
			ServerCode.seeOther,
			`/dashboard/event/${event.params.eventKey}/pit-scouting/${event.params.section}/team/${event.params.team}/${s.id}`
		);
	}
};
