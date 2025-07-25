<script lang="ts">
    import { Demo } from "$lib/model/demo";
	import { DataArr } from "drizzle-struct/front-end";
	import { onMount } from "svelte";

    let all = $state(new DataArr(Demo.Demo, []));

    onMount(() => {
        all = Demo.Demo.all(false);
    });


    const create = () => {
        Demo.Demo.new({
            age: Math.floor(Math.random() * 100)
        });
    }
</script>


<div class="container layer-1">
    <div class="row mb-3">
        {#each $all as demo, i}
            <div class="col-md-4">
                <div class="card layer-2">
                    <div class="card-body">
                        {i} - {demo.data.age}
                    </div>
                </div>
            </div>
        {/each}
    </div>
    <div class="row mb-3">
        <div class="col">
            <button type="button" class="btn btn-primary" onclick={create}>
                Create new Demo!
            </button>
        </div>
    </div>
</div>