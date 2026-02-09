<script lang="ts">
	import { page } from '$app/state';
	import { Account } from '$lib/model/account';
	import { Webhooks } from '$lib/model/webhooks';
	import { Form } from '$lib/utils/form';
	import { notify } from '$lib/utils/prompts';
	import { freqEst, getDesc } from '$lib/utils/webhooks';
	import { capitalize, fromSnakeCase, sleep } from 'ts-utils';

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

	const type = String(page.params.type);
	const args = String(page.params.args);
</script>

<div class="container d-flex flex-column align-items-center justify-content-center vh-100">
	<div class="card shadow-sm p-4" style="max-width: 400px; width: 100%;">
		<h5 class="text-center mb-3">
			Do you want to subscribe to <strong class="text-primary"
				>{capitalize(fromSnakeCase(type))}</strong
			>?
			<br />
		</h5>
		<p class="text-muted">
			Description: {getDesc(type, args)}
			<br />
			Will run: {freqEst(type, args)}
		</p>

		<button
			type="button"
			class="btn btn-primary"
			onclick={async () => {
				const {
					value: { Preferences }
				} = await getNotify();

				const self = await Account.getSelf().await();
				if (self.isErr()) {
					console.error('Failed to get account info:', self.error);
					return;
				}

				const res = await Webhooks.Subscriptions.new({
					type: type,
					args: args,
					accountId: String(self.value.data.id),
					email: Preferences.includes('email'),
					popup: Preferences.includes('popup'),
					discord: Preferences.includes('discord')
				});

				if (res.isOk()) {
					notify({
						autoHide: 3000,
						title: `Subscribed to ${capitalize(fromSnakeCase(type))} Webhook`,
						message: `You have successfully subscribed to ${fromSnakeCase(type)}.`,
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

				await sleep(1000);
				window.location.href = '/account/subscriptions';
			}}
		>
			Subscribe to Event(s)
		</button>
	</div>
</div>
