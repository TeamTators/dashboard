<script lang="ts">
	import '$lib/defaults/mentor';
    const { data = $bindable() } = $props();
    const year = $derived(data.year);
    const events = $derived(data.events);
</script>


<div class="container">
    <div class="row">
        {#each events as e}
            <div class="col-md-4 p-2">
                <a href="/dashboard/mentor/pitscouting/event/{e.key}" class="text-reset text-decoration-none">
                    <div class="card bg-success">
                        <div class="card-body">
                            <h5 class="card-title">{e.name}</h5>
                            <p class="card-text">{e.start_date} - {e.end_date}</p>
                        </div>
                    </div>
                </a>
            </div>
        {/each}
    </div>
</div>