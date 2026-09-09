export const validateRequired = (value, fieldName) => {
  if (!value || !value.trim()) {
    return `Please enter your ${fieldName}.`;
  }

  return null;
};

export const validateEmail = (email) => {
  if (!email || !email.trim()) {
    return "Please enter your email address.";
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email.trim())) {
    return "Please enter a valid email address.";
  }

  return null;
};

export const validatePhone = (phone) => {
  if (!phone || !phone.trim()) {
    return "Please enter your phone number.";
  }

  const phoneRegex = /^[6-9]\d{9}$/;

  if (!phoneRegex.test(phone.trim())) {
    return "Please enter a valid 10-digit phone number.";
  }

  return null;
};

export const validateNameOnly = (name, fieldName) => {
  if (!name || !name.trim()) {
    return `Please enter your ${fieldName}.`;
  }

  return null;
};

export const validateName = (name, fieldName) => {
  if (!name || !name.trim()) {
    return `Please enter your ${fieldName}.`;
  }

  const nameRegex = /^[A-Za-z\s]+$/;

  if (!nameRegex.test(name.trim())) {
    return `Please enter a valid ${fieldName}.`;
  }

  return null;
};


export const validatePassword = (password) => {
  if (!password) {
    return "Please enter your password.";
  }

  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }

  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter.";
  }

  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter.";
  }

  if (!/\d/.test(password)) {
    return "Password must contain at least one number.";
  }

  if (!/[@$!%*?&]/.test(password)) {
    return "Password must contain at least one special character.";
  }

  return null;
};

export const validateLocation = (location, fieldName = "location") => {
  if (!location) {
    return `Please select your ${fieldName}.`;
  }

  if (typeof location === "string") {
    if (!location.trim()) {
      return `Please select your ${fieldName}.`;
    }
    return null;
  }

  if (!location.address || !location.address.trim()) {
    return `Please select your ${fieldName}.`;
  }

  return null;
};

export const validateDate = (date, fieldName = "date") => {
  if (!date || !date.trim()) {
    return `Please select your ${fieldName}.`;
  }

  const selectedDate = new Date(date);

  if (isNaN(selectedDate.getTime())) {
    return `Please select a valid ${fieldName}.`;
  }

  return null;
};

export const validateTime = (time, fieldName = "time") => {
  if (!time || !time.trim()) {
    return `Please select your ${fieldName}.`;
  }

  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

  if (!timeRegex.test(time.trim())) {
    return `Please select a valid ${fieldName}.`;
  }

  return null;
};