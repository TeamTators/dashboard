<script lang="ts">
	import type { Strategy } from "$lib/model/strategy";
    import { Whiteboard } from "$lib/services/whiteboard";
	import { onMount } from "svelte";
	import Modal from "../bootstrap/Modal.svelte";

    interface Props {
        whiteboard: Strategy.MatchWhiteboardData;
        event: string;
        matchNumber: number;
        compLevel: string;
        red: [number, number, number];
        blue: [number, number, number];
    }

    const { whiteboard, event, matchNumber, compLevel, red, blue }: Props = $props();

    let wb: Whiteboard | undefined = $state(undefined);

    export const save = () => {};

    let infoModal: Modal;
</script>


<div
{@attach (div) => {
        const res = Whiteboard.from({
            target: div,
            event,
            matchNumber,
            compLevel,
            red,
            blue
        }, whiteboard);
        if (res.isOk()) {
            wb = res.value;
        } else {
            console.error("Failed to initialize whiteboard:", res.error);
        }
    }}
></div>


<Modal bind:this={infoModal} title="Whiteboard Info">
	{#snippet body()}
		<div class="alert alert-info mb-3" style="font-size: 1.1em;">
			<strong>Instructions:</strong><br />
			<ul style="margin-bottom: 0;">
				<li>
					Draw on the field by clicking and dragging (or touching and dragging) on the whiteboard
					area.
				</li>
				<li>Tap or click near a path to select it. The selected path will be highlighted.</li>
				<li>Tap or click a selected path to open options (e.g., delete).</li>
				<li>Use the <b>Undo</b> and <b>Redo</b> buttons to revert or reapply changes.</li>
				<li>
					Use <b>New</b> to create a new whiteboard, or <b>Load</b> to switch between saved boards.
				</li>
			</ul>
		</div>
	{/snippet}
</Modal>