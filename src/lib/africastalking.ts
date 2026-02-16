import AfricasTalking from 'africastalking';

const credentials = {
  apiKey: process.env.AFRICASTALKING_API_KEY || '',
  username: process.env.AFRICASTALKING_USERNAME || 'sandbox',
};

const africastalking = AfricasTalking(credentials);

// Export individual services
export const sms = africastalking.SMS;
export const ussd = africastalking.USSD;
export const voice = africastalking.VOICE;
export const airtime = africastalking.AIRTIME;

export default africastalking;
