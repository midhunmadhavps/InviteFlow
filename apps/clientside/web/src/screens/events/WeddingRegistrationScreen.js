import React from "react";
import EventRegistrationForm from "./EventRegistrationForm";

const WeddingRegistrationScreen = (props) => (
  <EventRegistrationForm {...props} eventName="Wedding" />
);

export default WeddingRegistrationScreen;
