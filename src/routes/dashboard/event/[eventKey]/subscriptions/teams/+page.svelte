<script lang="ts">
	import { Webhooks } from '$lib/model/webhooks';
	import { Account } from '$lib/model/account';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { TBAEvent, TBATeam } from '$lib/utils/tba';
	import { Form } from '$lib/utils/form';
	import { confirm, notify } from '$lib/utils/prompts';
	import { capitalize, fromSnakeCase, resolveAll } from 'ts-utils';
	import { freqEst, getDesc } from '$lib/utils/webhooks';
	import nav from '$lib/nav/robot-display';

	const eventKey = String(page.params.eventKey);
	let event: TBAEvent | undefined = $state(undefined);

	type T = {
		team: TBATeam;
		show: boolean;
	};

	let teams: T[] = $state([]);
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
		const self = Account.getSelf();
		self.await().then((res) => {
			if (res.isOk()) {
				subscriptions = Webhooks.Subscriptions.get(
					{
						accountId: res.value.data.id
					},
					{
						type: 'all'
					}
				);
			}
		});

		TBAEvent.getEvent(eventKey, false, new Date(Date.now() + 1000 * 60 * 60 * 24)).then((e) => {
			if (e.isOk()) {
				event = e.value;
				nav(event.tba);
				event.getTeams(false, new Date(Date.now() + 1000 * 60 * 10)).then((ts) => {
					if (ts.isOk()) {
						teams = ts.value.map((m) => ({
							show: false,
							team: m
						}));
					}
				});
			}
		});
		return () => {
			// u1();
		};
	});
</script>

{#snippet row(type: string, team: T)}
	{@const args = `${eventKey}:team:${team.team.tba.team_number}`}
	{@const subscribed = $subscriptions.find((s) => s.data.type === type && s.data.args === args)}
	<tr class:collapse={!team.show}>
		<td class="prop"></td>
		<td class="prop">
			{capitalize(fromSnakeCase(type))}
		</td>
		<td>
			{getDesc(type, args)}
		</td>
		<td class="prop">
			{freqEst(type, args)}
		</td>
		<td class="prop">
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

{#snippet teamRow(team: T)}
	{@const args = `${eventKey}:team:${team.team.tba.team_number}`}
	{@const subs = $subscriptions.filter(
		(s) => s.data.args === `${eventKey}:team:${team.team.tba.team_number}`
	)}
	<tr class="team-row">
		<td class="ws-nowrap prop">
			<button
				type="button"
				class="btn w-100"
				class:btn-danger={subs.length > 0}
				class:btn-success={subs.length === 0}
				onclick={async () => {
					// subscribe to all
					if (subs.length) {
						if (await confirm('Are you sure you want to completely unsubscribe from this match?')) {
							const res = resolveAll(await Promise.all(subs.map((s) => s.delete())));
							if (res.isOk()) {
								notify({
									autoHide: 3000,
									title: `Unsubscribed from Team ${team.team.tba.team_number} Webhooks`,
									message: `You have successfully unsubscribed from all notifications for Match ${team.team.tba.team_number}.`,
									color: 'success'
								});
							} else {
								notify({
									autoHide: 5000,
									title: `Failed to Unsubscribe from Team ${team.team.tba.team_number} Webhooks`,
									message: `An error occurred while unsubscribing: ${res.error.message}`,
									color: 'danger'
								});
							}
						}
					} else {
						const {
							value: { Preferences }
						} = await getNotify();
						const res = resolveAll(
							await Promise.all([
								Webhooks.subscribe(
									'match_score',
									args,
									Preferences.includes('email'),
									Preferences.includes('popup'),
									Preferences.includes('discord')
								),
								Webhooks.subscribe(
									'match_video',
									args,
									Preferences.includes('email'),
									Preferences.includes('popup'),
									Preferences.includes('discord')
								),
								Webhooks.subscribe(
									'upcoming_match',
									args,
									Preferences.includes('email'),
									Preferences.includes('popup'),
									Preferences.includes('discord')
								)
							])
						);

						if (res.isOk()) {
							notify({
								autoHide: 3000,
								title: `Subscribed to Team ${team.team.tba.team_number} Webhooks`,
								message: `You have successfully subscribed to all notifications for Match ${team.team.tba.team_number}.`,
								color: 'success'
							});
						} else {
							notify({
								autoHide: 5000,
								title: `Failed to Subscribe to Team ${team.team.tba.team_number} Webhooks`,
								message: `An error occurred while subscribing: ${res.error.message}`,
								color: 'danger'
							});
						}
					}
				}}
			>
				<i class="material-icons">
					{subs.length ? 'notifications_off' : 'notifications_active'}
				</i>
				({subs.length})
			</button>
		</td>
		<td class="prop">
			{team.team.tba.team_number}
		</td>
		<td colspan="2">
			{team.team.tba.nickname}
		</td>
		<td class="prop">
			<button type="button" class="btn w-100" onclick={() => (team.show = !team.show)}>
				<i class="material-icons">
					{team.show ? 'expand_less' : 'expand_more'}
				</i>
			</button>
		</td>
	</tr>
	{@render row('match_score', team)}
	{@render row('match_video', team)}
	{@render row('upcoming_match', team)}
{/snippet}

{#snippet link(name: string, desc: string, freq: string, url: string)}
	<tr>
		<td class="prop"></td>
		<td class="prop">
			{name}
		</td>
		<td>
			{desc}
		</td>
		<td class="prop">
			{freq}
		</td>
		<td class="prop">
			<a href={url} class="btn btn-primary w-100">Go</a>
		</td>
	</tr>
{/snippet}

<div class="container layer-1 pt-3">
	<div class="row mb-3">
		<h1>Webhook Subscriptions for Event {event?.tba.name || eventKey}</h1>
		<p>
			<small class="text-muted">
				Manage your match subscriptions here. Click on a match number to subscribe or unsubscribe
				from all match-related notifications for that match. Use the dropdowns to manage individual
				subscriptions.
			</small>
		</p>
	</div>
	<div class="row mb-3">
		<a
			href="/account/subscriptions"
			target="_blank"
			rel="noopener noreferrer"
			class="btn btn-primary">Manage My Subscriptions ({$subscriptions.length})</a
		>
	</div>
	<div class="row mb-3">
		<table class="table table-dark">
			<thead>
				<tr>
					<th class="prop">Match</th>
					<th class="prop">Type</th>
					<th>Description</th>
					<th class="prop">Frequency</th>
					<th class="prop">Action</th>
				</tr>
			</thead>
			<tbody>
				{@render link(
					'matches',
					'Subscribe to updates about matches at this event',
					'Varies',
					`/dashboard/event/${eventKey}/subscriptions/matches`
				)}
				{@render link(
					'event',
					'Subscribe to event updates',
					'Varies',
					`/dashboard/event/${eventKey}/subscriptions`
				)}
				<!-- {#key render} -->
				{#each teams as match}
					{@render teamRow(match)}
				{/each}
				<!-- {/key} -->
			</tbody>
		</table>
	</div>
</div>

<style>
	.team-row td.prop {
		width: 12.5% !important;
	}
</style>
