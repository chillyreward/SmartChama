import twilio from 'twilio';

// Twilio configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Initialize Twilio client
const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export interface SMSOptions {
  to: string;
  message: string;
}

/**
 * Send SMS using Twilio
 */
export async function sendSMS({ to, message }: SMSOptions) {
  if (!client || !twilioPhoneNumber) {
    console.error('Twilio is not configured. Please set environment variables.');
    throw new Error('SMS service not configured');
  }

  try {
    const result = await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: to
    });

    console.log('SMS sent successfully:', result.sid);
    return { success: true, sid: result.sid };
  } catch (error: any) {
    console.error('Failed to send SMS:', error);
    throw new Error(`SMS failed: ${error.message}`);
  }
}

/**
 * Send OTP verification code
 */
export async function sendOTP(phoneNumber: string, code: string) {
  const message = `Your SmartChama verification code is: ${code}. Valid for 10 minutes.`;
  return sendSMS({ to: phoneNumber, message });
}

/**
 * Send contribution reminder
 */
export async function sendContributionReminder(phoneNumber: string, amount: number, dueDate: string) {
  const message = `Reminder: Your contribution of KES ${amount.toLocaleString()} is due on ${dueDate}. Pay via M-Pesa to avoid penalties.`;
  return sendSMS({ to: phoneNumber, message });
}

/**
 * Send loan approval notification
 */
export async function sendLoanApproval(phoneNumber: string, amount: number, chamaName: string) {
  const message = `Good news! Your loan of KES ${amount.toLocaleString()} from ${chamaName} has been approved. Funds will be disbursed shortly.`;
  return sendSMS({ to: phoneNumber, message });
}

/**
 * Send transaction notification
 */
export async function sendTransactionNotification(
  phoneNumber: string, 
  type: 'contribution' | 'loan' | 'withdrawal',
  amount: number,
  balance: number
) {
  const typeText = type === 'contribution' ? 'Contribution received' : 
                   type === 'loan' ? 'Loan disbursed' : 'Withdrawal processed';
  
  const message = `${typeText}: KES ${amount.toLocaleString()}. New balance: KES ${balance.toLocaleString()}. Thank you!`;
  return sendSMS({ to: phoneNumber, message });
}

/**
 * Send meeting reminder
 */
export async function sendMeetingReminder(phoneNumber: string, date: string, time: string, venue: string) {
  const message = `Reminder: Chama meeting on ${date} at ${time}. Venue: ${venue}. Please confirm attendance.`;
  return sendSMS({ to: phoneNumber, message });
}

/**
 * Send welcome message to new member
 */
export async function sendWelcomeMessage(phoneNumber: string, memberName: string, chamaName: string) {
  const message = `Welcome to ${chamaName}, ${memberName}! We're excited to have you. Check your dashboard for next steps.`;
  return sendSMS({ to: phoneNumber, message });
}
