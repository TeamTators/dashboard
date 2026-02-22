<!--
@fileoverview Whiteboard renderer for strategy planning.

@component Whiteboard

@description
Renders a strategy whiteboard using the Board class and Stack for undo/redo.

@example
```svelte
<Whiteboard board={board} />
```
-->
<script lang="ts">
	import { Board } from '$lib/services/whiteboard/index.ts';
	import { Stack } from '$lib/utils/stack';

	/**
	 * @typedef Props
	 * @property {Board} board - Board instance to render.
	 */
	interface Props {
		/**
		 * Board instance to render. The Board class manages the state and rendering of the whiteboard, while the Stack provides undo/redo functionality for actions taken on the board.
		 */
		board: Board;
	}

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
