/**
 * @fileoverview Client load mapper for pit scouting team view.
 * @description
 * Wraps server payloads into model instances and DataArr collections.
 */

import { FIRST } from '$lib/model/FIRST.js';
import { Scouting } from '$lib/model/scouting';
import { DataArr } from '$lib/services/struct/data-arr';
import { Account } from '$lib/model/account';

/**
 * Maps server data into client-side pit scouting models.
 * @param event - SvelteKit load event with server data.
 * @returns Page data containing team, section, and pit scouting collections.
 */
export const load = (event) => {
	return {
		section: Scouting.PIT.Sections.Generator(event.data.section),
		eventKey: event.data.eventKey,
		sections: new DataArr(
			Scouting.PIT.Sections,
			event.data.sections
				.map((s) => Scouting.PIT.Sections.Generator(s))
				.sort((a, b) => Number(a.data.order) - Number(b.data.order))
		),
		teams: event.data.teams,
		team: event.data.team,
		sectionIndex: event.data.sectionIndex,
		event: event.data.event,
		questions: new DataArr(
			Scouting.PIT.Questions,
			event.data.questions
				.map((q) => Scouting.PIT.Questions.Generator(q))
				.sort((a, b) => Number(a.data.order) - Number(b.data.order))
		),
		answers: new DataArr(
			Scouting.PIT.Answers,
			event.data.answers.map((a) => Scouting.PIT.Answers.Generator(a.answer))
		),
		groups: new DataArr(
			Scouting.PIT.Groups,
			event.data.groups
				.map((g) => Scouting.PIT.Groups.Generator(g))
				.sort((a, b) => Number(a.data.order) - Number(b.data.order))
		),
		pictures: new DataArr(
			FIRST.TeamPictures,
			event.data.pictures.map((p) => FIRST.TeamPictures.Generator(p))
		),
		answeredAccounts: event.data.answers
			.map((a) => a.account)
			.filter(Boolean)
			.map((a) => Account.Account.Generator(a))
	};
};
