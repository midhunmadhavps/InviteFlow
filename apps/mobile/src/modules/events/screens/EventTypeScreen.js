import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageBackground,
  SafeAreaView,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';

import { getEventTypes } from '../api/event.api';

const { width } = Dimensions.get('window');

const EventTypeScreen = ({ navigation }) => {
  const [eventTypes, setEventTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEventTypes();
  }, []);

  const fetchEventTypes = async () => {
    try {
      setLoading(true);

      const response = await getEventTypes();

      console.log('Event Types Response:', response);

      if(response.success) {

        const allowedEvents = [
          {
            name: 'Wedding',
            image: require('../../../../assets/images/wedding.png'),
          },
          {
            name: 'Anniversary',
            image: require('../../../../assets/images/anniversary.png'),
          },
          {
            name: 'Engagement',
            image: require('../../../../assets/images/engagement.png'),
          },
          {
            name: 'Birthday',
            image: require('../../../../assets/images/birthday.png'),
          },
        ]

        const filteredEvents = response.data
          .filter((event) =>
            allowedEvents.some((allowed) => allowed.name === event.name)
          )
          .map((event) => {
            const allowed = allowedEvents.find(
              (item) => item.name === event.name
            );

            return {
              ...event,
              image: allowed.image,
            };
          });

        setEventTypes(filteredEvents);

      } else {
        Alert.alert(
          'Error',
          response.message || 'Failed to load event types'
        );
      }
    } catch (error) {
      console.log(
        'Event types error:',
        error.response?.data || error.message
      );

      Alert.alert(
        'Error',
        'Unable to load event types'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEvent = (event) => {
    switch (event.name) {
      case 'Wedding':
        navigation.navigate('WeddingEvent');
        break;

      case 'Anniversary':
        navigation.navigate('AnniversaryEvent');
        break;

      case 'Engagement':
        navigation.navigate('EngagementEvent');
        break;

      case 'Birthday':
        navigation.navigate('BirthdayEvent');
        break;

      default:
        console.log('No screen configured for:', event.name);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={require('../../../../assets/Vector1.png')}
        style={styles.background}
        resizeMode="stretch"
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>

            {/* Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Text style={styles.backArrow}>‹</Text>

              <Text style={styles.backText}>
                Back
              </Text>
            </TouchableOpacity>

            {/* Header */}
            <Text style={styles.title}>
              Select Event Type
            </Text>

            <Text style={styles.subtitle}>
              Choose an event to get started
            </Text>

            {/* Loading */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator
                  size="large"
                  color="#ff7f86"
                />

                <Text style={styles.loadingText}>
                  Loading event types...
                </Text>
              </View>
            ) : eventTypes.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  No event types available
                </Text>
              </View>
            ) : (
              /* Event Grid */
              <View style={styles.grid}>
                {eventTypes.map((event) => (
                  <TouchableOpacity
                    key={event._id}
                    activeOpacity={0.8}
                    style={styles.eventContainer}
                    onPress={() => handleSelectEvent(event)}
                  >
                    <View style={styles.iconCard}>
                      <Image
                        source={event.image}
                        style={styles.icon}
                        resizeMode="contain"
                      />
                    </View>

                    <Text style={styles.eventTitle}>
                      {event.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

          </View>
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
};

export default EventTypeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  background: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },

  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 20,
  },

  backArrow: {
    fontSize: 36,
    lineHeight: 36,
    color: '#263957',
    marginRight: 6,
  },

  backText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#263957',
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#263957',
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 15,
    color: '#7D8799',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 32,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  eventContainer: {
    width: '33.333%',
    alignItems: 'center',
    marginBottom: 25,
  },

  iconCard: {
    width: (width - 56) / 3,
    height: (width - 56) / 3,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  eventTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#263957',
    marginTop: 12,
    textAlign: 'center',
  },

  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#7D8799',
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },

  emptyText: {
    fontSize: 16,
    color: '#7D8799',
  },
});