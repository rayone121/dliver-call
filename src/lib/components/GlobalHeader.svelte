<script lang="ts">
  export let user: {id: string, email: string} | null = null;
  export let showNavigation = false;
  export let title = "Dliver Call";
</script>

<header class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between h-16">
      <div class="flex items-center space-x-3">
        <a href="/" class="flex items-center space-x-3">
          <div class="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
          </div>
          <h1 class="font-bold text-xl text-white">{title}</h1>
        </a>
      </div>

      <div class="flex items-center space-x-4">
        {#if showNavigation && user}
          <nav class="hidden md:flex space-x-6">
            <a href="/dashboard" class="text-white hover:text-blue-200 transition-colors">Dashboard</a>
            <a href="/dashboard/calls" class="text-white hover:text-blue-200 transition-colors">Call Center</a>
            <a href="/dashboard/recordings" class="text-white hover:text-blue-200 transition-colors">Recordings</a>
          </nav>
        {/if}

        {#if user}
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
              </svg>
            </div>
            <span class="text-sm text-white font-medium hidden sm:block">{user.email}</span>
            <form method="POST" action="/logout?/logout">
              <button type="submit" class="inline-flex items-center px-3 py-1.5 border border-white border-opacity-20 text-sm font-medium rounded-lg text-white hover:bg-white hover:bg-opacity-10 transition-all">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span class="hidden sm:inline">Sign Out</span>
              </button>
            </form>
          </div>
        {:else}
          <a href="/login" class="inline-flex items-center px-4 py-2 border border-white border-opacity-20 text-sm font-medium rounded-lg text-white hover:bg-white hover:bg-opacity-10 transition-all">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Sign In
          </a>
        {/if}
      </div>
    </div>
  </div>
</header>