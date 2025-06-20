import type PocketBase from 'pocketbase';
import { get, writable } from 'svelte/store';

export interface ApiClientSettings {
    id?: string;
    user?: string;
    host: string;
    apiKey: string;
    collectionId?: string;
    collectionName?: string;
    created?: string;
    updated?: string;
}

// Default values for new API client settings
export const defaultApiClientSettings: ApiClientSettings = {
    host: 'http://localhost:8000',
    apiKey: ''
};

// Create a writable store for the API client settings
export const apiClientSettings = writable<ApiClientSettings>(defaultApiClientSettings);

/**
 * Fetch the API client settings for the current user
 * @param pb PocketBase client instance
 * @param userId User ID to fetch settings for
 * @returns Promise that resolves to the API client settings
 */
export async function fetchApiClientSettings(pb: PocketBase, userId: string): Promise<ApiClientSettings> {
    try {
        // Try to get existing settings
        const record = await pb.collection('api_clients').getFirstListItem(`user="${userId}"`);
        const settings: ApiClientSettings = {
            id: record.id,
            user: record.user,
            host: record.host,
            apiKey: record.apiKey,
            collectionId: record.collectionId,
            collectionName: record.collectionName,
            created: record.created,
            updated: record.updated
        };
        
        apiClientSettings.set(settings);
        return settings;
    } catch (error) {
        // If no settings found, return default
        apiClientSettings.set(defaultApiClientSettings);
        return defaultApiClientSettings;
    }
}

/**
 * Save API client settings for the current user
 * @param pb PocketBase client instance
 * @param userId User ID to save settings for
 * @param settings Settings to save
 * @returns Promise that resolves to the saved API client settings
 */
export async function saveApiClientSettings(
    pb: PocketBase, 
    userId: string, 
    settings: ApiClientSettings
): Promise<ApiClientSettings> {
    try {
        const currentSettings = get(apiClientSettings);
        
        // If we have an ID, update the existing record
        if (currentSettings.id) {
            const updatedRecord = await pb.collection('api_clients').update(currentSettings.id, {
                host: settings.host,
                apiKey: settings.apiKey
            });
            
            const updatedSettings: ApiClientSettings = {
                id: updatedRecord.id,
                user: updatedRecord.user,
                host: updatedRecord.host,
                apiKey: updatedRecord.apiKey,
                collectionId: updatedRecord.collectionId,
                collectionName: updatedRecord.collectionName,
                created: updatedRecord.created,
                updated: updatedRecord.updated
            };
            
            apiClientSettings.set(updatedSettings);
            return updatedSettings;
        } else {
            // Create a new record
            const newRecord = await pb.collection('api_clients').create({
                user: userId,
                host: settings.host,
                apiKey: settings.apiKey
            });
            
            const newSettings: ApiClientSettings = {
                id: newRecord.id,
                user: newRecord.user,
                host: newRecord.host,
                apiKey: newRecord.apiKey,
                collectionId: newRecord.collectionId,
                collectionName: newRecord.collectionName,
                created: newRecord.created,
                updated: newRecord.updated
            };
            
            apiClientSettings.set(newSettings);
            return newSettings;
        }
    } catch (error) {
        console.error('Error saving API client settings:', error);
        throw error;
    }
}

/**
 * Test the API connection using the current settings
 * @param settings API client settings to test
 * @returns Promise that resolves to the test result
 */
export async function testApiConnection(settings: ApiClientSettings): Promise<{ 
    success: boolean; 
    message: string; 
    data?: any;
}> {
    try {
        const response = await fetch(`${settings.host}/health`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // Health endpoint doesn't require API key but we'll include it
                // for consistency with other API calls
                'X-API-Key': settings.apiKey
            }
        });

        if (!response.ok) {
            return {
                success: false,
                message: `Error ${response.status}: ${response.statusText}`
            };
        }

        const data = await response.json();
        return {
            success: true,
            message: `Connected to ${data.api} v${data.version}`,
            data
        };
    } catch (error) {
        return {
            success: false,
            message: `Connection failed: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}