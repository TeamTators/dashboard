<script lang="ts">
	import { Picklist } from '$lib/model/picklist.js';
	import { TBAEvent, TBATeam } from '$lib/utils/tba.js';
	import { onMount } from 'svelte';
    import PL from '$lib/components/picklist/Picklist.svelte';
	import { prompt } from '$lib/utils/prompts';

    const { data } = $props();

    const eventKey = $derived(data.eventKey);
    const event = $derived(new TBAEvent(data.event));
    const teams = $derived(data.teams.map(t => new TBATeam(t, event)));

    let picklists = $state(Picklist.Picklist.arr());

    onMount(() => {
        picklists = Picklist.Picklist.fromProperty('eventKey', eventKey, false);
    });
</script>

<svelte:head>
    <title>Picklists - {event.tba.name}</title>
</svelte:head>

<div class="container-fluid">
    <div class="row mb-3">
        <div class="col">
            <h1>Picklists for {event.tba.name}</h1>
        </div>
    </div>

    <div class="row mb-3">
        <button type="button" class="btn btn-primary" onclick={async () => {
            const res = await prompt('Name of new picklist:');
            if (!res) return;
            Picklist.Picklist.new({
                eventKey: eventKey,
                name: res,
                frozen: false
            });
        }}>
            <i class="material-icons">add</i>
            Create Picklist
        </button>
    </div>

    {#each $picklists as picklist}
        <div class="row mb-3">
            <div class="col">
                <PL {picklist} {teams} />
            </div>
        </div>
    {/each}
</div>