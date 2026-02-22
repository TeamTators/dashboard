<script lang="ts">
	import { Board } from '$lib/services/whiteboard/index.ts';
	import { Stack } from '$lib/utils/stack';

	interface Props {
		board: Board;
	}

	export const save = () => {};

	// export const clear = () => {};

	const { board }: Props = $props();
</script>

<div
	{@attach (div) =>
		board.render(
			div,
			new Stack({
				name: 'strategy',
				debug: true
			})
		)}
></div>
