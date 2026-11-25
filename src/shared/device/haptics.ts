import * as Haptics from 'expo-haptics'

export type FeedbackKind = 'success' | 'warning' | 'error'

const NOTIFICATION_TYPES: Record<FeedbackKind, Haptics.NotificationFeedbackType> = {
  success: Haptics.NotificationFeedbackType.Success,
  warning: Haptics.NotificationFeedbackType.Warning,
  error: Haptics.NotificationFeedbackType.Error,
}

export function notify(kind: FeedbackKind) {
  Haptics.notificationAsync(NOTIFICATION_TYPES[kind]).catch(() => {})
}

export function tap() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
}
