<script lang="ts">
    import { Strategy } from "$lib/model/strategy";
	import Grid from "../general/Grid.svelte";
    import { TBAEvent } from "$lib/utils/tba";

    interface Props {
        strategies: Strategy.StrategyArr;
        height?: number;
    }

    const { strategies, height }: Props = $props();
</script>

<p class="text-muted text-small">
    Double click on a strategy to view or edit it.
</p>
<Grid 
    data={strategies}
    opts={{
        columnDefs: [
            { field: 'data.name', headerName: 'Name',  flex: 1 },
            { field: 'data.notes', headerName: 'Notes', flex: 2 },
            { field: 'data.compLevel', headerName: 'Comp Level', flex: 1 },
            { field: 'data.matchNumber', headerName: 'Match Number', flex: 1 },
            { field: 'data.created', headerName: 'Created', flex: 1 },
            { field: 'data.updated', headerName: 'Updated', flex: 1 },
        ],
        onRowDoubleClicked: (params) => {
            if (!params.data) return;
            window.location.href = `/dashboard/event/${params.data.data.eventKey}/strategy/${params.data.data.id}`;
        }
    }}
    height={`${height ?? 400}px`}
/>