(() => {
	GM_addStyle(`
		.hidden-notification {
			display: none !important;
		}
		.notification {
			margin-bottom: 14px !important;
		}
		.minor-notification {
			margin-left: 36px !important;
			border-left: 3px solid rgb(var(--color-blue)) !important;
			padding-left: 6px !important;
		}

		.reset-btn {
			margin-bottom: 12px !important;
		}
    `);

	console.log('Content script loaded.');

	const $ = selector => document.querySelector(selector);
	const $$ = a => Array.from(document.querySelectorAll(a));

	const anilist = {
		notifications: {
			running: false,

			shouldGroup: true,
			
			stopRunning() {
				this.running = false;
			},

			async init() {
				if (this.running) {
					return;
				}

				this.running = true;

				this.addSignature();
				this.createBanner();
				await this.handleNotifications();
				return this.stopRunning();
			},

			addSignature() {
				const filters = $('.filters');
				if (filters) {
					const signatureExists = filters.querySelector('.rayne-signature');
					if (signatureExists) return;

					//create container div, align text to center
					const containerDiv = anilist.helpers.createElement('div', { class: 'rayne-signature-container' }, { "text-align": "center" });
					filters.appendChild(containerDiv);

					const signatureElement = anilist.helpers.createElement('div', { class: 'rayne-signature' }, { "font-size": "1rem", "margin-bottom": "12px" });
					signatureElement.innerHTML = 'Clutterfree for Anilist by <a class="link" href="https://anilist.co/user/MilesRayne/" style="color: rgb(var(--color-blue)); cursor: pointer;">Rayne</a>';

					const button = anilist.helpers.createElement('a', { class: 'should-group-button' }, { "font-size": "1.1rem", "cursor": "pointer", "user-select": "none" });
					button.innerText = this.shouldGroup ? 'Disable grouping' : 'Enable grouping';
					//add class to copy

					button.addEventListener('click', function () {
						anilist.notifications.toggleGrouping();
						button.innerText = anilist.notifications.shouldGroup ? 'Disable grouping' : 'Enable grouping';
					});

					const signatureElementSecondRow = anilist.helpers.createElement('div', { class: 'rayne-signature' }, { "font-size": "1rem" });
					signatureElementSecondRow.innerText = 'Buy me a coffee at';
					const signatureElementLink = anilist.helpers.createElement('a', { href: 'https://ko-fi.com/milesrayne', target: '_blank' }, { "font-size": "1rem", "color": "rgb(var(--color-blue))", "cursor": "pointer" });
					signatureElementLink.innerText = 'ko-fi.com/milesrayne';
					const imageContainer = anilist.helpers.createElement('div', { class: 'rayne-signature-image-container' }, { "margin-top": "4px", "margin-bottom": "12px" });
					const signatureElementImage = anilist.helpers.createElement('img',
						{
							src: 'https://external-content.duckduckgo.com/iu/?u=http%3A%2F%2Ficons.iconarchive.com%2Ficons%2Fpaomedia%2Fsmall-n-flat%2F128%2Fheart-icon.png&f=1&nofb=1&ipt=41869b207e1a0f4ab86a651682ed0d07b5f12d5724bc3d2e32963865b06bd33d&ipo=images', border: '0', 'alt': 'Love, Rayne.'
						}, { "height": "16px" });

					containerDiv.appendChild(signatureElement);
					containerDiv.appendChild(signatureElementSecondRow);
					containerDiv.appendChild(signatureElementLink);
					containerDiv.appendChild(imageContainer);
					containerDiv.appendChild(button);

					imageContainer.appendChild(signatureElementImage);
				}
			},

			async handleNotifications() {
				const metaDataCollection = this.gatherMetaData() || [];
				if (metaDataCollection.length < 1) return;
				if (this.shouldGroup) {
					await this.formGroups(metaDataCollection);
				}
				else {
					this.removeGroups();
				}
			},

			gatherMetaData() {
				const metaDataCollection = [];
				const notificationsContainer = $('.notifications');

				if (notificationsContainer) {
					const notifications = $$('.notification');

					if (!notifications || notifications.length < 1) return;

					for (const notification of notifications) {

						const details = notification.querySelectorAll('.details');

						for (const detail of details) {
							const context = detail.querySelector('.context');
							let metadataElement = detail.querySelector('.metadata');
							let metaData;
							if (!metadataElement) {
								let contextJSON;
								let displayText;

								try {
									contextJSON = JSON.parse(context.innerText);
									displayText = contextJSON.displayText;
									metaData = contextJSON.metaData;
								} catch (error) {
									metaData = {};
								}

								metadataElement = anilist.helpers.createElement('div', { class: 'metadata' }, { display: 'none' });
								metadataElement.innerText = JSON.stringify(metaData);
								detail.appendChild(metadataElement);
								if (displayText)
									context.innerText = displayText;
							} else {
								metaData = JSON.parse(metadataElement.innerText);
							}

							if (metaData.createdAt)
								metaData.createdAt = new Date(metaData.createdAt * 1000);
							metaDataCollection.push(metaData);

						}
					}
				}
				return metaDataCollection;
			},

			removeGroups() {
				const hiddenNotifications = $$('.hidden-notification');
				for (const hiddenNotification of hiddenNotifications) {
					hiddenNotification.classList.remove('hidden-notification');
				}
				const minorNotifications = $$('.minor-notification');
				for (const minorNotification of minorNotifications) {
					minorNotification.classList.remove('minor-notification');
				}
				const majorNotifications = $$('[class*="major-notification-"]');
				for (const majorNotification of majorNotifications) {
					//find name of class and remove it
					const className = majorNotification.className.match(/major-notification-\d+-\d+/)[0];
					majorNotification.classList.remove(className);
					const context = majorNotification.querySelector('.context');
					context.innerText = "liked your activity."
					majorNotification.style.borderLeft = 'none';
					majorNotification.style.paddingLeft = '0px';
					const activityId = className.split('-')[3];
					//remove link to activity from first notification a element
					const majorNotificationLink = majorNotification.querySelector('.link');
					majorNotificationLink.removeAttribute('href');
					majorNotificationLink.setAttribute('href', `https://anilist.co/activity/${activityId}`);

					let clone = majorNotification.cloneNode(true);
					majorNotification.replaceWith(clone);

				}

				//get expand buttons by regex of expand-hidden-button-*
				const expandButtons = $$('[class*="expand-hidden-button-"]');

				//delete all duplicate notifications
				const duplicateNotifications = $$('[class*="duplicate-notification-"]');
				for (const duplicateNotification of duplicateNotifications) {
					duplicateNotification.remove();

				}

				//delete all expand buttons
				for (const expandButton of expandButtons) {
					expandButton.remove();
				}
			},

			async formGroups(metaDataCollection) {
				const notificationContainer = $('.notifications');
				const notifications = $$('.notification');

				const groups = [];

				for (const notification of notifications) {
					const metaData = metaDataCollection[notifications.indexOf(notification)];

					let lastGroup;

					if (groups && groups.length > 0) {
						lastGroup = groups[groups.length - 1];
					}
					if (lastGroup && lastGroup.userId == metaData?.userId && lastGroup.activityType == metaData?.activityType) {
						//line below prevents duplicate notifications from being added to the same group
						const alreadyAdded = (lastGroup.notifications.find(el => { return el.metaData.activityId == metaData.activityId && el.metaData.userId == metaData.userId }));
						if (alreadyAdded) continue;
						lastGroup.notifications.push({ element: notification, metaData });
					} else {
						const group = { userId: metaData.userId, parentActivityId: metaData.activityId, activityType: metaData.activityType, notifications: [] };
						group.notifications.push({ element: notification, metaData });
						groups.push(group);
					}
				}
				for (const group of groups) {
					if (group.activityType == 'ACTIVITY_LIKE' && group.notifications.length > 1) {

						// sort notifications by createdAt latest to earliest
						group.notifications.sort((a, b) => {
							return b.metaData.createdAt - a.metaData.createdAt;
						});

						const firstNotification = group.notifications[0];
						const firstNotificationElement = firstNotification.element;

						//check if duplicate notification already exists
						let duplicateNotificationExists = notificationContainer.querySelector(`.duplicate-notification-${group.userId}-${group.parentActivityId}`);

						//create a copy of the first notification and insert it after the first notification
						if (!duplicateNotificationExists) {
							const duplicateNotification = firstNotificationElement.cloneNode(true);
							duplicateNotification.classList.add(`duplicate-notification-${group.userId}-${group.parentActivityId}`);
							duplicateNotification.classList.add(`hidden-id-${group.userId}-${group.parentActivityId}`);
							duplicateNotification.classList.add('hidden-notification');
							duplicateNotification.classList.add('minor-notification');
							firstNotificationElement.insertAdjacentElement('afterend', duplicateNotification);
						}

						const firstNotificationContext = firstNotificationElement.querySelector('.context');
						firstNotificationContext.innerText = `liked ${group.notifications.length} of your activities.`;
						firstNotificationElement.classList.add(`major-notification-${group.userId}-${group.parentActivityId}`);

						//remove link to activity from first notification a element
						const firstNotificationLink = firstNotificationElement.querySelector('.link');
						firstNotificationLink.removeAttribute('href');
						firstNotificationLink.setAttribute('href', 'javascript:void(0)');

						//change css of first notification
						//add border left 5px solid blue
						firstNotificationElement.style.borderLeft = '6px solid rgb(var(--color-blue))';
						firstNotificationElement.style.paddingLeft = '6px';

						//remove existing click event listener
						// firstNotificationLink.outerHTML = firstNotificationLink.outerHTML;
						let clone = firstNotificationLink.cloneNode(true);
						firstNotificationLink.replaceWith(clone);

						clone.addEventListener('click', function () {
							anilist.notifications.toggleMinorNotifications(group.userId, group.parentActivityId);
						});





						//check if button already exists
						let button = firstNotificationElement.querySelector(`.expand-hidden-button-${group.userId}-${group.parentActivityId}`);
						if (!button) {
							button = anilist.helpers.createElement('a', { class: `expand-hidden-button-${group.userId}-${group.parentActivityId}` }, { "font-size": "1.2rem", "margin-left": "4px", "cursor": "pointer", "position": "absolute", "right": "12px", "top": "32px" });
							button.innerText = 'Show all';
							button.addEventListener('click', function () {
								anilist.notifications.toggleMinorNotifications(group.userId, group.parentActivityId);
							});
							firstNotificationElement.appendChild(button);
						}

						//hide the rest of the notifications
						for (let i = 1; i < group.notifications.length; i++) {
							const notification = group.notifications[i];
							//add class if not already added
							if (!notification.element.classList.contains('minor-notification')) {
								if (button.innerText == 'Show all') {
									notification.element.classList.add('hidden-notification');
								}
								notification.element.classList.add('minor-notification');
								notification.element.classList.add(`hidden-id-${group.userId}-${group.parentActivityId}`)
							}
						}

					}
				}

				// await new Promise(resolve => setTimeout(resolve, 100));
			},

			toggleMinorNotifications(userId, parentActivityId) {
				console.log('triggered button');
				let areHidden;
				const minorNotifications = $$(`.hidden-id-${userId}-${parentActivityId}`);
				if (minorNotifications) {
					//check if hidden
					for (const notification of minorNotifications) {
						if (notification.classList.contains('hidden-notification')) {
							areHidden = false;
							notification.classList.remove('hidden-notification');
						} else {
							areHidden = true;
							notification.classList.add('hidden-notification');
						}
					}
				}

				const button = $(`.expand-hidden-button-${userId}-${parentActivityId}`);
				if (button) {
					if (areHidden) {
						button.innerText = 'Show all';
					} else {
						button.innerText = 'Hide all';
					}
				}
			},

			createBanner() {

				const notificationsContainer = $('.notifications');

				if (!notificationsContainer) return;
				//check if copy already exists
				const bannerExists = notificationsContainer.querySelector('.rayne-banner');

				if (!bannerExists) {

					// const banner = anilist.helpers.createElement('div', { class: 'rayne-banner' }, { "font-size": "1.2rem", "margin-bottom": "12px" });

					//add text to copy
					// const bannerText = anilist.helpers.createElement('div', { class: 'rayne-banner-text' }, { "font-size": "1.2rem", "margin-bottom": "12px" });
					// bannerText.innerText = 'Notifications grouped';
					// banner.appendChild(bannerText);

					//add button to toggle group

				}
			},

			toggleGrouping() {
				anilist.notifications.shouldGroup = !anilist.notifications.shouldGroup;
			}

		},
		helpers: {
			createElement(tag, attrs, styles) {
				const element = document.createElement(tag);
				for (const aKey in attrs) {
					if (!Object.prototype.hasOwnProperty.call(attrs, aKey)) continue;
					element.setAttribute(aKey, attrs[aKey]);
				}
				for (const sKey in styles) {
					if (!Object.prototype.hasOwnProperty.call(styles, sKey)) continue;
					element.style.setProperty(sKey, styles[sKey]);
					element.style[sKey] = styles[sKey];
				}
				return element;
			},
			page(regex, href = false) {
				return regex.test(href ? window.location.href : window.location.pathname);
			},
		}
	}

	const observer = new MutationObserver(() => {
		if (window.location.hostname === 'anilist.co') {
			if (anilist.helpers.page(/^\/notifications/)) {
				anilist.notifications.init();
			}
		}
	});

	observer.observe(document, { childList: true, subtree: true });
})();