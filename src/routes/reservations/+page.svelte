<script>
	import { resolve } from '$app/paths';

	import ReservationCard from './ReservationCard.svelte';

	import '#lib/styles/booking.css';

	let { data, form } = $props();

	const hasReservations = $derived(
		data.upcoming.length > 0 || data.past.length > 0
	);
</script>

<svelte:head>
	<title>My reservations : Campus Booking</title>
</svelte:head>

<div class="page bg-body-tertiary min-vh-100">
	<main class="container-xxl px-4 px-lg-5 py-5">
		<!-- Page header -->
		<p class="text-uppercase fw-semibold small text-primary mb-2">
			My workspace
		</p>
		<h1 class="fw-normal text-secondary mb-2">My reservations</h1>
		<p class="text-body-secondary mb-5">
			See all of your campus resource bookings in one place.
		</p>

		{#if form?.error}
			<div class="alert alert-danger">
				{form.error}
			</div>
		{/if}

		{#if !hasReservations}
			<!-- No reservations yet -->
			<section class="panel text-center p-5">
				<i class="bi bi-calendar-x text-secondary fs-1"></i>
				<h2 class="fs-5 fw-medium text-secondary mt-2 mb-1">
					No reservations yet
				</h2>
				<p class="small text-body-secondary mb-4">
					When you book a campus resource, it will show up here.
				</p>
				<a href={resolve('/resources')} class="btn bg-primary text-white">
					Browse resources
				</a>
			</section>
		{:else}
			<!-- Upcoming reservations -->
			<section class="mb-5">
				<h2 class="fs-5 fw-medium text-secondary mb-3">
					Upcoming
					<span class="badge rounded-pill bg-secondary ms-1">
						{data.upcoming.length}
					</span>
				</h2>
				{#if data.upcoming.length === 0}
					<p class="small text-body-secondary">
						You have no upcoming reservations.
					</p>
				{:else}
					<div class="d-flex flex-column gap-3">
						{#each data.upcoming as reservation (reservation.id)}
							<ReservationCard {reservation} isUpcoming={true} />
						{/each}
					</div>
				{/if}
			</section>

			<!-- Past and cancelled reservations -->
			<section>
				<h2 class="fs-5 fw-medium text-secondary mb-3">
					Past & cancelled
					<span class="badge rounded-pill bg-secondary ms-1">
						{data.past.length}
					</span>
				</h2>
				{#if data.past.length === 0}
					<p class="small text-body-secondary">
						You have no past reservations.
					</p>
				{:else}
					<div class="d-flex flex-column gap-3">
						{#each data.past as reservation (reservation.id)}
							<ReservationCard {reservation} isUpcoming={false} />
						{/each}
					</div>
				{/if}
			</section>
		{/if}
	</main>
</div>
