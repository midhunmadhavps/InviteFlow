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

      if (response.success) {
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
        ];

        const filteredEvents = response.data
          .filter((event) =>
            allowedEvents.some(
              (allowed) => allowed.name === event.name
            )
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
        navigation.navigate('WeddingEvent', {
          eventTypeId: event._id,
        });
        break;

      case 'Anniversary':
        navigation.navigate('AnniversaryEvent', {
          eventTypeId: event._id,
        });
        break;

      case 'Engagement':
        navigation.navigate('EngagementEvent', {
          eventTypeId: event._id,
        });
        break;

      case 'Birthday':
        navigation.navigate('BirthdayEvent', {
          eventTypeId: event._id,
        });
        break;

      default:
        console.log(
          'No screen configured for:',
          event.name
        );
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

              {/* <Text style={styles.backText}>
                Back
              </Text> */}
            </TouchableOpacity>

            {/* Header */}
            <View style={styles.headerContainer}>
              <Text style={styles.title}>
                Select Event Type
              </Text>

              <Text style={styles.subtitle}>
                Choose an event to get started
              </Text>
            </View>

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
              <View style={styles.grid}>
                {eventTypes.map((event) => (
                  <TouchableOpacity
                    key={event._id}
                    activeOpacity={0.85}
                    style={styles.eventContainer}
                    onPress={() => handleSelectEvent(event)}
                  >

                    {/* Shadow Card */}
                    <View style={styles.iconCard}>

                      {/* Image Holder */}
                      <View style={styles.imageContainer}>
                        <Image
                          source={event.image}
                          style={styles.icon}
                          resizeMode="stretch"
                        />
                      </View>

                    </View>

                    {/* Event Name */}
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
    paddingBottom: 40,
  },

  content: {
    paddingHorizontal: 24,
    paddingTop: 18,
  },

  /* ---------------- BACK ---------------- */

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    height: 40,
    marginBottom: 20,
  },

  backArrow: {
    fontSize: 28,
    fontWeight: '400',
    color: '#263957',
    marginRight: 2,
    includeFontPadding: false,   // Android: strips extra glyph padding that causes drift
    textAlignVertical: 'center', // Android
    lineHeight: 28,              // match fontSize so it centers vertically against sibling text
  },

  backText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#263957',
    lineHeight: 28,               // same lineHeight as arrow keeps both perfectly on one baseline
  },

  /* ---------------- HEADER ---------------- */

  headerContainer: {
    alignItems: 'center',
    marginBottom: 38,
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
  },

  /* ---------------- GRID ---------------- */

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },

  eventContainer: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 30,
  },

  /* ---------------- OUTER CARD ---------------- */

  iconCard: {
    width: 82,
    height: 82,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',

    // iOS shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 16,

    // Android shadow
    elevation: 8,
  },

  /* ---------------- IMAGE ---------------- */

  imageContainer: {
    width: 82,
  height: 82,
  borderRadius: 20,
  overflow: 'hidden',
  backgroundColor: '#FFFFFF',
  },  

  icon: {
    width: '100%',
    height: '100%',
    // borderRadius: 12
  },

  /* ---------------- EVENT NAME ---------------- */

  eventTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#263957',
    marginTop: 10,
    textAlign: 'center',
  },

  /* ---------------- LOADING ---------------- */

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

  /* ---------------- EMPTY ---------------- */

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