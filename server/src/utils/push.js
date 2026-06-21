import webpush from 'web-push';
import prisma from '../config/db.js';

// Setup VAPID keys if valid, otherwise we will log simulated push dispatches
let hasKeys = false;

try {
  if (process.env.VAPID_PUBLIC_KEY && !process.env.VAPID_PUBLIC_KEY.includes('mock') && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
      'mailto:admin@university.edu',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
    hasKeys = true;
  }
} catch (err) {
  console.warn('VAPID keys validation failed. Falling back to simulated push alerts:', err.message);
}


export async function sendPushNotification(userId, title, body, data = {}) {
  try {
    // Find all active subscriptions for the target user
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    });

    if (subscriptions.length === 0) {
      console.log(`[PUSH NOTIFICATION] User ${userId} has no active push subscriptions. Title: ${title}`);
      return { success: true, sentCount: 0 };
    }

    const payload = JSON.stringify({
      notification: {
        title,
        body,
        icon: '/logo.png',
        badge: '/badge.png',
        data,
      },
    });

    let successCount = 0;
    const obsoleteIds = [];

    for (const sub of subscriptions) {
      if (!hasKeys) {
        console.log(`[MOCK PUSH SENT] To User: ${userId} | Endpoint: ${sub.endpoint}`);
        console.log(`[MOCK PUSH CONTENT]: ${title} - ${body}`);
        successCount++;
        continue;
      }

      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };
        await webpush.sendNotification(pushSubscription, payload);
        successCount++;
      } catch (err) {
        console.error(`Push subscription failed: ${sub.endpoint}, error: ${err.message}`);
        // If subscription is expired or unregistered, mark for deletion
        if (err.statusCode === 410 || err.statusCode === 404) {
          obsoleteIds.push(sub.id);
        }
      }
    }

    // Clean up obsolete subscriptions
    if (obsoleteIds.length > 0) {
      await prisma.pushSubscription.deleteMany({
        where: { id: { in: obsoleteIds } },
      });
    }

    return { success: true, sentCount: successCount };
  } catch (error) {
    console.error('Web Push Notification failed:', error.message);
    return { success: false, error: error.message };
  }
}
