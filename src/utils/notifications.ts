import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export async function scheduleWaterReminders(enabled: boolean, intervalMinutes: number, startTime: string, endTime: string) {
  if (!Capacitor.isNativePlatform()) {
    console.log('[Notifications] Not a native platform, skipping scheduling.');
    return;
  }

  // Cancel any existing water reminders first (we use a specific ID range for water)
  // Water reminders use IDs from 1000 upwards
  const pending = await LocalNotifications.getPending();
  const waterIds = pending.notifications
    .filter(n => n.id >= 1000 && n.id < 2000)
    .map(n => n.id);
  
  if (waterIds.length > 0) {
    await LocalNotifications.cancel({ notifications: waterIds.map(id => ({ id })) });
  }

  if (!enabled) return;

  const permissions = await LocalNotifications.checkPermissions();
  if (permissions.display !== 'granted') {
    const request = await LocalNotifications.requestPermissions();
    if (request.display !== 'granted') return;
  }

  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  const startTotalMinutes = startHour * 60 + startMin;
  const endTotalMinutes = endHour * 60 + endMin;

  const notifications = [];
  let currentMinutes = startTotalMinutes;
  let counter = 0;

  // We only schedule for the next 24 hours to keep it simple and clean
  // Capacitor handles recurring if we use schedule.on.at, but for intervals it's better to just pick slots.
  
  while (currentMinutes <= endTotalMinutes && counter < 10) { // Limit to 10 reminders a day to avoid spam
    const hour = Math.floor(currentMinutes / 60);
    const minute = currentMinutes % 60;

    notifications.push({
      title: 'Time to Hydrate! 💧',
      body: 'Stay energized and healthy. Log a glass of water now.',
      id: 1000 + counter,
      schedule: {
        on: {
          hour,
          minute
        },
        repeats: true,
        allowWhileIdle: true
      },
      sound: 'default',
      attachments: [],
      actionTypeId: '',
      extra: null
    });

    currentMinutes += intervalMinutes;
    counter++;
  }

  if (notifications.length > 0) {
    await LocalNotifications.schedule({
      notifications: notifications as any
    });
    console.log(`[Notifications] Scheduled ${notifications.length} water reminders.`);
  }
}

export async function checkAndScheduleWorkoutReminder(history: any[]) {
  if (!Capacitor.isNativePlatform()) return;

  const lastWorkout = history && history.length > 0 ? history[0] : null;
  const now = new Date();
  
  // If no workout or last workout was > 24h ago
  const needsReminder = !lastWorkout || (new Date(lastWorkout.date).getTime() < now.getTime() - 24 * 60 * 60 * 1000);

  if (needsReminder) {
    const pending = await LocalNotifications.getPending();
    const workoutReminders = pending.notifications.filter(n => n.id === 500);
    
    if (workoutReminders.length === 0) {
      await LocalNotifications.schedule({
        notifications: [{
          title: 'Ready for your workout?',
          body: 'Keep your streak alive! Time to crush today\'s gym session.',
          id: 500,
          schedule: { at: new Date(Date.now() + 1000 * 60 * 60) }, // 1h from now
          sound: 'default'
        }]
      });
    }
  }
}

export async function cancelAllWaterReminders() {
  if (!Capacitor.isNativePlatform()) return;
  
  const pending = await LocalNotifications.getPending();
  const waterIds = pending.notifications
    .filter(n => n.id >= 1000 && n.id < 2000)
    .map(n => n.id);
  
  if (waterIds.length > 0) {
    await LocalNotifications.cancel({ notifications: waterIds.map(id => ({ id })) });
  }
}
