import React from "react";
import EventRegistrationForm from "./EventRegistrationForm";

const BirthdayRegistrationScreen = (props) => (
  <EventRegistrationForm {...props} eventName="Birthday" />
);

export default BirthdayRegistrationScreen;
