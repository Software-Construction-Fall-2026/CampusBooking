<script>
	let { steps, currentStep } = $props();
</script>

<!-- Booking steps -->
<ol class="stepper d-flex list-unstyled mx-auto mb-5 overflow-x-auto">
	{#each steps as step, index (step)}
		<li
			class="step"
			class:done={index < currentStep}
			class:active={index === currentStep}
		>
			<span
				class="step-circle d-inline-flex align-items-center justify-content-center rounded-circle small"
			>
				{#if index < currentStep}
					<i class="bi bi-check-lg"></i>
				{:else}
					{index + 1}
				{/if}
			</span>
			<span class="step-label d-block small mt-2">{step}</span>
		</li>
	{/each}
</ol>

<style>
	.stepper {
		max-width: 760px;
		padding: 0;
	}

	.step {
		flex: 1;
		position: relative;
		text-align: center;
		color: var(--bs-secondary-color);
	}

	.step:not(:last-child)::after {
		content: '';
		position: absolute;
		top: 14px;
		left: calc(50% + 22px);
		width: calc(100% - 44px);
		height: 2px;
		background-color: var(--bs-border-color);
	}

	.step.done:not(:last-child)::after {
		background-color: var(--primary);
	}

	.step-circle {
		width: 30px;
		height: 30px;
		border: 2px solid var(--bs-border-color);
		background-color: white;
	}

	.step.done .step-circle {
		color: white;
		border-color: var(--secondary);
		background-color: var(--secondary);
	}

	.step.active .step-circle {
		color: white;
		border-color: var(--primary);
		background-color: var(--primary);
	}

	.step.done .step-label {
		color: var(--secondary);
	}

	.step.active .step-label {
		color: var(--primary);
	}
</style>
