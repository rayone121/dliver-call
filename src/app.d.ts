// See https://kit.svelte.dev/docs/types#app
import PocketBase from 'pocketbase';
import type { BaseAuthStore } from 'pocketbase';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			pb: PocketBase;
			user: BaseAuthStore['model'];
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};