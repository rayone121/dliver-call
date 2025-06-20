<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    apiClientSettings, 
    type ApiClientSettings,
    testApiConnection 
  } from '$lib/models/apiClient';
  import { page } from '$app/stores';

  // Get the form action status from the page data
  export let form = $page.form;
  
  let loading = true;
  let testing = false;
  let showApiKey = false;
  let settings: ApiClientSettings = $page.data.apiClientSettings || {
    host: '',
    apiKey: ''
  };
  let testResult: { success: boolean; message: string; data?: any } | null = null;

  // Form submission status
  let submitting = false;

  onMount(() => {
    loading = false;
  });

  async function handleTestConnection() {
    if (!settings) return;
    
    testing = true;
    testResult = null;
    
    try {
      testResult = await testApiConnection(settings);
    } catch (error) {
      testResult = {
        success: false,
        message: `Error testing connection: ${error instanceof Error ? error.message : String(error)}`
      };
    } finally {
      testing = false;
    }
  }

  function toggleApiKeyVisibility() {
    showApiKey = !showApiKey;
  }

  // Reset test result when form input changes
  function handleInputChange() {
    testResult = null;
  }
</script>

{#if form?.success === true}
  <div class="bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
    <strong class="font-bold">Success!</strong>
    <span class="block sm:inline"> {form.message}</span>
  </div>
{:else if form?.success === false}
  <div class="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
    <strong class="font-bold">Error!</strong>
    <span class="block sm:inline"> {form.message}</span>
  </div>
{/if}

<div class="bg-white p-6 rounded-lg shadow-md">
  <h2 class="text-xl font-semibold mb-4">API Client Settings</h2>
  
  {#if loading}
    <div class="flex justify-center items-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  {:else}
    <form method="POST" action="?/updateApiSettings" class="space-y-4">
      <div class="space-y-2">
        <label for="host" class="block text-sm font-medium text-gray-700">
          Host URL <span class="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="host"
          name="host"
          placeholder="http://localhost:8000"
          bind:value={settings.host}
          on:input={handleInputChange}
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          required
        />
        <p class="text-sm text-gray-500">
          The address of your API server (include protocol and port if needed)
        </p>
      </div>

      <div class="space-y-2">
        <label for="apiKey" class="block text-sm font-medium text-gray-700">
          API Key <span class="text-red-500">*</span>
        </label>
        <div class="relative">
          <input
            type={showApiKey ? "text" : "password"}
            id="apiKey"
            name="apiKey"
            placeholder="Your API key"
            bind:value={settings.apiKey}
            on:input={handleInputChange}
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary pr-12"
            required
          />
          <button 
            type="button" 
            class="absolute inset-y-0 right-0 px-3 flex items-center text-sm text-gray-500 hover:text-gray-700"
            on:click={toggleApiKeyVisibility}
          >
            {showApiKey ? 'Hide' : 'Show'}
          </button>
        </div>
        <p class="text-sm text-gray-500">
          The API key for authentication with your API server
        </p>
      </div>

      <div class="flex space-x-4 pt-4">
        <button
          type="submit"
          class="px-4 py-2 bg-primary text-white rounded-md shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
          disabled={submitting}
        >
          {submitting ? 'Saving...' : 'Save Settings'}
        </button>
        
        <button
          type="button"
          class="px-4 py-2 bg-secondary text-white rounded-md shadow-sm hover:bg-secondary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary disabled:opacity-50"
          on:click={handleTestConnection}
          disabled={testing || !settings.host || !settings.apiKey}
        >
          {testing ? 'Testing...' : 'Test Connection'}
        </button>
      </div>
    </form>

    {#if testResult}
      <div class={`mt-4 p-4 rounded-md ${testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
        <div class="flex items-center">
          <svg 
            class={`mr-2 h-5 w-5 ${testResult.success ? 'text-green-500' : 'text-red-500'}`} 
            fill="currentColor" 
            viewBox="0 0 20 20" 
            xmlns="http://www.w3.org/2000/svg"
          >
            {#if testResult.success}
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
            {:else}
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
            {/if}
          </svg>
          <p class="font-medium">{testResult.message}</p>
        </div>
        {#if testResult.success && testResult.data}
          <div class="mt-2 text-sm">
            <p>API: {testResult.data.api}</p>
            <p>Version: {testResult.data.version}</p>
            <p>Status: {testResult.data.status}</p>
          </div>
        {/if}
      </div>
    {/if}
  {/if}
</div>

<style>
  :global(.bg-primary) {
    background-color: #3b82f6;
  }
  
  :global(.bg-primary-dark) {
    background-color: #2563eb;
  }
  
  :global(.bg-secondary) {
    background-color: #6b7280;
  }
  
  :global(.bg-secondary-dark) {
    background-color: #4b5563;
  }
  
  :global(.text-primary) {
    color: #3b82f6;
  }
  
  :global(.border-primary) {
    border-color: #3b82f6;
  }
  
  :global(.ring-primary) {
    --tw-ring-color: #3b82f6;
  }
</style>