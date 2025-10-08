<script lang="ts">
	import Navbar from '$lib/components/general/Navbar.svelte';
	import Footer from '$lib/components/general/Footer.svelte';

	const { children } = $props();
</script>

<main class="dashboard">
	<Navbar title={__APP_ENV__.name} />

	{@render children()}
</main>
<Footer />
