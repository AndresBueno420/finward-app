import { EventEmitter, NativeModule, requireNativeModule } from 'expo-modules-core';

export type NotificationEvent = {
  title: string;
  text: string;
  packageName: string;
  timestamp: number;
};

type Events = {
  onNotificationReceived: (event: NotificationEvent) => void;
};

declare class NotificationListenerNativeModule extends NativeModule<Events> {
  isNotificationServiceEnabled(): boolean;
  openNotificationSettings(): void;
}

const NativeModule =
  requireNativeModule<NotificationListenerNativeModule>('NotificationListener');
const emitter = new EventEmitter(NativeModule);

export function isNotificationServiceEnabled(): boolean {
  return NativeModule.isNotificationServiceEnabled();
}

export function openNotificationSettings(): void {
  NativeModule.openNotificationSettings();
}

export function addNotificationListener(
  listener: (event: NotificationEvent) => void
) {
  return emitter.addListener('onNotificationReceived', listener);
}
