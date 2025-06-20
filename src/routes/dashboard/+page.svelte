<script lang="ts">
    import ApiClientSettings from "$lib/components/ApiClientSettings.svelte";
    import DashboardNav from "$lib/components/DashboardNav.svelte";
    import Card from "$lib/components/Card.svelte";
    import Alert from "$lib/components/Alert.svelte";
    import Button from "$lib/components/Button.svelte";
    import { onMount } from "svelte";
    import { apiClient } from "$lib/services/apiClient";
    import { apiClientSettings } from "$lib/models/apiClient";

    export let data;
    const user = data.user;
    let adbStatus:
        | {
              connected: boolean;
              devices?: { id: string; status: string }[];
              message?: string;
          }
        | undefined = undefined;

    // Using the loading variable to track loading state
    let loading = true;
    let hasApiSettings = false;

    onMount(async () => {
        try {
            // Check if API settings are configured
            hasApiSettings = !!(data.apiClientSettings?.host && data.apiClientSettings?.apiKey);
            
            // Update the apiClientSettings store with the server data
            if (data.apiClientSettings) {
                apiClientSettings.set(data.apiClientSettings);
                console.log("API settings loaded:", { 
                    host: data.apiClientSettings.host, 
                    hasApiKey: !!data.apiClientSettings.apiKey 
                });
            }
            
            // Only try to get ADB status if we have API settings
            if (hasApiSettings) {
                try {
                    adbStatus = await apiClient.getStatus();
                } catch (apiError) {
                    console.error("Error fetching ADB status:", apiError);
                    // Set a default status to avoid further errors
                    adbStatus = { connected: false, message: "Connection failed" };
                }
            } else {
                console.log("API settings not configured. Please configure them first.");
                // Set a default status indicating no configuration
                adbStatus = { connected: false, message: "API key not configured" };
            }
        } catch (error) {
            console.error("Error in dashboard initialization:", error);
            adbStatus = { connected: false, message: "Initialization failed" };
        } finally {
            loading = false;
        }
    });
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    <div class="container mx-auto px-4 py-8">
        <DashboardNav user={{ id: user.id, email: user.email }} />
        
        <div class="max-w-6xl mx-auto">
            <!-- Welcome Section -->
            <div class="bg-white rounded-2xl shadow-lg p-8 mb-8">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user.email.split('@')[0]}!</h1>
                        <p class="text-gray-600">Here's your call management dashboard overview</p>
                    </div>
                    <div class="hidden md:block">
                        <div class="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center">
                            <svg class="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Quick Actions -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <a href="/dashboard/calls" class="group bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all">
                    <div class="flex items-center justify-between mb-4">
                        <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                        </div>
                        <svg class="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">Call Center</h3>
                    <p class="text-gray-600 text-sm">Make and manage calls with advanced controls</p>
                </a>
                
                <a href="/dashboard/recordings" class="group bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all">
                    <div class="flex items-center justify-between mb-4">
                        <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                        </div>
                        <svg class="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">Recordings</h3>
                    <p class="text-gray-600 text-sm">Access and transcribe your call recordings</p>
                </a>
                
                <div class="bg-white rounded-2xl shadow-lg p-6">
                    <div class="flex items-center justify-between mb-4">
                        <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                            <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">Analytics</h3>
                    <p class="text-gray-600 text-sm">View call statistics and insights</p>
                    <span class="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">Coming Soon</span>
                </div>
            </div>
            
            <!-- Account Info -->
            <div class="bg-white rounded-2xl shadow-lg p-6 mb-8">
                <h2 class="text-xl font-semibold text-gray-900 mb-4">Account Information</h2>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="bg-gray-50 rounded-xl p-4">
                        <div class="flex items-center mb-2">
                            <svg class="w-5 h-5 text-gray-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                            </svg>
                            <span class="text-sm font-medium text-gray-500">User ID</span>
                        </div>
                        <p class="text-sm text-gray-900 font-mono">{user.id}</p>
                    </div>
                    <div class="bg-gray-50 rounded-xl p-4">
                        <div class="flex items-center mb-2">
                            <svg class="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                            </svg>
                            <span class="text-sm font-medium text-gray-500">Email</span>
                        </div>
                        <p class="text-sm text-gray-900">{user.email}</p>
                    </div>
                    <div class="bg-gray-50 rounded-xl p-4">
                        <div class="flex items-center mb-2">
                            <svg class="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m-6 0v8m0-8h6m-6 8V7m6 8V7" />
                            </svg>
                            <span class="text-sm font-medium text-gray-500">Member Since</span>
                        </div>
                        <p class="text-sm text-gray-900">{new Date(user.created).toLocaleDateString()}</p>
                    </div>
                </div>
            </div>

            <!-- Settings & Status -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <!-- API Settings -->
                <div class="bg-white rounded-2xl shadow-lg p-6">
                    <h2 class="text-xl font-semibold text-gray-900 mb-4">API Configuration</h2>
                    <ApiClientSettings />
                </div>
                
                <!-- Connection Status -->
                <div class="bg-white rounded-2xl shadow-lg p-6">
                    <h2 class="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                        <svg class="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                        </svg>
                        Connection Status
                    </h2>
                    
                    {#if loading}
                        <div class="flex items-center justify-center py-8">
                            <svg class="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                            </svg>
                        </div>
                    {:else if !data.apiClientSettings?.apiKey}
                        <div class="bg-red-50 border border-red-200 rounded-xl p-4">
                            <div class="flex items-center">
                                <svg class="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                                </svg>
                                <div>
                                    <p class="text-red-800 font-medium">API Key Required</p>
                                    <p class="text-red-700 text-sm">Configure your API key to enable device connection</p>
                                </div>
                            </div>
                        </div>
                    {:else if adbStatus?.connected}
                        <div class="space-y-4">
                            <div class="bg-green-50 border border-green-200 rounded-xl p-4">
                                <div class="flex items-center">
                                    <svg class="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                                    </svg>
                                    <div>
                                        <p class="text-green-800 font-medium">Connected</p>
                                        <p class="text-green-700 text-sm">ADB connection is active</p>
                                    </div>
                                </div>
                            </div>
                            
                            {#if adbStatus.devices && adbStatus.devices.length > 0}
                                <div class="space-y-2">
                                    <h3 class="text-sm font-medium text-gray-700">Connected Devices</h3>
                                    {#each adbStatus.devices as device}
                                        <div class="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                                            <span class="text-sm font-medium text-gray-900">{device.id}</span>
                                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                {device.status}
                                            </span>
                                        </div>
                                    {/each}
                                </div>
                            {/if}
                        </div>
                    {:else}
                        <div class="bg-red-50 border border-red-200 rounded-xl p-4">
                            <div class="flex items-center">
                                <svg class="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                                </svg>
                                <div>
                                    <p class="text-red-800 font-medium">Not Connected</p>
                                    <p class="text-red-700 text-sm">{adbStatus?.message || "No devices detected"}</p>
                                </div>
                            </div>
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    </div>
</div>
