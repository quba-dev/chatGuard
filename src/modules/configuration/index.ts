import { registerAs } from '@nestjs/config';

export const configValues = {
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE_NAME,
    weather: process.env.WEATHER_APPID,
  },
  app: {
    url: process.env.APP_URL,
    port: parseInt(process.env.APP_PORT, 10),
  },
  jwt: {
    jwtSecret: process.env.JWT_SECRET_KEY,
  },
  mailgun: {
    apiKey: process.env.MAILGUN_API_KEY,
    domain: process.env.MAILGUN_DOMAIN,
    otpSenderAddress: process.env.OTP_SENDER_ADDRESS,
    notificationsSenderAddress: process.env.NOTIFICATIONS_SENDER_ADDRESS,
    apiHost: process.env.MAILGUN_API_HOST || 'api.eu.mailgun.net',
  },
};

export default registerAs('config', () => {
  return configValues;
});
