<script lang="ts">
  import { page } from '$app/stores';

  export let user: {id: string, email: string} | null = null;
  
  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'home' },
    { path: '/dashboard/calls', label: 'Call Center', icon: 'phone' },
    { path: '/dashboard/contacts', label: 'Contacts', icon: 'users' },
    { path: '/dashboard/recordings', label: 'Recordings', icon: 'microphone' }
  ];
  
  function getIcon(name: string) {
    switch (name) {
      case 'home':
        return `<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l-5-5m0 0l-5 5m5-5v12" />
                </svg>`;
      case 'phone':
        return `<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>`;
      case 'users':
        return `<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>`;
      case 'microphone':
        return `<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>`;
      default:
        return '';
    }
  }
</script>

<nav class="bg-white shadow-lg rounded-2xl mb-8 overflow-hidden">
  <div class="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600">
    <div class="flex items-center space-x-3">
      <div class="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
        <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
        </svg>
      </div>
      <h1 class="font-bold text-xl text-white">Dliver Call</h1>
    </div>
    <div class="flex items-center space-x-4">
      {#if user}
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
            </svg>
          </div>
          <span class="text-sm text-white font-medium">{user.email || 'User'}</span>
          <form method="POST" action="/logout?/logout">
            <button type="submit" class="inline-flex items-center px-3 py-1.5 border border-white border-opacity-20 text-sm font-medium rounded-lg text-white hover:bg-white hover:bg-opacity-10 transition-all">
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </form>
        </div>
      {/if}
    </div>
  </div>
  
  <div class="flex px-4 py-3 bg-gray-50 overflow-x-auto">
    {#each navItems as item}
      <a 
        href={item.path}
        class="flex items-center px-4 py-2.5 mx-1 rounded-xl text-sm font-medium transition-all {$page.url.pathname === item.path || ($page.url.pathname.startsWith(item.path) && item.path !== '/dashboard') ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-gray-600 hover:bg-white hover:text-gray-800 hover:shadow-sm'}"
      >
        <span class="mr-2">
          {@html getIcon(item.icon)}
        </span>
        {item.label}
      </a>
    {/each}
  </div>
</nav>