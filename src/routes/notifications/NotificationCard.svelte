<script>
	import { formatCreatedAt } from '#lib/utils/datetime.js';
	import { enhance } from '$app/forms';
	let { notification } = $props();
</script>

<article
	class="panel d-flex flex-wrap align-items-center gap-3 p-4"
	class:unread={!notification.read}
>
	<!-- Bell icon -->
	<div
		class="icon d-flex align-items-center justify-content-center rounded-3 bg-secondary-subtle text-secondary fs-4"
	>
		<i class="bi bi-bell"></i>
	</div>

	<!-- Message and time -->
	<div class="flex-grow-1">
		<p class="text-secondary mb-1" class:fw-medium={!notification.read}>
			{notification.message}
		</p>
		<p class="small text-body-secondary mb-0">
			<i class="bi bi-clock me-1"></i>
			{formatCreatedAt(notification.createdAt)}
		</p>
	</div>

	{#if !notification.read}
		<span class="badge rounded-pill bg-primary">New</span>
		<!-- Unread button -->
		<form method="POST" action="?/setRead" use:enhance>
			<button type="submit" aria-label="Mark as read" class="btn fs-4">
				<i class="bi bi-check text-secondary"></i>
			</button>
			<input type="hidden" name="notificationId" value={notification.id} />
		</form>
	{/if}
</article>

<style>
	.icon {
		width: 48px;
		height: 48px;
		flex-shrink: 0;
	}

	.unread {
		border-left: 4px solid var(--primary);
	}
</style>
