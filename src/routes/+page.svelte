<script lang="ts">
    export let data;
</script>

<div class="container mx-auto p-8">
    <h1 class="text-3xl font-bold mb-6">Welcome to Dliver-Call</h1>
    
    {#if data.user}
        <div class="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <p class="text-lg">
                You are logged in as <span class="font-semibold">{data.user.email}</span>.
            </p>
            <div class="mt-4">
                <a href="/dashboard" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md mr-4">
                    Go to Dashboard
                </a>
                <form method="POST" action="/logout?/logout" class="inline-block">
                    <button type="submit" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md">
                        Sign Out
                    </button>
                </form>
            </div>
        </div>
    {:else}
        <div class="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
            <p class="text-lg mb-4">
                Please sign in to access your account.
            </p>
            <a href="/login" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
                Sign In
            </a>
        </div>
    {/if}
    
    <div class="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-semibold mb-4">About Dliver-Call</h2>
        <p class="text-gray-700">
            This application demonstrates PocketBase authentication integration with SvelteKit 5.
            The authentication system features secure login and session management.
        </p>
    </div>
</div>