---
aside: false
outline: false
pageClass: api-reference-page
---

<script setup>
import ApiReference from '../.vitepress/components/ApiReference.vue'
</script>

# Interactive API Reference

The reference below is rendered from `apps/api/openapi/openapi.json`. Use the
**Authorize** control to provide a Strafe access token when testing protected
endpoints. Refresh tokens must never be pasted into the reference UI.

<ClientOnly>
  <ApiReference />
  <template #fallback>
    <div class="api-reference-status" role="status">
      Loading the Strafe API reference…
    </div>
  </template>
</ClientOnly>
