<script lang="ts">
	import { onMount } from 'svelte';

    const { data } = $props();
    const alert = $state(data.alert);

    const alertData: any = $derived(JSON.parse(alert.data));



</script>
<div class="container d-flex flex-column align-items-center justify-content-center vh-100">
	<div class="card shadow-sm p-4" style="max-width: 400px; width: 100%;">
        {#if alert.type === ''}
            <!--  -->
        {/if}
	</div>
</div>
