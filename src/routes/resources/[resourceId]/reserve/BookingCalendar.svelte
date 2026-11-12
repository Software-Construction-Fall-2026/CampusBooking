<script>
	import { formatDate, toDateString } from '#lib/utils/datetime.js';

	let { date, bookingWindow, startOver } = $props();
	const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

	// Calendar cells
	const calendarDays = $derived.by(() => {
		const { year, month } = visibleMonth;
		const firstWeekday = new Date(year, month, 1).getDay();
		const daysInMonth = new Date(year, month + 1, 0).getDate();

		const days = [];
		for (let i = 0; i < firstWeekday; i++) {
			days.push(null);
		}
		for (let day = 1; day <= daysInMonth; day++) {
			days.push({ day, date: toDateString(year, month, day) });
		}
		return days;
	});

	// Months for the calendar starting from the selected date
	let visibleMonth = $derived({
		year: Number(date.slice(0, 4)),
		month: Number(date.slice(5, 7)) - 1
	});

	const isBookableDate = (date) => {
		return date >= bookingWindow.firstDate && date <= bookingWindow.lastDate;
	};

	const monthLabel = $derived(
		new Date(visibleMonth.year, visibleMonth.month).toLocaleDateString(
			'en-US',
			{ month: 'long', year: 'numeric' }
		)
	);

	// Months outside the booking window are hidden
	const visibleMonthKey = $derived(
		toDateString(visibleMonth.year, visibleMonth.month, 1).slice(0, 7)
	);

	const canShowPreviousMonth = $derived(
		visibleMonthKey > bookingWindow.firstDate.slice(0, 7)
	);

	const canShowNextMonth = $derived(
		visibleMonthKey < bookingWindow.lastDate.slice(0, 7)
	);

	// Changes month forward or backward
	const changeMonth = (offset) => {
		const shifted = new Date(visibleMonth.year, visibleMonth.month + offset);
		visibleMonth = { year: shifted.getFullYear(), month: shifted.getMonth() };
	};
</script>

<!-- Calendar -->
<div class="col-md-6 overflow-x-auto">
	<section class="panel h-100 p-4">
		<h3 class="fs-6 fw-medium text-secondary mb-3">
			<i class="bi bi-calendar3 me-2"></i>
			Select date
		</h3>

		<!-- Month change buttons -->
		<div class="d-flex align-items-center justify-content-between mb-2">
			<button
				type="button"
				class="btn btn-sm text-secondary"
				aria-label="Previous month"
				disabled={!canShowPreviousMonth}
				onclick={() => changeMonth(-1)}
			>
				<i class="bi bi-chevron-left"></i>
			</button>
			<span class="small fw-medium">{monthLabel}</span>
			<button
				type="button"
				class="btn btn-sm text-secondary"
				aria-label="Next month"
				disabled={!canShowNextMonth}
				onclick={() => changeMonth(1)}
			>
				<i class="bi bi-chevron-right"></i>
			</button>
		</div>

		<!-- This loads timeslots for a date -->
		<form
			method="GET"
			class="calendar text-center small"
			data-sveltekit-noscroll
			data-sveltekit-keepfocus
		>
			{#each weekdays as weekday (weekday)}
				<span class="text-body-secondary py-1">{weekday}</span>
			{/each}
			{#each calendarDays as cell, index (index)}
				{#if cell}
					<button
						type="submit"
						name="date"
						value={cell.date}
						class="calendar-day btn btn-sm rounded-circle mx-auto"
						class:selected={cell.date === date}
						disabled={!isBookableDate(cell.date)}
						aria-label={formatDate(cell.date)}
						aria-pressed={cell.date === date}
						onclick={startOver}
					>
						{cell.day}
					</button>
				{:else}
					<span></span>
				{/if}
			{/each}
		</form>
	</section>
</div>

<style>
	.calendar {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		row-gap: 0.25rem;
	}

	.calendar-day {
		width: 34px;
		height: 34px;
		padding: 0;
	}

	.calendar-day:hover {
		background-color: var(--bs-secondary-bg);
	}

	.calendar-day.selected {
		color: white;
		background-color: var(--secondary);
	}
</style>
