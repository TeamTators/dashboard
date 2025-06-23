import { Redis } from "./redis";
import { EventEmitter } from "ts-utils/event-emitter";
import { z } from "zod";

export namespace TBAWebhooks {
    export const messageSchemas: {
        [key: string]: z.ZodTypeAny;
    } = {
        'upcoming_match': z.object({
            event_key: z.string(),
            match_key: z.string(),
            event_name: z.string(),
            team_keys: z.tuple([z.string(), z.string(), z.string(), z.string(), z.string(), z.string()]),
            scheduled_time: z.number(),
            predicted_time: z.number().optional(),
            webcast: z.object({
                type: z.string(),
                channel: z.string(),
            }).optional(),
        }),
        'match_score': z.object({
            event_name: z.string(),
            match: z.object({
                comp_level: z.string(),
                match_number: z.number(),
                videos: z.array(z.object({
                    key: z.string(),
                    type: z.string(), // or z.enum(['youtube', 'twitch']) if values are known/fixed
                })).optional().catch(() => []),
                alliances: z.object({
                    blue: z.object({
                        score: z.number(),
                        team_keys: z.tuple([z.string(), z.string(), z.string()]),
                    }),
                    red: z.object({
                        score: z.number(),
                        team_keys: z.tuple([z.string(), z.string(), z.string()]),
                    }),
                }),
            }),
            event_key: z.string(),
        }),
        'starting_comp_level': z.object({
            event_name: z.string(),
            comp_level: z.string(),
            event_key: z.string(),
            scheduled_time: z.number(),
        }),
        'alliance_selection': z.object({
            event_name: z.string(),
            event_key: z.string(),
            event: z.object({
                address: z.string(),
                city: z.string(),
                country: z.string(),
                district: z.object({
                    abbreviation: z.string(),
                    display_name: z.string(),
                    key: z.string(),
                    year: z.number(),
                }),
                division_keys: z.array(z.string()),
                end_date: z.string(), // ISO date string
                event_code: z.string(),
                event_type: z.number(),
                event_type_string: z.string(),
                first_event_code: z.string(),
                first_event_id: z.string(),
                gmaps_place_id: z.string(),
                gmaps_url: z.string().url(),
                key: z.string(),
                lat: z.number(),
                lng: z.number(),
                location_name: z.string(),
                name: z.string(),
                parent_event_key: z.string().nullable(),
                playoff_type: z.number().nullable(),
                playoff_type_string: z.string().nullable(),
                postal_code: z.string(),
                short_name: z.string(),
                start_date: z.string(), // ISO date string
                state_prov: z.string(),
                timezone: z.string(),
                webcasts: z.array(z.object({
                    channel: z.string(),
                    file: z.string(),
                    type: z.string(), // or z.enum(['livestream']) if values are known/fixed
                })),
                website: z.string().url(),
                week: z.number(),
                year: z.number(),
            }),
        }),
        'awards_posted': z.object({
            event_key: z.string(),
            team_key: z.string(),
            event_name: z.string(),
            awards: z.array(z.object({
                name: z.string(),
                award_type: z.number(),
                year: z.number(),
                event_key: z.string(),
                recipient_list: z.array(z.object({
                    awardee: z.unknown().nullable(),
                    team_key: z.string(),
                })),
            })),
        }),
        'schedule_updated': z.object({
            event_key: z.string(),
            event_name: z.string(),
            firsts_match_time: z.number(),
        }),
        'ping': z.object({
            title: z.string(),
            desc: z.string(),
        }),
        'broadcast': z.object({
            title: z.string(),
            desc: z.string(),
            url: z.string().url(),
        }),
        'verification': z.object({
            verification_key: z.string(),
        }),
        'match_video': z.object({
            event_name: z.string(),
            match: z.object({
                comp_level: z.string(),
                match_number: z.number(),
                videos: z.array(z.object({
                    key: z.string(),
                    type: z.string(), // or z.enum(['youtube', 'twitch']) if values are known/fixed
                })),
                time_string: z.string().optional(),
                set_number: z.number(),
                key: z.string(),
                time: z.number(),
                score_breakdown: z.unknown().nullable().optional(),
                event_key: z.string(),
            })
        }),
    }


    const em = new EventEmitter<{
        [key in keyof typeof messageSchemas]: z.infer<typeof messageSchemas[key]>;
    }>();

    let service: Redis.ListeningService<any, any>;



    export const on = em.on.bind(em);
    export const off = em.off.bind(em);
    export const once = em.once.bind(em);

    export const init = () => {
        service = Redis.createListeningService(
            'tba_webhooks_dev', 
            messageSchemas
        );

        service.on('upcomming_match', (data) => {
            console.log('upcoming_match', data);
        });
    };
}