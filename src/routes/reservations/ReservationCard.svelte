<script>
	import { enhance } from '$app/forms';
	import { formatDate } from '#lib/utils/datetime.js';
	import '#lib/styles/booking.css';

	// isUpcoming tells if the reservation has not started yet
	let { reservation, isUpcoming, showCancelBtn=true } = $props();

	// Badge shown on the reservation depending on its status
	const badge = $derived.by(() => {
		if (reservation.status === 'cancelled') {
			return { label: 'Cancelled', className: 'text-bg-danger' };
		}
		if (isUpcoming) {
			return { label: 'Confirmed', className: 'text-bg-success' };
		}
		return { label: 'Completed', className: 'text-bg-secondary' };
	});
</script>

<article
	class="panel d-flex flex-wrap align-items-center gap-3 p-4"
	class:inactive={!isUpcoming}
>
	<!-- Resource icon -->
	<div
		class="icon d-flex align-items-center justify-content-center rounded-3 bg-secondary-subtle text-secondary fs-4"
	>
		<i class="bi bi-building"></i>
	</div>

	<!-- Resource name and location -->
	<div class="flex-grow-1">
		<h3 class="fs-6 fw-medium text-secondary mb-1">
			{reservation.resourceName}
		</h3>
		{#if reservation.building}
			<p class="small text-body-secondary mb-0">
				<i class="bi bi-geo-alt me-1"></i>
				{reservation.building}
				{#if reservation.room}
					| Room {reservation.room}
				{/if}
			</p>
		{/if}
	</div>

	<!-- Date and time -->
	<div class="small text-body-secondary">
		<div>
			<i class="bi bi-calendar3 me-2"></i>
			{formatDate(reservation.date)}
		</div>
		<div>
			<i class="bi bi-clock me-2"></i>
			{reservation.timeLabel}
		</div>
	</div>

	<span class="badge rounded-pill {badge.className}">{badge.label}</span>

	{#if isUpcoming}
		<form
			method="POST"
			action="?/cancel"
			use:enhance={({ cancel }) => {
				if (
					!confirm(`Cancel your reservation for ${reservation.resourceName}?`)
				) {
					cancel();
				}
			}}
		>
			<input type="hidden" name="reservationId" value={reservation.id} />
			{#if showCancelBtn}
			<button type="submit" class="btn btn-sm btn-outline-danger">
				Cancel
			</button>
			{/if}
		</form>
	{/if}
</article>

<style>
	.icon {
		width: 48px;
		height: 48px;
		flex-shrink: 0;
	}

	.inactive {
		opacity: 0.75;
	}
</style>
