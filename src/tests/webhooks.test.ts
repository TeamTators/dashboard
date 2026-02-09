/**
 * @fileoverview Unit tests for webhook helpers.
 * @description
 * Verifies subscription key generation and notification formatting.
 */

import { describe, expect, it } from 'vitest';
import { Webhooks } from '$lib/server/structs/webhooks';
import type { TBAWebhooks } from '$lib/server/services/tba-webhooks';

describe('Webhooks helpers', () => {
	it('genArgs builds subscription keys for each webhook type', () => {
		const allianceSelection = {
			event_key: '2024mike2',
			event_name: 'Great Lakes Bay Regional'
		} as TBAWebhooks.Types.Schema<'alliance_selection'>;

		const matchScore = {
			event_key: '2024mike2',
			event_name: 'Great Lakes Bay Regional',
			match: {
				comp_level: 'qm',
				match_number: 12,
				alliances: {
					red: { score: 124 },
					blue: { score: 118 }
				}
			}
		} as TBAWebhooks.Types.Schema<'match_score'>;

		const matchVideo = {
			event_key: '2024mike2',
			event_name: 'Great Lakes Bay Regional',
			match: {
                event_key: '2024mike2',
                key: '2024mike2_qf2',
                comp_level: 'qf',
                match_number: 2,
                videos: [{ type: 'youtube', key: 'abcd1234' }],
                'set_number': 1,
                'time': 1700000000,
            }
		} as TBAWebhooks.Types.Schema<'match_video'>;

		const scheduleUpdated = {
			event_key: '2024mike2',
			event_name: 'Great Lakes Bay Regional'
		} as TBAWebhooks.Types.Schema<'schedule_updated'>;

		const startingCompLevel = {
			event_key: '2024mike2',
			event_name: 'Great Lakes Bay Regional',
			comp_level: 'sf'
		} as TBAWebhooks.Types.Schema<'starting_comp_level'>;

		const upcomingMatch = {
			event_key: '2024mike2',
			event_name: 'Great Lakes Bay Regional',
			match_key: '2024mike2_12_qm',
			scheduled_time: Date.now() + 60_000
		} as TBAWebhooks.Types.Schema<'upcoming_match'>;

		const broadcast = {
			title: 'Field Cam',
			desc: 'Playoffs are live.',
			url: 'https://example.com/stream'
		} as TBAWebhooks.Types.Schema<'broadcast'>;

		const ping = {
			title: 'Ping',
			desc: 'Check connectivity.'
		} as TBAWebhooks.Types.Schema<'ping'>;

		const verification = {
			verification_key: 'verify-123'
		} as TBAWebhooks.Types.Schema<'verification'>;

		expect(Webhooks.genArgs('alliance_selection', allianceSelection)).toEqual([
			{ args: '2024mike2', single: true }
		]);

		expect(Webhooks.genArgs('match_score', matchScore)).toEqual([
			{ args: '2024mike2', single: false },
			{ args: '2024mike2:qm:12', single: true }
		]);

		expect(Webhooks.genArgs('match_video', matchVideo)).toEqual([
			{ args: '2024mike2:qf:2', single: true }
		]);

		expect(Webhooks.genArgs('schedule_updated', scheduleUpdated)).toEqual([
			{ args: '2024mike2', single: true }
		]);

		expect(Webhooks.genArgs('starting_comp_level', startingCompLevel)).toEqual([
			{ args: '2024mike2', single: false },
			{ args: '2024mike2:sf', single: true }
		]);

		expect(Webhooks.genArgs('upcoming_match', upcomingMatch)).toEqual([
			{ args: '2024mike2', single: false },
			{ args: '2024mike2:qm:12', single: true }
		]);

		expect(() => Webhooks.genArgs('broadcast', broadcast)).toThrow('Unhandled webhook type');
		expect(() => Webhooks.genArgs('ping', ping)).toThrow('Unhandled webhook type');
		expect(() => Webhooks.genArgs('verification', verification)).toThrow('Unhandled webhook type');
	});

	it('buildNotif formats notification metadata for each webhook type', () => {
		const notifAlliance = Webhooks.buildNotif('alliance_selection', {
			event_key: '2024mike2',
			event_name: 'Great Lakes Bay Regional'
		} as TBAWebhooks.Types.Schema<'alliance_selection'>);

		expect(notifAlliance.severity).toBe('info');
		expect(notifAlliance.icon).toEqual({ type: 'material-icons', name: 'group' });
		expect(notifAlliance.title).toContain('Great Lakes Bay Regional');

		const notifMatchScore = Webhooks.buildNotif('match_score', {
			event_key: '2024mike2',
			event_name: 'Great Lakes Bay Regional',
			match: {
				comp_level: 'qm',
				match_number: 12,
				alliances: {
					red: { score: 124 },
					blue: { score: 118 }
				}
			}
		} as TBAWebhooks.Types.Schema<'match_score'>);

		expect(notifMatchScore.icon).toEqual({ type: 'material-icons', name: 'sports_martial_arts' });
		expect(notifMatchScore.message).toContain('124');
		expect(notifMatchScore.message).toContain('118');

		const notifMatchVideo = Webhooks.buildNotif('match_video', {
			event_key: '2024mike2',
			event_name: 'Great Lakes Bay Regional',
			match: {
                event_key: '2024mike2',
                key: '2024mike2_qf2',
                comp_level: 'qf',
                match_number: 2,
                videos: [{ type: 'youtube', key: 'abcd1234' }],
                'set_number': 1,
                'time': 1700000000,
			}
		} as TBAWebhooks.Types.Schema<'match_video'>);

		expect(notifMatchVideo.icon).toEqual({ type: 'material-icons', name: 'videocam' });
		expect(notifMatchVideo.title).toContain('QF 2');

		const notifSchedule = Webhooks.buildNotif('schedule_updated', {
			event_key: '2024mike2',
			event_name: 'Great Lakes Bay Regional'
		} as TBAWebhooks.Types.Schema<'schedule_updated'>);

		expect(notifSchedule.icon).toEqual({ type: 'material-icons', name: 'schedule' });
		expect(notifSchedule.title).toContain('Schedule Updated');

		const notifCompLevel = Webhooks.buildNotif('starting_comp_level', {
			event_key: '2024mike2',
			event_name: 'Great Lakes Bay Regional',
			comp_level: 'sf'
		} as TBAWebhooks.Types.Schema<'starting_comp_level'>);

		expect(notifCompLevel.icon).toEqual({ type: 'material-icons', name: 'play_circle_filled' });
		expect(notifCompLevel.title).toContain('SF');

		const upcomingMatch = {
			event_key: '2024mike2',
			event_name: 'Great Lakes Bay Regional',
			match_key: '2024mike2_12_qm',
			scheduled_time: Date.now() + 60_000
		} as TBAWebhooks.Types.Schema<'upcoming_match'>;

		const notifUpcoming = Webhooks.buildNotif('upcoming_match', upcomingMatch);

		expect(notifUpcoming.icon).toEqual({ type: 'material-icons', name: 'alarm' });
		expect(notifUpcoming.message.startsWith(`Match ${upcomingMatch.match_key} is scheduled at `)).toBe(true);

		const broadcast = {
			title: 'Field Cam',
			desc: 'Playoffs are live.',
			url: 'https://example.com/stream'
		} as TBAWebhooks.Types.Schema<'broadcast'>;

		const ping = {
			title: 'Ping',
			desc: 'Check connectivity.'
		} as TBAWebhooks.Types.Schema<'ping'>;

		const verification = {
			verification_key: 'verify-123'
		} as TBAWebhooks.Types.Schema<'verification'>;

		expect(() => Webhooks.buildNotif('broadcast', broadcast)).toThrow('Unhandled webhook type');
		expect(() => Webhooks.buildNotif('ping', ping)).toThrow('Unhandled webhook type');
		expect(() => Webhooks.buildNotif('verification', verification)).toThrow('Unhandled webhook type');
	});
});
