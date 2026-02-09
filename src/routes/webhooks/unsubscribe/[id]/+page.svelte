<script lang="ts">
	import { Webhooks } from '$lib/model/webhooks';
	import { notify } from '$lib/utils/prompts';
	import { freqEst, getDesc } from '$lib/utils/webhooks';
	import { capitalize, fromSnakeCase } from 'ts-utils';

	const { data } = $props();
	const sub = $derived(Webhooks.Subscriptions.Generator(data.sub));
</script>

<div class="container d-flex flex-column align-items-center justify-content-center vh-100">
	<div class="card shadow-sm p-4" style="max-width: 400px; width: 100%;">
		<h5 class="text-center mb-3">
			Do you want to unsubscribe from <strong class="text-primary"
				>{capitalize(fromSnakeCase(String($sub.type)))}</strong
			>?
			<br />
		</h5>
		<p class="text-muted">
			Description: {getDesc(String($sub.type), String($sub.args))}
			<br />
			Will run: {freqEst(String($sub.type), String($sub.args))}
		</p>

		<button
			type="button"
			class="btn btn-warning"
			onclick={async () => {
				const res = await sub.delete();
				if (res.isOk()) {
					notify({
						title: 'Unsubscribed',
						message: 'You have been unsubscribed successfully.',
						color: 'success',
						autoHide: 3000
					});
				} else {
					notify({
						title: 'Unsubscribe Failed',
						message: `Failed to unsubscribe: ${res.error}`,
						color: 'danger',
						autoHide: 5000
					});
				}
			}}
		>
			Unsubscribe
		</button>
	</div>
</div>
