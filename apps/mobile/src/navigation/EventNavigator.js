import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import EventTypeScreen from "../modules/events/screens/EventTypeScreen";
import MyEventsScreen from "../modules/events/screens/MyEvents";

//event screens
import WeddingScreen from "../modules/events/screens/events/WeddingEventScreen";
import EngagementScreen from "../modules/events/screens/events/EngagementEventScreen";
import AnniversaryScreen from "../modules/events/screens/events/AnniversaryEventScreen";
import BirthdayScreen from "../modules/events/screens/events/BirthdayEventScreen";


const EventStack = createNativeStackNavigator();

export default function EventNavigator() {
  return (
        <EventStack.Navigator screenOptions={{ headerShown: false }}>

            <EventStack.Screen name="EventTypes" component={EventTypeScreen}/>
            <EventStack.Screen name="MyEvents" component={MyEventsScreen}/>

            <EventStack.Screen name="WeddingEvent" component={WeddingScreen}/>
            <EventStack.Screen name="EngagementEvent" component={EngagementScreen}/>
            <EventStack.Screen name="AnniversaryEvent" component={AnniversaryScreen}/>
            <EventStack.Screen name="BirthdayEvent" component={BirthdayScreen}/>

        </EventStack.Navigator>
  );
}