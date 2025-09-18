<script lang="ts">
	import { Subscription } from '$lib/model/subscription.js';

	const { data } = $props();

	const subscription = $derived(Subscription.WebhookSubscription.Generator(data.subscription));
</script>

<svelte:head>
	<title>Subscription Details - {$subscription.type}</title>
</svelte:head>

<div class="container">
	<div class="row mb-3">
		<div class="col">
			<h2>Subscription Details</h2>
		</div>
	</div>
	<div class="row mb-3">
		<div class="col">
			<p><strong>Type:</strong> {$subscription.type}</p>
			<p><strong>Arguments:</strong> {$subscription.args}</p>
			<p>
				<strong>Created At:</strong>
				{$subscription.created?.toLocaleString() || 'Invalid Date'}
			</p>
			<p>
				<strong>Updated At:</strong>
				{$subscription.updated?.toLocaleString() || 'Invalid Date'}
			</p>
		</div>
	</div>
	<div class="row mb-3">
		<div class="col">
			<button
				type="button"
				class="btn btn-secondary"
				onclick={async () => {
					const res = await Subscription.unsubscribe(subscription);
					if (res.isErr()) {
						alert('Failed to unsubscribe: ' + res.error.message);
					} else {
						if (!res.value.success) {
							alert('Failed to unsubscribe: ' + res.value.message || 'Unknown error');
						} else {
							window.location.href = '/account/tba-subscription/unsubscribed';
						}
					}
				}}
			>
				Unsubscribe
			</button>
		</div>
	</div>
</div>
