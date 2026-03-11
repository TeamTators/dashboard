/**
 * @fileoverview TBA request/response cache Structs.
 *
 * @description
 * Defines client-side Structs for caching TBA requests and custom event/team/match data.
 */
import { browser } from '$app/environment';
import { sse } from '$lib/services/sse';
import { Struct } from '$lib/services/struct';

export namespace TBA {
	export const Requests = new Struct({
		name: 'tba_requests',
		structure: {
			/** Request URL used as cache key. */
			url: 'string',
			/** Cached response payload (serialized). */
			response: 'string'
		},
		socket: sse,
		browser
	});

	export const Events = new Struct({
		name: 'tba_custom_events',
		structure: {
			/** Competition year. */
			year: 'number',
			/** Event key. */
			eventKey: 'string',
			/** Serialized event data. */
			data: 'string'
		},
		socket: sse,
		browser
	});

	export const Teams = new Struct({
		name: 'tba_custom_teams',
		structure: {
			/** Event key to scope teams. */
			eventKey: 'string',
			/** Team key (e.g., frc1234). */
			teamKey: 'string',
			/** Serialized team data. */
			data: 'string'
		},
		socket: sse,
		browser
	});

	export const Matches = new Struct({
		name: 'tba_custom_matches',
		structure: {
			/** Event key to scope matches. */
			eventKey: 'string',
			/** Match key (e.g., 2025miket_qm1). */
			matchKey: 'string',
			/** Serialized match data. */
			data: 'string'
		},
		socket: sse,
		browser
	});
}
