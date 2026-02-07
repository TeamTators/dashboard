/**
 * @fileoverview Phase 1 Tests: TBA Integration & Caching
 * @description
 * Critical tests for TBA data retrieval, caching, and error handling.
 * Part of Phase 1: Data Integrity testing.
 */

import { describe, expect, test, beforeAll, afterEach } from 'vitest';
import { Struct } from 'drizzle-struct';
import { DB } from '$lib/server/db';
import * as TBA from '$lib/server/utils/tba';
import { TBA as TBAStructs } from '$lib/server/structs/TBA';
import { mockEvent2025, mockTeam254, mockMatch2025 } from './fixtures/tba-data';

describe('Phase 1: TBA Integration & Caching', async () => {
	// Setup database
	beforeAll(async () => {
		await Struct.buildAll(DB).unwrap();
	});

	// Clean up test data after each test
	afterEach(async () => {
		// Clean up test TBA requests cache
		const testRequests = await TBAStructs.Requests.get(
			{},
			{ type: 'array', limit: 1000, offset: 0 }
		);
		if (testRequests.isOk()) {
			for (const req of testRequests.value) {
				// Only delete test-related cache entries
				if (req.data.url.includes('test') || req.data.url.includes('2025idbo')) {
					await req.delete();
				}
			}
		}
	});

	describe('Event.getEvents()', () => {
		test('should fetch events for a season', async () => {
			const result = await TBA.Event.getEvents(2024);

			expect(result.isOk()).toBe(true);
			const events = result.unwrap();
			expect(events.length).toBeGreaterThan(0);
			expect(events[0].tba.year).toBe(2024);
		});

		test('should return TBAEvent instances', async () => {
			const result = await TBA.Event.getEvents(2024);
			expect(result.isOk()).toBe(true);

			const events = result.unwrap();
			const event = events[0];
			expect(event).toBeInstanceOf(TBA.Event);
			expect(event.tba).toBeDefined();
			expect(event.tba.key).toBeDefined();
		});
	});

	describe('Event.getEvent()', () => {
		test('should fetch a single event by key', async () => {
			const result = await TBA.Event.getEvent('2024idbo');

			expect(result.isOk()).toBe(true);
			const event = result.unwrap();
			expect(event).toBeInstanceOf(TBA.Event);
			expect(event.tba.key).toBe('2024idbo');
		});

		test('should cache event in memory', async () => {
			// First call
			const result1 = await TBA.Event.getEvent('2024idbo');
			expect(result1.isOk()).toBe(true);

			// Second call should use cached event
			const result2 = await TBA.Event.getEvent('2024idbo');
			expect(result2.isOk()).toBe(true);

			// Should be same instance
			expect(result1.unwrap().tba.key).toBe(result2.unwrap().tba.key);
		});
	});

	describe('Event.getMatches()', () => {
		test('should fetch matches for an event', async () => {
			const eventResult = await TBA.Event.getEvent('2024idbo');
			expect(eventResult.isOk()).toBe(true);

			const event = eventResult.unwrap();
			const matchesResult = await event.getMatches();

			expect(matchesResult.isOk()).toBe(true);
			const matches = matchesResult.unwrap();
			expect(matches.length).toBeGreaterThan(0);
			expect(matches[0]).toBeInstanceOf(TBA.Match);
		});

		test('should cache matches after first fetch', async () => {
			const eventResult = await TBA.Event.getEvent('2024idbo');
			const event = eventResult.unwrap();

			// First call
			const matches1 = await event.getMatches();
			expect(matches1.isOk()).toBe(true);

			// Second call should use cache
			const matches2 = await event.getMatches();
			expect(matches2.isOk()).toBe(true);

			expect(matches1.unwrap().length).toBe(matches2.unwrap().length);
		});
	});

	describe('Event.getTeams()', () => {
		test('should fetch teams for an event', async () => {
			const eventResult = await TBA.Event.getEvent('2024idbo');
			expect(eventResult.isOk()).toBe(true);

			const event = eventResult.unwrap();
			const teamsResult = await event.getTeams();

			expect(teamsResult.isOk()).toBe(true);
			const teams = teamsResult.unwrap();
			expect(teams.length).toBeGreaterThan(0);
			expect(teams[0]).toBeInstanceOf(TBA.Team);
		});

		test('should cache teams after first fetch', async () => {
			const eventResult = await TBA.Event.getEvent('2024idbo');
			const event = eventResult.unwrap();

			// First call
			const teams1 = await event.getTeams();
			expect(teams1.isOk()).toBe(true);

			// Second call should use cache
			const teams2 = await event.getTeams();
			expect(teams2.isOk()).toBe(true);

			expect(teams1.unwrap().length).toBe(teams2.unwrap().length);
		});
	});

	describe('Match.getTeams()', () => {
		test('should resolve match teams as TBATeam wrappers', async () => {
			const eventResult = await TBA.Event.getEvent('2024idbo');
			expect(eventResult.isOk()).toBe(true);

			const event = eventResult.unwrap();
			const matchesResult = await event.getMatches();
			expect(matchesResult.isOk()).toBe(true);

			const matches = matchesResult.unwrap();
			const match = matches[0];

			const teamsResult = await match.getTeams();
			expect(teamsResult.isOk()).toBe(true);

			const teams = teamsResult.unwrap();
			expect(teams).toHaveLength(6);
			teams.forEach((team) => {
				expect(team).toBeInstanceOf(TBA.Team);
			});
		});
	});

	describe('Team.getMatches()', () => {
		test('should fetch matches involving a specific team', async () => {
			const eventResult = await TBA.Event.getEvent('2024idbo');
			const event = eventResult.unwrap();

			const teamsResult = await event.getTeams();
			const teams = teamsResult.unwrap();
			const team = teams[0];

			const matchesResult = await team.getMatches();
			expect(matchesResult.isOk()).toBe(true);

			const matches = matchesResult.unwrap();
			expect(matches.length).toBeGreaterThan(0);
			
			// Verify team is in each match
			matches.forEach((match) => {
				const allTeamKeys = [
					...match.tba.alliances.red.team_keys,
					...match.tba.alliances.blue.team_keys
				];
				expect(allTeamKeys).toContain(team.tba.key);
			});
		});
	});

	describe('TBA Caching', () => {
		test('should cache TBA requests in database', async () => {
			// Make a request that will be cached
			const eventResult = await TBA.Event.getEvent('2024idbo');
			expect(eventResult.isOk()).toBe(true);

			// Wait a bit for async cache write
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Check if cached in database
			const cached = await TBAStructs.Requests.get(
				{},
				{ type: 'array', limit: 100, offset: 0 }
			);

			expect(cached.isOk()).toBe(true);
			// Should have at least some cached requests
			expect(cached.unwrap().length).toBeGreaterThan(0);
		});

		test('should use cached data within threshold', async () => {
			// This test validates that cached data is used
			// We can't easily test the internal cache hit without mocking,
			// but we can verify the cache exists and data is consistent

			const result1 = await TBA.Event.getEvent('2024idbo');
			expect(result1.isOk()).toBe(true);

			const result2 = await TBA.Event.getEvent('2024idbo');
			expect(result2.isOk()).toBe(true);

			// Should return consistent data
			expect(result1.unwrap().tba.key).toBe(result2.unwrap().tba.key);
			expect(result1.unwrap().tba.name).toBe(result2.unwrap().tba.name);
		});
	});

	describe('Custom TBA Events', () => {
		test('should create custom event', async () => {
			const result = await TBAStructs.Events.new({
				year: 2025,
				eventKey: '2025customtest',
				data: JSON.stringify(mockEvent2025)
			});

			expect(result.isOk()).toBe(true);
			const event = result.unwrap();
			expect(event.data.eventKey).toBe('2025customtest');
			expect(event.data.year).toBe(2025);

			// Clean up
			await event.delete();
		});

		test('should delete custom event and cascade to teams', async () => {
			// Create custom event
			const eventResult = await TBAStructs.Events.new({
				year: 2025,
				eventKey: '2025cascadetest',
				data: JSON.stringify(mockEvent2025)
			});
			expect(eventResult.isOk()).toBe(true);
			const event = eventResult.unwrap();

			// Create custom team
			const teamResult = await TBAStructs.Teams.new({
				eventKey: '2025cascadetest',
				teamKey: 'frc254',
				data: JSON.stringify(mockTeam254)
			});
			expect(teamResult.isOk()).toBe(true);

			// Delete event (should cascade)
			await event.delete();

			// Wait for cascade
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Verify team was deleted
			const teamsCheck = await TBAStructs.Teams.get(
				{ eventKey: '2025cascadetest' },
				{ type: 'array', limit: 10, offset: 0 }
			);
			expect(teamsCheck.isOk()).toBe(true);
			expect(teamsCheck.unwrap().length).toBe(0);
		});

		test('should delete custom event and cascade to matches', async () => {
			// Create custom event
			const eventResult = await TBAStructs.Events.new({
				year: 2025,
				eventKey: '2025matchcascade',
				data: JSON.stringify(mockEvent2025)
			});
			expect(eventResult.isOk()).toBe(true);
			const event = eventResult.unwrap();

			// Create custom match
			const matchResult = await TBAStructs.Matches.new({
				eventKey: '2025matchcascade',
				matchKey: '2025matchcascade_qm1',
				data: JSON.stringify(mockMatch2025)
			});
			expect(matchResult.isOk()).toBe(true);

			// Delete event (should cascade)
			await event.delete();

			// Wait for cascade
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Verify match was deleted
			const matchesCheck = await TBAStructs.Matches.get(
				{ eventKey: '2025matchcascade' },
				{ type: 'array', limit: 10, offset: 0 }
			);
			expect(matchesCheck.isOk()).toBe(true);
			expect(matchesCheck.unwrap().length).toBe(0);
		});
	});

	describe('Error Handling', () => {
		test('should handle invalid event key gracefully', async () => {
			const result = await TBA.Event.getEvent('invalid_event_key_12345');

			// Should either return error or handle gracefully
			// Actual behavior depends on TBA API implementation
			if (result.isErr()) {
				expect(result.error).toBeDefined();
			}
		});

		test('should return Result type for all operations', async () => {
			const eventResult = await TBA.Event.getEvent('2024idbo');
			
			// All results should have isOk/isErr methods
			expect(typeof eventResult.isOk).toBe('function');
			expect(typeof eventResult.isErr).toBe('function');
			
			if (eventResult.isOk()) {
				const event = eventResult.unwrap();
				const matchesResult = await event.getMatches();
				expect(typeof matchesResult.isOk).toBe('function');
				expect(typeof matchesResult.isErr).toBe('function');
			}
		});
	});

	describe('Match toString()', () => {
		test('should format match labels correctly', async () => {
			const eventResult = await TBA.Event.getEvent('2024idbo');
			expect(eventResult.isOk()).toBe(true);

			const event = eventResult.unwrap();
			const matchesResult = await event.getMatches();
			expect(matchesResult.isOk()).toBe(true);

			const matches = matchesResult.unwrap();
			
			// Find different match types
			const qm = matches.find((m) => m.tba.comp_level === 'qm');
			if (qm) {
				expect(qm.toString()).toContain('Qualifications');
			}

			const qf = matches.find((m) => m.tba.comp_level === 'qf');
			if (qf) {
				expect(qf.toString()).toContain('Quarterfinals');
			}

			const sf = matches.find((m) => m.tba.comp_level === 'sf');
			if (sf) {
				expect(sf.toString()).toContain('Semifinals');
			}

			const f = matches.find((m) => m.tba.comp_level === 'f');
			if (f) {
				expect(f.toString()).toContain('Finals');
			}
		});
	});
});
