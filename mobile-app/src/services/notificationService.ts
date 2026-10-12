import { LocalNotifications } from '@capacitor/local-notifications';
import { StorageService } from './storageService';

export const NotificationService = {
  async init(): Promise<boolean> {
    try {
      const perm = await LocalNotifications.checkPermissions();
      if (perm.display !== 'granted') {
        const req = await LocalNotifications.requestPermissions();
        return req.display === 'granted';
      }
      return true;
    } catch (e) {
      console.warn('LocalNotifications permissions error:', e);
      return false;
    }
  },

  async scheduleInactivityAlert(hour: number = 20, minute: number = 30): Promise<void> {
    const settings = StorageService.getSettings();
    if (!settings.notificationsEnabled || !settings.streakSaverEnabled) return;

    try {
      // Cancel previous inactivity reminder (id: 101)
      await LocalNotifications.cancel({ notifications: [{ id: 101 }] });

      const streak = StorageService.getStreak();
      const freezeTokens = StorageService.getFreezeTokens();

      // Schedule daily notification
      await LocalNotifications.schedule({
        notifications: [
          {
            id: 101,
            title: '🔥 Streak At Risk — StudyForge OS',
            body: `Your ${streak}-day streak is pending! Log today's study session before midnight to keep your fire burning. (${freezeTokens} freeze shields remaining)`,
            schedule: {
              on: { hour, minute },
              allowWhileIdle: true
            },
            sound: 'beep.wav',
            smallIcon: 'ic_stat_name',
            actionTypeId: '',
            extra: { type: 'inactivity_alert' }
          }
        ]
      });
      console.log(`Inactivity reminder scheduled daily for ${hour}:${minute}`);
    } catch (err) {
      console.warn('Failed to schedule inactivity notification:', err);
    }
  },

  async sendImmediateNotification(title: string, body: string, id: number = Math.floor(Math.random() * 1000) + 200): Promise<boolean> {
    try {
      await this.init();
      await LocalNotifications.schedule({
        notifications: [
          {
            id,
            title,
            body,
            schedule: { at: new Date(Date.now() + 500) }, // 500ms from now
            sound: 'beep.wav'
          }
        ]
      });
      return true;
    } catch (err) {
      console.warn('Immediate notification failed:', err);
      return false;
    }
  },

  async triggerTestInactivityAlert(): Promise<boolean> {
    const streak = StorageService.getStreak();
    const freezeTokens = StorageService.getFreezeTokens();
    return this.sendImmediateNotification(
      '🔥 Streak Alert (Test Reminder)',
      `Notice: Your ${streak}-day study streak needs attention today! Log a session before midnight to preserve your rank. (${freezeTokens} shields left).`
    );
  },

  async triggerFreezeTokenUsedAlert(): Promise<boolean> {
    const tokens = StorageService.getFreezeTokens();
    return this.sendImmediateNotification(
      '❄️ Streak Shield Activated!',
      `You were inactive yesterday, but your progress was protected! 1 Freeze Token was used. ${tokens} tokens remaining.`
    );
  },

  async triggerRevisionDigest(): Promise<boolean> {
    const exam = StorageService.getActiveExam();
    const examName = exam === 'upsc' ? 'UPSC 2027' : exam === 'neet_pg' ? 'NEET PG 2027' : 'Banking 2027';
    return this.sendImmediateNotification(
      '🧠 Morning Spaced-Revision Due',
      `4 high-yield topics are due for spaced-repetition in ${examName}. Review them now for maximum retention!`
    );
  },

  async schedulePomodoroAlert(targetTimeMs: number, moduleName: string): Promise<void> {
    try {
      await this.init();
      await LocalNotifications.cancel({ notifications: [{ id: 105 }] });
      await LocalNotifications.schedule({
        notifications: [
          {
            id: 105,
            title: '⏰ Pomodoro Session Complete!',
            body: `Great focus sprint on ${moduleName}! Open StudyForge to review your notes & claim your XP.`,
            schedule: {
              at: new Date(targetTimeMs),
              allowWhileIdle: true
            },
            sound: 'beep.wav',
            extra: { type: 'pomodoro_complete' }
          }
        ]
      });
    } catch (e) {
      console.warn('Failed to schedule pomodoro notification:', e);
    }
  },

  async cancelPomodoroAlert(): Promise<void> {
    try {
      await LocalNotifications.cancel({ notifications: [{ id: 105 }] });
    } catch (e) {
      console.warn('Failed to cancel pomodoro notification:', e);
    }
  }
};
