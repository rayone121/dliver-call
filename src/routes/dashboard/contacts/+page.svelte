<script lang="ts">
    import DashboardNav from "$lib/components/DashboardNav.svelte";
    import Button from "$lib/components/Button.svelte";
    import { goto } from "$app/navigation";

    export let data;
    const { user, clients } = data;

    function formatDbPhoneNumber(number: string): string {
        // Remove all non-digit characters except +
        const cleaned = number.replace(/[^\d+]/g, "");
        
        // If it already starts with +, return as is
        if (cleaned.startsWith("+")) {
            return cleaned;
        }
        
        // Check if it looks like an international number (longer than typical local numbers)
        // and doesn't start with 0 (which is usually local)
        if (cleaned.length >= 10 && !cleaned.startsWith("0")) {
            return "+" + cleaned;
        }
        
        // For local numbers or numbers starting with 0, return as-is
        return cleaned;
    }

    async function handleCall(client: any) {
        if (client.phone) {
            // Format the phone number from DB to ensure international numbers have + prefix
            const formattedPhone = formatDbPhoneNumber(client.phone);
            
            // Log the call to PocketBase (don't await to avoid blocking navigation)
            logCallToPocketBase(formattedPhone, client.name || 'Unnamed Client');
            
            // Redirect to call page with phone number pre-filled
            goto(`/dashboard/calls?phone=${encodeURIComponent(formattedPhone)}&client=${encodeURIComponent(client.name || 'Unnamed Client')}`);
        } else {
            alert('No phone number available for this client');
        }
    }

    async function logCallToPocketBase(phone: string, clientName: string) {
        try {
            console.log('Contacts page - Attempting to log call:', { phone, clientName });
            
            const formData = new FormData();
            formData.append('clientName', clientName);
            formData.append('phoneNumber', phone);
            
            const response = await fetch('?/logCall', {
                method: 'POST',
                body: formData
            });
            
            console.log('Contacts page - Response status:', response.status);
            
            if (response.ok) {
                const result = await response.text();
                console.log('Contacts page - Call logged successfully:', result);
            } else {
                const errorText = await response.text();
                console.error('Contacts page - Failed to log call:', response.status, errorText);
            }
        } catch (error) {
            console.error('Contacts page - Error logging call:', error);
        }
    }
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    <div class="container mx-auto px-4 py-8">
        <DashboardNav user={{ id: user.id, email: user.email }} />
        
        <div class="max-w-6xl mx-auto">
            <!-- Header -->
            <div class="bg-white rounded-2xl shadow-lg p-8 mb-8">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-3xl font-bold text-gray-900 mb-2">Contacts</h1>
                        <p class="text-gray-600">Manage your client contacts and make calls</p>
                    </div>
                    <div class="hidden md:block">
                        <div class="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center">
                            <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Clients Table -->
            <div class="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div class="px-6 py-4 border-b border-gray-200">
                    <h2 class="text-lg font-semibold text-gray-900">Client Directory</h2>
                    <p class="text-sm text-gray-600 mt-1">Total: {clients.length} clients</p>
                </div>
                
                {#if clients.length > 0}
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        VAT
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Phone
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                {#each clients as client}
                                    <tr class="hover:bg-gray-50">
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="flex items-center">
                                                <div class="flex-shrink-0 h-10 w-10">
                                                    <div class="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                                                        <span class="text-sm font-medium text-blue-600">
                                                            {client.name ? client.name.charAt(0).toUpperCase() : '?'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div class="ml-4">
                                                    <div class="text-sm font-medium text-gray-900">
                                                        {client.name || 'Unnamed Client'}
                                                    </div>
                                                    <div class="text-sm text-gray-500">
                                                        ID: {client.id}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="text-sm text-gray-900">{client.vat || '-'}</div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="text-sm text-gray-900">{client.phone || '-'}</div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="text-sm text-gray-900">{client.email || '-'}</div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <Button
                                                on:click={() => handleCall(client)}
                                                disabled={!client.phone}
                                                class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                            >
                                                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                </svg>
                                                Call
                                            </Button>
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                {:else}
                    <div class="text-center py-12">
                        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <h3 class="mt-2 text-sm font-medium text-gray-900">No clients found</h3>
                        <p class="mt-1 text-sm text-gray-500">
                            No clients have been added to your database yet.
                        </p>
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>