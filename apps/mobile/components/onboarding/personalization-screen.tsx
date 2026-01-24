// apps/mobile/components/onboarding/personalization-screen.tsx
import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useTranslation } from '@/lib/i18n';
import { Icon, type IconName } from '@/components/icons';

export type TripType = 'commute' | 'roadTrips' | 'business' | 'longHaul';

type PersonalizationScreenProps = {
  onSelectionChange?: (selected: TripType[]) => void;
  initialSelection?: TripType[];
};

type TripOption = {
  id: TripType;
  icon: IconName;
  labelKey: string;
};

const TRIP_OPTIONS: TripOption[] = [
  { id: 'commute', icon: 'clock', labelKey: 'onboarding.personalization.options.commute' },
  { id: 'roadTrips', icon: 'route', labelKey: 'onboarding.personalization.options.roadTrips' },
  { id: 'business', icon: 'location', labelKey: 'onboarding.personalization.options.business' },
  { id: 'longHaul', icon: 'map', labelKey: 'onboarding.personalization.options.longHaul' },
];

export function PersonalizationScreen({
  onSelectionChange,
  initialSelection = [],
}: PersonalizationScreenProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [selected, setSelected] = useState<TripType[]>(initialSelection);

  const toggleOption = (id: TripType) => {
    setSelected((prev) => {
      const newSelection = prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id];
      onSelectionChange?.(newSelection);
      return newSelection;
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {t('onboarding.personalization.title')}
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Select all that apply
          </Text>
        </Animated.View>

        {/* Options grid */}
        <View style={styles.optionsContainer}>
          {TRIP_OPTIONS.map((option, index) => (
            <TripOptionCard
              key={option.id}
              option={option}
              isSelected={selected.includes(option.id)}
              onPress={() => toggleOption(option.id)}
              colors={colors}
              index={index}
              t={t}
            />
          ))}
        </View>

        {/* Selection indicator */}
        <Animated.View
          entering={FadeInDown.delay(500).duration(400)}
          style={styles.selectionIndicator}
        >
          <Text style={[styles.selectionText, { color: colors.mutedForeground }]}>
            {selected.length === 0
              ? 'Tap to select your trip types'
              : `${selected.length} selected`}
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

type TripOptionCardProps = {
  option: TripOption;
  isSelected: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useThemeColors>;
  index: number;
  t: (key: string) => string;
};

function TripOptionCard({ option, isSelected, onPress, colors, index, t }: TripOptionCardProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(isSelected ? 1.02 : 1) }],
    borderWidth: withSpring(isSelected ? 2 : 1),
    borderColor: isSelected ? colors.primary : colors.border,
    backgroundColor: isSelected ? colors.primary + '10' : colors.card,
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(200 + index * 100).duration(400)}
      style={styles.cardWrapper}
    >
      <Pressable onPress={onPress}>
        <Animated.View style={[styles.optionCard, animatedStyle]}>
          {/* Selected checkmark */}
          {isSelected && (
            <View style={[styles.checkmark, { backgroundColor: colors.primary }]}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
          )}

          {/* Icon */}
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: isSelected ? colors.primary + '20' : colors.muted },
            ]}
          >
            <Icon
              name={option.icon}
              size={28}
              color={isSelected ? colors.primary : colors.mutedForeground}
            />
          </View>

          {/* Label */}
          <Text
            style={[
              styles.optionLabel,
              { color: isSelected ? colors.foreground : colors.mutedForeground },
            ]}
          >
            {t(option.labelKey)}
          </Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 28,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
  cardWrapper: {
    width: '45%',
    minWidth: 150,
  },
  optionCard: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    position: 'relative',
    minHeight: 140,
    justifyContent: 'center',
  },
  checkmark: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    textAlign: 'center',
  },
  selectionIndicator: {
    marginTop: 32,
    alignItems: 'center',
  },
  selectionText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
});
