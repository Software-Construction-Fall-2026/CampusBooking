<script>
	import '#lib/styles/booking.css';
	import NotificationList from './NotificationList.svelte';

	let { data } = $props();

	const notifications = $derived(data.notifications ?? []);

	const unreadNotifications = $derived(
		notifications.filter((notification) => !notification.read)
	);

	const readNotifications = $derived(
		notifications.filter((notification) => notification.read)
	);
</script>

<svelte:head>
	<title>Notifications : Campus Booking</title>
</svelte:head>

<div class="page bg-body-tertiary min-vh-100">
	<main class="container-xxl px-4 px-lg-5 py-5">
		<!-- Page header -->
		<p class="text-uppercase fw-semibold small text-primary mb-2">
			My workspace
		</p>
		<h1 class="fw-normal text-secondary mb-2">
			Notifications
			{#if unreadNotifications.length > 0}
				<span class="badge rounded-pill bg-primary fs-6 align-middle ms-1">
					{unreadNotifications.length} new
				</span>
			{/if}
		</h1>
		<p class="text-body-secondary mb-5">
			Updates about your campus resource bookings.
		</p>

		<!-- Read and unread notification lists -->
		<div class="d-flex flex-column gap-3">
			<NotificationList notifications={unreadNotifications} type="unread" />
			<hr />
			<NotificationList notifications={readNotifications} type="past" />
		</div>
	</main>
</div>
