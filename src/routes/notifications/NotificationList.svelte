<script>
	import NotificationCard from './NotificationCard.svelte';
	const { notifications, type } = $props();
</script>

<!-- Header -->
<h3 class="mb-0 notification-header">{type} notifications</h3>
{#if notifications.length === 0}
	<p class="small text-body-secondary mb-4">No {type} notifications</p>
{:else}
	<p class="small text-body-secondary mb-4">Your {type} notifications</p>
{/if}

<!-- List of notification cards -->
{#each notifications as notification (notification.id)}
	<NotificationCard {notification} />
{/each}

<style>
	.notification-header::first-letter {
		text-transform: uppercase;
	}
</style>
