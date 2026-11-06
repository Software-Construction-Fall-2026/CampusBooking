<script>
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';

	import { formatDate } from '#lib/utils/datetime.js';
	import '#lib/styles/booking.css';

	let {
		data,
		confirmedReservation = $bindable(),
		startOver,
		// eslint-disable-next-line no-useless-assignment
		selectedHour = $bindable(),
		selectedSlot,
		form
	} = $props();

	let isSubmitting = $state();
</script>

<div class="col-lg-4">
	<aside class="summary panel p-4">
	<!-- Confirmed reservation success -->
		{#if confirmedReservation}
			<div class="text-center">
				<i class="bi bi-check-circle text-success fs-1"></i>
				<h3 class="fs-5 fw-medium text-secondary mt-2 mb-1">
					Reservation confirmed
				</h3>
				<p class="small text-body-secondary mb-4">
					{data.resource.name}
					<br />
					{formatDate(confirmedReservation.date)} | {confirmedReservation.timeLabel}
				</p>
				<a
					href={resolve('/reservations')}
					class="btn bg-primary text-white w-100 mb-2"
				>
					View my reservations
				</a>
				<button
					type="button"
					class="btn btn-link text-secondary text-decoration-none small"
					onclick={startOver}
				>
					Book another time
				</button>
			</div>
		{:else}
		<!-- Not yet confirmed reservation -->
			<h3 class="fs-5 fw-medium text-secondary mb-3">Reservation summary</h3>
			<p class="mb-0">{data.resource.name}</p>
			{#if data.resource.building}
				<p class="small text-body-secondary mb-0">
					{data.resource.building}
					{#if data.resource.room}
						| Room {data.resource.room}
					{/if}
				</p>
			{/if}
			
			<!-- Date, time, and duration -->
			<dl class="summary-details small border-top border-bottom py-3 my-3">
				<dt class="fw-normal text-body-secondary">
					<i class="bi bi-calendar3 me-2"></i>
					Date
				</dt>
				<dd>{formatDate(data.date)}</dd>
				<dt class="fw-normal text-body-secondary">
					<i class="bi bi-clock me-2"></i>
					Time
				</dt>
				<dd>
					{#if selectedSlot}
						{selectedSlot.label}
					{:else}
						<span class="text-body-secondary">Select a time</span>
					{/if}
				</dd>
				<dt class="fw-normal text-body-secondary">
					<i class="bi bi-hourglass-split me-2"></i>
					Duration
				</dt>
				<dd>1 hour</dd>
			</dl>

			<p class="small text-secondary bg-secondary-subtle rounded-3 px-3 py-2">
				<i class="bi bi-info-circle me-1"></i>
				You can view your booking in My Reservations.
			</p>

			<!-- Submit booking form -->
			<form
				method="POST"
				use:enhance={() => {
					isSubmitting = true;
					return async ({ result, update }) => {
						await update();
						isSubmitting = false;
						if (result.type === 'success') {
							confirmedReservation = result.data.reservation;
							selectedHour = null;
						}
					};
				}}
			>
				<input type="hidden" name="date" value={data.date} />
				<input type="hidden" name="startHour" value={selectedSlot?.startHour} />
				<button
					type="submit"
					class="btn bg-primary text-white w-100"
					disabled={!selectedSlot || isSubmitting}
				>
					{#if isSubmitting}
						Confirming...
					{:else}
						Confirm reservation
						<i class="bi bi-arrow-right ms-1"></i>
					{/if}
				</button>
			</form>

			<!-- Error  display -->
			{#if form?.error}
				<div class="alert alert-danger small mt-3 mb-0">{form.error}</div>
			{/if}
		{/if}
	</aside>
</div>

<style>
	.summary {
		position: sticky;
		top: 1.5rem;
	}

	.summary-details {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.75rem 1.5rem;
	}

	.summary-details dd {
		margin: 0;
		text-align: right;
	}
</style>
