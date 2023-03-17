import { AbstractFunctionality } from "./abstract-functionality";
import polyfill from "../polyfill";
import { UserSettings } from "../models/user-settings.model";

export class NotificationSettings extends AbstractFunctionality {
	async run(): Promise<void> {
		await this.addSettingsOptions();
	}

	settingsToSave: UserSettings;

	async addSettingsOptions() {
		const clutterFreeOptionsExist = this.$(".cf-options");

		if (clutterFreeOptionsExist) return;

		let userSettings = await this.getUserSettings();
		this.settingsToSave = userSettings;
		this.createSettingsElements(this.settingsToSave);

		this.attachAdditionalActionToSaveButton();
	}

	createSettingsElements(userSettings: UserSettings) {
		const notificationSettings = this.$(".notifications");
		const firstSection = notificationSettings!.querySelectorAll(".section")[0];
		const firstHeader = firstSection.querySelector("h2");
		const firstOption = firstSection.querySelector(".option");

		const clutterfreeSettings = firstHeader!.cloneNode(true) as HTMLElement;
		clutterfreeSettings.textContent = "Clutterfree Settings";

		const clutterfreeOptionsDiv = polyfill.createElement("div", {
			class: "cf-options",
		});

		const groupNotificationsOption = firstOption!.cloneNode(
			true
		) as HTMLElement;

		groupNotificationsOption.setAttribute("cf-option", "group-likes");
		const groupNotificationsLabel = groupNotificationsOption.querySelector(
			".el-checkbox__label"
		) as HTMLElement;

		groupNotificationsLabel.textContent = "Group activity likes by user";

		clutterfreeOptionsDiv.appendChild(clutterfreeSettings);
		clutterfreeOptionsDiv.appendChild(groupNotificationsOption);

		this.setOption(
			groupNotificationsOption,
			userSettings.notifications.shouldGroup!
		);

		const checkboxLabel = groupNotificationsOption.querySelector(
			"[role='checkbox']"
		) as HTMLElement;

		checkboxLabel.addEventListener("click", (e) => {
			e.stopPropagation();
			e.preventDefault();
			this.toggleOption("shouldGroup", groupNotificationsOption);
		});

		firstSection.insertBefore(clutterfreeOptionsDiv, firstSection.firstChild);
	}

	setOption(optionElement: HTMLElement, isTrue: boolean) {
		const checkboxElement = optionElement.querySelector(
			".el-checkbox__input"
		) as HTMLInputElement;
		const checkboxLabel = optionElement.querySelector(
			"[role='checkbox']"
		) as HTMLElement;
		optionElement.classList.remove("is-checked");
		checkboxElement.classList.remove("is-checked");
		checkboxLabel.setAttribute("aria-checked", "false");

		if (isTrue) {
			optionElement.classList.add("is-checked");
			checkboxElement.classList.add("is-checked");
			checkboxLabel.setAttribute("aria-checked", "true");
		}
	}
	toggleOption(option: string, optionsElement: HTMLElement, value?: boolean) {
		if (value === undefined) {
			value = !this.settingsToSave.notifications[option];
		}

		this.setOption(optionsElement as HTMLInputElement, value);

		this.settingsToSave.notifications[option] = value;
	}

	attachAdditionalActionToSaveButton() {
		const notifications = this.$(".notifications") as HTMLElement;
		const saveButton = notifications.querySelector(".button");
		saveButton!.addEventListener("click", async () => {
			await this.saveSettings();
		});
	}

	async saveSettings() {
		await chrome.storage.sync.set({
			clutterfree: this.settingsToSave,
		});
	}
}
