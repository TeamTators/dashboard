<script lang="ts">
	import { onMount } from 'svelte';
	import { writable, get } from 'svelte/store';

	let value = writable(0);
	let otherValue = $derived(-value);

	$effect(() => {
		console.log('Value is now', value, otherValue);
	});

	const incr = () => value.update((v) => v + 1);

	const reset = () => value.set(0);
	onMount(() => {
		const unsub = value.subscribe((v) => {
			console.log('Value is now', v);
		});

		return unsub;
	});
</script>

<button type="button" onclick={incr}>
	Click me: {$value}
</button>

<button type="button" onclick={reset}> Reset </button>
