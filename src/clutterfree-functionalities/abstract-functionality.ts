import { UserSettings } from "../models/user-settings.model";

export abstract class AbstractFunctionality {
	$ = (selector: string) => document.querySelector(selector);
	$$ = (a: string) => Array.from(document.querySelectorAll(a));
	running: boolean = false;
	async init() {
		if (this.running) return;

		this.running = true;
		await this.run();
		this.stopRunning();
	}

	async getUserSettings() {
		let settings: UserSettings = (await chrome.storage.sync.get("clutterfree"))
			.clutterfree as UserSettings;

		if (settings) {
			return settings;
		} else {
			settings = {
				notifications: {
					shouldGroup: true,
					byPerson: false,
				},
			};
			await chrome.storage.sync.set({ clutterfree: settings });
			return settings;
		}
	}

	stopRunning() {
		this.running = false;
	}

	abstract run(): Promise<void>;
}
