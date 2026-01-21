import { View, Text, StyleSheet, Pressable, FlatList, Linking } from 'react-native';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { Icon, type IconName } from '@/components/icons';
import { useTranslation } from '@/lib/i18n';

type PlaceType = 'gas_station' | 'rest_area' | 'town';

interface SafePlace {
  id: string;
  name: string;
  type: PlaceType;
  latitude: number;
  longitude: number;
  address?: string;
  distanceKm?: number;
}

interface SafePlacesListProps {
  places: SafePlace[];
  isLoading?: boolean;
  onSelectPlace?: (place: SafePlace) => void;
  emptyMessage?: string;
}

const PLACE_TYPE_CONFIG: Record<PlaceType, { icon: IconName; label: string; color: string }> = {
  gas_station: {
    icon: 'road',
    label: 'places.gasStation',
    color: '#EF4444',
  },
  rest_area: {
    icon: 'location',
    label: 'places.restArea',
    color: '#3B82F6',
  },
  town: {
    icon: 'map',
    label: 'places.town',
    color: '#8B5CF6',
  },
};

function PlaceItem({
  place,
  onPress,
}: {
  place: SafePlace;
  onPress?: () => void;
}) {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const config = PLACE_TYPE_CONFIG[place.type];

  const openInMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;
    Linking.openURL(url);
  };

  return (
    <Pressable
      style={[styles.placeItem, { backgroundColor: colors.card }]}
      onPress={onPress || openInMaps}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${config.color}20` }]}>
        <Icon name={config.icon} size={20} color={config.color} />
      </View>

      <View style={styles.placeInfo}>
        <Text style={[styles.placeName, { color: colors.foreground }]} numberOfLines={1}>
          {place.name}
        </Text>
        <Text style={[styles.placeType, { color: colors.mutedForeground }]}>
          {t(config.label)}
        </Text>
        {place.address && (
          <Text
            style={[styles.placeAddress, { color: colors.mutedForeground }]}
            numberOfLines={1}
          >
            {place.address}
          </Text>
        )}
      </View>

      <View style={styles.distanceContainer}>
        {place.distanceKm !== undefined && (
          <Text style={[styles.distance, { color: colors.foreground }]}>
            {place.distanceKm < 1
              ? `${Math.round(place.distanceKm * 1000)} m`
              : `${place.distanceKm.toFixed(1)} km`}
          </Text>
        )}
        <Icon name="arrowRight" size={16} color={colors.mutedForeground} />
      </View>
    </Pressable>
  );
}

export function SafePlacesList({
  places,
  isLoading = false,
  onSelectPlace,
  emptyMessage,
}: SafePlacesListProps) {
  const colors = useThemeColors();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          {t('places.loading')}
        </Text>
      </View>
    );
  }

  if (places.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="location" size={32} color={colors.mutedForeground} />
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          {emptyMessage || t('places.noPlacesFound')}
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={places}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <PlaceItem
          place={item}
          onPress={onSelectPlace ? () => onSelectPlace(item) : undefined}
        />
      )}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
}

// Grouped view for displaying places by type
interface SafePlacesGroupedProps {
  gasStations: SafePlace[];
  restAreas: SafePlace[];
  towns: SafePlace[];
  isLoading?: boolean;
  onSelectPlace?: (place: SafePlace) => void;
}

export function SafePlacesGrouped({
  gasStations,
  restAreas,
  towns,
  isLoading = false,
  onSelectPlace,
}: SafePlacesGroupedProps) {
  const colors = useThemeColors();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          {t('places.loading')}
        </Text>
      </View>
    );
  }

  const sections = [
    { title: t('places.nearbyGasStations'), data: gasStations, type: 'gas_station' as PlaceType },
    { title: t('places.nearbyRestAreas'), data: restAreas, type: 'rest_area' as PlaceType },
    { title: t('places.nearbyTowns'), data: towns, type: 'town' as PlaceType },
  ].filter((section) => section.data.length > 0);

  if (sections.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="location" size={32} color={colors.mutedForeground} />
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          {t('places.noPlacesFound')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.groupedContainer}>
      {sections.map((section) => (
        <View key={section.type} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {section.title}
          </Text>
          {section.data.slice(0, 3).map((place) => (
            <PlaceItem
              key={place.id}
              place={place}
              onPress={onSelectPlace ? () => onSelectPlace(place) : undefined}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
  },
  placeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  placeName: {
    fontFamily: 'NunitoSans_600SemiBold',
    fontSize: 15,
  },
  placeType: {
    fontFamily: 'NunitoSans_400Regular',
    fontSize: 12,
    marginTop: 2,
  },
  placeAddress: {
    fontFamily: 'NunitoSans_400Regular',
    fontSize: 11,
    marginTop: 2,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  distance: {
    fontFamily: 'NunitoSans_600SemiBold',
    fontSize: 13,
  },
  separator: {
    height: 8,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: {
    fontFamily: 'NunitoSans_400Regular',
    fontSize: 14,
    textAlign: 'center',
  },
  groupedContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'NunitoSans_700Bold',
    fontSize: 16,
    marginBottom: 12,
  },
});
