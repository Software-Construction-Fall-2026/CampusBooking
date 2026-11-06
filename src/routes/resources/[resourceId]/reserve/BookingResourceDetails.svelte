<script>
	let { resource } = $props();
</script>

<!-- Resource details -->
<section class="panel overflow-hidden mb-4">
	<!-- Image -->
	{#if resource.imageUrl}
		<img
			src={resource.imageUrl}
			alt={resource.name}
			class="resource-image w-100"
		/>
	{:else}
		<div
			class="resource-image d-flex align-items-center justify-content-center bg-secondary-subtle text-secondary"
		>
			<i class="bi bi-building fs-1"></i>
		</div>
	{/if}

	<div class="p-4">
		<!-- Type, name, building with room, description, and capacity -->
		<p class="eyebrow text-uppercase fw-semibold small text-primary mb-2">
			{resource.type}
		</p>

		<h2 class="fs-4 fw-normal text-secondary mb-2">
			{resource.name}
		</h2>

		<p class="small text-body-secondary mb-2">
			<i class="bi bi-geo-alt me-1"></i>
			{resource.building}
			| Room {resource.room}
		</p>

		<p class="small text-body-secondary mb-0">
			{resource.description}
		</p>

		<div class="d-flex gap-4 small text-body-secondary border-top pt-3 mt-3">
			<span>
				<i class="bi bi-people me-1"></i>
				{resource.capacity} people
			</span>
			<span><i class="bi bi-clock me-1"></i> 1 hr slots</span>
		</div>
	</div>
</section>

<style>
	.resource-image {
		height: 180px;
		object-fit: cover;
	}
</style>
