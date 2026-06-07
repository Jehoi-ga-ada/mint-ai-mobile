import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import type { DefaultRangeMode } from '../../api/settingsStorage';
import { useBackupStore } from '../../money/backupSync';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Icon } from '../../components/Icon';
import { Screen } from '../../components/Screen';
import type { RootStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { colors, radius, spacing, typography } from '../../theme';

const OPTIONS: { value: DefaultRangeMode; label: string; hint: string }[] = [
  { value: 'month', label: 'This month', hint: 'Current calendar month (1st →)' },
  { value: 'cycle', label: 'Monthly cycle', hint: 'Custom start day, e.g. 25th → 25th' },
  { value: '3m', label: 'Last 3 months', hint: 'Rolling 90 days' },
  { value: '6m', label: 'Last 6 months', hint: 'Rolling 180 days' },
  { value: '1y', label: 'Last 12 months', hint: 'Rolling year' },
  { value: 'all', label: 'All time', hint: 'Everything' },
];

const CYCLE_DAYS = Array.from({ length: 28 }, (_, i) => i + 1);

export function SettingsScreen() {
  const defaultRange = useSettingsStore((s) => s.defaultRange);
  const cycleDay = useSettingsStore((s) => s.cycleDay);
  const setDefaultRange = useSettingsStore((s) => s.setDefaultRange);
  const setCycleDay = useSettingsStore((s) => s.setCycleDay);

  return (
    <Screen header scroll>
      <Text style={styles.sectionTitle}>Account</Text>
      <AccountSection />

      <Text style={styles.sectionTitle}>Default date range</Text>
      <Text style={styles.help}>Transactions and stats open with this range selected.</Text>

      <Card style={styles.card}>
        {OPTIONS.map((opt, i) => {
          const active = opt.value === defaultRange;
          return (
            <Pressable
              key={opt.value}
              onPress={() => setDefaultRange(opt.value)}
              accessibilityRole="button"
              accessibilityLabel={opt.label}
              accessibilityState={{ selected: active }}
              style={[styles.row, i > 0 && styles.divider]}
            >
              <View style={styles.rowText}>
                <Text style={styles.label}>{opt.label}</Text>
                <Text style={styles.hint}>{opt.hint}</Text>
              </View>
              <Text style={[styles.check, active && styles.checkActive]}>
                {active ? '●' : '○'}
              </Text>
            </Pressable>
          );
        })}
      </Card>

      {defaultRange === 'cycle' && (
        <Card>
          <Text style={styles.label}>Cycle start day</Text>
          <Text style={styles.hint}>
            Each period runs from day {cycleDay} of one month to day {cycleDay} of the next.
          </Text>
          <View style={styles.dayGrid}>
            {CYCLE_DAYS.map((d) => {
              const active = d === cycleDay;
              return (
                <Pressable
                  key={d}
                  onPress={() => setCycleDay(d)}
                  style={styles.dayCell}
                  accessibilityRole="button"
                  accessibilityLabel={`Day ${d}`}
                  accessibilityState={{ selected: active }}
                >
                  <View style={[styles.dayInner, active && styles.dayInnerActive]}>
                    <Text style={[styles.dayText, active && styles.dayTextActive]}>{d}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Card>
      )}
    </Screen>
  );
}

type Nav = NativeStackNavigationProp<RootStackParamList>;

/** Auth is optional. Guests get a sign-in CTA; signed-in users see their name
 * and a sign-out button. Signing out never touches local Money data. */
function BackupStatusLine() {
  const status = useBackupStore((s) => s.status);
  const lastBackupAt = useBackupStore((s) => s.lastBackupAt);

  const text =
    status === 'syncing'
      ? 'Backing up money data…'
      : status === 'error'
        ? 'Money backup failed — retries when online.'
        : lastBackupAt
          ? `Money backed up ${new Date(lastBackupAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
          : 'Money backs up automatically when online.';

  return <Text style={styles.hint}>{text}</Text>;
}

function AccountSection() {
  const navigation = useNavigation<Nav>();
  const status = useAuthStore((s) => s.status);
  const username = useAuthStore((s) => s.username);
  const signOut = useAuthStore((s) => s.signOut);

  const confirmSignOut = () => {
    Alert.alert('Sign out', 'Signing out keeps all your money data on this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  if (status === 'authed') {
    return (
      <Card style={styles.card}>
        <View style={styles.accountRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(username ?? '?').slice(0, 1).toUpperCase()}
            </Text>
          </View>
          <View style={styles.rowText}>
            <Text style={styles.label}>{username ?? 'Signed in'}</Text>
            <Text style={styles.hint}>Portfolios sync and the AI assistant are unlocked.</Text>
            <BackupStatusLine />
          </View>
        </View>
        <View style={styles.signOutWrap}>
          <Button title="Sign out" variant="secondary" onPress={confirmSignOut} />
        </View>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <View style={styles.accountRow}>
        <View style={styles.avatar}>
          <Icon name="logIn" color={colors.primary} size={20} />
        </View>
        <View style={styles.rowText}>
          <Text style={styles.label}>You&apos;re using Mint AI as a guest</Text>
          <Text style={styles.hint}>
            Money works fully offline. Sign in to sync portfolios and use the AI assistant.
          </Text>
        </View>
      </View>
      <View style={styles.signOutWrap}>
        <Button title="Sign in" onPress={() => navigation.navigate('Login')} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { ...typography.heading, color: colors.text },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...typography.heading, color: colors.primary },
  signOutWrap: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  dayGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm },
  dayCell: { width: `${100 / 7}%`, paddingVertical: spacing.xs, alignItems: 'center' },
  dayInner: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayInnerActive: { backgroundColor: colors.primary },
  dayText: { ...typography.body, color: colors.text },
  dayTextActive: { color: colors.background, fontWeight: '700' },
  help: { ...typography.caption, color: colors.textMuted },
  card: { padding: 0, gap: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  rowText: { gap: spacing.xs, flex: 1 },
  label: { ...typography.body, color: colors.text },
  hint: { ...typography.caption, color: colors.textMuted },
  check: { ...typography.heading, color: colors.border },
  checkActive: { color: colors.primary },
});
