import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ContactsScreen from "../modules/contacts/screens/ContactsScreen";

const ContactsStack = createNativeStackNavigator();

export default function ContactsNavigator() {
  return (
    <ContactsStack.Navigator screenOptions={{ headerShown: false }}>
      <ContactsStack.Screen name="Contacts" component={ContactsScreen} />
    </ContactsStack.Navigator>
  );
}