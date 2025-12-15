/* eslint-disable @typescript-eslint/no-explicit-any */
import { boolean, text } from 'drizzle-orm/pg-core';
import { Struct } from 'drizzle-struct/back-end';
import { TBAWebhooks } from '../services/tba-webhooks';
import { attempt, attemptAsync, capitalize, fromSnakeCase } from 'ts-utils';
import { DB } from '../db';
import { and, eq, inArray } from 'drizzle-orm';
import { Account } from './account';
import type { Notification } from '$lib/types/notification';
import { sendEmail } from '../services/email';
import { domain } from '../utils/env';
import { Event, type Match } from '../utils/tba';
import { teamsFromMatch } from 'tatorscout/tba';
// import { freqEst, getDesc } from '$lib/utils/webhooks';

export namespace Webhooks {
	export const Subscriptions = new Struct({
		name: 'webhook_subscriptions',
		structure: {
			accountId: text('account_id').notNull(),
			type: text('type').notNull(),
			args: text('args').notNull(),
			email: boolean('email').notNull(),
			popup: boolean('popup').notNull(),
			discord: boolean('discord').notNull()
		}
	});

	Subscriptions.on('create', async (s) => {
		const exists = await Subscriptions.get({
			accountId: s.data.accountId,
			type: s.data.type,
			args: s.data.args,
		}, {
			type: 'all',
		});
		if (exists.isOk() && exists.value.length > 1) {
			// already exists
			await s.delete();
			return;
		}

		// if (!s.data.email) return;
		// const account = await Account.Account.fromId(s.data.accountId).unwrap();
		// if (account) {
		// 	await sendEmail({
		// 		to: account.data.email,
		// 		type: 'webhook-init',
		// 		subject: `Webhook Subscription Created: ${capitalize(fromSnakeCase(s.data.type))}`,
		// 		data: {
		// 			created_date: s.created.toLocaleDateString(),
		// 			email_address: account.data.email,
		// 			frequency_estimate: freqEst(s.data.type, s.data.args),
		// 			manage_subscriptions_url: domain({ port: false, protocol: true }) + '/account/webhooks',
		// 			subscription_id: s.id,
		// 			test_notification_url: domain({ port: false, protocol: true }) + `/webhooks/test/${s.id}`,
		// 			timestamp: new Date().toLocaleDateString(),
		// 			unsubscribe_url:
		// 				domain({ port: false, protocol: true }) + `/webhooks/unsubscribe/${s.id}`,
		// 			username: account.data.username,
		// 			webhook_description: getDesc(s.data.type, s.data.args),
		// 			webhook_type: capitalize(fromSnakeCase(s.data.type))
		// 		}
		// 	}).unwrap();
		// }
	});

	export type SubscriptionData = typeof Subscriptions.sample;

	export const WebhookAlerts = new Struct({
		name: 'webhook_alerts',
		structure: {
			type: text('type').notNull(),
			data: text('data').notNull()
		},
		lifetime: 1000 * 60 * 60 * 24 * 7, // 7 days
		frontend: false
	});

	export type WebhookAlertsData = typeof WebhookAlerts.sample;

	export const genArgs = <K extends TBAWebhooks.Types.Schemas>(
		type: K,
		data: TBAWebhooks.Types.Schema<K>
	): {
		args: string;
		single: boolean;
	}[] => {
		switch (type) {
			case 'alliance_selection':
				return [
					{
						args: (data as TBAWebhooks.Types.Schema<'alliance_selection'>).event_key,
						single: true
					}
				];
			case 'match_score': {
				const m = data as TBAWebhooks.Types.Schema<'match_score'>;
				return [
					{ args: m.event_key, single: false },
					{ args: `${m.event_key}:${m.match.comp_level}:${m.match.match_number}`, single: true }
				];
			}
			case 'match_video': {
				const m = data as TBAWebhooks.Types.Schema<'match_video'>;
				return [
					{
						args: `${m.match.event_key}:${m.match.comp_level}:${m.match.match_number}`,
						single: true
					}
				];
			}
			case 'schedule_updated':
				return [
					{ args: (data as TBAWebhooks.Types.Schema<'schedule_updated'>).event_key, single: true }
				];
			case 'starting_comp_level': {
				const m = data as TBAWebhooks.Types.Schema<'starting_comp_level'>;
				return [
					{ args: m.event_key, single: false },
					{ args: `${m.event_key}:${m.comp_level}`, single: true }
				];
			}
			case 'upcoming_match': {
				const m = data as TBAWebhooks.Types.Schema<'upcoming_match'>;
				const key = m.match_key;
				const parts = key.split('_');
				const match_number = parts[parts.length - 2];
				const comp_level = parts[parts.length - 1];
				return [
					{ args: m.event_key, single: false },
					{ args: `${m.event_key}:${comp_level}:${match_number}`, single: true }
				];
			}
			default:
				throw new Error(`Unhandled webhook type: ${type}`);
		}
	};

	export const findSubs = <K extends TBAWebhooks.Types.Schemas>(
		type: K,
		data: TBAWebhooks.Types.Schema<K>
	) => {
		return attemptAsync(async () => {
			const args = genArgs(type, data);
			const subs = await DB.select()
				.from(Subscriptions.table)
				.where(
					and(
						inArray(
							Subscriptions.table.args,
							args.map((a) => a.args)
						),
						eq(Subscriptions.table.type, type)
					)
				);
			return subs.map((s) => {
				const sub = Subscriptions.Generator(s);
				const argDef = args.find((a) => a.args === sub.data.args);
				if (!argDef) {
					throw new Error('Subscription argument definition not found');
				}
				return {
					sub,
					single: argDef.single
				};
			});
		});
	};

	const doNotify = (type: TBAWebhooks.Types.Schemas, data: any, whData: WebhookAlertsData) => {
		const notif = buildNotif(type, data);
		return (sub: SubscriptionData) => {
			return attemptAsync(async () => {
				if (sub.data.popup) {
					await Account.notifyPopup(sub.data.accountId, notif).unwrap();
				}
				if (sub.data.email) {
					const account = await Account.Account.fromId(sub.data.accountId).unwrap();
					if (!account) return;
					await sendEmail({
						type: 'tba-webhook',
						to: account.data.email,
						subject: notif.title,
						data: {
							manage_subscriptions_url:
								domain({ port: false, protocol: true }) + '/account/webhooks',
							timestamp: new Date().toLocaleDateString(),
							type: capitalize(fromSnakeCase(type)),
							username: account.data.username,
							view_event_url:
								domain({ port: false, protocol: true }) + `/webhooks/view/${whData.id}`
						}
					}).unwrap();
				}
			});
		};
	};

	const runWebhook =
		<K extends TBAWebhooks.Types.Schemas>(type: K) =>
		(data: any) => {
			return attemptAsync(async () => {
				const whData = await WebhookAlerts.new({
					type,
					data: JSON.stringify(data)
				}).unwrap();

				const safe = TBAWebhooks.messageSchemas[type].parse(data);
				const subs = await findSubs(type, safe).unwrap();
				const run = doNotify(type, safe, whData);
				await Promise.all(
					subs.map(async (s) => {
						if (s.single) {
							await s.sub.delete().unwrap();
						}
						await run(s.sub).unwrap();
					})
				);
				return whData;
			});
		};

	const buildNotif = <K extends TBAWebhooks.Types.Schemas>(
		type: K,
		data: TBAWebhooks.Types.Schema<K>
	): Notification => {
		switch (type) {
			case 'alliance_selection': {
				const d = data as TBAWebhooks.Types.Schema<'alliance_selection'>;
				return {
					title: `Alliance Selection Started for ${d.event_name}`,
					message: `First match to be announced`,
					severity: 'info',
					icon: {
						type: 'material-icons',
						name: 'group'
					}
				};
			}
			case 'match_score': {
				const d = data as TBAWebhooks.Types.Schema<'match_score'>;
				return {
					title: `Match ${d.match.comp_level.toUpperCase()} ${d.match.match_number} Scored at ${d.event_name}`,
					message: `Final Score: ${d.match.alliances.red.score} - ${d.match.alliances.blue.score}`,
					severity: 'info',
					icon: {
						type: 'material-icons',
						name: 'sports_martial_arts'
					}
				};
			}
			case 'match_video': {
				const d = data as TBAWebhooks.Types.Schema<'match_video'>;
				return {
					title: `New Video for Match ${d.match.comp_level.toUpperCase()} ${d.match.match_number} at ${d.event_name}`,
					message: `A new match video has been uploaded.`,
					severity: 'info',
					icon: {
						type: 'material-icons',
						name: 'videocam'
					}
				};
			}
			case 'schedule_updated': {
				const d = data as TBAWebhooks.Types.Schema<'schedule_updated'>;
				return {
					title: `Schedule Updated for ${d.event_name}`,
					message: `The event schedule has been updated.`,
					severity: 'info',
					icon: {
						type: 'material-icons',
						name: 'schedule'
					}
				};
			}
			case 'starting_comp_level': {
				const d = data as TBAWebhooks.Types.Schema<'starting_comp_level'>;
				return {
					title: `Starting ${d.comp_level.toUpperCase()} at ${d.event_name}`,
					message: `Matches are starting for the ${d.comp_level.toUpperCase()} level.`,
					severity: 'info',
					icon: {
						type: 'material-icons',
						name: 'play_circle_filled'
					}
				};
			}
			case 'upcoming_match': {
				const d = data as TBAWebhooks.Types.Schema<'upcoming_match'>;
				return {
					title: `Upcoming Match at ${d.event_name}`,
					message: `Match ${d.match_key} is scheduled at ${new Date(d.scheduled_time).toLocaleTimeString()}.`,
					severity: 'info',
					icon: {
						type: 'material-icons',
						name: 'alarm'
					}
				};
			}
			default:
				throw new Error(`Unhandled webhook type: ${type}`);
		}
	};

	const runMatchWebhook = <K extends TBAWebhooks.Types.Schemas>(type: K) => {
		const run = runWebhook(type);
		return (data: any) => {
			return attemptAsync(async () => {
				const whData = await run(data).unwrap();
				let event: Event;
				if (type === 'match_video') {
					event = await Event.getEvent((data as TBAWebhooks.Types.Schema<'match_video'>).match.event_key).unwrap();
				} else {
					event = await Event.getEvent((data as any).event_key).unwrap();
				}

				const matches = await event.getMatches().unwrap();

				let match: Match | undefined;
				if (type === 'match_video') {
					const d = data as TBAWebhooks.Types.Schema<'match_video'>;
					match = matches.find(
						(m) =>
							m.tba.comp_level === d.match.comp_level &&
							m.tba.match_number === d.match.match_number
					);
				} else if (type === 'match_score') {
					const d = data as TBAWebhooks.Types.Schema<'match_score'>;
					match = matches.find(
						(m) =>
							m.tba.comp_level === d.match.comp_level &&
							m.tba.match_number === d.match.match_number
					);
				} else if (type === 'upcoming_match') {
					const d = data as TBAWebhooks.Types.Schema<'upcoming_match'>;
					match = matches.find((m) => m.tba.key === d.match_key);
				} else {
					throw new Error('Unsupported match webhook type for runMatchWebhook');
				}

				if (!match) {
					throw new Error('Match not found for webhook processing');
				}

				const teams = teamsFromMatch(match.tba);

				const subs = await DB.select()
					.from(Subscriptions.table)
					.where(
						and(
							inArray(
								Subscriptions.table.args,
								teams.map(t => `${event.tba.key}:team:${t}`)
							),
							eq(Subscriptions.table.type, type)
						)
					);

				const subData = subs.map((s) => Subscriptions.Generator(s));

				const doTeamSub = doNotify(type, data, whData);
				await Promise.all(
					subData.map(async (s) => {
						await doTeamSub(s);
					})
				);
			});
		}
	};

	export const init = (name: string) => {
		return attempt(async () => {
			const service = TBAWebhooks.init(name).unwrap();

			service.on('alliance_selection', runWebhook('alliance_selection'));
			service.on('schedule_updated', runWebhook('schedule_updated'));
			service.on('starting_comp_level', runWebhook('starting_comp_level'));
			// service.on('broadcast', runWebhook('broadcast'));

			// match specific webhooks - uses team subscription
			service.on('upcoming_match', runMatchWebhook('upcoming_match'));
			service.on('match_score', runMatchWebhook('match_score'));
			service.on('match_video', runMatchWebhook('match_video'));
		});
	};
}

export const _subscriptions = Webhooks.Subscriptions.table;
export const _webhookAlerts = Webhooks.WebhookAlerts.table;
