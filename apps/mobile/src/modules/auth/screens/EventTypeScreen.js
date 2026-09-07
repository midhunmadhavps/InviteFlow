import React from 'react';
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
} from 'react-native';

const { width } = Dimensions.get('window');

const eventTypes = [
  {
    id: 'wedding',
    title: 'Wedding',
    image: require('../../../../assets/images/wedding.png'),
  },
  {
    id: 'anniversary',
    title: 'Anniversary',
    image: require('../../../../assets/images/anniversary.png'),
  },
  {
    id: 'engagement',
    title: 'Engagement',
    image: require('../../../../assets/images/engagement.png'),
  },
  {
    id: 'birthday',
    title: 'Birthday',
    image: require('../../../../assets/images/birthday.png'),
  },
  {
    id: 'aaaa',
    title: 'aaaa',
    image: require('../../../../assets/images/birthday.png'),
  },
  {
    id: 'bbbb',
    title: 'bbbb',
    image: require('../../../../assets/images/birthday.png'),
  },
  {
    id: 'cccc',
    title: 'cccc',
    image: require('../../../../assets/images/birthday.png'),
  },
  {
    id: 'dddd',
    title: 'dddd',
    image: require('../../../../assets/images/birthday.png'),
  },
];

const EventTypeScreen = ({ navigation }) => {
  const handleSelectEvent = (event) => {
    switch (event.id) {
      case 'wedding':
        navigation.navigate('WeddingDetails');
        break;

      case 'anniversary':
        navigation.navigate('AnniversaryDetails');
        break;

      case 'engagement':
        navigation.navigate('EngagementDetails');
        break;

      case 'birthday':
        navigation.navigate('BirthdayDetails');
        break;

      default:
        console.log('Unknown event type:', event.id);
    }
};

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={require('../../../../assets/Vector1.png')}
        style={styles.background}
        // resizeMode="cover"
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
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>

            {/* Header */}
            <Text style={styles.title}>Select Event Type</Text>

            <Text style={styles.subtitle}>
              Choose an event to get started
            </Text>

            {/* Event Grid */}
            <View style={styles.grid}>
              {eventTypes.map((event) => (
                <TouchableOpacity
                  key={event.id}
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
                    {event.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

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
    justifyContent: 'space-between',
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
},

  grid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
},

  icon: {
    width: '100%',
    height: '100%',
  },

  eventTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#263957',
    marginTop: 12,
    textAlign: 'center',
  },
  background: {
    flex: 1,
  },
});