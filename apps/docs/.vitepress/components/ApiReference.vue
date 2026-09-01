<script setup lang="ts">
import '@scalar/api-reference/style.css'

import { onMounted, ref } from 'vue'
import { defineClientComponent, withBase } from 'vitepress'

const documentUrl = withBase('/openapi.json')
const status = ref<'loading' | 'ready' | 'error'>('loading')
const errorMessage = ref('')

const configuration = {
  customCss: `
    :root {
      --scalar-color-accent: #059669;
      --scalar-color-green: #10b981;
    }

    .dark-mode {
      --scalar-color-accent: #34d399;
      --scalar-color-green: #34d399;
    }
  `,
  hideClientButton: true,
  hideDownloadButton: false,
  showSidebar: true,
  theme: 'default',
  url: documentUrl,
}

const ScalarApiReference = defineClientComponent(
  () => import('./ScalarApiReference.client'),
  [{ configuration }],
)

async function loadReference() {
  status.value = 'loading'
  errorMessage.value = ''

  try {
    const response = await fetch(documentUrl, {
      headers: { accept: 'application/json' },
    })
    if (!response.ok) {
      throw new Error(`OpenAPI request returned ${response.status}`)
    }

    const document = (await response.json()) as {
      info?: { title?: unknown }
      openapi?: unknown
    }
    if (
      typeof document.openapi !== 'string' ||
      typeof document.info?.title !== 'string'
    ) {
      throw new Error('OpenAPI document has an invalid structure')
    }

    status.value = 'ready'
  } catch (error) {
    status.value = 'error'
    errorMessage.value =
      error instanceof Error ? error.message : 'Unknown loading error'
  }
}

onMounted(loadReference)
</script>

<template>
  <div v-if="status === 'loading'" class="api-reference-status" role="status">
    Loading the Strafe API reference…
  </div>
  <div v-else-if="status === 'error'" class="api-reference-status" role="alert">
    <strong>Unable to load the API reference.</strong>
    <span>{{ errorMessage }}</span>
    <button type="button" @click="loadReference">Try again</button>
  </div>
  <div v-else class="scalar-api-reference">
    <ScalarApiReference />
  </div>
</template>
