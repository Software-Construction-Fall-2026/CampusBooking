<script>
	import '#lib/styles/booking.css';

	// eslint-disable-next-line no-useless-assignment
	let { slots, selectedSlot, selectedHour = $bindable() } = $props();

	const setSelectedHour = (slot) => {
		selectedHour = slot.startHour;
	};
</script>

<!-- Time slots -->
<div class="col-md-6">
	<section class="panel h-100 p-4">
		<h3 class="fs-6 fw-medium text-secondary mb-3">
			<i class="bi bi-clock me-2"></i>
			Select time
		</h3>

		<p
			class="small text-secondary bg-secondary-subtle rounded-3 px-3 py-2 mb-3"
		>
			<i class="bi bi-info-circle me-1"></i>
			All reservations are 1 hour long.
		</p>

		{#if slots.length === 0}
			<!-- No booking slots available -->
			<p class="small text-body-secondary mb-0">
				This resource is not available for booking.
			</p>
		{:else}
			<div class="row row-cols-2 g-2">
				<!-- Display each slot as a clickable button -->
				{#each slots as slot (slot.startHour)}
					<div class="col">
						<button
							type="button"
							class="slot btn btn-sm w-100 py-2"
							class:selected={slot.startHour === selectedSlot?.startHour}
							disabled={slot.status !== 'available'}
							onclick={() => {
								setSelectedHour(slot);
							}}
						>
							{slot.label}
							{#if slot.status === 'booked'}
								<span class="d-block text-body-secondary">Booked</span>
							{/if}
						</button>
					</div>
				{/each}
			</div>
		{/if}
	</section>
</div>

<style>
	.slot {
		border: 1px solid var(--bs-border-color);
		background-color: white;
	}

	.slot:hover {
		border-color: var(--primary);
	}

	.slot.selected {
		color: white;
		border-color: var(--secondary);
		background-color: var(--secondary);
	}
</style>
