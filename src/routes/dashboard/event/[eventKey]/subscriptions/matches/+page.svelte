<script lang="ts">
	import { Webhooks } from '$lib/model/webhooks';
	import { Account } from '$lib/model/account';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { TBAEvent, TBAMatch } from '$lib/utils/tba';
	import { Form } from '$lib/utils/form';
	import { confirm, notify } from '$lib/utils/prompts';
	import { capitalize, fromSnakeCase, resolveAll } from 'ts-utils';
	import { freqEst, getDesc } from '$lib/utils/webhooks';
	import nav from '$lib/imports/robot-display'
	import { teamsFromMatch } from 'tatorscout/tba';

	const eventKey = String(page.params.eventKey);
	let event: TBAEvent | undefined = $state(undefined);

    type M = {
        match: TBAMatch;
        show: boolean;
    }

    let matches: M[] = $state([]);
	let subscriptions = $state(Webhooks.Subscriptions.arr());

	const getNotify = async () => {
		return new Form()
			.input('Preferences', {
				type: 'checkbox',
				options: [
					{
						label: 'Email',
						value: 'email'
					},
					{
						label: 'Popup',
						value: 'popup',
						selected: true
						// }, {
						//     disabled: false,
						//     label: 'Discord',
						//     value: 'discord',
					}
				],
				label: 'Preferences',
				required: true
			})
			.prompt({
				title: 'Notification Preferences',
				send: false
			})
			.unwrap();
	};

    // let render = $state(0);

	onMount(() => {
        // let u1 = () => {};
		Account.getSelfAsync().then((s) => {
			if (s.isOk()) {
				subscriptions = Webhooks.Subscriptions.fromProperty('accountId', String(s.value.data.id), {
					type: 'all'
				});
                // u1 = subscriptions.subscribe(() => render++);
			}
		});

		TBAEvent.getEvent(eventKey, false, new Date(Date.now() + 1000 * 60 * 60 * 24)).then((e) => {
			if (e.isOk()) {
				event = e.value;
				nav(event.tba);
                event.getMatches(false, new Date(Date.now() + 1000 * 60 * 10)).then(ms => {
                    if (ms.isOk()) {
                        matches = ms.value.map(m => ({
                            show: false,
                            match: m
                        }) );
                    }
                });
			}
		});
        return () => {
            // u1();
        }
	});
</script>

{#snippet row(type: string, match: M)}
    {@const args = `${eventKey}:${match.match.tba.comp_level}:${match.match.tba.match_number}`}
	{@const subscribed = $subscriptions.find((s) => s.data.type === type && s.data.args === args)}
    <tr
        class:collapse={!match.show}
    >
        <td></td>
        <td>
            {capitalize(fromSnakeCase(type))}
        </td>
        <td colspan="3">
            {getDesc(type, args)}
        </td>
        <td colspan="2">
            {freqEst(type, args)}
        </td>
        <td>
            	<button
		type="button"
		class="btn w-100"
        class:btn-danger={subscribed}
        class:btn-success={!subscribed}
		onclick={async () => {
			if (subscribed) {
				if (
					await confirm(
						`Are you sure you want to unsubscribe from ${fromSnakeCase(type)} notifications for ${event?.tba.name || eventKey}?`
					)
				) {
					const res = await subscribed.delete();

					if (res.isOk()) {
						notify({
							autoHide: 3000,
							title: `Unsubscribed from ${capitalize(fromSnakeCase(type))} Webhook`,
							message: `You have successfully unsubscribed from ${fromSnakeCase(type)} notifications for ${event?.tba.name || eventKey}.`,
							color: 'success'
						});
					} else {
						notify({
							autoHide: 5000,
							title: `Failed to Unsubscribe from ${capitalize(fromSnakeCase(type))} Webhook`,
							message: `An error occurred while unsubscribing: ${res.error.message}`,
							color: 'danger'
						});
					}
				}
			} else {
				const {
					value: { Preferences }
				} = await getNotify();
				const res = await Webhooks.subscribe(
					type,
					args,
					Preferences.includes('email'),
					Preferences.includes('popup'),
					Preferences.includes('discord')
				);

				if (res.isOk()) {
					notify({
						autoHide: 3000,
						title: `Subscribed to ${capitalize(fromSnakeCase(type))} Webhook`,
						message: `You have successfully subscribed to ${fromSnakeCase(type)} notifications for ${event?.tba.name || eventKey}.`,
						color: 'success'
					});
				} else {
					notify({
						autoHide: 5000,
						title: `Failed to Subscribe to ${capitalize(fromSnakeCase(type))} Webhook`,
						message: `An error occurred while subscribing: ${res.error.message}`,
						color: 'danger'
					});
				}
			}
		}}
	>
		<i class="material-icons">
            {subscribed ? 'notifications_off' : 'notifications_active'}
        </i>
	</button>
        </td>
    </tr>
{/snippet}

{#snippet matchRow(match: M)}
    {@const teams = teamsFromMatch(match.match.tba)}
    {@const subs = $subscriptions.filter(s => s.data.args === `${eventKey}:${match.match.tba.comp_level}:${match.match.tba.match_number}`)}
    <tr class="match-row" class:tator={teams.includes(2122)}>
        <td class="ws-nowrap">
            <button type="button" class="btn w-100" class:btn-danger={subs.length > 0} class:btn-success={subs.length === 0} onclick={async () => {
                // subscribe to all
                if (subs.length) {
                    if (await confirm('Are you sure you want to completely unsubscribe from this match?')) {
                        const res = resolveAll(await Promise.all(subs.map(s => s.delete())));
                        if (res.isOk()) {
                            notify({
                                autoHide: 3000,
                                title: `Unsubscribed from Match ${match.match.tba.comp_level}${match.match.tba.match_number} Webhooks`,
                                message: `You have successfully unsubscribed from all notifications for Match ${match.match.tba.comp_level}${match.match.tba.match_number}.`,
                                color: 'success'
                            });
                        } else {
                            notify({
                                autoHide: 5000,
                                title: `Failed to Unsubscribe from Match ${match.match.tba.comp_level}${match.match.tba.match_number} Webhooks`,
                                message: `An error occurred while unsubscribing: ${res.error.message}`,
                                color: 'danger'
                            });
                        }
                    }
                } else {
                    const {
                        value: { Preferences }
                    } = await getNotify();
                    const res = resolveAll(await Promise.all([
                        Webhooks.subscribe(
                            'match_score',
                            `${eventKey}:${match.match.tba.comp_level}:${match.match.tba.match_number}`,
                            Preferences.includes('email'),
                            Preferences.includes('popup'),
                            Preferences.includes('discord')
                        ),
                        Webhooks.subscribe(
                            'match_video',
                            `${eventKey}:${match.match.tba.comp_level}:${match.match.tba.match_number}`,
                            Preferences.includes('email'),
                            Preferences.includes('popup'),
                            Preferences.includes('discord')
                        ),
                        Webhooks.subscribe(
                            'upcoming_match',
                            `${eventKey}:${match.match.tba.comp_level}:${match.match.tba.match_number}`,
                            Preferences.includes('email'),
                            Preferences.includes('popup'),
                            Preferences.includes('discord')
                        )
                    ]));

                    if (res.isOk()) {
                        notify({
                            autoHide: 3000,
                            title: `Subscribed to Match ${match.match.tba.comp_level}${match.match.tba.match_number} Webhooks`,
                            message: `You have successfully subscribed to all notifications for Match ${match.match.tba.comp_level}${match.match.tba.match_number}.`,
                            color: 'success'
                        });
                    } else {
                        notify({
                            autoHide: 5000,
                            title: `Failed to Subscribe to Match ${match.match.tba.comp_level}${match.match.tba.match_number} Webhooks`,
                            message: `An error occurred while subscribing: ${res.error.message}`,
                            color: 'danger'
                        });
                    }
                }
            }}>
                {match.match.tba.comp_level}{match.match.tba.match_number} ({subs.length})
            </button>
        </td>
        {#each teams as team, i}
            <td 
                class:text-danger={i < teams.length / 2}
                class:text-primary={i >= teams.length / 2}
            >
                {team}
            </td>
        {/each}
        <td>
            <button type="button" class="btn w-100" onclick={() => match.show = !match.show}>
                <i class="material-icons">
                    {match.show ? 'expand_less' : 'expand_more'}
                </i>
            </button>
        </td>
    </tr>
    {@render row('match_score', match)}
    {@render row('match_video', match)}
    {@render row('upcoming_match', match)}
{/snippet}

{#snippet link(name: string, desc: string, freq: string, url: string)}
	<tr>
        <td></td>
		<td>
			{name}
		</td>
		<td colspan={3}>
			{desc}
		</td>
		<td>
			{freq}
		</td>
        <td></td>
		<td>
			<a href="{url}" class="btn btn-primary w-100">Go</a>
		</td>
	</tr>
{/snippet}

<div class="container layer-1 pt-3">
	<div class="row mb-3">
		<h1>Webhook Subscriptions for Event {event?.tba.name || eventKey}</h1>
        <p>
            <small class="text-muted">
                Manage your match subscriptions here. Click on a match number to subscribe or unsubscribe from all match-related notifications for that match. Use the dropdowns to manage individual subscriptions.
            </small>
        </p>
	</div>
	<div class="row mb-3">
		<a href="/account/subscriptions" target="_blank" rel="noopener noreferrer" class="btn btn-primary">Manage My Subscriptions ({$subscriptions.length})</a>
	</div>
	<div class="row mb-3">
        <table class="table table-dark">
            <thead>
                <tr>
                    <th>Match</th>
                    <th>Type</th>
                    <th colspan="3">Description</th>
                    <th>Frequency</th>
                    <th>Action</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
				{@render link('teams', 'Subscribe to updates about teams at this event', 'Varies',`/dashboard/event/${eventKey}/subscriptions/teams`)}
				{@render link('event', 'Subscribe to event updates', 'Varies',`/dashboard/event/${eventKey}/subscriptions`)}
                <!-- {#key render} -->
                    {#each matches as match}
                        {@render matchRow(match)}
                    {/each}
                <!-- {/key} -->
            </tbody>
        </table>
	</div>
</div>


<style>
    .match-row td {
        width: 12.5% !important;
    }
    .tator {
        border: 2px purple solid !important;
    }
</style>