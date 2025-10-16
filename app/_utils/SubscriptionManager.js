import { adminDb } from '../../lib/firebaseAdmin';

// Email sending function for server-side use
const sendEmail = async (to, subject, html) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, subject, html }),
    });

    if (!response.ok) {
      throw new Error(`Email sending failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

export class SubscriptionManager {
  // Check and update expired subscriptions
  static async checkExpiredSubscriptions() {
    try {
      const now = new Date();
      const subscriptionsRef = adminDb.collection('userSubscriptions');
      const expiredQuery = subscriptionsRef
        .where('status', '==', 'active')
        .where('endDate', '<=', adminDb.Timestamp.fromDate(now));

      const expiredSubscriptions = await expiredQuery.get();

      const expiredUsers = [];
      for (const doc of expiredSubscriptions.docs) {
        const subscription = doc.data();

        // Update subscription to expired
        await doc.ref.update({
          status: 'expired',
          expiredAt: adminDb.FieldValue.serverTimestamp()
        });

        expiredUsers.push({
          userId: subscription.userId,
          userEmail: subscription.userEmail,
          plan: subscription.plan,
          duration: subscription.duration
        });
      }

      return expiredUsers;
    } catch (error) {
      console.error('Error checking expired subscriptions:', error);
      return [];
    }
  }

  // Send expiration reminder emails
  static async sendExpirationReminders() {
    try {
      const now = new Date();
      const reminderDate = new Date(now);
      reminderDate.setDate(reminderDate.getDate() + 3); // 3 days before expiration

      const subscriptionsRef = adminDb.collection('userSubscriptions');
      const reminderQuery = subscriptionsRef
        .where('status', '==', 'active')
        .where('endDate', '<=', adminDb.Timestamp.fromDate(reminderDate))
        .where('endDate', '>', adminDb.Timestamp.fromDate(now));

      const expiringSubscriptions = await reminderQuery.get();

      for (const doc of expiringSubscriptions.docs) {
        const subscription = doc.data();

        // Check if reminder was already sent (you might want to add a field for this)
        if (subscription.reminderSent) continue;

        const planName = subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1).toLowerCase();
        const endDate = subscription.endDate.toDate();
        const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

        const emailSubject = `Your ${planName} Plan Expires in ${daysLeft} Days`;
        const emailBody = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Plan Expiration Reminder</h2>
            <p>Dear ${subscription.userEmail},</p>
            <p>Your <strong>${planName} Plan</strong> will expire in <strong>${daysLeft} days</strong> (${endDate.toDateString()}).</p>
            <p>To continue enjoying premium features and storage, please renew your subscription.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/upgrade"
                 style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Renew Subscription
              </a>
            </div>
            <p>If you have any questions, please contact our support team.</p>
            <p>Best regards,<br>CloudSharing Team</p>
          </div>
        `;

        await sendEmail(subscription.userEmail, emailSubject, emailBody);

        // Mark reminder as sent
        await doc.ref.update({
          reminderSent: true,
          reminderSentAt: adminDb.FieldValue.serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error sending expiration reminders:', error);
    }
  }

  // Get current active plan for a user
  static async getCurrentPlan(userId) {
    try {
      const subscriptionDoc = await adminDb.collection('userSubscriptions').doc(userId).get();

      if (!subscriptionDoc.exists) {
        return { plan: 'FREE', status: 'none' };
      }

      const subscription = subscriptionDoc.data();
      const now = new Date();

      // Check if subscription is expired
      if (subscription.status === 'active' && subscription.endDate) {
        const endDate = subscription.endDate.toDate();
        if (endDate <= now) {
          // Mark as expired
          await subscriptionDoc.ref.update({
            status: 'expired',
            expiredAt: adminDb.FieldValue.serverTimestamp()
          });
          return { plan: 'FREE', status: 'expired' };
        }
      }

      return {
        plan: subscription.status === 'active' ? subscription.plan : 'FREE',
        status: subscription.status,
        endDate: subscription.endDate?.toDate(),
        startDate: subscription.startDate?.toDate()
      };
    } catch (error) {
      console.error('Error getting current plan:', error);
      return { plan: 'FREE', status: 'error' };
    }
  }

  // Renew subscription (extend end date)
  static async renewSubscription(userId, duration) {
    try {
      const subscriptionRef = adminDb.collection('userSubscriptions').doc(userId);
      const subscriptionDoc = await subscriptionRef.get();

      if (!subscriptionDoc.exists) {
        throw new Error('No active subscription found');
      }

      const subscription = subscriptionDoc.data();
      let newEndDate = new Date();

      // If subscription is still active, extend from current end date
      if (subscription.status === 'active' && subscription.endDate) {
        newEndDate = subscription.endDate.toDate();
      }

      // Add the new duration
      switch (duration) {
        case 'monthly':
          newEndDate.setMonth(newEndDate.getMonth() + 1);
          break;
        case '3months':
          newEndDate.setMonth(newEndDate.getMonth() + 3);
          break;
        case 'annual':
          newEndDate.setFullYear(newEndDate.getFullYear() + 1);
          break;
        default:
          throw new Error('Invalid duration');
      }

      await subscriptionRef.update({
        endDate: adminDb.Timestamp.fromDate(newEndDate),
        status: 'active',
        renewedAt: adminDb.FieldValue.serverTimestamp(),
        reminderSent: false // Reset reminder flag
      });

      return { success: true, newEndDate };
    } catch (error) {
      console.error('Error renewing subscription:', error);
      throw error;
    }
  }
}