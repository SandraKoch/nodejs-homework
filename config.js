const dotenv = require("dotenv");

dotenv.config();

module.exports = {
  serverPort: process.env.PORT || 3000,
  mongoConnectionString: process.env.MONGO_CONNECTION_STRING,
  secret: process.env.SECRET_KEY,
  emailAddress: process.env.EMAIL_ADDRESS,
  emailPassword: process.env.NODEMAILER_PASSWORD,
  baseUrl: process.env.BASE_URL,
};
