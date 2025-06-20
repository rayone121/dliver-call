<script lang="ts">
  export let type: 'success' | 'error' | 'info' | 'warning' = 'info';
  export let message: string = '';
  export let dismissible: boolean = false;
  export let onClose: (() => void) | null = null;
  export let className: string = '';

  let visible = true;

  function handleClose() {
    visible = false;
    if (onClose) onClose();
  }

  $: alertClasses = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800'
  }[type];
</script>

{#if visible}
  <div class={`relative border rounded-lg px-4 py-3 mb-4 ${alertClasses} ${className}`}>
    <div class="flex items-start">
      <div class="flex-1">
        <slot>{message}</slot>
      </div>
      {#if dismissible}
        <button
          class="ml-4 text-xl leading-none text-gray-400 hover:text-gray-600 focus:outline-none"
          aria-label="Close alert"
          on:click={handleClose}
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      {/if}
    </div>
  </div>
{/if}