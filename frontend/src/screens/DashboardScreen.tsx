import { useCallback, useEffect, useState } from 'react';
import {
  AppState,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  addNotificationListener,
  isNotificationServiceEnabled,
  NotificationEvent,
  openNotificationSettings,
} from 'notification-listener';

export default function DashboardScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);

  const checkPermission = useCallback(() => {
    if (Platform.OS === 'android') {
      setHasPermission(isNotificationServiceEnabled());
    } else {
      setHasPermission(false);
    }
  }, []);

  // Check on mount and every time the user returns from Settings.
  useEffect(() => {
    checkPermission();
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') checkPermission();
    });
    return () => sub.remove();
  }, [checkPermission]);

  // Subscribe to notifications only after permission is confirmed.
  useEffect(() => {
    if (!hasPermission) return;
    const sub = addNotificationListener((event) => {
      setNotifications((prev) => [event, ...prev].slice(0, 50));
    });
    return () => sub.remove();
  }, [hasPermission]);

  if (hasPermission === null) {
    return (
      <View style={styles.centered}>
        <Text style={styles.hint}>Verificando permisos...</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Permiso requerido</Text>
        <Text style={styles.body}>
          FinWard necesita acceso a las notificaciones para detectar
          movimientos bancarios automáticamente.
        </Text>
        <TouchableOpacity style={styles.button} onPress={openNotificationSettings}>
          <Text style={styles.buttonLabel}>Conceder acceso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notificaciones Bancarias</Text>
      {notifications.length === 0 ? (
        <Text style={styles.hint}>Esperando notificaciones...</Text>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(_, index) => index.toString()}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.title || '(sin título)'}</Text>
              <Text style={styles.cardText}>{item.text || '(sin texto)'}</Text>
              <Text style={styles.cardMeta}>{item.packageName}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
    paddingTop: 24,
  },
  centered: {
    flex: 1,
    backgroundColor: '#f5f5f7',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1d1d1f',
    marginBottom: 12,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  body: {
    fontSize: 15,
    color: '#3c3c43',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  hint: {
    fontSize: 15,
    color: '#8e8e93',
    textAlign: 'center',
    marginTop: 48,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 12,
  },
  buttonLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1d1d1f',
    marginBottom: 4,
  },
  cardText: {
    fontSize: 14,
    color: '#3c3c43',
    marginBottom: 6,
  },
  cardMeta: {
    fontSize: 12,
    color: '#8e8e93',
  },
});
