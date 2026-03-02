<!--
@component
Root layout wrapper for all routes. Acts as middleware for global bootstrapping.
-->
<script>
	import { Struct } from '$lib/services/struct';
	import { browser } from '$app/environment';
	import '$lib/index';
	import { onMount } from 'svelte';

	setTimeout(() => {
		if (browser) Struct.buildAll();
	});

	let updateAvailable = $state(false);

	onMount(() => {
		if (!('serviceWorker' in navigator)) return;
		const handler = (event: MessageEvent) => {
			if (event.data?.type === 'SW_UPDATED') {
				updateAvailable = true;
			}
		};
		navigator.serviceWorker.addEventListener('message', handler);
		return () => navigator.serviceWorker.removeEventListener('message', handler);
	});

	const { children } = $props();
</script>

{#if updateAvailable}
	<div
		class="alert alert-info alert-dismissible d-flex align-items-center gap-2 m-2"
		role="alert"
		style="position: fixed; bottom: 1rem; left: 50%; transform: translateX(-50%); z-index: 1060; min-width: 320px;"
	>
		<i class="material-icons">system_update</i>
		<span>A new version is available.</span>
		<button class="btn btn-sm btn-primary ms-auto" onclick={() => location.reload()}>
			Reload
		</button>
		<button
			type="button"
			class="btn-close"
			aria-label="Dismiss"
			onclick={() => (updateAvailable = false)}
		></button>
	</div>
{/if}

<main>
	{@render children()}
</main>
