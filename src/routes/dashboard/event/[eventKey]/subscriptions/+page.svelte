<script lang="ts">
	import { Webhooks } from '$lib/model/webhooks';
	import { Account } from '$lib/model/account';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { TBAEvent } from '$lib/utils/tba';
	import { Form } from '$lib/utils/form';
	import { confirm, notify } from '$lib/utils/prompts';
	import { capitalize, fromSnakeCase } from 'ts-utils';
	import { freqEst, getDesc } from '$lib/utils/webhooks';
	import nav from '$lib/nav/robot-display';

	const eventKey = String(page.params.eventKey);
	let event: TBAEvent | undefined = $state(undefined);
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
			}
		});
	});
</script>

{#snippet row(type: string)}
	{@const subscribed = $subscriptions.find((s) => s.data.type === type && s.data.args === eventKey)}
	<tr>
		<td>
			{capitalize(fromSnakeCase(type))}
		</td>
		<td>
			{getDesc(type, eventKey)}
		</td>
		<td>
			{freqEst(type, eventKey)}
		</td>
		<td>
			<button
				type="button"
				class="btn btn-{subscribed ? 'danger' : 'success'}"
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
							eventKey,
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

{#snippet link(name: string, desc: string, freq: string, url: string)}
	<tr>
		<td>
			{name}
		</td>
		<td>
			{desc}
		</td>
		<td>
			{freq}
		</td>
		<td>
			<a href={url} class="btn btn-primary">Go</a>
		</td>
	</tr>
{/snippet}

<div class="container layer-1 pt-3">
	<div class="row mb-3">
		<h1>Webhook Subscriptions for Event {event?.tba.name || eventKey}</h1>
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
		<table class="table table-striped table-dark">
			<thead>
				<tr>
					<th>Type</th>
					<th>Description</th>
					<th>Frequency</th>
					<th>Action</th>
				</tr>
			</thead>
			<tbody>
				{@render link(
					'teams',
					'Subscribe to updates about teams at this event',
					'Varies',
					`/dashboard/event/${eventKey}/subscriptions/teams`
				)}
				{@render link(
					'matches',
					'Subscribe to updates about matches at this event',
					'Varies',
					`/dashboard/event/${eventKey}/subscriptions/matches`
				)}
				{@render row('alliance_selection')}
				{@render row('match_score')}
				{@render row('schedule_updated')}
				{@render row('starting_comp_level')}
				{@render row('upcoming_match')}
			</tbody>
		</table>
	</div>
</div>
