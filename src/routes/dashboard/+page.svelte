<script lang="ts">
    export let data;
    
    const user = data.user;
</script>

<div class="container mx-auto p-8">
    <div class="bg-white rounded-lg shadow-md p-6">
        <h1 class="text-2xl font-bold mb-4">Dashboard</h1>
        
        <div class="mb-6">
            <h2 class="text-xl font-semibold mb-2">Welcome, {user.email || 'User'}!</h2>
            <p class="text-gray-600">You're successfully logged in with PocketBase authentication.</p>
        </div>
        
        <div class="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 class="text-lg font-medium mb-2">User Information</h3>
            <div class="grid grid-cols-2 gap-2">
                <div class="text-gray-500">ID:</div>
                <div>{user.id}</div>
                <div class="text-gray-500">Email:</div>
                <div>{user.email}</div>
                <div class="text-gray-500">Created:</div>
                <div>{new Date(user.created).toLocaleString()}</div>
            </div>
        </div>
        
        <form method="POST" action="/logout?/logout">
            <button type="submit" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md">
                Sign Out
            </button>
        </form>
    </div>
</div>