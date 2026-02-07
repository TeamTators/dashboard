/**
 * @fileoverview Phase 1 Tests: Scouting Data Models & Trace Parsing
 * @description
 * Critical tests for scouting data integrity, trace parsing, and data retrieval.
 * Part of Phase 1: Data Integrity testing.
 */

import { describe, expect, test, beforeAll, afterEach } from 'vitest';
import { Struct } from 'drizzle-struct';
import { DB } from '$lib/server/db';
import { Scouting } from '$lib/server/structs/scouting';
import { Trace } from 'tatorscout/trace';
import {
	validTrace2025,
	validTrace2024,
	invalidTraceJSON,
	invalidTraceStructure,
	validChecks,
	validSliders,
	emptyChecks,
	emptySliders
} from './fixtures/trace-data';

describe('Phase 1: Scouting Data Models & Trace Parsing', async () => {
	// Setup database
	beforeAll(async () => {
		await Struct.buildAll(DB).unwrap();
	});

	// Clean up test data after each test
	afterEach(async () => {
		// Delete test scouting data
		const testData = await Scouting.MatchScouting.get(
			{ eventKey: '2025test' },
			{ type: 'array', limit: 1000, offset: 0 }
		);
		if (testData.isOk()) {
			for (const item of testData.value) {
				await item.delete();
			}
		}
	});

	describe('MatchScoutingExtended.from()', () => {
		test('should parse valid scouting data with trace', async () => {
			// Create valid scouting record
			const created = await Scouting.MatchScouting.new({
				eventKey: '2025test',
				matchNumber: 1,
				compLevel: 'qm',
				team: 254,
				scoutId: 'test-scout-id',
				scoutGroup: 1,
				prescouting: false,
				remote: false,
				trace: validTrace2025,
				checks: validChecks,
				scoutUsername: 'TestScout',
				alliance: 'red',
				year: 2025,
				sliders: validSliders
			});

			expect(created.isOk()).toBe(true);
			const scouting = created.unwrap();

			// Parse with MatchScoutingExtended
			const extended = Scouting.MatchScoutingExtended.from(scouting);

			expect(extended.isOk()).toBe(true);
			const ext = extended.unwrap();

			expect(ext.team).toBe(254);
			expect(ext.matchNumber).toBe(1);
			expect(ext.compLevel).toBe('qm');
			expect(ext.year).toBe(2025);
			expect(ext.eventKey).toBe('2025test');
			expect(ext.trace).toBeInstanceOf(Trace);
		});

		test('should fail with invalid trace JSON', async () => {
			const created = await Scouting.MatchScouting.new({
				eventKey: '2025test',
				matchNumber: 2,
				compLevel: 'qm',
				team: 254,
				scoutId: 'test-scout-id',
				scoutGroup: 1,
				prescouting: false,
				remote: false,
				trace: invalidTraceJSON,
				checks: emptyChecks,
				scoutUsername: 'TestScout',
				alliance: 'red',
				year: 2025,
				sliders: emptySliders
			});

			expect(created.isOk()).toBe(true);
			const scouting = created.unwrap();

			// Should fail to parse
			const extended = Scouting.MatchScoutingExtended.from(scouting);
			expect(extended.isErr()).toBe(true);
		});

		test('should fail with invalid trace structure', async () => {
			const created = await Scouting.MatchScouting.new({
				eventKey: '2025test',
				matchNumber: 3,
				compLevel: 'qm',
				team: 254,
				scoutId: 'test-scout-id',
				scoutGroup: 1,
				prescouting: false,
				remote: false,
				trace: invalidTraceStructure,
				checks: emptyChecks,
				scoutUsername: 'TestScout',
				alliance: 'red',
				year: 2025,
				sliders: emptySliders
			});

			expect(created.isOk()).toBe(true);
			const scouting = created.unwrap();

			// Should fail to parse
			const extended = Scouting.MatchScoutingExtended.from(scouting);
			expect(extended.isErr()).toBe(true);
		});
	});

	describe('MatchScoutingExtended computed properties', () => {
		test('getChecks() should parse checks JSON', async () => {
			const created = await Scouting.MatchScouting.new({
				eventKey: '2025test',
				matchNumber: 10,
				compLevel: 'qm',
				team: 254,
				scoutId: 'test-scout-id',
				scoutGroup: 1,
				prescouting: false,
				remote: false,
				trace: validTrace2025,
				checks: validChecks,
				scoutUsername: 'TestScout',
				alliance: 'red',
				year: 2025,
				sliders: emptySliders
			});

			const scouting = created.unwrap();
			const extended = Scouting.MatchScoutingExtended.from(scouting).unwrap();

			const checks = extended.getChecks();
			expect(checks.isOk()).toBe(true);
			expect(checks.unwrap()).toEqual(['defense', 'fast', 'accurate']);
		});

		test('getChecks() should handle empty checks', async () => {
			const created = await Scouting.MatchScouting.new({
				eventKey: '2025test',
				matchNumber: 11,
				compLevel: 'qm',
				team: 254,
				scoutId: 'test-scout-id',
				scoutGroup: 1,
				prescouting: false,
				remote: false,
				trace: validTrace2025,
				checks: emptyChecks,
				scoutUsername: 'TestScout',
				alliance: 'red',
				year: 2025,
				sliders: emptySliders
			});

			const scouting = created.unwrap();
			const extended = Scouting.MatchScoutingExtended.from(scouting).unwrap();

			const checks = extended.getChecks();
			expect(checks.isOk()).toBe(true);
			expect(checks.unwrap()).toEqual([]);
		});

		test('getSliders() should parse sliders object', async () => {
			const created = await Scouting.MatchScouting.new({
				eventKey: '2025test',
				matchNumber: 12,
				compLevel: 'qm',
				team: 254,
				scoutId: 'test-scout-id',
				scoutGroup: 1,
				prescouting: false,
				remote: false,
				trace: validTrace2025,
				checks: emptyChecks,
				scoutUsername: 'TestScout',
				alliance: 'red',
				year: 2025,
				sliders: validSliders
			});

			const scouting = created.unwrap();
			const extended = Scouting.MatchScoutingExtended.from(scouting).unwrap();

			const sliders = extended.getSliders();
			expect(sliders.isOk()).toBe(true);
			const slidersObj = sliders.unwrap();
			expect(slidersObj.speed).toBeDefined();
			expect(slidersObj.speed.value).toBe(8);
			expect(slidersObj.defense).toBeDefined();
			expect(slidersObj.defense.value).toBe(6);
		});

		test('getSliders() should handle empty sliders', async () => {
			const created = await Scouting.MatchScouting.new({
				eventKey: '2025test',
				matchNumber: 13,
				compLevel: 'qm',
				team: 254,
				scoutId: 'test-scout-id',
				scoutGroup: 1,
				prescouting: false,
				remote: false,
				trace: validTrace2025,
				checks: emptyChecks,
				scoutUsername: 'TestScout',
				alliance: 'red',
				year: 2025,
				sliders: emptySliders
			});

			const scouting = created.unwrap();
			const extended = Scouting.MatchScoutingExtended.from(scouting).unwrap();

			const sliders = extended.getSliders();
			expect(sliders.isOk()).toBe(true);
			expect(sliders.unwrap()).toEqual({});
		});
	});

	describe('getMatchScouting()', () => {
		test('should retrieve match scouting by match identifiers', async () => {
			// Create scouting record
			await Scouting.MatchScouting.new({
				eventKey: '2025test',
				matchNumber: 20,
				compLevel: 'qm',
				team: 1114,
				scoutId: 'test-scout-id',
				scoutGroup: 1,
				prescouting: false,
				remote: false,
				trace: validTrace2025,
				checks: emptyChecks,
				scoutUsername: 'TestScout',
				alliance: 'blue',
				year: 2025,
				sliders: emptySliders
			});

			// Retrieve it
			const result = await Scouting.getMatchScouting({
				eventKey: '2025test',
				match: 20,
				team: 1114,
				compLevel: 'qm'
			});

			expect(result.isOk()).toBe(true);
			const scouting = result.unwrap();
			expect(scouting).toBeDefined();
			expect(scouting?.data.team).toBe(1114);
			expect(scouting?.data.matchNumber).toBe(20);
		});

		test('should return undefined for non-existent match', async () => {
			const result = await Scouting.getMatchScouting({
				eventKey: '2025test',
				match: 999,
				team: 254,
				compLevel: 'qm'
			});

			expect(result.isOk()).toBe(true);
			expect(result.unwrap()).toBeUndefined();
		});

		test('should exclude archived records', async () => {
			// Create and archive a record
			const created = await Scouting.MatchScouting.new({
				eventKey: '2025test',
				matchNumber: 21,
				compLevel: 'qm',
				team: 2056,
				scoutId: 'test-scout-id',
				scoutGroup: 1,
				prescouting: false,
				remote: false,
				trace: validTrace2025,
				checks: emptyChecks,
				scoutUsername: 'TestScout',
				alliance: 'red',
				year: 2025,
				sliders: emptySliders
			});

			const scouting = created.unwrap();
			await scouting.setArchive(true);

			// Should not find archived record
			const result = await Scouting.getMatchScouting({
				eventKey: '2025test',
				match: 21,
				team: 2056,
				compLevel: 'qm'
			});

			expect(result.isOk()).toBe(true);
			expect(result.unwrap()).toBeUndefined();
		});
	});

	describe('getTeamScouting()', () => {
		test('should retrieve all scouting for team at event', async () => {
			// Create multiple scouting records for same team
			await Scouting.MatchScouting.new({
				eventKey: '2025test',
				matchNumber: 30,
				compLevel: 'qm',
				team: 254,
				scoutId: 'test-scout-id',
				scoutGroup: 1,
				prescouting: false,
				remote: false,
				trace: validTrace2025,
				checks: emptyChecks,
				scoutUsername: 'TestScout',
				alliance: 'red',
				year: 2025,
				sliders: emptySliders
			});

			await Scouting.MatchScouting.new({
				eventKey: '2025test',
				matchNumber: 31,
				compLevel: 'qm',
				team: 254,
				scoutId: 'test-scout-id',
				scoutGroup: 1,
				prescouting: false,
				remote: false,
				trace: validTrace2025,
				checks: emptyChecks,
				scoutUsername: 'TestScout',
				alliance: 'blue',
				year: 2025,
				sliders: emptySliders
			});

			// Retrieve all for team
			const result = await Scouting.getTeamScouting(254, '2025test');

			expect(result.isOk()).toBe(true);
			const scoutingData = result.unwrap();
			expect(scoutingData.length).toBeGreaterThanOrEqual(2);
		});

		test('should return empty array for team with no scouting data', async () => {
			const result = await Scouting.getTeamScouting(9999, '2025test');

			expect(result.isOk()).toBe(true);
			expect(result.unwrap()).toEqual([]);
		});

		test('should exclude archived records', async () => {
			// Create non-archived record
			await Scouting.MatchScouting.new({
				eventKey: '2025test',
				matchNumber: 32,
				compLevel: 'qm',
				team: 1114,
				scoutId: 'test-scout-id',
				scoutGroup: 1,
				prescouting: false,
				remote: false,
				trace: validTrace2025,
				checks: emptyChecks,
				scoutUsername: 'TestScout',
				alliance: 'red',
				year: 2025,
				sliders: emptySliders
			});

			// Create and archive another
			const archived = await Scouting.MatchScouting.new({
				eventKey: '2025test',
				matchNumber: 33,
				compLevel: 'qm',
				team: 1114,
				scoutId: 'test-scout-id',
				scoutGroup: 1,
				prescouting: false,
				remote: false,
				trace: validTrace2025,
				checks: emptyChecks,
				scoutUsername: 'TestScout',
				alliance: 'blue',
				year: 2025,
				sliders: emptySliders
			});
			await archived.unwrap().setArchive(true);

			// Should only get non-archived
			const result = await Scouting.getTeamScouting(1114, '2025test');
			expect(result.isOk()).toBe(true);
			const scoutingData = result.unwrap();

			// Should only have non-archived records
			expect(scoutingData.every((s) => !s.archived)).toBe(true);
		});
	});

	describe('getTeamPrescouting()', () => {
		test('should retrieve prescouting for team/year', async () => {
			// Create prescouting record
			await Scouting.MatchScouting.new({
				eventKey: '2025test',
				matchNumber: 40,
				compLevel: 'qm',
				team: 254,
				scoutId: 'test-scout-id',
				scoutGroup: 1,
				prescouting: true,
				remote: false,
				trace: validTrace2025,
				checks: emptyChecks,
				scoutUsername: 'TestScout',
				alliance: 'red',
				year: 2025,
				sliders: emptySliders
			});

			// Create non-prescouting record (should be excluded)
			await Scouting.MatchScouting.new({
				eventKey: '2025test',
				matchNumber: 41,
				compLevel: 'qm',
				team: 254,
				scoutId: 'test-scout-id',
				scoutGroup: 1,
				prescouting: false,
				remote: false,
				trace: validTrace2025,
				checks: emptyChecks,
				scoutUsername: 'TestScout',
				alliance: 'blue',
				year: 2025,
				sliders: emptySliders
			});

			const result = await Scouting.getTeamPrescouting(254, 2025);

			expect(result.isOk()).toBe(true);
			const prescouting = result.unwrap();
			expect(prescouting.length).toBeGreaterThanOrEqual(1);
			// All should be prescouting
			expect(prescouting.every((s) => s.prescouting)).toBe(true);
		});

		test('should filter by year correctly', async () => {
			// Create 2024 prescouting
			await Scouting.MatchScouting.new({
				eventKey: '2024test',
				matchNumber: 42,
				compLevel: 'qm',
				team: 254,
				scoutId: 'test-scout-id',
				scoutGroup: 1,
				prescouting: true,
				remote: false,
				trace: validTrace2024,
				checks: emptyChecks,
				scoutUsername: 'TestScout',
				alliance: 'red',
				year: 2024,
				sliders: emptySliders
			});

			// Create 2025 prescouting
			await Scouting.MatchScouting.new({
				eventKey: '2025test',
				matchNumber: 43,
				compLevel: 'qm',
				team: 254,
				scoutId: 'test-scout-id',
				scoutGroup: 1,
				prescouting: true,
				remote: false,
				trace: validTrace2025,
				checks: emptyChecks,
				scoutUsername: 'TestScout',
				alliance: 'red',
				year: 2025,
				sliders: emptySliders
			});

			// Get 2024 only
			const result2024 = await Scouting.getTeamPrescouting(254, 2024);
			expect(result2024.isOk()).toBe(true);
			const prescouting2024 = result2024.unwrap();
			expect(prescouting2024.every((s) => s.year === 2024)).toBe(true);

			// Get 2025 only
			const result2025 = await Scouting.getTeamPrescouting(254, 2025);
			expect(result2025.isOk()).toBe(true);
			const prescouting2025 = result2025.unwrap();
			expect(prescouting2025.every((s) => s.year === 2025)).toBe(true);
		});
	});
});
