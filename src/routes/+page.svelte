<script>
	import { resolve } from '$app/paths';

	import ReservationCard from './reservations/ReservationCard.svelte';
	import '#lib/styles/booking.css';

	let { data, form } = $props();

	// The type is from the database
	const categories = [
		{
			type: 'Study Room',
			label: 'Study Rooms',
			icon: 'bi-book',
			color: 'primary'
		},
		{
			type: 'Classroom',
			label: 'Classrooms',
			icon: 'bi-easel',
			color: 'warning'
		},
		{
			type: 'Computer Lab',
			label: 'Computer Labs',
			icon: 'bi-pc-display',
			color: 'info'
		},

		{
			type: 'Equipment',
			label: 'Equipment',
			icon: 'bi-box-seam',
			color: 'success'
		}
	];

	const firstName = $derived(data.user.name.split(' ')[0]);
</script>

<svelte:head>
	<title>Dashboard : Campus Booking</title>
</svelte:head>

<div class="page bg-body-tertiary min-vh-100">
	<main class="container-xxl px-4 px-lg-5 py-5">
		<!-- Welcome banner -->
		<section
			class="hero position-relative overflow-hidden rounded-4 bg-secondary text-white p-4 p-lg-5 mb-5"
		>
			<p class="text-uppercase fw-bold small text-primary mb-2">
				Welcome back, {firstName}
			</p>
			<h1 class="fw-medium mb-3">What would you like to reserve?</h1>
			<p class="text-white-50 mb-4">
				Explore campus spaces and equipment for your study session or group
				projects
			</p>
			<a
				href={resolve('/resources')}
				class="btn bg-primary text-white fw-semibold px-4 py-2"
				>Browse resources
				<i class="bi bi-chevron-right ms-1"></i>
			</a>
		</section>

		<!-- Categories -->
		<section class="mb-5">
			<div class="d-flex justify-content-between align-items-end mb-3">
				<div>
					<h2 class="fs-4 fw-normal text-secondary mb-1">
						Explore by category
					</h2>
					<p class="small text-body-secondary mb-0">
						Find the right space or equipment for your needs
					</p>
				</div>
			</div>
			<div class="row g-3">
				{#each categories as category (category.type)}
					<div class="col-sm-6 col-xl-3">
						<a
							href="{resolve('/resources')}?type={encodeURIComponent(
								category.type
							)}"
							class="panel d-flex align-items-center gap-3 p-3 text-decoration-none h-100"
						>
							<span
								class="icon d-flex align-items-center justify-content-center rounded-3 fs-4 bg-{category.color}-subtle text-{category.color}-emphasis"
							>
								<i class="bi {category.icon}"></i>
							</span>
							<span class="flex-grow-1">
								<span class="d-block fw-semibold text-secondary">
									{category.label}
								</span>
								<span class="small text-body-secondary">
									{data.resourceCounts[category.type.toLowerCase()] ?? 0} resources
								</span>
							</span>
							<i class="bi bi-chevron-right text-body-secondary"></i>
						</a>
					</div>
				{/each}
			</div>
		</section>

		<!-- Upcoming reservations for students or faculty -->
		{#if data.upcoming}
			<section>
				<div class="d-flex justify-content-between align-items-end mb-3">
					<div>
						<h2 class="fs-4 fw-normal text-secondary mb-1">
							Upcoming reservations
						</h2>
						<p class="small text-body-secondary mb-0">
							View your upcoming confirmed bookings
						</p>
					</div>
					<a
						href={resolve('/reservations')}
						class="small fw-semibold text-secondary texet-decoration-none"
					>
						View all <i class="bi bi-chevron-right"></i>
					</a>
				</div>

				{#if form?.error}
					<div class="alert alert-danger">{form.error}</div>
				{/if}

				{#if data.upcoming.length === 0}
					<p class="small text-body-secondary">
						You have no upcoming reservations.
					</p>
				{:else}
					<div class="d-flex flex-column gap-3">
						{#each data.upcoming as reservation (reservation.id)}
							<ReservationCard {reservation} isUpcoming={true} showCancelBtn={false} />
						{/each}
					</div>
				{/if}
			</section>
		{/if}
	</main>
</div>

<style>
	.hero-icon {
		position: absolute;
		top: 50%;
		right: 15%;
		transform: translateY(-50%);
		font-size: 4rem;
	}

	.hero::before,
	.hero::after {
		content: '';
		position: absolute;
		bottom: -40%;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 50%;
		pointer-events: none;
	}

	.hero::before {
		right: -5%;
		width: 360px;
		height: 360px;
	}

	.hero::after {
		right: 3%;
		width: 240px;
		height: 240px;
	}

	.icon {
		width: 48px;
		height: 48px;
		flex-shrink: 0;
	}
</style>
