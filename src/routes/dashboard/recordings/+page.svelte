<script lang="ts">
import { onMount } from "svelte";
import { apiClient } from "$lib/services/apiClient";
import DashboardNav from "$lib/components/DashboardNav.svelte";

export let data;

interface Recording {
    name: string;
    type: "incoming" | "outgoing";
    size: number;
}

let recordings: Recording[] = [];
let recordingsLoading = false;
let errorMessage = "";
let successMessage = "";
let selectedRecording: Recording | null = null;
let transcriptionLanguage = "en";
let transcribing = false;
let transcriptionResult = "";
let transcriptionError = "";
let transcriptionRecording: Recording | null = null;
let playingRecording: Recording | null = null;
let audioElement: HTMLAudioElement | null = null;
let isPlaying = false;
let audioUrl: string | null = null;

onMount(fetchRecordings);

async function fetchRecordings() {
    recordingsLoading = true;
    try {
        const response = await apiClient.getRecordings();
        recordings = response.recordings || [];
    } catch (error) {
        errorMessage = `Error fetching recordings: ${error instanceof Error ? error.message : String(error)}`;
    } finally {
        recordingsLoading = false;
    }
}

async function transcribeRecording(recording: Recording) {
    if (!recording) return;
    transcriptionRecording = recording;
    transcribing = true;
    transcriptionResult = "";
    transcriptionError = "";
    try {
        const result = await apiClient.getTranscription(recording.name, transcriptionLanguage);
        transcriptionResult = result.text || "No transcription available.";
    } catch (error) {
        transcriptionError = `Error transcribing: ${error instanceof Error ? error.message : String(error)}`;
    } finally {
        transcribing = false;
    }
}

async function deleteRecording(recording: Recording) {
    if (!confirm(`Are you sure you want to delete recording ${recording.name}?`)) return;
    selectedRecording = recording;
    try {
        await apiClient.deleteRecording(recording.name, recording.type);
        successMessage = `Recording ${recording.name} deleted successfully`;
        await fetchRecordings();
    } catch (error) {
        errorMessage = `Error deleting recording: ${error instanceof Error ? error.message : String(error)}`;
    } finally {
        selectedRecording = null;
    }
}

async function playRecording(recording: Recording) {
    try {
        if (playingRecording?.name === recording.name && isPlaying) {
            // Pause if the same recording is already playing
            audioElement?.pause();
            isPlaying = false;
            return;
        }
        
        // Stop any currently playing audio
        if (audioElement) {
            audioElement.pause();
            audioElement.currentTime = 0;
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
            }
        }
        
        playingRecording = recording;
        const blob = await apiClient.getRecordingBlob(recording.name);
        audioUrl = URL.createObjectURL(blob);
        
        audioElement = new Audio(audioUrl);
        audioElement.onplay = () => { isPlaying = true; };
        audioElement.onpause = () => { isPlaying = false; };
        audioElement.onended = () => { 
            isPlaying = false; 
            playingRecording = null;
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
                audioUrl = null;
            }
        };
        audioElement.onerror = () => {
            errorMessage = `Error playing recording: ${recording.name}`;
            isPlaying = false;
            playingRecording = null;
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
                audioUrl = null;
            }
        };
        
        await audioElement.play();
    } catch (error) {
        errorMessage = `Error playing recording: ${error instanceof Error ? error.message : String(error)}`;
        playingRecording = null;
        isPlaying = false;
    }
}
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    <div class="container mx-auto px-4 py-8">
        <DashboardNav user={data.user} />
        
        <div class="max-w-6xl mx-auto">
            <div class="text-center mb-8">
                <h1 class="text-4xl font-bold text-gray-900 mb-2">Call Recordings</h1>
                <p class="text-gray-600">Manage and transcribe your call recordings</p>
            </div>
            
            <div class="bg-white rounded-2xl shadow-lg p-6">
                <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
                    <div class="flex items-center space-x-2">
                        <svg class="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clip-rule="evenodd" />
                        </svg>
                        <h2 class="text-2xl font-semibold text-gray-800">Recordings Library</h2>
                    </div>
                    <button 
                        on:click={fetchRecordings} 
                        disabled={recordingsLoading} 
                        class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all"
                    >
                        {#if recordingsLoading}
                            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                            </svg>
                            Refreshing...
                        {:else}
                            <svg class="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Refresh
                        {/if}
                    </button>
                </div>
                {#if errorMessage}
                    <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center">
                        <svg class="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                        </svg>
                        {errorMessage}
                    </div>
                {/if}
                {#if successMessage}
                    <div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center">
                        <svg class="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                        </svg>
                        {successMessage}
                    </div>
                {/if}
                {#if recordingsLoading && recordings.length === 0}
                    <div class="flex justify-center items-center py-16">
                        <div class="text-center">
                            <svg class="animate-spin h-8 w-8 text-blue-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                            </svg>
                            <p class="text-gray-600">Loading recordings...</p>
                        </div>
                    </div>
                {:else if recordings.length === 0}
                    <div class="text-center py-16">
                        <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clip-rule="evenodd" />
                        </svg>
                        <h3 class="text-lg font-medium text-gray-900 mb-2">No recordings found</h3>
                        <p class="text-gray-500">No call recordings are available on the device yet.</p>
                    </div>
                {:else}
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {#each recordings as recording}
                            <div class="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                                <div class="flex items-start justify-between mb-4">
                                    <div class="flex-1">
                                        <h3 class="text-lg font-semibold text-gray-900 truncate">{recording.name}</h3>
                                        <div class="flex items-center mt-2 space-x-4">
                                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {recording.type === 'incoming' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}">
                                                <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                    {#if recording.type === 'incoming'}
                                                        <path fill-rule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clip-rule="evenodd" />
                                                    {:else}
                                                        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                                                    {/if}
                                                </svg>
                                                {recording.type}
                                            </span>
                                            <span class="text-sm text-gray-500">
                                                {recording.size < 1024
                                                    ? `${recording.size} B`
                                                    : recording.size < 1048576
                                                        ? `${Math.round((recording.size / 1024) * 10) / 10} KB`
                                                        : `${Math.round((recording.size / 1048576) * 10) / 10} MB`}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="flex space-x-2">
                                    <button 
                                        on:click={() => playRecording(recording)} 
                                        class="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg {playingRecording?.name === recording.name && isPlaying ? 'text-red-700 bg-red-100 hover:bg-red-200' : 'text-green-700 bg-green-100 hover:bg-green-200'} focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                                        title="{playingRecording?.name === recording.name && isPlaying ? 'Pause recording' : 'Play recording'}"
                                    >
                                        {#if playingRecording?.name === recording.name && isPlaying}
                                            <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                                            </svg>
                                            Pause
                                        {:else}
                                            <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M8 5v14l11-7z"/>
                                            </svg>
                                            Play
                                        {/if}
                                    </button>
                                    <button 
                                        on:click={() => transcriptionRecording = recording} 
                                        class="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                                        title="Transcribe recording"
                                    >
                                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Transcribe
                                    </button>
                                    <button 
                                        on:click={() => deleteRecording(recording)} 
                                        class="inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                                        title="Delete recording"
                                        aria-label="Delete recording"
                                    >
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        {/each}
                    </div>
                {/if}
                
                {#if transcriptionRecording}
                    <div class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
                        <div class="bg-white rounded-2xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <div class="flex items-center justify-between mb-6">
                                <h3 class="text-xl font-semibold text-gray-900">Transcribe Recording</h3>
                                <button 
                                    on:click={() => { transcriptionRecording = null; transcriptionResult = ""; transcriptionError = ""; }}
                                    class="text-gray-400 hover:text-gray-600 transition-colors"
                                    aria-label="Close transcription"
                                >
                                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            
                            <div class="mb-6">
                                <p class="text-sm text-gray-600 mb-2">Recording:</p>
                                <p class="font-medium text-gray-900">{transcriptionRecording.name}</p>
                            </div>
                            
                            <div class="mb-6">
                                <label for="transcription-language" class="block text-sm font-medium text-gray-700 mb-2">Language:</label>
                                <select 
                                    id="transcription-language" 
                                    bind:value={transcriptionLanguage} 
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="en">English</option>
                                    <option value="ro">Romanian</option>
                                </select>
                            </div>
                            
                            <button 
                                on:click={() => transcribeRecording(transcriptionRecording!)} 
                                disabled={transcribing} 
                                class="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all mb-4"
                            >
                                {#if transcribing}
                                    <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                                    </svg>
                                    Transcribing...
                                {:else}
                                    <svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Start Transcription
                                {/if}
                            </button>
                            
                            {#if transcriptionResult}
                                <div class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <h4 class="font-medium text-blue-900 mb-2">Transcription Result:</h4>
                                    <div class="text-blue-800 text-sm leading-relaxed">{transcriptionResult}</div>
                                </div>
                            {/if}
                            
                            {#if transcriptionError}
                                <div class="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <div class="flex items-center">
                                        <svg class="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                                        </svg>
                                        <span class="text-red-800 text-sm">{transcriptionError}</span>
                                    </div>
                                </div>
                            {/if}
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>
