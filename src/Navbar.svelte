<script>
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';

	// User comes from root layout
	let { user } = $props();

	// Used for mobile screens when sidebar collapses
	let isOpen = $state(false);

	const links = [
		{ href: '/', label: 'Dashboard', icon: 'bi-grid' },
		{ href: '/resources', label: 'Browse Resources', icon: 'bi-search' },
		{ href: '/reservations', label: 'My Reservations', icon: 'bi-calendar3' }
	];

	// Gets user's full name initials, like "AM"
	const initials = $derived(
		(user?.name ?? '')
			.split(' ')
			.filter(Boolean)
			.slice(0, 2)
			.map((word) => word[0].toUpperCase())
			.join('')
	);

	// Check if a link is focused
	const isActive = (href) => {
		return href === '/'
			? page.url.pathname === '/'
			: page.url.pathname.startsWith(href);
	};
</script>

<!-- Top bar with menu button for mobile -->
<header
	class="d-flex d-lg-none align-items-center gap-3 bg-secondary text-white px-3 py-2"
>
	<button
		type="button"
		class="btn text-white p-1 fs-4"
		aria-label="Open menu"
		onclick={() => {
			isOpen = true;
		}}
	>
		<i class="bi bi-list"></i>
	</button>
	<span class="fw-bold">UTEP Resource Booking</span>
</header>

<!-- Dark backdrop for mobile -->
{#if isOpen}
	<button
		type="button"
		class="backdrop d-lg-none"
		aria-label="Close menu"
		onclick={() => (isOpen = false)}
	></button>
{/if}

<aside
	class="sidebar d-flex flex-column bg-secondary text-white"
	class:open={isOpen}
>
	<!-- Logo -->
	<div
		class="d-flex align-items-center gap-3 px-4 py-3 border-bottom border-white border-opacity-10"
	>
		<div
			class="logo d-flex align-items-center justify-content-center rounded-3 fs-4 fw-bold"
		>
			U
		</div>
		<div class="lh-sm">
			<div class="fs-5 fw-bold">UTEP</div>
			<div class="small text-white-50">Resource Booking</div>
		</div>

		<button
			type="button"
			class="btn text-white ms-auto d-lg-none"
			aria-label="Close menu"
			onclick={() => (isOpen = false)}
		>
			<i class="bi bi-x-lg"></i>
		</button>
	</div>

	<!-- Navigation links -->
	<nav class="px-3 pt-4 flex-grow-1">
		<p
			class="section-label text-uppercase fw-bold small text-white-50 px-2 mb-2"
		>
			My workspace
		</p>
		{#each links as link (link.href)}
			{@const active = isActive(link.href)}
			<a
				href={resolve(link.href)}
				class="nav-link-item d-flex align-items-center gap-3 rounded-2 px-3 py-2 mb-1 text-decoration-none"
				class:active
				aria-current={active ? 'page' : undefined}
				onclick={() => (isOpen = false)}
			>
				<i class="bi {link.icon} fs-5"></i>
				<span class="flex-grow-1">{link.label}</span>
				{#if active}
					<i class="bi bi-chevron-right small"></i>
				{/if}
			</a>
		{/each}
	</nav>

	<!-- Help Card -->
	<div class="help-card rounded-3 mx-3 mb-3 p-3">
		<div class="d-flex align-items-center gap-2 fw-semibold mb-2">
			<i class="bi bi-person-circle fs-5"></i>
			Need help?
		</div>
		<p class="small text-white-50 mb-2">Contact Campus Technology Support.</p>
		<a
			href={resolve('/support')}
			class="small fw-semibold text-primary text-decoration-none"
		>
			Visit support center</a
		>
	</div>

	<!-- Current user and logout button -->
	{#if user}
		<div
			class="d-flex align-items-center gap-3 px-3 py-3 border-top border-white border-opacity-10"
		>
			<span
				class="avatar d-flex align-items-center justify-content-center rounded-2 bg-primary fw-bold small"
			>
				{initials}
			</span>
			<div class="lh-sm flex-grow-1 text-truncate">
				<div class="fw-semibold small text-truncate">{user.name}</div>
				<div class="small text-white-50 text-capitalize">{user.role}</div>
			</div>
			<!-- Logout is done via POST request -->
			<form method="POST" action="/auth/logout" use:enhance>
				<button
					type="submit"
					class="btn text-white-50 p-1 fs-5"
					aria-label="Log out"
					title="Log out"
				>
					<i class="bi bi-box-arrow-right"></i>
				</button>
			</form>
		</div>
	{/if}
</aside>

<style>
	.sidebar {
		width: 270px;
		flex-shrink: 0;
		position: sticky;
		top: 0;
		height: 100vh;
	}

	/* Mobile */
	@media (max-width: 991px) {
		.sidebar {
			position: fixed;
			left: 0;
			z-index: 1050;
			transform: translateX(-100%);
			transition: transform 0.2s ease;
		}

		.sidebar.open {
			transform: translateX(0);
		}
	}

	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 1040;
		border: none;
		background: rgba(0, 0, 0, 0.5);
	}

	.logo {
		width: 46px;
		height: 46px;
		border: 2px solid var(--primary);
	}

	.section-label {
		font-size: 0.7rem;
		letter-spacing: 0.08em;
	}

	.nav-link-item {
		color: rgba(255, 255, 255, 0.85);
		border-left: 3px solid transparent;
	}

	.nav-link-item:hover {
		color: white;
		background-color: rgba(255, 255, 255, 0.06);
	}

	.nav-link-item.active {
		color: white;
		font-weight: 600;
		background-color: rgba(255, 255, 255, 0.1);
		border-left-color: var(--primary);
	}

	.help-card {
		background-color: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.avatar {
		width: 38px;
		height: 38px;
		flex-shrink: 0;
	}
</style>
