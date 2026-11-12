<script>
	import { resolve } from '$app/paths';

	import BookingCalendar from './BookingCalendar.svelte';
	import BookingSteps from './BookingSteps.svelte';
	import BookingTimeSlots from './BookingTimeSlots.svelte';
	import BookingResourceDetails from './BookingResourceDetails.svelte';
	import BookingReservationSummary from './BookingReservationSummary.svelte';

	import '#lib/styles/booking.css';

	let { data, form } = $props();
	let selectedHour = $state(null);
	let confirmedReservation = $state(null);

	const steps = ['Resource', 'Date & Time', 'Review', 'Confirmation'];

	// Only available slots can be booked
	const selectedSlot = $derived(
		data.slots.find(
			(slot) => slot.startHour === selectedHour && slot.status === 'available'
		)
	);

	// Index of the current booking step
	const currentStep = $derived.by(() => {
		if (confirmedReservation) {
			return steps.length;
		}
		if (selectedSlot) {
			return 2;
		}
		return 1;
	});

	// Clears the selected time and any confirmation
	const startOver = () => {
		selectedHour = null;
		confirmedReservation = null;
	};
</script>

<svelte:head>
	<title>Make a reservation : Campus Booking</title>
</svelte:head>

<div class="page bg-body-tertiary min-vh-100">
	<main class="container-xxl px-4 px-lg-5 py-5">
		<a
			href={resolve('/resources')}
			class="d-inline-flex align-items-center gap-2 small text-secondary text-decoration-none mb-4"
		>
			<i class="bi bi-arrow-left"></i>
			Back to resources
		</a>

		<!-- Page header -->
		<p class="text-uppercase fw-semibold small text-primary mb-2">
			New reservation
		</p>
		<h1 class="fw-normal text-secondary mb-2">Make a reservation</h1>
		<p class="text-body-secondary mb-5">
			Find a time that works for you, then confirm your booking.
		</p>

		<!-- Shows the step the user is currently on -->
		<BookingSteps {steps} {currentStep} />

		<div class="row g-4">
			<div class="col-lg-8">
				<BookingResourceDetails resource={data.resource} />
				<div class="row g-4">
					<BookingCalendar
						date={data.date}
						bookingWindow={data.bookingWindow}
						{startOver}
					/>
					<BookingTimeSlots
						slots={data.slots}
						{selectedSlot}
						bind:selectedHour
					/>
				</div>
			</div>

			<!-- Reservation summary -->
			<BookingReservationSummary
				bind:confirmedReservation
				bind:selectedHour
				{data}
				{startOver}
				{form}
				{selectedSlot}
			/>
		</div>
	</main>
</div>
