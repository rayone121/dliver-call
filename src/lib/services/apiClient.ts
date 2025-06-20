import { get } from "svelte/store";
import {
  apiClientSettings,
  type ApiClientSettings,
} from "$lib/models/apiClient";

/**
 * Base class for API client service
 * This class provides methods for making HTTP requests to the FastAPI backend
 */
export class ApiClientService {
  private settings: ApiClientSettings;

  constructor() {
    // Get the current API client settings from the store
    this.settings = get(apiClientSettings);

    // Subscribe to changes in the store
    apiClientSettings.subscribe((value) => {
      this.settings = value;
    });
  }

  /**
   * Make a request to the FastAPI backend
   * @param endpoint Endpoint to call
   * @param options Request options
   * @returns Promise that resolves to the response
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    console.log("Making API request with settings:", { 
      host: this.settings.host, 
      hasApiKey: !!this.settings.apiKey,
      apiKeyLength: this.settings.apiKey?.length || 0
    });
    
    if (!this.settings.host) {
      throw new Error("API host is not configured");
    }

    if (!this.settings.apiKey) {
      throw new Error("API key is not configured");
    }

    const url = `${this.settings.host}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

    // Default headers including the API key
    const headers = new Headers(options.headers);
    headers.set("X-API-Key", this.settings.apiKey);
    headers.set("Content-Type", "application/json");

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `API request failed: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    return (await response.json()) as T;
  }

  /**
   * Get the API server status
   * @returns Promise that resolves to the status
   */
  async getStatus(): Promise<{
    connected: boolean;
    devices?: any[];
    message?: string;
  }> {
    return this.makeRequest<any>("/api/adb/status");
  }

  /**
   * Get the API settings
   * @returns Promise that resolves to the settings
   */
  async getSettings(): Promise<any> {
    return this.makeRequest<any>("/api/settings");
  }

  /**
   * Update the API settings
   * @param settings New settings
   * @returns Promise that resolves to the updated settings
   */
  async updateSettings(settings: any): Promise<any> {
    return this.makeRequest<any>("/api/settings", {
      method: "POST",
      body: JSON.stringify(settings),
    });
  }

  /**
   * Make a phone call
   * @param phoneNumber Phone number to call
   * @param simSlot SIM slot to use (0 for SIM1, 1 for SIM2)
   * @returns Promise that resolves to the call result
   */
  async makeCall(phoneNumber: string, simSlot?: number): Promise<any> {
    return this.makeRequest<any>("/api/calls/make", {
      method: "POST",
      body: JSON.stringify({
        phone_number: phoneNumber,
        sim_slot: simSlot,
      }),
    });
  }

  /**
   * Hang up the current call
   * @returns Promise that resolves to the result
   */
  async hangupCall(): Promise<any> {
    return this.makeRequest<any>("/api/calls/hangup", {
      method: "POST",
    });
  }

  /**
   * Get the current call status
   * @returns Promise that resolves to the call status
   */
  async getCallStatus(): Promise<any> {
    return this.makeRequest<any>("/api/calls/status");
  }

  /**
   * Get a list of all recordings
   * @returns Promise that resolves to the recordings list
   */
  async getRecordings(): Promise<any> {
    return this.makeRequest<any>("/api/recordings");
  }

  /**
   * Transfer a recording from the device to the server
   * @param filename Name of the recording file
   * @param type Type of recording (incoming or outgoing)
   * @returns Promise that resolves to the transfer result
   */
  async transferRecording(
    filename: string,
    type: "incoming" | "outgoing",
  ): Promise<any> {
    return this.makeRequest<any>(`/api/recordings/${filename}`, {
      method: "POST",
      body: JSON.stringify({
        type,
      }),
    });
  }

  /**
   * Get the streaming URL for a recording with proper authentication
   * @param filename Name of the recording file
   * @returns Promise that resolves to the audio blob
   */
  async getRecordingBlob(filename: string): Promise<Blob> {
    if (!this.settings.host) {
      throw new Error("API host is not configured");
    }

    if (!this.settings.apiKey) {
      throw new Error("API key is not configured");
    }

    const url = `${this.settings.host}/api/stream-recording/${filename}`;

    const response = await fetch(url, {
      headers: {
        "X-API-Key": this.settings.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch recording: ${response.status} ${response.statusText}`,
      );
    }

    return await response.blob();
  }

  /**
   * Delete a recording from the device
   * @param filename Name of the recording file
   * @param type Type of recording (incoming or outgoing)
   * @returns Promise that resolves to the delete result
   */
  async deleteRecording(
    filename: string,
    type: "incoming" | "outgoing",
  ): Promise<any> {
    return this.makeRequest<any>(`/api/recordings/${filename}`, {
      method: "DELETE",
      body: JSON.stringify({
        type,
      }),
    });
  }

  /**
   * Create a new API key
   * @param name Name for the new API key
   * @returns Promise that resolves to the new API key
   */
  async createApiKey(name: string): Promise<any> {
    return this.makeRequest<any>("/api/keys", {
      method: "POST",
      body: JSON.stringify({
        name,
      }),
    });
  }

  /**
   * List all API keys
   * @returns Promise that resolves to the list of API keys
   */
  async listApiKeys(): Promise<any> {
    return this.makeRequest<any>("/api/keys");
  }

  /**
   * Delete an API key
   * @param keyName Name of the API key to delete
   * @returns Promise that resolves to the delete result
   */
  async deleteApiKey(keyName: string): Promise<any> {
    return this.makeRequest<any>(`/api/keys/${keyName}`, {
      method: "DELETE",
    });
  }

  async getTranscription(filename: string, lang: string): Promise<any> {
    return this.makeRequest<any>(
      `/api/transcribe/${filename}?language=${lang}`,
      {
        method: "POST",
      },
    );
  }
}
// Create and export a singleton instance
export const apiClient = new ApiClientService();
