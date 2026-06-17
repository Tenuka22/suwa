import { tenantNotifications } from "@suwa/db";
import { markNotificationReadSchema } from "@suwa/db/schemas-types";
import { and, eq } from "drizzle-orm";

import { requireAuth } from "../../../hooks";
import { protectedProcedure } from "../../../index";

// Get all notifications for the current user
export const listNotificationsRoute = protectedProcedure.handler(
  async ({ context }) => {
    const { userId } = requireAuth(context);

    const notifications = await context.db
      .select()
      .from(tenantNotifications)
      .where(eq(tenantNotifications.userId, userId));

    notifications.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return {
      notifications,
      unreadCount: notifications.filter((n) => !n.isRead).length,
    };
  }
);

// Mark a notification as read
export const markNotificationReadRoute = protectedProcedure
  .input(markNotificationReadSchema)
  .handler(async ({ context, input }) => {
    const { userId } = requireAuth(context);

    await context.db
      .update(tenantNotifications)
      .set({ isRead: true })
      .where(
        and(
          eq(tenantNotifications.id, input.notificationId),
          eq(tenantNotifications.userId, userId)
        )
      );

    return { success: true };
  });

// Mark all notifications as read
export const markAllNotificationsReadRoute = protectedProcedure.handler(
  async ({ context }) => {
    const { userId } = requireAuth(context);

    await context.db
      .update(tenantNotifications)
      .set({ isRead: true })
      .where(eq(tenantNotifications.userId, userId));

    return { success: true };
  }
);
