---
aside: false
outline: false
pageClass: api-reference-page
---

<script setup>
import ApiReference from '../.vitepress/components/ApiReference.vue'
</script>

# Bot API Reference

This reference contains only operations available to scoped bot tokens. Use the
**Authorize** control with a `strafe_bot_…` credential. Each operation documents
its required scopes; server roles and channel permissions still apply.

<ClientOnly>
  <ApiReference document-path="/bot-openapi.json" />
  <template #fallback>
    <div class="api-reference-status" role="status">
      Loading the Strafe Bot API reference…
    </div>
  </template>
</ClientOnly>
