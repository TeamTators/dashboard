<script lang="ts">
	import { Picklist } from '$lib/model/picklist.js';
	import { TBAEvent, TBATeam } from '$lib/utils/tba.js';
	import { onMount } from 'svelte';
    import PL from '$lib/components/picklist/Picklist.svelte';
	import { prompt } from '$lib/utils/prompts';
	import Grid from '$lib/components/general/Grid.svelte';
    import { TextEditorModule } from 'ag-grid-community'; 
	import { Account } from '$lib/model/account.js';

    const { data } = $props();

    const eventKey = $derived(data.eventKey);
    const event = $derived(new TBAEvent(data.event));
    const teams = $derived(data.teams.map(t => new TBATeam(t, event)));
    let filteredTeams = $derived(teams);

    let picklists = $state(Picklist.Picklist.arr());
    let spectators = $state(Picklist.SpecTator.arr());

    onMount(() => {
        picklists = Picklist.Picklist.fromProperty('eventKey', eventKey, false);
        spectators = Picklist.SpecTator.fromProperty('eventKey', eventKey, false);

        const specUnsub = spectators.subscribe((s) => {
            filteredTeams = teams.filter(t => !s.find(tt => tt.data.team === t.tba.team_number));
        });

        return () => {
            specUnsub();
        };
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
                frozen: false,
                addedBy: String(Account.getSelf().get().data.id),
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

    <br>
        <div class="row mb-3">
            <div class="col">
                <h4>Spectators</h4>
            </div>
        </div>
        <div class="row mb-3">
            {#key spectators}
            <Grid 
                data={spectators}
                opts={{
                    columnDefs: [{
                        field: 'data.team',
                        headerName: 'Team',
                    },
                    {
                        headerName: 'Name',
                        valueGetter: (params) => {
                            const team = teams.find(t => t.tba.team_number === params.data?.data.team);
                            return team ? team.tba.nickname || 'No Name' : 'N/A';
                        },
                    },
                    {
                        field: 'data.reason',
                        headerName: 'Reason',
                        editable: true,
                        valueGetter: (params) => {
                            return params.data?.data.reason || 'N/A';
                        },
                        valueSetter: (params) => {
                            if (params.data) {
                                params.data.update(() => ({
                                    reason: params.newValue,
                                }));
                                return true;
                            }
                            return false;
                        },
                    }]
                }}
                height="400px"
                modules={[TextEditorModule]}
            />
            {/key}
        </div>

</div>