<script lang="ts">
    import { Picklist } from '$lib/model/picklist';


    interface Props {
        list: Picklist.ListData;
        teams: Picklist.PicklistDataArr;
    };

    const { list, teams }: Props = $props();
</script>

<div class="container-fluid">
    <div class="row mb-3">
        <h3>
            {$list.name}
        </h3>
    </div>
</div>