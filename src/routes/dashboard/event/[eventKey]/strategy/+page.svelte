<script lang="ts">
	import { page } from "$app/state";
    import { Strategy } from "$lib/model/strategy";
	import { onMount } from "svelte";
    import nav from '$lib/nav/robot-display.js';
	import { TBAEvent } from "$lib/utils/tba";
	import { tomorrow } from "ts-utils";
	import StrategyGrid from "$lib/components/strategy/StrategyGrid.svelte";

    let strategies = $state(Strategy.Strategy.arr());

    onMount(() => {
        strategies = Strategy.Strategy.get({
            eventKey: String(page.params.eventKey),
        }, {
            type: 'all',
        });

        TBAEvent.getEvent(String(page.params.eventKey), false, tomorrow()).then((res) => {
            if (res.isOk()) {
                nav(res.value.tba);
            }
        });
    });
</script>


<div class="container">
    <div class="row mb-3">
        <div class="col">
            <h1>Strategies</h1>
        </div>
        <a href={`/dashboard/event/${page.params.eventKey}/matches`} class="btn btn-outline-primary">
            View Matches
            <span class="text-muted">
                (to create new strategies)
            </span>
        </a>
    </div>
    <div class="row mb-3">
        <div class="col">
        {#key strategies}
            <StrategyGrid {strategies} />
        {/key}
        </div>
    </div>
</div>