

<script>
  let { data } = $props();

  let search = $state('');
  let category = $state('All');
  let building = $state('All');

  let resources = $derived(data.resources ?? []);

  let buildings = $derived([
    'All',
    ...new Set(
      resources
        .map((resource) => resource.building)
        .filter(Boolean)
    )
  ]);

  let filteredResources = $derived(
    resources.filter((resource) => {
      const name = String(resource.name ?? '').toLowerCase();
      const type = String(resource.type ?? '').toLowerCase();
      const resourceBuilding = String(resource.building ?? '').toLowerCase();

      const query = search.trim().toLowerCase();
      const matchesName = name.includes(query) || type.includes(query);
      const matchesType =
        category === 'All' || type === category.toLowerCase();
      const matchesBuilding =
        building === 'All' ||
        resourceBuilding === building.toLowerCase();

      return matchesName && matchesType && matchesBuilding;
    })
  );
</script>


<div class="page">
  <h1>Browse Resources</h1>
  <p>Find classrooms and equipment available for reservation.</p>

  <input
    type="text"
    placeholder="Search resources..."
    bind:value={search}
  />

  <div class="filters">
    {#each ['All', 'Classroom', 'Equipment'] as option}
      <button
        class:active={category === option}
        onclick={() => category = option}
      >
        {option}
      </button>
    {/each}
  </div>

  
<div class="building-filter">
  <label for="building">Filter by Building:</label>

  <select id="building" bind:value={building}>
    {#each buildings as option}
      <option value={option}>
        {option === 'All' ? 'All Buildings' : option}
      </option>
    {/each}
  </select>
</div>

  <div class="resource-grid">
    {#each filteredResources as resource}
      <div class="resource-card">
        <h2>{resource.name}</h2>
        <p><strong>Type:</strong> {resource.type}</p>
        <p><strong>Location:</strong> {resource.location}</p>
        {#if resource.capacity}
          <p><strong>Capacity:</strong> {resource.capacity}</p>
        {/if}
        <a
          class="details"
          href={`/resources/${encodeURIComponent(resource.id)}/reserve`}
        >
        View Details
        </a>
      </div>
    {:else}
      <p>No resources found.</p>
    {/each}
  </div>
</div>

<style>
  .page {
    padding: 32px;
    font-family: Arial, sans-serif;
  }

  h1 {
    color: #07234a;
    margin-bottom: 8px;
  }

  .page > p {
    color: #64748b;
    margin-bottom: 24px;
  }

  input {
    width: 100%;
    max-width: 550px;
    padding: 12px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    box-sizing: border-box;
  }

  .filters {
    display: flex;
    gap: 10px;
    margin: 24px 0;
    flex-wrap: wrap;
  }

  .filters button {
    padding: 10px 18px;
    border: 1px solid #07234a;
    border-radius: 8px;
    background: white;
    color: #07234a;
    cursor: pointer;
  }

  .filters button.active {
    background: #07234a;
    color: white;
  }

  .resource-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
    gap: 20px;
  }

  .resource-card {
    padding: 22px;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    background: white;
    box-shadow: 0 2px 8px #0000000d;
  }

  .resource-card h2 {
    color: #07234a;
    margin-top: 0;
  }

  .details {
    background: #ff8200;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 10px 16px;
    cursor: pointer;
  }
  
  
.building-filter {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.building-filter label {
  color: #07234a;
  font-weight: bold;
}

.building-filter select {
  padding: 10px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: white;
}


</style>
