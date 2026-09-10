const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "../../uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const eventId = req.eventId;

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

module.exports = upload;