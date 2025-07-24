<template>
  <div class="container">
    <h1>React to Vue Migration Dashboard</h1>
    
    <div class="stats-grid">
      <div class="stat-card">
        <h3>Total Components</h3>
        <div class="value">{{ stats.total }}</div>
      </div>
      <div class="stat-card">
        <h3>Pending</h3>
        <div class="value">{{ stats.pending }}</div>
      </div>
      <div class="stat-card">
        <h3>In Progress</h3>
        <div class="value">{{ stats.inProgress }}</div>
      </div>
      <div class="stat-card">
        <h3>Migrated</h3>
        <div class="value">{{ stats.migrated }}</div>
      </div>
      <div class="stat-card">
        <h3>Verified</h3>
        <div class="value">{{ stats.verified }}</div>
      </div>
      <div class="stat-card">
        <h3>Test Coverage</h3>
        <div class="value">{{ stats.averageTestCoverage.toFixed(1) }}%</div>
      </div>
    </div>
    
    <div class="progress-bar">
      <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
    </div>
    
    <h2>Components</h2>
    <div class="component-table">
      <table>
        <thead>
          <tr>
            <th>Component Path</th>
            <th>React LOC</th>
            <th>Vue LOC</th>
            <th>Status</th>
            <th>Test Coverage</th>
            <th>Migrated By</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="component in components" :key="component.id">
            <td>{{ component.component_path }}</td>
            <td>{{ component.react_loc }}</td>
            <td>{{ component.vue_loc || '-' }}</td>
            <td>
              <span :class="['status-badge', 'status-' + component.status]">
                {{ component.status }}
              </span>
            </td>
            <td>{{ component.test_coverage ? component.test_coverage + '%' : '-' }}</td>
            <td>{{ component.migrated_by || '-' }}</td>
            <td>{{ component.notes || '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

interface Stats {
  total: number;
  pending: number;
  inProgress: number;
  migrated: number;
  verified: number;
  totalReactLoc: number;
  totalVueLoc: number;
  averageTestCoverage: number;
}

interface Component {
  id: number;
  component_path: string;
  react_loc: number;
  vue_loc: number;
  status: string;
  test_coverage: number;
  migrated_by: string;
  notes: string;
}

const stats = ref<Stats>({
  total: 0,
  pending: 0,
  inProgress: 0,
  migrated: 0,
  verified: 0,
  totalReactLoc: 0,
  totalVueLoc: 0,
  averageTestCoverage: 0
});

const components = ref<Component[]>([]);

const progressPercentage = computed(() => {
  if (stats.value.total === 0) return 0;
  return ((stats.value.migrated + stats.value.verified) / stats.value.total) * 100;
});

async function fetchData() {
  try {
    // Fetch stats
    const statsResponse = await fetch('/api/v1/migration/stats');
    stats.value = await statsResponse.json();
    
    // Fetch components
    const componentsResponse = await fetch('/api/v1/migration/components');
    components.value = await componentsResponse.json();
  } catch (error) {
    console.error('Failed to fetch migration data:', error);
  }
}

onMounted(() => {
  fetchData();
  // Refresh every 10 seconds
  setInterval(fetchData, 10000);
});
</script>