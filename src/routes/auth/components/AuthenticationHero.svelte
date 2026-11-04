<script>
	// Small user icons for the bottom left
	const userIcons = [
		{
			initials: 'AM',
			class: 'bg-primary'
		},
		{
			initials: 'ER',
			class: 'bg-white bg-opacity-25'
		},
		{
			initials: '+2k',
			class: 'bg-white bg-opacity-25'
		}
	];
</script>

<aside
	class="col-lg-6 d-none d-lg-flex flex-column justify-content-between position-relative overflow-hidden bg-secondary text-white p-5"
>
	<div
		class="logo d-flex align-items-center justify-content-center rounded-2 fs-3 fw-bold"
	>
		<i class="bi bi-mortarboard"></i>
	</div>

	<!-- Hero text -->
	<div class="position-relative">
		<p class="text-uppercase fw-medium text-primary">
			The University of Texas at El Paso
		</p>
		<h1 class="display-3 fw-medium mb-4">
			Campus spaces,
			<br />
			<span class="text-primary">ready when you are.</span>
		</h1>
		<p class="fs-5 fw-light text-white-50">
			Find and reserve study rooms, classrooms, labs, and equipment in just a
			few clicks.
		</p>
	</div>

	<!-- User icons -->
	<div class="d-flex align-items-center gap-3 small position-relative">
		<div class="d-flex">
			{#each userIcons as userIcon (userIcon.initials)}
				<span
					class="avatar d-flex align-items-center justify-content-center rounded-circle fw-bold {userIcon.class}"
				>
					{userIcon.initials}
				</span>
			{/each}
		</div>
		<div class="z-1">
			<strong class="d-block">One connected campus.</strong>
			<span class="text-white-50">Built for Miners, faculty, and staff.</span>
		</div>
	</div>

	<!-- Decorative ring -->
	<div class="ring"></div>
</aside>

<style>
	.logo {
		width: 52px;
		height: 52px;
		border: 2px solid var(--primary);
	}

	.ring {
		position: absolute;
		right: -220px;
		bottom: -330px;
		width: 580px;
		height: 580px;
		border: 90px solid var(--primary);
		filter: brightness(50%);
		border-radius: 50%;
	}

	.avatar {
		width: 36px;
		height: 36px;
		margin-right: -6px;
		border: 2px solid var(--secondary);
		font-size: 11px;
	}
</style>
