import { browser } from '$app/environment';
import { sse } from '$lib/services/sse';
import { Struct } from '$lib/services/struct';

export namespace Picklist {
	export const Picklist = new Struct({
		name: 'picklist',
		structure: {
			eventKey: 'string',
			name: 'string',
			frozen: 'boolean',
			addedByUsername: 'string',
			addedById: 'string'
		},
		browser,
		socket: sse
	});

	export type PicklistData = typeof Picklist.sample;
	export type PicklistDataArr = ReturnType<typeof Picklist.arr>;

	export const PicklistTeam = new Struct({
		name: 'picklist_team',
		structure: {
			picklist: 'string',
			team: 'number',
			order: 'number',
			reason: 'string',
			chosen: 'boolean',
			addedByUsername: 'string',
			addedById: 'string'
		},
		browser,
		socket: sse
	});

	export type PicklistTeamData = typeof PicklistTeam.sample;
	export type PicklistTeamDataArr = ReturnType<typeof PicklistTeam.arr>;

	export const PicklistChange = new Struct({
		name: 'picklist_change',
		structure: {
			picklist: 'string',
			direction: 'string',
			team: 'number',
			reason: 'string',
			addedByUsername: 'string',
			addedById: 'string'
		},
		browser,
		socket: sse
	});

	export type PicklistChangeData = typeof PicklistChange.sample;
	export type PicklistChangeDataArr = ReturnType<typeof PicklistChange.arr>;

	export const SpecTator = new Struct({
		name: 'picklist_spectator',
		structure: {
			eventKey: 'string',
			team: 'number',
			reason: 'string',
			addedByUsername: 'string',
			addedById: 'string'
		},
		browser,
		socket: sse
	});

	export type SpecTatorData = typeof SpecTator.sample;
	export type SpecTatorArr = ReturnType<typeof SpecTator.arr>;

	export const SpecTatorVote = new Struct({
		name: 'picklist_spectator_vote',
		structure: {
			team: 'number',
			addOrRemove: 'string',
			reason: 'string',
			addedByUsername: 'string',
			addedById: 'string'
		},
		browser,
		socket: sse
	});
}
