<script>
	import favicon from '#lib/assets/favicon.svg';

	// bootstrap is installed via npm package
	import 'bootstrap/dist/css/bootstrap.min.css';
	import 'bootstrap-icons/font/bootstrap-icons.min.css';

	import Navbar from '../Navbar.svelte';

	let { children, data } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="d-lg-flex">
	{#if data.user}
		<Navbar user={data.user} unreadNotifications={data.unreadNotifications} />
	{/if}
	<div class="flex-grow-1">
		{@render children()}
	</div>
</div>

<style>
	:root {
		--primary: rgb(255, 130, 0);
		--secondary: rgb(4, 30, 66);
	}

	:global(.text-primary) {
		color: var(--primary) !important;
	}

	:global(.text-secondary) {
		color: var(--secondary) !important;
	}

	:global(.bg-primary) {
		background-color: var(--primary) !important;
	}

	:global(.bg-secondary) {
		background-color: var(--secondary) !important;
	}
</style>
