<script lang="ts">
  export let className: string = "";
</script>

<div class={`bg-white rounded-lg shadow-md p-6 ${className}`}>
  <slot />
</div>
