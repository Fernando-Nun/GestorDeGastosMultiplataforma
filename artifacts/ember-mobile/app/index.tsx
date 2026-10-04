import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { ExpensesProvider, useExpenses } from '@/contexts/ExpensesContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useColors } from '@/hooks/useColors';
import { getLocalUsdMxnRate, setLocalUsdMxnRate } from '@/lib/localDatabase';
import { formatMXN, formatUSD } from '@/lib/money';
import type { Expense, ExpenseInput } from '@/lib/types';

type FeatherName = React.ComponentProps<typeof Feather>['name'];
type Tab = 'home' | 'settings';
type Urgency = 'green' | 'yellow' | 'red';

const serviceIcons: Array<[string, FeatherName]> = [
  ['netflix', 'play-circle'],
  ['spotify', 'music'],
  ['disney', 'play'],
  ['youtube', 'video'],
  ['icloud', 'cloud'],
  ['google', 'globe'],
  ['adobe', 'aperture'],
];

function serviceIcon(service: string): FeatherName {
  const found = serviceIcons.find(([name]) =>
    service.toLowerCase().includes(name),
  );
  return found?.[1] ?? 'credit-card';
}

function daysUntil(paymentDay: number) {
  const today = new Date();
  const date = new Date(today.getFullYear(), today.getMonth(), paymentDay);
  if (date <= today) date.setMonth(date.getMonth() + 1);
  return Math.ceil((date.getTime() - today.getTime()) / 86_400_000);
}

function urgencyFor(paymentDay: number): Urgency {
  const days = daysUntil(paymentDay);
  if (days <= 1) return 'red';
  if (days <= 3) return 'yellow';
  return 'green';
}

function urgencyLabel(urgency: Urgency) {
  if (urgency === 'red') return 'Mañana';
  if (urgency === 'yellow') return `${daysUntil(1)} días`;
  return 'Próximo';
}

function formatAmount(amount: number, currency: Expense['currency']) {
  return currency === 'USD' ? formatUSD(amount) : formatMXN(amount);
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  colors,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'decimal-pad' | 'number-pad';
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        keyboardType={keyboardType}
        autoCapitalize="sentences"
        style={[
          styles.input,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            color: colors.text,
          },
        ]}
      />
    </View>
  );
}

function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  colors,
  icon,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  colors: ReturnType<typeof useColors>;
  icon?: FeatherName;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => [
        styles.primaryButton,
        {
          backgroundColor: colors.primary,
          opacity: disabled || loading ? 0.55 : pressed ? 0.82 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.primaryForeground} />
      ) : (
        <>
          {icon ? (
            <Feather
              name={icon}
              size={17}
              color={colors.primaryForeground}
            />
          ) : null}
          <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

function SummaryCard({
  rate,
  baseCurrency,
}: {
  rate: number | null;
  baseCurrency: 'MXN' | 'USD';
}) {
  const colors = useColors();
  const { expenses } = useExpenses();
  const month = new Intl.DateTimeFormat('es-MX', { month: 'long' }).format(
    new Date(),
  );
  const needsRate =
    !rate && expenses.some(expense => expense.currency !== baseCurrency);
  const total = expenses.reduce((sum, expense) => {
    if (expense.currency === baseCurrency) return sum + expense.amount;
    if (!rate) return sum;
    return sum + (baseCurrency === 'MXN'
      ? expense.amount * rate
      : expense.amount / rate);
  }, 0);
  const counts = {
    green: expenses.filter(item => urgencyFor(item.payment_day) === 'green').length,
    yellow: expenses.filter(item => urgencyFor(item.payment_day) === 'yellow').length,
    red: expenses.filter(item => urgencyFor(item.payment_day) === 'red').length,
  };

  return (
    <View
      style={[
        styles.summaryCard,
        { backgroundColor: colors.surfaceStrong, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.eyebrow, { color: colors.textTertiary }]}>
        Total {month}
      </Text>
      <View style={styles.summaryRow}>
        <View>
          <Text style={[styles.totalValue, { color: colors.text }]}>
            {needsRate ? '—' : baseCurrency === 'MXN' ? formatMXN(total) : formatUSD(total)}
          </Text>
          <Text style={[styles.caption, { color: colors.textTertiary }]}>
            {expenses.length} {expenses.length === 1 ? 'suscripción' : 'suscripciones'}
          </Text>
          {needsRate ? (
            <Text style={[styles.caption, { color: colors.urgentYellow }]}>
              Configura el tipo de cambio en Ajustes
            </Text>
          ) : null}
        </View>
        <View style={styles.urgencyCounts}>
          {(['green', 'yellow', 'red'] as const).map(level =>
            counts[level] ? (
              <View key={level} style={styles.urgencyCount}>
                <Text
                  style={[
                    styles.urgencyNumber,
                    {
                      color:
                        level === 'green'
                          ? colors.urgentGreen
                          : level === 'yellow'
                            ? colors.urgentYellow
                            : colors.urgentRed,
                    },
                  ]}
                >
                  {counts[level]}
                </Text>
                <View
                  style={[
                    styles.urgencyDot,
                    {
                      backgroundColor:
                        level === 'green'
                          ? colors.urgentGreen
                          : level === 'yellow'
                            ? colors.urgentYellow
                            : colors.urgentRed,
                    },
                  ]}
                />
              </View>
            ) : null,
          )}
        </View>
      </View>
    </View>
  );
}

function ExpenseCard({
  expense,
  rate,
  onEdit,
  onDelete,
}: {
  expense: Expense;
  rate: number | null;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const colors = useColors();
  const urgency = urgencyFor(expense.payment_day);
  const urgencyColor =
    urgency === 'green'
      ? colors.urgentGreen
      : urgency === 'yellow'
        ? colors.urgentYellow
        : colors.urgentRed;
  const converted =
    expense.currency === 'USD' && rate ? expense.amount * rate : null;

  return (
    <View
      style={[
        styles.expenseCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderLeftColor: urgencyColor,
        },
      ]}
    >
      <View style={[styles.serviceIcon, { backgroundColor: `${colors.primary}20` }]}>
        <Feather name={serviceIcon(expense.service_name)} size={19} color={colors.primary} />
      </View>
      <View style={styles.expenseMain}>
        <Text style={[styles.serviceName, { color: colors.text }]} numberOfLines={1}>
          {expense.service_name}
        </Text>
        <Text style={[styles.expenseMeta, { color: colors.textTertiary }]}>
          Día {expense.payment_day}
          {expense.card_label ? ` · ${expense.card_label}` : ''}
        </Text>
        {converted ? (
          <Text style={[styles.expenseConversion, { color: colors.primary }]}>
            {formatMXN(converted)}
          </Text>
        ) : null}
      </View>
      <View style={styles.expenseRight}>
        <Text style={[styles.expenseAmount, { color: colors.text }]}>
          {formatAmount(expense.amount, expense.currency)}
        </Text>
        <View style={styles.cardActions}>
          <Text style={[styles.urgencyLabel, { color: urgencyColor }]}>
            {urgencyLabel(urgency)}
          </Text>
          <Pressable
            accessibilityLabel="Editar suscripción"
            onPress={onEdit}
            hitSlop={8}
            style={styles.iconButton}
          >
            <Feather name="edit-2" size={14} color={colors.textSecondary} />
          </Pressable>
          <Pressable
            accessibilityLabel="Eliminar suscripción"
            onPress={onDelete}
            hitSlop={8}
            style={styles.iconButton}
          >
            <Feather name="trash-2" size={14} color={colors.urgentRed} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function ExpenseSheet({
  expense,
  rate,
  onClose,
}: {
  expense: Expense | null;
  rate: number | null;
  onClose: () => void;
}) {
  const colors = useColors();
  const { addExpense, updateExpense } = useExpenses();
  const editing = Boolean(expense);
  const [serviceName, setServiceName] = useState(expense?.service_name ?? '');
  const [paymentDay, setPaymentDay] = useState(String(expense?.payment_day ?? 1));
  const [cardLabel, setCardLabel] = useState(expense?.card_label ?? '');
  const [amount, setAmount] = useState(expense ? String(expense.amount) : '');
  const [currency, setCurrency] = useState<Expense['currency']>(
    expense?.currency ?? 'MXN',
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const amountNumber = Number(amount) || 0;
  const converted = currency === 'USD' && rate ? amountNumber * rate : null;

  const submit = async () => {
    Keyboard.dismiss();
    setError('');
    const day = Number(paymentDay);
    if (!serviceName.trim()) {
      setError('El nombre del servicio es requerido');
      return;
    }
    if (!Number.isInteger(day) || day < 1 || day > 31) {
      setError('El día debe estar entre 1 y 31');
      return;
    }
    if (!amountNumber || amountNumber <= 0) {
      setError('Ingresa un monto válido');
      return;
    }
    const data: ExpenseInput = {
      service_name: serviceName.trim(),
      payment_day: day,
      card_label: cardLabel.trim() || null,
      amount: amountNumber,
      currency,
    };
    setSaving(true);
    const result = expense
      ? await updateExpense(expense.id, data)
      : await addExpense(data);
    setSaving(false);
    if (result) {
      setError(result);
      return;
    }
    onClose();
  };

  return (
    <Modal animationType="slide" transparent visible onRequestClose={onClose}>
      <View style={[styles.modalRoot, { backgroundColor: colors.overlay }]}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <KeyboardAwareScrollViewCompat
          style={[styles.sheet, { backgroundColor: colors.meshOne }]}
          contentContainerStyle={[
            styles.sheetContent,
            { paddingBottom: 24 + useSafeAreaInsets().bottom },
          ]}
        >
          <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
          <View style={styles.sheetHeader}>
            <View>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>
                {editing ? 'Editar suscripción' : 'Nueva suscripción'}
              </Text>
              <Text style={[styles.sheetSubtitle, { color: colors.textTertiary }]}>
                Se repite cada mes
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeButton}>
              <Feather name="x" size={19} color={colors.textSecondary} />
            </Pressable>
          </View>
          <Field
            label="Nombre del servicio"
            value={serviceName}
            onChangeText={setServiceName}
            placeholder="Netflix, Spotify..."
            colors={colors}
          />
          <Field
            label="Día de pago"
            value={paymentDay}
            onChangeText={setPaymentDay}
            placeholder="1 a 31"
            keyboardType="number-pad"
            colors={colors}
          />
          <Field
            label="Tarjeta o método de pago (opcional)"
            value={cardLabel}
            onChangeText={setCardLabel}
            placeholder="Tarjeta azul, efectivo..."
            colors={colors}
          />
          <View style={styles.amountRow}>
            <View style={styles.amountField}>
              <Field
                label="Monto"
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                keyboardType="decimal-pad"
                colors={colors}
              />
            </View>
            <View style={styles.currencyField}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                Moneda
              </Text>
              <View style={[styles.currencyPicker, { borderColor: colors.border }]}>
                {(['MXN', 'USD'] as const).map(item => (
                  <Pressable
                    key={item}
                    onPress={() => setCurrency(item)}
                    style={[
                      styles.currencyOption,
                      currency === item && { backgroundColor: colors.primary },
                    ]}
                  >
                    <Text
                      style={[
                        styles.currencyOptionText,
                        { color: currency === item ? colors.primaryForeground : colors.textSecondary },
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
          {converted ? (
            <View
              style={[
                styles.conversionBox,
                { backgroundColor: `${colors.primary}14`, borderColor: `${colors.primary}28` },
              ]}
            >
              <View>
                <Text style={[styles.caption, { color: colors.textTertiary }]}>
                  Equivalente en pesos
                </Text>
                <Text style={[styles.conversionValue, { color: colors.primary }]}>
                  {formatMXN(converted)}
                </Text>
              </View>
              <Text style={[styles.rateText, { color: colors.textSecondary }]}>
                {formatUSD(amountNumber)} × {rate?.toFixed(2) ?? '—'}
              </Text>
            </View>
          ) : null}
          <View style={[styles.reminderBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.caption, { color: colors.textTertiary }]}>
              Recordatorios automáticos
            </Text>
            {[
              [colors.urgentGreen, '7 días antes — Aviso temprano'],
              [colors.urgentYellow, '3 días antes — Atención'],
              [colors.urgentRed, '1 día antes — Urgente'],
            ].map(([color, label]) => (
              <View key={label} style={styles.reminderRow}>
                <View style={[styles.reminderDot, { backgroundColor: color }]} />
                <Text style={[styles.reminderText, { color: colors.textSecondary }]}>
                  {label}
                </Text>
              </View>
            ))}
          </View>
          {error ? (
            <Text style={[styles.errorText, { color: colors.urgentRed }]}>
              {error}
            </Text>
          ) : null}
          <View style={styles.sheetActions}>
            <Pressable
              onPress={onClose}
              style={[styles.secondaryButton, { borderColor: colors.border }]}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>
                Cancelar
              </Text>
            </Pressable>
            <View style={styles.actionGrow}>
              <PrimaryButton
                label={editing ? 'Guardar cambios' : 'Añadir gasto'}
                onPress={submit}
                loading={saving}
                colors={colors}
              />
            </View>
          </View>
        </KeyboardAwareScrollViewCompat>
      </View>
    </Modal>
  );
}

function HomeView({
  rate,
  baseCurrency,
  onAdd,
  onEdit,
}: {
  rate: number | null;
  baseCurrency: 'MXN' | 'USD';
  onAdd: () => void;
  onEdit: (expense: Expense) => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { expenses, loading, error, refresh, deleteExpense } = useExpenses();
  const sorted = useMemo(
    () =>
      [...expenses].sort(
        (a, b) =>
          ({ red: 0, yellow: 1, green: 2 }[urgencyFor(a.payment_day)] ?? 3) -
          ({ red: 0, yellow: 1, green: 2 }[urgencyFor(b.payment_day)] ?? 3),
      ),
    [expenses],
  );

  const confirmDelete = (expense: Expense) => {
    Alert.alert(
      'Eliminar suscripción',
      `¿Quieres eliminar ${expense.service_name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => void deleteExpense(expense.id),
        },
      ],
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.meshOne }]}>
      <View style={[styles.meshOrbTop, { backgroundColor: colors.meshTwo }]} />
      <View style={[styles.meshOrbBottom, { backgroundColor: colors.meshThree }]} />
      <ScrollView
        contentContainerStyle={[
          styles.homeContent,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 104 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => void refresh()}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View style={styles.brandLockup}>
            <Image
              source={require('../assets/images/icon.png')}
              style={styles.headerIcon}
            />
            <Text style={[styles.headerBrand, { color: colors.text }]}>Ember</Text>
          </View>
          <View
            accessible
            accessibilityLabel="Datos guardados en este dispositivo"
            style={[styles.avatar, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Feather name="database" size={16} color={colors.primary} />
          </View>
        </View>
        <SummaryCard rate={rate} baseCurrency={baseCurrency} />
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Mis suscripciones
            </Text>
            <Text style={[styles.caption, { color: colors.textTertiary }]}>
              Tus pagos recurrentes
            </Text>
          </View>
          <Pressable
            onPress={onAdd}
            style={({ pressed }) => [
              styles.addButton,
              { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Feather name="plus" size={16} color={colors.primaryForeground} />
            <Text style={[styles.addButtonText, { color: colors.primaryForeground }]}>
              Añadir
            </Text>
          </Pressable>
        </View>
        {error ? (
          <View style={[styles.errorBox, { borderColor: `${colors.urgentRed}45`, backgroundColor: `${colors.urgentRed}15` }]}>
            <Feather name="alert-circle" size={17} color={colors.urgentRed} />
            <Text style={[styles.errorText, { color: colors.urgentRed }]}>{error}</Text>
          </View>
        ) : null}
        {loading && !expenses.length ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.primary} />
            <Text style={[styles.caption, { color: colors.textTertiary }]}>
              Cargando tus gastos...
            </Text>
          </View>
        ) : sorted.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.emptyIcon, { backgroundColor: `${colors.primary}18` }]}>
              <Feather name="calendar" size={25} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Aún no tienes suscripciones
            </Text>
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              Añade tu primer pago recurrente para empezar a organizar tu mes.
            </Text>
            <PrimaryButton
              label="Añadir suscripción"
              icon="plus"
              onPress={onAdd}
              colors={colors}
            />
          </View>
        ) : (
          <View style={styles.expensesList}>
            {sorted.map(expense => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                rate={rate}
                onEdit={() => onEdit(expense)}
                onDelete={() => confirmDelete(expense)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function SettingsView({
  rate,
  onRateChange,
  baseCurrency,
  onBaseCurrencyChange,
}: {
  rate: number | null;
  onRateChange: (rate: number | null) => void;
  baseCurrency: 'MXN' | 'USD';
  onBaseCurrencyChange: (currency: 'MXN' | 'USD') => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isDark, toggleTheme } = useTheme();
  const [silent, setSilent] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(rate ? String(rate) : '');
  const [rateError, setRateError] = useState('');
  const [savingRate, setSavingRate] = useState(false);

  useEffect(() => {
    void AsyncStorage.getItem('@ember/silent-notifs').then(silentValue => {
      setSilent(silentValue === 'true');
    });
    void getLocalUsdMxnRate().then(storedRate => {
      if (storedRate !== null) {
        setExchangeRate(String(storedRate));
        onRateChange(storedRate);
      }
    });
  }, []);

  const toggleSilent = (value: boolean) => {
    setSilent(value);
    void AsyncStorage.setItem('@ember/silent-notifs', String(value));
  };
  const changeCurrency = (value: 'MXN' | 'USD') => {
    onBaseCurrencyChange(value);
    void AsyncStorage.setItem('@ember/base-currency', value);
  };
  const saveRate = async () => {
    const parsed = Number(exchangeRate.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setRateError('Ingresa un tipo de cambio mayor que cero');
      return;
    }
    setSavingRate(true);
    setRateError('');
    try {
      await setLocalUsdMxnRate(parsed);
      onRateChange(parsed);
    } catch (error) {
      setRateError(error instanceof Error ? error.message : 'No se pudo guardar');
    } finally {
      setSavingRate(false);
    }
  };

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.settingsContent,
        { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 104 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.settingsTitle, { color: colors.text }]}>Ajustes</Text>
      <View style={[styles.identityCard, { backgroundColor: colors.surfaceStrong, borderColor: colors.border }]}>
        <Image source={require('../assets/images/icon.png')} style={styles.identityIcon} />
        <View>
          <Text style={[styles.identityTitle, { color: colors.text }]}>Ember</Text>
          <Text style={[styles.caption, { color: colors.textTertiary }]}>
            Gestor de suscripciones
          </Text>
        </View>
      </View>
      <SettingsSection title="Datos locales" colors={colors}>
        <Text style={[styles.localDataText, { color: colors.textSecondary }]}>
          Tus suscripciones se guardan en este dispositivo. No necesitas una
          cuenta y los datos no se sincronizan automáticamente con otros
          teléfonos.
        </Text>
      </SettingsSection>
      <SettingsSection title="Apariencia" colors={colors}>
        <SettingRow
          icon={isDark ? 'moon' : 'sun'}
          title="Tema"
          description={isDark ? 'Modo oscuro activo' : 'Modo claro activo'}
          colors={colors}
          right={<Switch value={isDark} onValueChange={toggleTheme} trackColor={{ false: colors.border, true: colors.primary }} thumbColor={colors.primaryForeground} />}
        />
        <SettingRow
          icon="globe"
          title="Moneda base"
          description="Moneda para mostrar totales"
          colors={colors}
          right={
            <View style={[styles.currencyPickerSmall, { borderColor: colors.border }]}>
              {(['MXN', 'USD'] as const).map(value => (
                <Pressable
                  key={value}
                  onPress={() => changeCurrency(value)}
                  style={[styles.currencySmallOption, baseCurrency === value && { backgroundColor: colors.primary }]}
                >
                  <Text style={[styles.currencyOptionText, { color: baseCurrency === value ? colors.primaryForeground : colors.textSecondary }]}>
                    {value}
                  </Text>
                </Pressable>
              ))}
            </View>
          }
        />
      </SettingsSection>
      <SettingsSection title="Conversión de moneda" colors={colors}>
        <Text style={[styles.localDataText, { color: colors.textSecondary }]}>
          Define cuántos pesos mexicanos equivale 1 dólar. El valor se guarda
          localmente y Ember no consulta servicios externos.
        </Text>
        <View style={styles.exchangeRateRow}>
          <Text style={[styles.settingTitle, styles.exchangeRateLabel, { color: colors.text }]}>
            MXN por 1 USD
          </Text>
          <TextInput
            accessibilityLabel="Tipo de cambio de dólares a pesos"
            keyboardType="decimal-pad"
            value={exchangeRate}
            onChangeText={value => {
              setExchangeRate(value);
              setRateError('');
            }}
            placeholder="Ej. 18.00"
            placeholderTextColor={colors.textTertiary}
            style={[
              styles.exchangeRateInput,
              {
                color: colors.text,
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          />
        </View>
        {rateError ? (
          <Text style={[styles.errorText, { color: colors.urgentRed }]}>
            {rateError}
          </Text>
        ) : null}
        <Pressable
          accessibilityRole="button"
          disabled={savingRate}
          onPress={() => void saveRate()}
          style={[
            styles.rateSaveButton,
            { backgroundColor: colors.primary, opacity: savingRate ? 0.6 : 1 },
          ]}
        >
          <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>
            {savingRate ? 'Guardando…' : 'Guardar tipo de cambio'}
          </Text>
        </Pressable>
      </SettingsSection>
      <SettingsSection title="Notificaciones" colors={colors}>
        <SettingRow
          icon="bell"
          title="Notificaciones silenciosas"
          description="Recibe recordatorios sin sonido"
          colors={colors}
          right={<Switch value={silent} onValueChange={toggleSilent} trackColor={{ false: colors.border, true: colors.primary }} thumbColor={colors.primaryForeground} />}
        />
        <View style={[styles.infoBox, { backgroundColor: `${colors.primary}10`, borderColor: `${colors.primary}22` }]}>
          <Text style={[styles.infoText, { color: colors.textTertiary }]}>
            Los recordatorios aparecen cuando abres la app. Las notificaciones push estarán disponibles en una próxima versión.
          </Text>
        </View>
      </SettingsSection>
      <Text style={[styles.versionText, { color: colors.textTertiary }]}>
        Ember v1.0.0 · Gestor de suscripciones
      </Text>
    </ScrollView>
  );
}

function SettingsSection({
  title,
  children,
  colors,
}: {
  title: string;
  children: React.ReactNode;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[styles.settingsSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.sectionEyebrow, { color: colors.textTertiary }]}>{title}</Text>
      {children}
    </View>
  );
}

function SettingRow({
  icon,
  title,
  description,
  right,
  colors,
}: {
  icon: FeatherName;
  title: string;
  description: string;
  right: React.ReactNode;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
      <View style={[styles.settingIcon, { backgroundColor: `${colors.primary}18` }]}>
        <Feather name={icon} size={16} color={colors.primary} />
      </View>
      <View style={styles.settingCopy}>
        <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.settingDescription, { color: colors.textTertiary }]} numberOfLines={1}>
          {description}
        </Text>
      </View>
      {right}
    </View>
  );
}

function BottomNav({
  tab,
  onChange,
}: {
  tab: Tab;
  onChange: (tab: Tab) => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.bottomNav,
        {
          paddingBottom: Math.max(insets.bottom, 12),
          backgroundColor: colors.surfaceStrong,
          borderColor: colors.border,
        },
      ]}
    >
      {([
        ['home', 'Inicio', 'home'],
        ['settings', 'Ajustes', 'settings'],
      ] as const).map(([value, label, icon]) => (
        <Pressable
          key={value}
          onPress={() => onChange(value)}
          style={styles.navItem}
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === value }}
        >
          <Feather
            name={icon}
            size={20}
            color={tab === value ? colors.primary : colors.textTertiary}
          />
          <Text
            style={[
              styles.navLabel,
              { color: tab === value ? colors.primary : colors.textTertiary },
            ]}
          >
            {label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function EmberApp() {
  const colors = useColors();
  const [tab, setTab] = useState<Tab>('home');
  const [rate, setRate] = useState<number | null>(null);
  const [baseCurrency, setBaseCurrency] = useState<'MXN' | 'USD'>('MXN');
  const [sheetExpense, setSheetExpense] = useState<Expense | null | undefined>();

  useEffect(() => {
    let active = true;
    void getLocalUsdMxnRate().then(value => {
      if (active) setRate(value);
    });
    void AsyncStorage.getItem('@ember/base-currency').then(value => {
      if (active && value === 'USD') setBaseCurrency('USD');
    });
    return () => {
      active = false;
    };
  }, []);

  const openAdd = () => setSheetExpense(null);
  const openEdit = (expense: Expense) => setSheetExpense(expense);
  const closeSheet = () => setSheetExpense(undefined);

  return (
    <View style={styles.appRoot}>
      <View style={styles.appBody}>
        {tab === 'home' ? (
          <HomeView
            rate={rate}
            baseCurrency={baseCurrency}
            onAdd={openAdd}
            onEdit={openEdit}
          />
        ) : (
          <SettingsView
            rate={rate}
            onRateChange={setRate}
            baseCurrency={baseCurrency}
            onBaseCurrencyChange={setBaseCurrency}
          />
        )}
      </View>
      <BottomNav tab={tab} onChange={setTab} />
      {sheetExpense !== undefined ? (
        <ExpenseSheet
          expense={sheetExpense}
          rate={rate}
          onClose={closeSheet}
        />
      ) : null}
      <View pointerEvents="none" style={[styles.bottomTint, { backgroundColor: colors.meshOne }]} />
    </View>
  );
}

export default function IndexScreen() {
  return (
    <ExpensesProvider>
      <EmberApp />
    </ExpensesProvider>
  );
}

const styles = StyleSheet.create({
  appRoot: { flex: 1 },
  appBody: { flex: 1 },
  screen: { flex: 1, overflow: 'hidden' },
  homeContent: { paddingHorizontal: 20 },
  meshOrbTop: { position: 'absolute', width: 360, height: 300, borderRadius: 180, top: -130, left: -110, opacity: 0.5 },
  meshOrbBottom: { position: 'absolute', width: 420, height: 360, borderRadius: 210, bottom: -180, right: -160, opacity: 0.4 },
  field: { gap: 7, marginBottom: 14 },
  fieldLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 0.4, textTransform: 'uppercase' },
  input: { borderWidth: 1, borderRadius: 13, paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 13 : 11, fontFamily: 'Inter_400Regular', fontSize: 15 },
  primaryButton: { minHeight: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 18 },
  primaryButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  errorText: { fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 18 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 21 },
  brandLockup: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  headerIcon: { width: 31, height: 31, borderRadius: 9 },
  headerBrand: { fontFamily: 'Outfit_700Bold', fontSize: 22 },
  avatar: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  summaryCard: { borderRadius: 24, borderWidth: 1, padding: 19, marginBottom: 25 },
  eyebrow: { fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 1.3, textTransform: 'uppercase', marginBottom: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  totalValue: { fontFamily: 'Outfit_700Bold', fontSize: 30, letterSpacing: -0.5 },
  caption: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 4 },
  urgencyCounts: { flexDirection: 'row', gap: 12, alignItems: 'flex-end' },
  urgencyCount: { alignItems: 'center', gap: 4 },
  urgencyNumber: { fontFamily: 'Outfit_700Bold', fontSize: 18 },
  urgencyDot: { width: 7, height: 7, borderRadius: 4 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 13 },
  sectionTitle: { fontFamily: 'Outfit_700Bold', fontSize: 18 },
  addButton: { borderRadius: 12, paddingVertical: 9, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 5 },
  addButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  expensesList: { gap: 10 },
  expenseCard: { minHeight: 88, borderWidth: 1, borderLeftWidth: 3, borderRadius: 18, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 11 },
  serviceIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  expenseMain: { flex: 1, minWidth: 0 },
  serviceName: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  expenseMeta: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 5 },
  expenseConversion: { fontFamily: 'Inter_500Medium', fontSize: 10, marginTop: 3 },
  expenseRight: { alignItems: 'flex-end', gap: 5 },
  expenseAmount: { fontFamily: 'Outfit_700Bold', fontSize: 15 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  urgencyLabel: { fontFamily: 'Inter_500Medium', fontSize: 10 },
  iconButton: { padding: 1 },
  emptyBox: { borderWidth: 1, borderRadius: 22, padding: 24, alignItems: 'center', marginTop: 5 },
  emptyIcon: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 13 },
  emptyTitle: { fontFamily: 'Outfit_700Bold', fontSize: 17 },
  emptyText: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 7, marginBottom: 18 },
  loadingBox: { alignItems: 'center', gap: 10, paddingTop: 28 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 13, padding: 11, marginBottom: 12 },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: StyleSheet.absoluteFill,
  sheet: { maxHeight: '91%', borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  sheetContent: { paddingHorizontal: 20, paddingTop: 10 },
  sheetHandle: { width: 42, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 18 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 21 },
  sheetTitle: { fontFamily: 'Outfit_700Bold', fontSize: 22 },
  sheetSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 4 },
  closeButton: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  amountRow: { flexDirection: 'row', gap: 10 },
  amountField: { flex: 1 },
  currencyField: { width: 130 },
  currencyPicker: { borderWidth: 1, borderRadius: 13, flexDirection: 'row', padding: 3, height: 48 },
  currencyOption: { flex: 1, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  currencyOptionText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  conversionBox: { borderWidth: 1, borderRadius: 16, padding: 13, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 1, marginBottom: 14 },
  conversionValue: { fontFamily: 'Outfit_700Bold', fontSize: 18, marginTop: 3 },
  rateText: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  reminderBox: { borderWidth: 1, borderRadius: 16, padding: 13, marginBottom: 14 },
  reminderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  reminderDot: { width: 7, height: 7, borderRadius: 4 },
  reminderText: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  sheetActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  secondaryButton: { minHeight: 50, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 17 },
  secondaryButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  actionGrow: { flex: 1 },
  settingsContent: { paddingHorizontal: 20 },
  settingsTitle: { fontFamily: 'Outfit_700Bold', fontSize: 28, marginBottom: 19 },
  identityCard: { borderWidth: 1, borderRadius: 22, padding: 17, flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 18 },
  identityIcon: { width: 48, height: 48, borderRadius: 15 },
  identityTitle: { fontFamily: 'Outfit_700Bold', fontSize: 17 },
  settingsSection: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, marginBottom: 14 },
  sectionEyebrow: { fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', paddingTop: 14, paddingBottom: 2 },
  settingRow: { minHeight: 67, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 11 },
  settingIcon: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  settingCopy: { flex: 1, minWidth: 0 },
  settingTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  settingDescription: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 3 },
  verified: { fontFamily: 'Inter_500Medium', fontSize: 10 },
  currencyPickerSmall: { borderWidth: 1, borderRadius: 11, flexDirection: 'row', padding: 2 },
  currencySmallOption: { borderRadius: 8, paddingVertical: 6, paddingHorizontal: 9 },
  infoBox: { borderWidth: 1, borderRadius: 13, padding: 11, marginVertical: 13 },
  infoText: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 17 },
  localDataText: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
  exchangeRateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 14 },
  exchangeRateLabel: { flex: 1 },
  exchangeRateInput: { width: 110, borderWidth: 1, borderRadius: 11, paddingHorizontal: 11, paddingVertical: 9, textAlign: 'right', fontFamily: 'Inter_500Medium', fontSize: 14 },
  rateSaveButton: { minHeight: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 12, paddingHorizontal: 14 },
  versionText: { fontFamily: 'Inter_400Regular', textAlign: 'center', fontSize: 11, marginTop: 4 },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-around', paddingTop: 10 },
  navItem: { alignItems: 'center', gap: 4, minWidth: 70 },
  navLabel: { fontFamily: 'Inter_500Medium', fontSize: 10 },
  bottomTint: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 1 },
});