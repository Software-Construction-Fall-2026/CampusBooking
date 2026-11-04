<script>
	import AuthenticationHero from '../components/AuthenticationHero.svelte';
	import RoleSelector from '../components/RoleSelector.svelte';
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';

	let { form } = $props();
	let isSubmitting = $state(false);
	let selectedRole = $state('Student');

	// Reduces repetitive form field rendering
	const formFields = [
		{
			name: 'email',
			label: 'Email address',
			type: 'email',
			placeholder: 'alex.morgan@miners.utep.edu'
		},
		{
			name: 'password',
			label: 'Password',
			type: 'password',
			placeholder: '*********'
		}
	];
</script>

<svelte:head>
	<title>Log in : Campus Booking</title>
</svelte:head>

<div class="container-fluid">
	<div class="row min-vh-100">
		<!-- Hero left -->
		<AuthenticationHero />

		<!-- Log in form -->
		<main
			class="col-lg-6 d-flex align-items-center justify-content-center py-5"
		>
			<div class="w-100" style="max-width: 486px">
				<p class="text-uppercase fw-bold text-primary mb-2">Welcome back</p>
				<h2 class="fw-medium mb-3">Sign in to your account</h2>
				<p class="text-body-secondary mb-4">
					Choose your role to explore the complete booking experience.
				</p>

				<form
					method="POST"
					use:enhance={() => {
						isSubmitting = true;
						return async ({ update }) => {
							await update();
							isSubmitting = false;
						};
					}}
				>
					<RoleSelector bind:selectedRole showAdminRole={true} />

					<!-- Display form fields -->
					{#each formFields as formField (formField.name)}
						{@const formFieldError = form?.errors?.[formField.name]}
						{@const submittedFieldValue = form?.values?.[formField.name] ?? ''}
						<div class="mb-3">
							<label for={formField.name} class="form-label small fw-semibold"
								>{formField.label}</label
							>
							<input
								class="form-control"
								class:is-invalid={formFieldError}
								id={formField.name}
								name={formField.name}
								type={formField.type}
								placeholder={formField.placeholder}
								value={formField.type === 'password' ? '' : submittedFieldValue}
								required
							/>
							<div class="invalid-feedback">{formFieldError}</div>
						</div>
					{/each}

					<!-- Submit button -->
					<button
						type="submit"
						class="btn bg-primary text-white btn-lg fs-6 w-100 mt-2"
						disabled={isSubmitting}
					>
						{#if isSubmitting}
							Logging in...
						{:else}
							Log in as {selectedRole}
							<i class="bi bi-chevron-right small"></i>
						{/if}
					</button>

					<!-- Error display -->
					{#if form?.errors?.general}
						<div class="alert alert-danger mt-3">{form.errors.general}</div>
					{/if}

					<!-- Signup page link -->
					<p class="text-center mt-3 text-body-secondary">
						Don't have an account yet?
						<a
							href={resolve('/auth/signup')}
							class="text-primary fw-medium text-decoration-none">Sign up</a
						>
					</p>
				</form>
			</div>
		</main>
	</div>
</div>
