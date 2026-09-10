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

export const validateLocation = (location, fieldName) => {
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

export const validateDate = (date, fieldName) => {
  if (!date || !date.trim()) {
    return `Please select your ${fieldName}.`;
  }

  const selectedDate = new Date(date);

  if (isNaN(selectedDate.getTime())) {
    return `Please select a valid ${fieldName}.`;
  }

  return null;
};

export const validateTime = (time, fieldName) => {
  if (!time || !time.trim()) {
    return `Please select your ${fieldName}.`;
  }

  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

  if (!timeRegex.test(time.trim())) {
    return `Please select a valid ${fieldName}.`;
  }

  return null;
};

// ================================
// IMAGE VALIDATION
// ================================

export const validateImage = (
  file,
  fieldName = "Image"
) => {
  if (!file) {
    return `Please upload your ${fieldName}.`;
  }

  const mimeType = (
    file.mimeType ||
    file.type ||
    ""
  ).toLowerCase();

  const fileName = (
    file.fileName ||
    file.name ||
    ""
  ).toLowerCase();

  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  const allowedExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
  ];

  const validMimeType =
    allowedTypes.includes(mimeType);

  const validExtension =
    allowedExtensions.some((extension) =>
      fileName.endsWith(extension)
    );

  if (!validMimeType && !validExtension) {
    return `${fieldName} must be JPG, JPEG, PNG, or WEBP.`;
  }

  // Maximum image size: 5 MB
  const maxSize = 5 * 1024 * 1024;

  if (
    typeof file.size === "number" &&
    file.size > maxSize
  ) {
    return `${fieldName} must be 5 MB or smaller.`;
  }

  return null;
};


// ================================
// INVITATION IMAGE OR PDF VALIDATION
// ================================

export const validateImageOrPdf = (
  file,
  fieldName = "Invitation"
) => {
  // if (!file) {
  //   return `Please upload your ${fieldName}.`;
  // }

  const mimeType = (
    file.mimeType ||
    file.type ||
    ""
  ).toLowerCase();

  const fileName = (
    file.fileName ||
    file.name ||
    ""
  ).toLowerCase();

  // Allowed image types
  const imageTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  const imageExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
  ];

  const isImage =
    imageTypes.includes(mimeType) ||
    imageExtensions.some((extension) =>
      fileName.endsWith(extension)
    );

  // Allowed PDF
  const isPdf =
    mimeType === "application/pdf" ||
    fileName.endsWith(".pdf");

  // Invalid file type
  if (!isImage && !isPdf) {
    return `${fieldName} must be an image (JPG, JPEG, PNG, WEBP) or PDF.`;
  }

  // Image maximum: 5 MB
  if (isImage) {
    const maxImageSize =
      5 * 1024 * 1024;

    if (
      typeof file.size === "number" &&
      file.size > maxImageSize
    ) {
      return `${fieldName} image must be 5 MB or smaller.`;
    }
  }

  // PDF maximum: 10 MB
  if (isPdf) {
    const maxPdfSize =
      10 * 1024 * 1024;

    if (
      typeof file.size === "number" &&
      file.size > maxPdfSize
    ) {
      return `${fieldName} PDF must be 10 MB or smaller.`;
    }
  }

  return null;
};