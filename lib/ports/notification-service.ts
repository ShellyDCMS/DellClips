export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
}

export interface NotificationService {
  sendToUser(userId: string, payload: NotificationPayload): Promise<void>;
  sendToAll(payload: NotificationPayload): Promise<void>;
}
