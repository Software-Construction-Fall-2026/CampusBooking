<script>
	// selectedRole is bound to the signup page's current role
	let { selectedRole = $bindable(), showAdminRole = false } = $props();
	const roles = [
		{
			name: 'Student',
			icon: 'bi-mortarboard'
		},
		{
			name: 'Faculty',
			icon: 'bi-book'
		},
		{
			name: 'Admin',
			icon: 'bi-hammer'
		}
	].filter((role) => showAdminRole || role.name !== 'Admin');
</script>

<div class="row g-2 mb-4">
	<!-- Creates a clickable button for each role -->
	{#each roles as role (role.name)}
		<div class="col">
			<input
				type="radio"
				class="btn-check"
				name="role"
				id="role-{role.name}"
				value={role.name}
				bind:group={selectedRole}
			/>
			<label
				class="role btn w-100 py-3 position-relative"
				for="role-{role.name}"
			>
				{#if selectedRole == role.name}
					<i
						class="bi bi-check-circle-fill position-absolute top-0 end-0 me-2 mt-1 small text-primary"
					></i>
				{/if}
				<i class="bi {role.icon} d-block fs-5 mb-1"></i>
				<span class="small">{role.name}</span>
			</label>
		</div>
	{/each}
</div>

<style>
	.role {
		border-color: lightgrey;
		--bs-btn-active-border-color: var(--primary);
	}

	.role:active,
	.role:hover {
		border-color: var(--primary);
	}
</style>
