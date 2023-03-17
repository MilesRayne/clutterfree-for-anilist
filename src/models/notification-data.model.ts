import { NotificationType } from "./../enums/notification-type.enum";
export class NotificationData {
	notificationType: NotificationType = NotificationType.ACTIVITY_LIKE;
	element: Element;
	data: {
		username?: string;
		activityId?: string;
	};
}
