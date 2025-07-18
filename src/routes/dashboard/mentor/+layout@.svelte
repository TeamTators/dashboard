<script lang="ts">
	import Navbar from '$lib/components/general/Navbar.svelte';
	import Footer from '$lib/components/general/Footer.svelte';
	import { PUBLIC_APP_NAME } from '$env/static/public';
    import nav from '$lib/imports/mentor';
    nav();

	const { children } = $props();
</script>

<main class="dashboard">
	<Navbar title={PUBLIC_APP_NAME} />

	{@render children()}
</main>
<Footer />
