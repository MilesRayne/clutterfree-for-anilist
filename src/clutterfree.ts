import polyfill from "./polyfill";
import { Notifications } from "./clutterfree-functionalities/notifications";
import { NotificationSettings } from "./clutterfree-functionalities/notification-settings";

let notifications = new Notifications();
let notificationSettings = new NotificationSettings();

async function setupCSS() {
	const css = await polyfill.importCSS("css/clutterfree.css");
	polyfill.GM_addStyle(css);
}

(async () => {
	polyfill.applyConsolePrefix();
	const observer = new MutationObserver(() => {
		if (window.location.hostname === "anilist.co") {
			if (polyfill.page(/^\/notifications/)) {
				notifications.init();
			} else if (polyfill.page(/^\/settings\/notifications/)) {
				notificationSettings.init();
			}
		}
	});

	observer.observe(document, { childList: true, subtree: true });

	await setupCSS();
})();
