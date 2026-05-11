import { pushSubscriptions } from "@/drizzle/schema";
import { db } from "@/lib/db";
import type {
  NotificationPayload,
  NotificationService,
} from "@/lib/ports/notification-service";
import { eq } from "drizzle-orm";
import webPush from "web-push";

webPush.setVapidDetails(
  process.env.VAPID_EMAIL || "mailto:noreply@dellclips.app",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export class WebPushNotificationService implements NotificationService {
  async sendToUser(userId: string, payload: NotificationPayload): Promise<void> {
    const subscriptions = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));

    const notification = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || "/icons/icon-192.png",
      badge: payload.badge || "/icons/icon-96.png",
      data: { url: payload.url || "/feed" },
      tag: payload.tag,
    });

    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webPush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            notification
          );
        } catch (error: any) {
          if (error.statusCode === 410 || error.statusCode === 404) {
            // Subscription expired — remove it
            await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
            console.log(`[push] Removed expired subscription ${sub.id}`);
          } else {
            console.error(`[push] Failed to send to ${sub.id}:`, error);
          }
        }
      })
    );
  }

  async sendToAll(payload: NotificationPayload): Promise<void> {
    const subscriptions = await db.select().from(pushSubscriptions);

    const notification = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || "/icons/icon-192.png",
      badge: payload.badge || "/icons/icon-96.png",
      data: { url: payload.url || "/feed" },
      tag: payload.tag,
    });

    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webPush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            notification
          );
        } catch (error: any) {
          if (error.statusCode === 410 || error.statusCode === 404) {
            await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
          }
        }
      })
    );
  }
}
