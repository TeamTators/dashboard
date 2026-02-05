<!--
@component
Mentor dashboard layout shell.

Provides shared navigation chrome and footer for mentor routes.
-->
<script lang="ts">
	import Navbar from '$lib/components/general/Navbar.svelte';
	import Footer from '$lib/components/general/Footer.svelte';
	import nav from '$lib/nav/mentor';
	nav();

	const { children } = $props();
</script>

<main class="dashboard">
	<Navbar title={__APP_ENV__.name} />

	{@render children()}
</main>
<Footer />
