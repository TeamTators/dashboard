<script lang="ts">
	import { Picklist } from "$lib/model/picklist";
	import { TBAEvent, TBATeam } from "$lib/utils/tba.js";
	import { onMount } from "svelte";

    const { data } = $props();

    const event = $derived(new TBAEvent(data.event));
    const teams = $derived(data.teams.map(t => new TBATeam(t, event)));
    let lists = $derived(data.picklist.map(l => ({
        list: Picklist.Lists.Generator(l.list),
        teams: Picklist.Picklist.arr(
            l.teams.map(t => Picklist.Picklist.Generator(t)),
            (d) => d.data.list === l.list.id,
        )
    })));

    onMount(() => {
        Picklist.Lists.on('new', (list) => {
            if (list.data.eventKey === event.tba.key) {
                lists.push({
                    list,
                    teams: Picklist.Picklist.arr([], (d) => d.data.list === list.data.id),
                });
            }
        });

        Picklist.Lists.on('delete', (list) => {
            lists = lists.filter(l => l.list.data.id  !== list.data.id);
        });

        Picklist.Lists.on('archive', (list) => {
            lists = lists.filter(l => l.list.data.id !== list.data.id);
        });
    });
</script>

<div class="container-fluid">
    <div class="row mb-3">
        <h1>
            {event.tba.name} Picklists
        </h1>
    </div>
</div>