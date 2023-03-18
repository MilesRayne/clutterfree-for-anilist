import short from "short-uuid";
import { UserSettings } from "./../models/user-settings.model";
import { NotificationType } from "../enums/notification-type.enum";
import { NotificationData } from "../models/notification-data.model";
import { NotificationGroup } from "../models/notification-group.model";
import { AbstractFunctionality } from "./abstract-functionality";
import polyfill from "../polyfill";

export class Notifications extends AbstractFunctionality {
	async run(): Promise<void> {
		const userSettings = await this.getUserSettings();
		this.addOptionsPanel(userSettings);
		const notificationsData = this.getNotificationsData();

		if (!notificationsData) {
			return;
		}

		if (userSettings.notifications.shouldGroup) {
			this.groupNotifications(notificationsData);
		}
	}

	addOptionsPanel(userSettings: UserSettings) {
		const clutterfreeOptionsExist = this.$(".cf-options-group");
		if (clutterfreeOptionsExist) return;

		const filters = this.$(".filters");
		const notificationsMobile = filters!.querySelector(".mobile-nav");
		const settingsHeader = notificationsMobile?.querySelector("h1");
		if (settingsHeader) settingsHeader.textContent = "Options";

		const filtersGroup = filters!.querySelector(".filter-group");

		//clone the group
		const optionsGroup = filtersGroup!.cloneNode(true) as HTMLElement;
		optionsGroup.classList.add("cf-options-group");
		const options = optionsGroup.querySelectorAll(".link");
		for (const option of options) {
			option.remove();
		}

		const header = optionsGroup.querySelector(".group-header");
		header!.textContent = "Clutterfree Settings";

		filtersGroup!.before(optionsGroup);

		const groupBtnDiv = document.createElement("div");
		groupBtnDiv.classList.add("cf-group-settings-container");

		const groupBtnCaption = document.createElement("div");
		groupBtnCaption.textContent = "Group Activity Likes";
		groupBtnCaption.classList.add("cf-group-settings");

		const groupBtnToggle = document.createElement("a");
		groupBtnToggle.classList.add("cf-group-settings-button");

		if (userSettings.notifications.shouldGroup) {
			groupBtnToggle.classList.add("cf-button-enabled");
			groupBtnToggle.textContent = "ON";
		} else {
			groupBtnToggle.classList.add("cf-button-disabled");
			groupBtnToggle.textContent = "OFF";
		}

		groupBtnToggle.addEventListener("click", () => {
			this.toggleGrouping(userSettings);
			if (userSettings.notifications.shouldGroup) {
				groupBtnToggle.classList.remove("cf-button-disabled");
				groupBtnToggle.classList.add("cf-button-enabled");
				groupBtnToggle.textContent = "ON";
			} else {
				groupBtnToggle.classList.remove("cf-button-enabled");
				groupBtnToggle.classList.add("cf-button-disabled");
				groupBtnToggle.textContent = "OFF";
			}
		});

		groupBtnDiv.append(groupBtnCaption, groupBtnToggle);
		optionsGroup.append(groupBtnDiv);
	}

	getNotificationsData() {
		const data: NotificationData[] = [];
		const notificationElements = this.$$(".notification");

		notificationElements.forEach((element) => {
			const context = element.querySelectorAll(".context")[0];
			const contextText = context.textContent;

			const notificationData: NotificationData = {
				notificationType: NotificationType.OTHER,
				element,
				data: {},
			};

			if (
				contextText == " liked your activity." ||
				contextText?.includes("of your activities.")
			) {
				const userHref = element
					.querySelector("a.avatar")
					?.getAttribute("href");

				const username = userHref?.split("/")[2];

				const activityIdHref = element
					.querySelector("a.link")
					?.getAttribute("href");

				const activityId = activityIdHref?.split("/")[2];

				notificationData.notificationType = NotificationType.ACTIVITY_LIKE;
				notificationData.data = {
					username,
					activityId,
				};
			}

			data.push(notificationData);
		});

		return data;
	}

	groupNotifications(notificationsData: NotificationData[]) {
		const groups = this.formGroups(notificationsData);
		this.stylizeGroups(groups);
	}

	formGroups(notificationsData: NotificationData[]) {
		const groups: NotificationGroup[] = [];

		let currentGroup: NotificationGroup | undefined;

		for (let i = 0; i < notificationsData.length; i++) {
			const notification = notificationsData[i];

			let shouldCreateNewGroup = false;
			let groupId;

			if (notification.notificationType == NotificationType.ACTIVITY_LIKE) {
				if (!currentGroup) {
					shouldCreateNewGroup = true;
				} else {
					if (currentGroup.username != notification.data.username) {
						shouldCreateNewGroup = true;
					} else {
						currentGroup.notifications.push(notification);
						groupId = currentGroup.groupId;
					}
				}
			} else {
				currentGroup = undefined;
				continue;
			}

			if (shouldCreateNewGroup) {
				groupId = notification.element.getAttribute("cf-group-id") || undefined;

				if (!groupId) {
					groupId = short.generate();
				}

				currentGroup = {
					username: notification.data.username!,
					groupId,
					notifications: [notification],
				};

				groups.push(currentGroup);
			}

			notification.element.setAttribute("cf-group-id", groupId!);
		}

		//remove all groups that have only one notification
		for (let i = 0; i < groups.length; i++) {
			const group = groups[i];
			if (group.notifications.length == 1) {
				group.notifications[0].element.removeAttribute("cf-group-id");
				groups.splice(i, 1);
				i--;
			}
		}

		return groups;
	}

	stylizeGroups(groups: NotificationGroup[]) {
		for (const group of groups) {
			const notifications = group.notifications;

			const firstNotification = notifications[0];
			const firstNotificationElement = firstNotification.element;

			let i = 0;
			let shouldHideGroup = true;

			if (!firstNotificationElement.classList.contains("cf-group-card")) {
				const groupCard = firstNotificationElement.cloneNode(
					true
				) as HTMLElement;
				groupCard.classList.add("cf-group-card");
				groupCard.setAttribute("cf-group-hidden", "true");

				const context = groupCard.querySelectorAll(".context")[0];
				context.textContent = ` liked ${notifications.length} of your activities.`;

				firstNotificationElement.before(groupCard);
				const groupCardLink = groupCard.querySelector("a.link");
				groupCardLink!.removeAttribute("href");
				groupCard!.addEventListener("click", () => {
					this.toggleGroupVisibility(group.groupId);
				});
			} else {
				const context =
					firstNotificationElement.querySelectorAll(".context")[0];
				context.textContent = ` liked ${
					notifications.length - 1
				} of your activities.`;

				i = 1;
				shouldHideGroup =
					firstNotificationElement.getAttribute("cf-group-hidden") == "true";
			}

			for (i; i < notifications.length; i++) {
				const notification = notifications[i];
				const element = notification.element;
				element.classList.remove("cf-last-minor-notification");

				const hideGroupButton = element.querySelector(".cf-hide-group-button");

				if (hideGroupButton) {
					hideGroupButton.remove();
				}

				if (!element.classList.contains("cf-minor-notification")) {
					element.classList.add("cf-minor-notification");
				}

				if (shouldHideGroup && !element.classList.contains("cf-hidden")) {
					element.classList.add("cf-hidden");
				}

				if (i == notifications.length - 1) {
					element.classList.add("cf-last-minor-notification");

					//add button to hide group
					const hideGroupButton = polyfill.createElement("a", {
						class: "cf-hide-group-button",
						"cf-group-id": group.groupId,
					});
					hideGroupButton.textContent = "^";
					hideGroupButton.addEventListener("click", (e) => {
						e.stopPropagation();
						this.hideGroup(group.groupId);
					});
					element.append(hideGroupButton);
				}
			}
		}
	}

	ungroupNotifications() {
		const notifications = this.$$(".notification");
		for (const notification of notifications) {
			if (notification.classList.contains("cf-group-card")) {
				notification.remove();
				continue;
			}

			notification.removeAttribute("cf-group-id");
			notification.classList.remove("cf-minor-notification");
			notification.classList.remove("cf-last-minor-notification");
			notification.classList.remove("cf-hidden");
		}
		const hideGroupButtons = this.$$(".cf-hide-group-button");
		for (const button of hideGroupButtons) {
			button.remove();
		}
	}

	hideGroup(groupId: string) {
		const notifications = this.$$(
			".notification[cf-group-id='" + groupId + "']"
		);
		const groupCard = this.$(
			".notification[cf-group-id='" + groupId + "'].cf-group-card"
		);

		groupCard!.setAttribute("cf-group-hidden", "true");
		notifications.forEach((notification) => {
			notification.classList.add("cf-hidden");
		});
		groupCard!.classList.remove("cf-hidden");
		groupCard!.classList.remove("cf-group-card-expanded");
	}

	toggleGroupVisibility(id: string) {
		const notifications = this.$$(".notification[cf-group-id='" + id + "']");
		const groupCard = this.$(
			".notification[cf-group-id='" + id + "'].cf-group-card"
		);

		if (groupCard!.getAttribute("cf-group-hidden") == "true") {
			groupCard!.setAttribute("cf-group-hidden", "false");
			groupCard!.classList.add("cf-group-card-expanded");
			notifications.forEach((notification) => {
				notification.classList.remove("cf-hidden");
			});
		} else {
			groupCard!.setAttribute("cf-group-hidden", "true");
			notifications.forEach((notification) => {
				notification.classList.add("cf-hidden");
			});
			groupCard!.classList.remove("cf-hidden");
			groupCard!.classList.remove("cf-group-card-expanded");
		}
	}

	toggleGrouping(userSettings: UserSettings) {
		const notificationsData = this.getNotificationsData();
		userSettings.notifications.shouldGroup =
			!userSettings.notifications.shouldGroup;
		chrome.storage.sync.set({ clutterfree: userSettings });

		if (userSettings.notifications.shouldGroup) {
			this.groupNotifications(notificationsData);
		} else {
			this.ungroupNotifications();
		}
	}
}
