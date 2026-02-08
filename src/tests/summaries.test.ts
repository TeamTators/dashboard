/**
 * @fileoverview Phase 1 Tests: Year-Specific Trace Summaries
 * @description
 * Critical tests for 2024/2025 trace summary calculations and aggregation.
 * Part of Phase 1: Data Integrity testing.
 */

import { describe, expect, test, beforeAll, afterEach, afterAll } from 'vitest';
import { Struct } from 'drizzle-struct';
import { DB } from '$lib/server/db';
import { FIRST } from '$lib/server/structs/FIRST';
import { Scouting } from '$lib/server/structs/scouting';
import { TBA as TBAStructs } from '$lib/server/structs/TBA';
import { Trace } from 'tatorscout/trace';
import { Aggregators } from 'tatorscout/summary';
import { validTrace2025, validTrace2024 } from './fixtures/trace-data';
import {
	mockEvent2024,
	mockEvent2025,
	mockMatch2025WithScoreBreakdown,
	mockTeam254
} from './fixtures/tba-data';

describe('Year-Specific Trace Summaries', async () => {
	// Setup database
	beforeAll(async () => {
		await Struct.buildAll(DB).unwrap();
		await clearAll();
	});

	const clearAll = async () => {
		const clearEvent = async (eventKey: string) => {
			const event = await TBAStructs.Events.get({ eventKey }, { type: 'single' });
			if (event.isOk() && event.value) {
				await event.value.delete();
			}

			const scouting = await Scouting.MatchScouting.get({ eventKey }, { type: 'all' });
			if (scouting.isOk()) {
				for (const item of scouting.value) {
					await item.delete();
				}
			}

			const summaries = await FIRST.EventSummary.get({ eventKey }, { type: 'all' });
			if (summaries.isOk()) {
				for (const summary of summaries.value) {
					await summary.delete();
				}
			}

			const matches = await TBAStructs.Matches.get({ eventKey }, { type: 'all' });
			if (matches.isOk()) {
				for (const match of matches.value) {
					await match.delete();
				}
			}

			const teams = await TBAStructs.Teams.get({ eventKey }, { type: 'all' });
			if (teams.isOk()) {
				for (const team of teams.value) {
					await team.delete();
				}
			}
		};

		await clearEvent('2025summarytest');
		await clearEvent('2024summarytest');
		await clearEvent('2025nocache');
		await clearEvent('2025serializetest');
	};

	afterAll(clearAll);

	// Clean up test data after each test
	afterEach(clearAll);

	describe('Aggregators', () => {
		test('average() should calculate mean', () => {
			const result = Aggregators.average([1, 2, 3, 4, 5]);
			expect(result).toBe(3);
		});

		test('average() should handle empty array', () => {
			const result = Aggregators.average([]);
			expect(result).toBe(0); // or NaN depending on implementation
		});

		test('average() should handle single value', () => {
			const result = Aggregators.average([10]);
			expect(result).toBe(10);
		});

		test('average() should handle decimals correctly', () => {
			const result = Aggregators.average([1.5, 2.5, 3.5]);
			expect(result).toBeCloseTo(2.5, 2);
		});

		test('max() should return maximum value', () => {
			const result = Aggregators.max([1, 5, 3, 9, 2]);
			expect(result).toBe(9);
		});

		test('max() should handle negative numbers', () => {
			const result = Aggregators.max([-5, -2, -10, -1]);
			expect(result).toBe(-1);
		});

		test('min() should return minimum value', () => {
			const result = Aggregators.min([10, 5, 3, 9, 2]);
			expect(result).toBe(2);
		});

		test('min() should handle negative numbers', () => {
			const result = Aggregators.min([-5, -2, -10, -1]);
			expect(result).toBe(-10);
		});

		test('sum() should return total', () => {
			const result = Aggregators.sum([1, 2, 3, 4, 5]);
			expect(result).toBe(15);
		});

		test('sum() should handle empty array', () => {
			const result = Aggregators.sum([]);
			expect(result).toBe(0);
		});
	});

	describe('Trace Parsing', () => {
		test('should parse valid 2025 trace', () => {
			const result = Trace.parse(validTrace2025);
			expect(result.isOk()).toBe(true);

			const trace = result.unwrap();
			expect(trace).toBeInstanceOf(Trace);
			expect(trace.points).toBeDefined();
		});

		test('should parse valid 2024 trace', () => {
			const result = Trace.parse(validTrace2024);
			expect(result.isOk()).toBe(true);

			const trace = result.unwrap();
			expect(trace).toBeInstanceOf(Trace);
		});

		test('should fail on invalid JSON', () => {
			const result = Trace.parse('invalid json {');
			expect(result.isErr()).toBe(true);
		});

		test('should fail on missing required fields', () => {
			const invalidTrace = JSON.stringify({
				points: []
				// Missing sections, scoring, metadata
			});
			const result = Trace.parse(invalidTrace);
			expect(result.isErr()).toBe(true);
		});
	});

	describe('FIRST.generateSummary()', () => {
		test('should generate summary for 2025 event', async () => {
			// Create test event
			await TBAStructs.Events.new({
				year: 2025,
				eventKey: '2025summarytest',
				data: JSON.stringify(mockEvent2025)
			});

			// Create test team
			await TBAStructs.Teams.new({
				eventKey: '2025summarytest',
				teamKey: 'frc254',
				data: JSON.stringify(mockTeam254)
			});

			// Create test match
			await TBAStructs.Matches.new({
				eventKey: '2025summarytest',
				matchKey: '2025summarytest_qm1',
				data: JSON.stringify(mockMatch2025WithScoreBreakdown)
			});

			// Create scouting data
			await Scouting.MatchScouting.new({
				eventKey: '2025summarytest',
				matchNumber: 1,
				compLevel: 'qm',
				team: 254,
				scoutId: 'test-scout-id',
				scoutGroup: 1,
				prescouting: false,
				remote: false,
				trace: validTrace2024,
				checks: '[]',
				scoutUsername: 'TestScout',
				alliance: 'red',
				year: 2025,
				sliders: '{}'
			});

			// Generate summary
			const summary = await FIRST.generateSummary('2025summarytest', 2025).unwrap();

			expect(summary).toBeDefined();
		});

		test('should generate summary for 2024 event', async () => {
			// Create test event
			await TBAStructs.Events.new({
				year: 2024,
				eventKey: '2024summarytest',
				data: JSON.stringify(mockEvent2024)
			});

			// Create test team
			await TBAStructs.Teams.new({
				eventKey: '2024summarytest',
				teamKey: 'frc254',
				data: JSON.stringify(mockTeam254)
			});

			// Create test match
			await TBAStructs.Matches.new({
				eventKey: '2024summarytest',
				matchKey: '2024summarytest_qm1',
				data: JSON.stringify({
					...mockMatch2025WithScoreBreakdown,
					key: '2024summarytest_qm1',
					eventKey: '2024summarytest'
				})
			});

			// Create scouting data
			await Scouting.MatchScouting.new({
				eventKey: '2024summarytest',
				matchNumber: 1,
				compLevel: 'qm',
				team: 254,
				scoutId: 'test-scout-id',
				scoutGroup: 1,
				prescouting: false,
				remote: false,
				trace: validTrace2024,
				checks: '[]',
				scoutUsername: 'TestScout',
				alliance: 'red',
				year: 2024,
				sliders: '{}'
			});

			// Generate summary
			const summary = await FIRST.generateSummary('2024summarytest', 2024).unwrap();
			expect(summary).toBeDefined();
		});

		test('should fail with invalid year', async () => {
			const result = await FIRST.generateSummary('2025summarytest', 2023 as 2024 | 2025);

			expect(result.isErr()).toBe(true);
		});
	});

	describe('FIRST.getSummary()', () => {
		test('should generate summary if not cached', async () => {
			// Create test data without cached summary
			await TBAStructs.Events.new({
				year: 2025,
				eventKey: '2025nocache',
				data: JSON.stringify({ ...mockEvent2025, key: '2025nocache' })
			});

			await TBAStructs.Teams.new({
				eventKey: '2025nocache',
				teamKey: 'frc254',
				data: JSON.stringify(mockTeam254)
			});

			await TBAStructs.Matches.new({
				eventKey: '2025nocache',
				matchKey: '2025nocache_qm1',
				data: JSON.stringify({ ...mockMatch2025WithScoreBreakdown, key: '2025nocache_qm1' })
			});

			await Scouting.MatchScouting.new({
				eventKey: '2025nocache',
				matchNumber: 1,
				compLevel: 'qm',
				team: 254,
				scoutId: 'test-scout-id',
				scoutGroup: 1,
				prescouting: false,
				remote: false,
				trace: validTrace2025,
				checks: '[]',
				scoutUsername: 'TestScout',
				alliance: 'red',
				year: 2025,
				sliders: '{}'
			});

			// Get summary - should generate
			const summary = await FIRST.getSummary('2025nocache', 2025).unwrap();
			expect(summary).toBeDefined();
		});
	});

	describe('Summary Serialization', () => {
		test('should serialize and deserialize 2025 summary', async () => {
			// Create minimal test data
			await TBAStructs.Events.new({
				year: 2025,
				eventKey: '2025serializetest',
				data: JSON.stringify({ ...mockEvent2025, key: '2025serializetest' })
			});

			await TBAStructs.Teams.new({
				eventKey: '2025serializetest',
				teamKey: 'frc254',
				data: JSON.stringify(mockTeam254)
			});

			await TBAStructs.Matches.new({
				eventKey: '2025serializetest',
				matchKey: '2025serializetest_qm1',
				data: JSON.stringify({
					...mockMatch2025WithScoreBreakdown,
					key: '2025serializetest_qm1'
				})
			});

			await Scouting.MatchScouting.new({
				eventKey: '2025serializetest',
				matchNumber: 1,
				compLevel: 'qm',
				team: 254,
				scoutId: 'test-scout-id',
				scoutGroup: 1,
				prescouting: false,
				remote: false,
				trace: validTrace2025,
				checks: '[]',
				scoutUsername: 'TestScout',
				alliance: 'red',
				year: 2025,
				sliders: '{}'
			});

			// Generate summary
			const summary = await FIRST.generateSummary('2025serializetest', 2025).unwrap();
			expect(summary).toBeDefined();

			// Serialize
			const serialized = summary.serialize();
			expect(typeof serialized).toBe('string');

			// Deserialize
			const Summary2025 = (await import('$lib/utils/trace/summaries/2025')).default;
			const deserialized = Summary2025.deserialize(serialized);
			expect(deserialized.isOk()).toBe(true);
		});
	});
});
