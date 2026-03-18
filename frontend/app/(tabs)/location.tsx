import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  address?: string;
  city?: string;
  district?: string;
  country?: string;
}

interface NearbyService {
  id: string;
  name: string;
  nameNepali: string;
  icon: string;
  color: string;
  description: string;
  descriptionNepali: string;
}

const NEARBY_SERVICES: NearbyService[] = [
  {
    id: 'hospital',
    name: 'Hospitals & Clinics',
    nameNepali: 'अस्पताल र क्लिनिक',
    icon: 'medical',
    color: '#EF4444',
    description: 'Find nearby hospitals and medical clinics',
    descriptionNepali: 'नजिकैका अस्पताल र क्लिनिकहरू',
  },
  {
    id: 'pharmacy',
    name: 'Pharmacies',
    nameNepali: 'औषधि पसल',
    icon: 'medkit',
    color: '#10B981',
    description: 'Find nearby pharmacies and medical stores',
    descriptionNepali: 'नजिकैका औषधि पसलहरू',
  },
  {
    id: 'restaurant',
    name: 'Restaurants',
    nameNepali: 'रेस्टुरेन्ट',
    icon: 'restaurant',
    color: '#F59E0B',
    description: 'Find nearby restaurants and eateries',
    descriptionNepali: 'नजिकैका खाने ठाउँहरू',
  },
  {
    id: 'grocery',
    name: 'Grocery Shops',
    nameNepali: 'किराना पसल',
    icon: 'cart',
    color: '#3B82F6',
    description: 'Find nearby grocery and general stores',
    descriptionNepali: 'नजिकैका किराना पसलहरू',
  },
  {
    id: 'atm',
    name: 'ATMs & Banks',
    nameNepali: 'एटीएम र बैंक',
    icon: 'card',
    color: '#8B5CF6',
    description: 'Find nearby ATMs and bank branches',
    descriptionNepali: 'नजिकैका एटीएम र बैंकहरू',
  },
  {
    id: 'petrol',
    name: 'Petrol Pumps',
    nameNepali: 'पेट्रोल पम्प',
    icon: 'car',
    color: '#EC4899',
    description: 'Find nearby petrol stations',
    descriptionNepali: 'नजिकैका पेट्रोल पम्पहरू',
  },
];

export default function LocationScreen() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    setPermissionStatus(status);
  };

  const requestPermission = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);

      if (status === 'granted') {
        await getLocation();
      } else {
        setErrorMsg('Location permission denied. Please enable it in settings.');
      }
    } catch (error) {
      setErrorMsg('Failed to request location permission');
    } finally {
      setLoading(false);
    }
  };

  const getLocation = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const locationResult = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude, accuracy } = locationResult.coords;

      // Try to get address from coordinates
      let addressData: Partial<LocationData> = {};
      try {
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });

        if (reverseGeocode.length > 0) {
          const addr = reverseGeocode[0];
          addressData = {
            address: [addr.street, addr.streetNumber].filter(Boolean).join(' ') || addr.name || '',
            city: addr.city || addr.subregion || '',
            district: addr.district || addr.region || '',
            country: addr.country || '',
          };
        }
      } catch (geocodeError) {
        console.log('Reverse geocode failed:', geocodeError);
      }

      setLocation({
        latitude,
        longitude,
        accuracy,
        ...addressData,
      });
    } catch (error: any) {
      console.error('Location error:', error);
      setErrorMsg('Failed to get location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openInMaps = (service: NearbyService) => {
    if (!location) {
      Alert.alert(
        'स्थान आवश्यक छ',
        'कृपया पहिले आफ्नो स्थान पत्ता लगाउनुहोस्।\n\nPlease get your location first.',
        [{ text: 'ठीक छ / OK' }]
      );
      return;
    }

    const { latitude, longitude } = location;
    const query = encodeURIComponent(service.name.split(' ')[0]);
    
    // Open Google Maps with search query near user's location
    const url = Platform.select({
      ios: `maps://maps.apple.com/?q=${query}&sll=${latitude},${longitude}`,
      android: `geo:${latitude},${longitude}?q=${query}`,
      default: `https://www.google.com/maps/search/${query}/@${latitude},${longitude},15z`,
    });

    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        // Fallback to Google Maps web
        Linking.openURL(
          `https://www.google.com/maps/search/${query}/@${latitude},${longitude},15z`
        );
      }
    });
  };

  const openSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Ionicons name="location" size={24} color="#10B981" />
          </View>
          <View>
            <Text style={styles.headerTitle}>मेरो स्थान</Text>
            <Text style={styles.headerSubtitle}>My Location</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Location Card */}
        <View style={styles.locationCard}>
          <View style={styles.locationHeader}>
            <Ionicons name="navigate" size={24} color="#10B981" />
            <Text style={styles.locationTitle}>हालको स्थान / Current Location</Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#10B981" />
              <Text style={styles.loadingText}>स्थान खोज्दै... / Getting location...</Text>
            </View>
          ) : location ? (
            <View style={styles.locationInfo}>
              {/* Address */}
              {(location.city || location.district) && (
                <View style={styles.addressContainer}>
                  <Ionicons name="home" size={20} color="#4F46E5" />
                  <View style={styles.addressText}>
                    {location.address && (
                      <Text style={styles.addressLine}>{location.address}</Text>
                    )}
                    <Text style={styles.cityLine}>
                      {[location.city, location.district].filter(Boolean).join(', ')}
                    </Text>
                    {location.country && (
                      <Text style={styles.countryLine}>{location.country}</Text>
                    )}
                  </View>
                </View>
              )}

              {/* Coordinates */}
              <View style={styles.coordsContainer}>
                <View style={styles.coordItem}>
                  <Text style={styles.coordLabel}>अक्षांश / Latitude</Text>
                  <Text style={styles.coordValue}>{location.latitude.toFixed(6)}</Text>
                </View>
                <View style={styles.coordItem}>
                  <Text style={styles.coordLabel}>देशान्तर / Longitude</Text>
                  <Text style={styles.coordValue}>{location.longitude.toFixed(6)}</Text>
                </View>
              </View>

              {/* Refresh Button */}
              <TouchableOpacity style={styles.refreshButton} onPress={getLocation}>
                <Ionicons name="refresh" size={18} color="#10B981" />
                <Text style={styles.refreshText}>स्थान अपडेट गर्नुहोस् / Refresh Location</Text>
              </TouchableOpacity>
            </View>
          ) : permissionStatus === 'denied' ? (
            <View style={styles.permissionDenied}>
              <Ionicons name="lock-closed" size={48} color="#EF4444" />
              <Text style={styles.permissionTitle}>अनुमति आवश्यक छ</Text>
              <Text style={styles.permissionSubtitle}>Permission Required</Text>
              <Text style={styles.permissionDesc}>
                स्थान सुविधा प्रयोग गर्न कृपया सेटिङमा गएर अनुमति दिनुहोस्।
              </Text>
              <TouchableOpacity style={styles.settingsButton} onPress={openSettings}>
                <Ionicons name="settings" size={18} color="#FFFFFF" />
                <Text style={styles.settingsButtonText}>सेटिङ खोल्नुहोस् / Open Settings</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.getLocationContainer}>
              <Ionicons name="location-outline" size={64} color="#4B5563" />
              <Text style={styles.getLocationTitle}>स्थान पत्ता लगाउनुहोस्</Text>
              <Text style={styles.getLocationSubtitle}>Get Your Location</Text>
              <Text style={styles.getLocationDesc}>
                नजिकैका सेवाहरू हेर्न आफ्नो स्थान पत्ता लगाउनुहोस्।
              </Text>
              <TouchableOpacity style={styles.getLocationButton} onPress={requestPermission}>
                <Ionicons name="locate" size={20} color="#FFFFFF" />
                <Text style={styles.getLocationButtonText}>स्थान पत्ता लगाउनुहोस्</Text>
              </TouchableOpacity>
            </View>
          )}

          {errorMsg && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color="#EF4444" />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}
        </View>

        {/* Nearby Services */}
        <View style={styles.servicesSection}>
          <Text style={styles.sectionTitle}>नजिकैका सेवाहरू / Nearby Services</Text>
          <Text style={styles.sectionSubtitle}>
            {location 
              ? 'खोज्न सेवामा क्लिक गर्नुहोस् / Tap to search nearby'
              : 'पहिले स्थान पत्ता लगाउनुहोस् / Get location first'}
          </Text>

          <View style={styles.servicesGrid}>
            {NEARBY_SERVICES.map((service) => (
              <TouchableOpacity
                key={service.id}
                style={[
                  styles.serviceCard,
                  !location && styles.serviceCardDisabled,
                ]}
                onPress={() => openInMaps(service)}
                disabled={!location}
              >
                <View style={[styles.serviceIcon, { backgroundColor: service.color + '20' }]}>
                  <Ionicons name={service.icon as any} size={28} color={service.color} />
                </View>
                <Text style={styles.serviceNameNepali}>{service.nameNepali}</Text>
                <Text style={styles.serviceName}>{service.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Info Note */}
        <View style={styles.infoNote}>
          <Ionicons name="information-circle-outline" size={18} color="#6B7280" />
          <Text style={styles.infoNoteText}>
            सेवामा क्लिक गर्दा Google Maps मा खुल्नेछ।{'\n'}
            Tapping a service will open Google Maps.
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  header: {
    backgroundColor: '#1A1A24',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D3D',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#10B981' + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  locationCard: {
    backgroundColor: '#1A1A24',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  loadingText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 12,
  },
  locationInfo: {},
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D3D',
  },
  addressText: {
    flex: 1,
  },
  addressLine: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cityLine: {
    fontSize: 15,
    color: '#E5E7EB',
    marginTop: 4,
  },
  countryLine: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  coordsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  coordItem: {
    flex: 1,
    backgroundColor: '#0A0A0F',
    borderRadius: 10,
    padding: 12,
  },
  coordLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
  },
  coordValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#10B981' + '40',
  },
  refreshText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },
  getLocationContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  getLocationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
  },
  getLocationSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  getLocationDesc: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 12,
    textAlign: 'center',
  },
  getLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
  },
  getLocationButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  permissionDenied: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#EF4444',
    marginTop: 16,
  },
  permissionSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  permissionDesc: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20,
  },
  settingsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EF4444' + '15',
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#EF4444',
  },
  servicesSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  serviceCard: {
    width: '47%',
    backgroundColor: '#1A1A24',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  serviceCardDisabled: {
    opacity: 0.5,
  },
  serviceIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  serviceNameNepali: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  serviceName: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
    textAlign: 'center',
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#1A1A24',
    borderRadius: 12,
    padding: 14,
  },
  infoNoteText: {
    flex: 1,
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 18,
  },
});
