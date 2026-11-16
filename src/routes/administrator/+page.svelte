
<script>
    let { data, form } = $props();

    let name = $state('');
    let type = $state('');
    let building = $state('');
    let description = $state('');
    let room = $state('');
    let capacity = $state('');
    let availability = $state('true');
</script>

<svelte:head>
    <title>Administrator Dashboard | Campus Booking</title>
</svelte:head>

<div class="container py-5">
    <div class="mb-4">
        <h1>Administrator Dashboard</h1>
        <p class="text-muted">
            Manage campus resources and their availability.
        </p>
    </div>

    <div class="card shadow-sm">
        <div class="card-header">
            <h4 class="mb-0">Add New Resource</h4>
        </div>

        <div class="card-body">
            {#if form?.success}
                <div class="alert alert-success" role="status">
                    {form.message}
                </div>
            {/if}

            {#if form?.error}
                <div class="alert alert-danger" role="alert">
                    {form.error}
                </div>
            {/if}

            <form method="POST" action="?/addResource">
                <div class="row g-3">
                    <div class="col-md-6">
                        <label for="name" class="form-label">
                            Resource Name *
                        </label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            class="form-control"
                            bind:value={name}
                            required
                        />
                    </div>

                    <div class="col-md-6">
                        <label for="type" class="form-label">
                            Resource Type *
                        </label>
                        <input
                            id="type"
                            name="type"
                            type="text"
                            class="form-control"
                            bind:value={type}
                            placeholder="Classroom, Equipment, Study Room"
                            required
                        />
                    </div>

                    <div class="col-md-6">
                        <label for="building" class="form-label">
                            Building *
                        </label>
                        <input
                            id="building"
                            name="building"
                            type="text"
                            class="form-control"
                            bind:value={building}
                            required
                        />
                    </div>

                    <div class="col-md-6">
                        <label for="room" class="form-label">
                            Room
                        </label>
                        <input
                            id="room"
                            name="room"
                            type="text"
                            class="form-control"
                            bind:value={room}
                        />
                    </div>

                    <div class="col-md-6">
                        <label for="capacity" class="form-label">
                            Capacity
                        </label>
                        <input
                            id="capacity"
                            name="capacity"
                            type="number"
                            min="1"
                            step="1"
                            class="form-control"
                            bind:value={capacity}
                        />
                    </div>

                    <div class="col-md-6">
                        <label for="availability" class="form-label">
                            Availability
                        </label>
                        <select
                            id="availability"
                            name="availability"
                            class="form-select"
                            bind:value={availability}
                        >
                            <option value="true">Available</option>
                            <option value="false">Unavailable</option>
                        </select>
                    </div>

                    <div class="col-12">
                        <label for="description" class="form-label">
                            Description
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            class="form-control"
                            rows="3"
                            bind:value={description}
                        ></textarea>
                    </div>

                    <div class="col-12">
                        <button type="submit" class="btn add-button">
                            Add Resource
                        </button>
                    </div>
                </div>
            </form>
        </div>
    </div>
</div>

<style>
    h1 {
        color: #07234a;
        font-weight: 700;
    }

    .card {
        border-radius: 10px;
        overflow: hidden;
    }

    .card-header {
        background-color: #07234a;
        color: white;
        padding: 18px;
    }

    .card-body {
        padding: 25px;
    }

    .add-button {
        background-color: #ff8200;
        color: white;
        font-weight: 600;
        padding: 10px 25px;
    }

    .add-button:hover {
        background-color: #e67300;
        color: white;
    }
</style>
