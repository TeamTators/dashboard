import { text } from "drizzle-orm/pg-core";
import { Struct } from "drizzle-struct/back-end";
import { Account } from "./account";
import { attempt, attemptAsync } from "ts-utils/check";
import { TBAWebhooks } from "../services/tba-webhooks";
import { domain, str } from "../utils/env";
import { DB } from "../db";
import { and, eq } from "drizzle-orm";
import { sendEmail } from "../services/email";
import { CallListener } from "../services/struct-listeners";
import z from "zod";
import terminal from "../utils/terminal";

export namespace Subscription {
    export const WebhookSubscription = new Struct({
        name: 'webhook_subscription',
        structure: {
            accountId: text('account_id').notNull(),
            type: text('type').notNull(),
            args: text('args').notNull(),
        }
    });

    export type WebhookSubscriptionData = typeof WebhookSubscription.sample;

    CallListener.on(
        'create-subscription',
        WebhookSubscription,
        z.object({
            type: z.string(),
            args: z.string(),
        }),
        async (event, data) => {
            if (!event.locals.account) {
                return {
                    success: false,
                    message: 'Not logged in',
                }
            }

            if (!event.locals.account.data.verified) {
                return {
                    success: false,
                    message: 'Your account must be verified to create a subscription',
                }
            }

            const exists = await DB.select()
                .from(WebhookSubscription.table)
                .where(
                    and(
                        eq(WebhookSubscription.table.accountId, event.locals.account.id),
                        eq(WebhookSubscription.table.type, data.type),
                        eq(WebhookSubscription.table.args, data.args),
                    )
                )
                .limit(1);

            if (exists.length > 0) {
                return {
                    success: false,
                    message: 'You already have a subscription for this exact trigger',
                }
            }

            const res = await WebhookSubscription.new({
                accountId: event.locals.account.id,
                type: data.type,
                args: data.args,
            });

            if (!res.isOk()) {
                terminal.error('Failed to create subscription', res.error);
                return {
                    success: false,
                    message: 'Failed to create subscription',
                }
            }

            Account.sendAccountNotif(event.locals.account.id, {
                icon: {
                    type: 'material-icons',
                    name: 'notifications',
                },
                link: `/tba-subscription/${res.value.id}`,
                severity: 'info',
                title: 'Subscription Created',
                message: `You have successfully created a subscription for ${data.type}.`,
            });

            return {
                success: true,
            }
        },
    );

    CallListener.on(
        'delete-subscription',
        WebhookSubscription,
        z.object({
            id: z.string(),
        }),
        async (event, data) => {
            if (!event.locals.account) {
                return {
                    success: false,
                    message: 'Not logged in',
                }
            }

            const sub = await WebhookSubscription.fromId(data.id).unwrap();
            if (!sub) {
                return {
                    success: false,
                    message: 'Subscription not found',
                }
            }

            if (sub.data.accountId !== event.locals.account.id) {
                return {
                    success: false,
                    message: 'You do not have permission to delete this subscription',
                }
            }

            const res = await sub.delete();
            if (!res.isOk()) {
                terminal.error('Failed to delete subscription', res.error);
                return {
                    success: false,
                    message: 'Failed to delete subscription',
                }
            }
            return {
                success: true,
            }
        }
    );

    export const getSubscriptions = (
        type: string,
        args: string,
    ) => {
        return attemptAsync(async () => {
            const res = await DB.select()
                .from(WebhookSubscription.table)
                .where(
                    and(
                        
                    eq(WebhookSubscription.table.type, type),
                    eq(WebhookSubscription.table.args, args),
                    )
                );

            return res.map(r => WebhookSubscription.Generator(r));
        });
    };

    export const init = () => {
        return attempt(() => {
            const service = TBAWebhooks.init(
                str('LOCAL_TBA_WEBHOOK_REDIS_NAME', true),
            );

            // service.on('match_video', async (data) => {
            //     const subs = await getSubscriptions('match_video', data.data.match.key);
            //     if (subs.isOk()) {

            //     }
            // });

            service.on('schedule_updated', async (data) => {
                const subs = await getSubscriptions('schedule_updated', data.data.event_key);
                if (subs.isOk()) {
                    await Promise.all(subs.value.map(async (sub) => {
                        const account = await Account.Account.fromId(sub.data.accountId);
                        if (account.isOk() && account.value) {
                            Account.sendAccountNotif(account.value.id, {
                                icon: {
                                    type: 'material-icons',
                                    name: 'event',
                                },
                                link: `/dashboard/event/${data.data.event_key}/matches`,
                                severity: 'info',
                                title: 'Event Schedule Updated',
                                message: 'The schedule for the event has been updated.',
                            });

                            Account.notifyPopup(account.value.id, {
                                icon: {
                                    type: 'material-icons',
                                    name: 'event',
                                },
                                severity: 'info',
                                title: 'Event Schedule Updated',
                                message: 'The schedule for the event has been updated.',
                            });

                            sendEmail({
                                to: account.value.data.email,
                                subject: `Schedule Updated for ${data.data.event_key}`,
                                type: 'tba-subscription',
                                data: {
                                    details: `The schedule for the event ${data.data.event_key} has been updated. Visit https://thebluealliance.com/event/${data.data.event_key}/matches to see the latest schedule.`,
                                    triggerName: 'Schedule Updated',
                                    triggerDescription: 'Runs when the schedule for an event is updated on TBA.',
                                    manageSubscription: `${domain({ protocol: true, port: false })}/tba-subscription/${sub.id}`,
                                },
                            });
                        }
                    }));
                }
            });

            service.on('upcoming_match', async (data) => {
                if (data.data.team_keys.includes('frc2122')) {
                    const subs = await getSubscriptions('tator_matches', data.data.event_key);
                    if (subs.isOk()) {
                        await Promise.all(subs.value.map(async (sub) => {
                            const account = await Account.Account.fromId(sub.data.accountId);
                            if (account.isOk() && account.value) {
                                Account.sendAccountNotif(account.value.id, {
                                    icon: {
                                        type: 'material-icons',
                                        name: 'event',
                                    },
                                    link: `/dashboard/event/${data.data.event_key}/matches`,
                                    severity: 'info',
                                    title: 'Upcoming Match',
                                    message: `The upcoming match for team 2122 is ${data.data.match_key}.`,
                                });

                                Account.notifyPopup(account.value.id, {
                                    icon: {
                                        type: 'material-icons',
                                        name: 'event',
                                    },
                                    severity: 'info',
                                    title: 'Upcoming Match',
                                    message: `The upcoming match for team 2122 is ${data.data.match_key}.`,
                                });

                                Account.notifyPopup(account.value.id, {
                                    icon: {
                                        type: 'material-icons',
                                        name: 'event',
                                    },
                                    severity: 'info',
                                    title: 'Upcoming Match',
                                    message: `The upcoming match for team 2122 is ${data.data.match_key}.`,
                                });
                            }
                        }));
                    }
                }
            });

            service.on('match_video', async (data) => {
                const subs = await getSubscriptions('match_video', data.data.match.key);
                if (subs.isOk()) {
                    await Promise.all(subs.value.map(async (sub) => {
                        const account = await Account.Account.fromId(sub.data.accountId);
                        if (account.isOk() && account.value) {
                            Account.sendAccountNotif(account.value.id, {
                                icon: {
                                    type: 'material-icons',
                                    name: 'videocam',
                                },
                                link: `/dashboard/event/${data.data.match.event_key}/matches`,
                                severity: 'info',
                                title: 'Match Video Posted',
                                message: `A video for match ${data.data.match.key} has been posted.`,
                            });

                            Account.notifyPopup(account.value.id, {
                                icon: {
                                    type: 'material-icons',
                                    name: 'videocam',
                                },
                                severity: 'info',
                                title: 'Match Video Posted',
                                message: `A video for match ${data.data.match.key} has been posted.`,
                            });

                            sendEmail({
                                to: account.value.data.email,
                                subject: `Video Posted for Match ${data.data.match.key}`,
                                type: 'tba-subscription',
                                data: {
                                    details: `A video for match ${data.data.match.key} has been posted. Visit https://thebluealliance.com/match/${data.data.match.key} to watch the video.`,
                                    triggerName: 'Match Video Posted',
                                    triggerDescription: 'Runs when a match video is posted on TBA.',
                                    manageSubscription: `${domain({ protocol: true, port: false })}/tba-subscription/${sub.id}`,
                                },
                            });
                        }
                    }));
                }
            });

            return service;
        });
    };
}

export const _webhookSubscriptions = Subscription.WebhookSubscription.table;