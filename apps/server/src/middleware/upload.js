const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const uploadDir = path.join(__dirname, "../../uploads");
const logoExtensions = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    if (file.fieldname === "logo") {
      cb(null, `system_logo_${crypto.randomUUID()}${logoExtensions[file.mimetype]}`);
      return;
    }

    const eventId = req.eventId || req.params?.id || Date.now();

    const extension = path.extname(file.originalname);

    let prefix;

    if (file.fieldname === "hostOneImage") {
      prefix = "host1image";
    } else if (file.fieldname === "invitation") {
      prefix = "invitation";
    } else {
      prefix = "file";
    }

    const filename = `${prefix}_${eventId}${extension}`;

    cb(null, filename);
  },
});

const upload = multer({
  storage,
});

const uploadLogo = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!Object.prototype.hasOwnProperty.call(logoExtensions, file.mimetype)) {
      cb(new Error("Logo must be a JPG, PNG, or WEBP image."));
      return;
    }
    cb(null, true);
  },
});

module.exports = upload;
module.exports.logo = uploadLogo;