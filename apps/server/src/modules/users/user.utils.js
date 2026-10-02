const User = require("../../models/user.model");

const createUsername = async (firstName, lastName, excludeUserId) => {
  const namePart = (value) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
  const baseUsername = `${namePart(firstName)}_${namePart(lastName)}`.replace(/^_+|_+$/g, "");
  const base = baseUsername.length >= 4 ? baseUsername : `${baseUsername}_user`;
  const exclusion = excludeUserId ? { _id: { $ne: excludeUserId } } : {};

  let username = base.slice(0, 30);
  let suffix = 2;

  while (await User.exists({ username, ...exclusion })) {
    const suffixText = `_${suffix}`;
    username = `${base.slice(0, 30 - suffixText.length)}${suffixText}`;
    suffix += 1;
  }

  return username;
};

module.exports = { createUsername };
