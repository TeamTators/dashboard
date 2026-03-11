<!--
@fileoverview Aggregated potato stat list for a friend.

@component Stats

@description
Computes the current and next phase information for a potato and renders multiple `Stat`
components (health, attack, defense, speed, mana, and next-phase progress).

@example
```svelte
<Stats {potato} />
```
-->
<script lang="ts">
	import Stats from './Stat.svelte';
	import { Potato } from '$lib/model/potato';

	interface Props {
		/** Potato friend data source. */
		potato: Potato.FriendData;
	}

	const { potato }: Props = $props();
	let currentPhase = $derived(Potato.getPhase(potato.data.level || 0));
	let nextPhase = $derived(Potato.getNextPhase(potato.data.level || 0));
	let nextLevel = $derived(Potato.Levels[currentPhase as keyof typeof Potato.Levels]);
</script>

<Stats
	level={nextLevel}
	name="Next Phase ({nextPhase})"
	stat={$potato.level || 0}
	color="#e60ecc"
/>
<Stats level={$potato.level || 0} name="Health" stat={$potato.health || 0} color="red" />
<Stats level={$potato.level || 0} name="Attack" stat={$potato.attack || 0} color="gold" />
<Stats level={$potato.level || 0} name="Defense" stat={$potato.defense || 0} color="gray" />
<Stats level={$potato.level || 0} name="Speed" stat={$potato.speed || 0} color="silver" />
<Stats level={$potato.level || 0} name="Mana" stat={$potato.mana || 0} color="blue" />
