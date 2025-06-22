<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { apiClient } from "$lib/services/apiClient";
    import { apiClientSettings } from "$lib/models/apiClient";
    import DashboardNav from "$lib/components/DashboardNav.svelte";
    import Card from "$lib/components/Card.svelte";
    import Button from "$lib/components/Button.svelte";
    import Alert from "$lib/components/Alert.svelte";
    import { page } from "$app/stores";

    export let data;

    let sim: number;
    let active: boolean;
    let description: string;

    interface CallStatus {
        active: boolean;
        sim_states?: Array<{
            sim: number;
            active: boolean;
            description: string;
        }>;
    }

    interface ApiResponse {
        message?: string;
    }

    let callStatus: CallStatus | null = null;
    let loading = true;
    let callLoading = false;
    let hangupLoading = false;
    let hangupTimeout: ReturnType<typeof setTimeout> | null = null;
    let hangupTimeoutActive = false;
    let hangupTimeoutSeconds = 3;
    let statusInterval: ReturnType<typeof setInterval> | null = null;
    let phoneNumber = "";
    let simSlot: number | undefined = undefined;
    let errorMessage = "";
    let successMessage = "";

    $: hasApiSettings = !!(
        $apiClientSettings?.host && $apiClientSettings?.apiKey
    );

    const keys: string[] = [
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "*",
        "0",
        "#",
    ];

    let inputEl: HTMLInputElement;

    // Fix for long press variables
    let longPressTimer: ReturnType<typeof setTimeout> | null = null;
    let longPressCompleted = false;

    onMount(async () => {
        // Check for URL parameters to pre-fill phone number
        const urlParams = $page.url.searchParams;
        const phoneFromUrl = urlParams.get('phone');
        const clientFromUrl = urlParams.get('client');
        
        if (phoneFromUrl) {
            // Format the phone number from DB (via URL) to ensure international numbers have + prefix
            phoneNumber = formatDbPhoneNumber(phoneFromUrl);
            if (inputEl) {
                inputEl.focus();
            }
        }
        
        // Initialize API settings from server data
        if (data.apiClientSettings) {
            apiClientSettings.set(data.apiClientSettings);
        }
        
        // Check if API settings are configured using the server data
        const hasSettings = !!(data.apiClientSettings?.host && data.apiClientSettings?.apiKey);
        
        if (hasSettings) {
            await loadData();
            statusInterval = setInterval(fetchCallStatus, 3000);
        } else {
            console.error(
                "API settings not configured. Please configure them in the dashboard.",
            );
            loading = false;
        }
    });

    onDestroy(() => {
        if (statusInterval) clearInterval(statusInterval);
        if (hangupTimeout) clearTimeout(hangupTimeout);
    });

    async function loadData() {
        loading = true;
        errorMessage = "";
        try {
            await fetchCallStatus();
        } catch (error) {
            console.error("Error loading data:", error);
            errorMessage = `Error loading data: ${error instanceof Error ? error.message : String(error)}`;
        } finally {
            loading = false;
        }
    }

    async function fetchCallStatus() {
        try {
            const hasSettings = !!(data.apiClientSettings?.host && data.apiClientSettings?.apiKey);
            if (hasSettings) {
                callStatus = await apiClient.getCallStatus();
            }
        } catch (error) {
            console.error("Error fetching call status:", error);
            // Don't set error message here to avoid spamming the user
        }
    }

    function handleKeyPress(key: string) {
        if (phoneNumber.length < 15) {
            phoneNumber += key;
        }
    }

    function handleDelete() {
        phoneNumber = phoneNumber.slice(0, -1);
    }

    function handleCall() {
        if (phoneNumber) {
            makeCall();
        }
    }

    function handleLongPressStart(key: string) {
        if (key === "0") {
            longPressTimer = setTimeout(() => {
                phoneNumber += "+";
                longPressCompleted = true;
                longPressTimer = null;
            }, 800);
        }
    }

    function handleLongPressEnd() {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
        if (longPressCompleted) {
            setTimeout(() => {
                longPressCompleted = false;
            }, 100);
        }
    }

    function formatPhoneNumber(number: string) {
        if (number.includes("+")) return number;
        if (number.length <= 3) return number;
        if (number.length <= 6)
            return `(${number.slice(0, 3)}) ${number.slice(3)}`;
        return `(${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6)}`;
    }

    function formatPhoneNumberForCalling(number: string): string {
        // Just clean the number, don't automatically add +
        return number.replace(/[^\d+]/g, "");
    }

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

    function handleInputChange(event: Event) {
        const target = event.target as HTMLInputElement;
        const value = target.value;
        const cleaned = value.replace(/[^\d+]/g, "");
        if (cleaned.includes("+") && !cleaned.startsWith("+")) {
            const withoutPlus = cleaned.replace(/\+/g, "");
            phoneNumber = "+" + withoutPlus;
        } else {
            phoneNumber = cleaned;
        }
    }

    function handleDialerClick() {
        inputEl.focus();
    }

    async function makeCall() {
        const hasSettings = !!(data.apiClientSettings?.host && data.apiClientSettings?.apiKey);
        if (!hasSettings) {
            errorMessage =
                "API settings are not configured. Please configure them in the dashboard.";
            return;
        }

        if (!phoneNumber) {
            errorMessage = "Please enter a phone number";
            return;
        }
        callLoading = true;
        errorMessage = "";
        successMessage = "";
        try {
            // Clean the phone number for calling (don't auto-add + for manual input)
            const formattedPhoneNumber = formatPhoneNumberForCalling(phoneNumber);
            
            const result: ApiResponse = await apiClient.makeCall(
                formattedPhoneNumber,
                simSlot,
            );
            successMessage = result.message || "Call initiated successfully";
            
            // Log the call to PocketBase
            const urlParams = $page.url.searchParams;
            const clientFromUrl = urlParams.get('client');
            await logCallToPocketBase(phoneNumber, clientFromUrl || "Manual Dial");
            
            phoneNumber = "";
        } catch (error) {
            console.error("Error making call:", error);
            errorMessage = `Error making call: ${error instanceof Error ? error.message : String(error)}`;
        } finally {
            callLoading = false;
        }
    }

    async function logCallToPocketBase(phone: string, clientName: string) {
        try {
            console.log('Attempting to log call:', { phone, clientName });
            
            const formData = new FormData();
            formData.append('clientName', clientName);
            formData.append('phoneNumber', phone);
            
            const response = await fetch('?/logCall', {
                method: 'POST',
                body: formData
            });
            
            console.log('Response status:', response.status);
            
            if (response.ok) {
                const result = await response.text();
                console.log('Call logged successfully, server response:', result);
                
                // Manually add the new call log to the existing data
                const newLog = {
                    id: 'temp-' + Date.now(),
                    clientName: clientName,
                    phoneNumber: phone,
                    created: new Date().toISOString(),
                    duration: 0,
                    status: 'initiated'
                };
                data.callLogs = [newLog, ...(data.callLogs || [])];
            } else {
                const errorText = await response.text();
                console.error('Failed to log call:', response.status, errorText);
            }
        } catch (error) {
            console.error('Error logging call:', error);
        }
    }

    async function hangupCall() {
        const hasSettings = !!(data.apiClientSettings?.host && data.apiClientSettings?.apiKey);
        if (!hasSettings) {
            errorMessage =
                "API settings are not configured. Please configure them in the dashboard.";
            return;
        }

        hangupLoading = true;
        errorMessage = "";
        successMessage = "";
        try {
            const result: ApiResponse = await apiClient.hangupCall();
            successMessage = result.message || "Call ended successfully";
            
            // Update call log status to 'Ended'
            await endCallInPocketBase();
            
            hangupTimeoutActive = true;
            hangupTimeoutSeconds = 3;
            hangupTimeout = setInterval(() => {
                hangupTimeoutSeconds--;
                if (hangupTimeoutSeconds <= 0) {
                    if (hangupTimeout) clearInterval(hangupTimeout);
                    hangupTimeout = null;
                    hangupTimeoutActive = false;
                }
            }, 1000);
        } catch (error) {
            console.error("Error hanging up call:", error);
            errorMessage = `Error hanging up call: ${error instanceof Error ? error.message : String(error)}`;
        } finally {
            hangupLoading = false;
        }
    }

    async function endCallInPocketBase() {
        try {
            const formData = new FormData();
            formData.append('callLogId', 'latest'); // Server will find the latest initiated call
            
            const response = await fetch('?/endCall', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                console.log('Call status updated to Ended');
                
                // Update the UI to reflect the status change
                if (data.callLogs && data.callLogs.length > 0) {
                    const latestCall = data.callLogs.find(call => call.status === 'initiated');
                    if (latestCall) {
                        latestCall.status = 'ended';
                        data.callLogs = [...data.callLogs]; // Trigger reactivity
                    }
                }
            } else {
                console.error('Failed to update call status');
            }
        } catch (error) {
            console.error('Error updating call status:', error);
        }
    }

    let activeTab = "call"; // 'call' or 'recordings'
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    <div class="container mx-auto px-4 py-8">
        <DashboardNav user={{ id: data.user.id, email: data.user.email || data.user.username || 'User' }} />
        
        <div class="max-w-6xl mx-auto">
            <div class="text-center mb-6">
                <h1 class="text-3xl font-bold text-gray-900 mb-2">Call Center</h1>
                <p class="text-gray-600">Manage your calls with ease</p>
            </div>
            
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Left Column: Dialer -->
                <div class="bg-white rounded-2xl shadow-lg p-6">
                    <h2 class="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                        <svg class="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                        </svg>
                        Make a Call
                    </h2>
                    
                    <!-- Phone Input -->
                    <div class="mb-4">
                        <input
                            bind:this={inputEl}
                            type="tel"
                            class="w-full text-xl text-center font-medium h-12 px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Enter phone number"
                            value={formatPhoneNumber(phoneNumber)}
                            on:input={handleInputChange}
                        />
                    </div>
                    
                    <!-- Keypad -->
                    <div class="grid grid-cols-3 gap-2 mb-4">
                        {#each keys as key}
                            <button
                                class="h-12 flex items-center justify-center text-lg font-semibold rounded-lg bg-gray-50 hover:bg-blue-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all relative"
                                on:click={() => handleKeyPress(key.toString())}
                                on:mousedown={() => handleLongPressStart(key.toString())}
                                on:mouseup={handleLongPressEnd}
                                on:mouseleave={handleLongPressEnd}
                                on:touchstart={() => handleLongPressStart(key.toString())}
                                on:touchend={handleLongPressEnd}
                                type="button"
                            >
                                {key}
                                {#if key === "0"}
                                    <span class="absolute bottom-1 right-1 text-xs text-gray-400">+</span>
                                {/if}
                            </button>
                        {/each}
                    </div>
                    
                    <!-- Delete Button -->
                    <div class="flex justify-center mb-4">
                        <button
                            class="h-10 w-16 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-red-100 hover:text-red-600 text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all disabled:opacity-50"
                            on:click={handleDelete}
                            disabled={phoneNumber === ""}
                            type="button"
                            aria-label="Delete"
                        >
                            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                            </svg>
                        </button>
                    </div>
                    
                    <!-- SIM Selection -->
                    <fieldset class="mb-4">
                        <legend class="block text-sm font-medium text-gray-700 mb-2">SIM Selection</legend>
                        <div class="flex rounded-lg bg-gray-100 p-1">
                            <button
                                class="flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all {simSlot === undefined ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}"
                                type="button"
                                on:click={() => (simSlot = undefined)}
                            >Default</button>
                            <button
                                class="flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all {simSlot === 0 ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}"
                                type="button"
                                on:click={() => (simSlot = 0)}
                            >SIM 1</button>
                            <button
                                class="flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all {simSlot === 1 ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}"
                                type="button"
                                on:click={() => (simSlot = 1)}
                            >SIM 2</button>
                        </div>
                    </fieldset>
                    
                    <!-- Call/Hangup Buttons -->
                    <div class="flex gap-3">
                        <button
                            on:click={makeCall}
                            disabled={callLoading || !phoneNumber}
                            class="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all"
                        >
                            {#if callLoading}
                                <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                                </svg>
                                Calling...
                            {:else}
                                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                Call
                            {/if}
                        </button>
                        <button
                            on:click={hangupCall}
                            disabled={hangupLoading || !callStatus?.active || hangupTimeoutActive}
                            class="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 transition-all"
                        >
                            {#if hangupLoading}
                                <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                                </svg>
                                Hanging up...
                            {:else if hangupTimeoutActive}
                                <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                                </svg>
                                Wait ({hangupTimeoutSeconds}s)
                            {:else}
                                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 3l18 18" />
                                </svg>
                                Hang Up
                            {/if}
                        </button>
                    </div>
                </div>
                
                <!-- Right Column: Status and Call Log -->
                <div class="space-y-6">
                    <!-- Status Card -->
                    <div class="bg-white rounded-2xl shadow-lg p-6">
                        <h2 class="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                            <svg class="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                            </svg>
                            Call Status
                        </h2>
                        <div class="space-y-4">
                            <div class="flex items-center justify-center">
                                {#if callStatus?.active}
                                    <div class="flex items-center space-x-2 bg-red-50 text-red-700 px-4 py-2 rounded-lg">
                                        <div class="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                                        <span class="font-medium">Call Active</span>
                                    </div>
                                {:else}
                                    <div class="flex items-center space-x-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg">
                                        <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                                        <span class="font-medium">Ready</span>
                                    </div>
                                {/if}
                            </div>
                            
                            {#if callStatus?.sim_states?.length}
                                <div class="space-y-2">
                                    <h3 class="text-sm font-medium text-gray-700">SIM Status</h3>
                                    <div class="grid grid-cols-1 gap-2">
                                        {#each callStatus.sim_states as simState}
                                            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <span class="text-sm font-medium text-gray-700">SIM {simState.sim + 1}</span>
                                                <div class="flex items-center space-x-2">
                                                    <div class="w-2 h-2 rounded-full {simState.active ? 'bg-red-500' : 'bg-gray-400'}"></div>
                                                    <span class="text-xs text-gray-600">{simState.description}</span>
                                                </div>
                                            </div>
                                        {/each}
                                    </div>
                                </div>
                            {/if}
                        </div>
                    </div>
                    
                    <!-- Call Log Card -->
                    <div class="bg-white rounded-2xl shadow-lg p-6">
                        <h2 class="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                            <svg class="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                            Recent Calls
                        </h2>
                        <div class="space-y-2 max-h-64 overflow-y-auto">
                            {#if data.callLogs && data.callLogs.length > 0}
                                {#each data.callLogs as log}
                                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                        <div class="flex-1">
                                            <div class="flex items-center space-x-3">
                                                <div class="flex-shrink-0">
                                                    <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                        <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                        </svg>
                                                    </div>
                                                </div>
                                                <div class="flex-1 min-w-0">
                                                    <p class="text-sm font-medium text-gray-900 truncate">
                                                        {log.clientName}
                                                    </p>
                                                    <p class="text-xs text-gray-500 truncate">
                                                        {log.phoneNumber}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="flex flex-col items-end space-y-1 text-xs text-gray-500">
                                            <span class="px-2 py-1 bg-{log.status.toLowerCase() === 'ended' ? 'green' : log.status.toLowerCase() === 'initiated' ? 'blue' : 'red'}-100 text-{log.status.toLowerCase() === 'ended' ? 'green' : log.status.toLowerCase() === 'initiated' ? 'blue' : 'red'}-800 rounded-full">
                                                {log.status}
                                            </span>
                                            <span class="text-xs">
                                                {new Date(log.created).toLocaleDateString()} {new Date(log.created).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                        </div>
                                    </div>
                                {/each}
                            {:else}
                                <div class="text-center py-8">
                                    <svg class="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 7h.01M9 16h.01" />
                                    </svg>
                                    <p class="mt-2 text-sm text-gray-600">No calls logged yet</p>
                                </div>
                            {/if}
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Messages -->
            {#if errorMessage || successMessage}
                <div class="mt-6">
                    {#if errorMessage}
                        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                            {errorMessage}
                        </div>
                    {/if}
                    
                    {#if successMessage}
                        <div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                            {successMessage}
                        </div>
                    {/if}
                </div>
            {/if}
            
            <!-- Loading Overlay -->
            {#if loading}
                <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div class="bg-white rounded-lg p-8 flex items-center space-x-4">
                        <svg class="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                        </svg>
                        <span class="text-gray-700">Loading...</span>
                    </div>
                </div>
            {/if}
        </div>
    </div>
</div>
