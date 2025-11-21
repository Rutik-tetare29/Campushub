const twilio = require('twilio');

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

let twilioClient;
if (accountSid && authToken) {
  twilioClient = twilio(accountSid, authToken);
}

/**
 * Send SMS notification
 * @param {string} to - Phone number to send to (E.164 format)
 * @param {string} message - Message content
 * @returns {Promise<Object>} - Twilio response
 */
const sendSMS = async (to, message) => {
  try {
    if (!twilioClient) {
      console.warn('Twilio not configured. SMS not sent.');
      return { success: false, error: 'Twilio not configured' };
    }

    if (!to || !message) {
      throw new Error('Phone number and message are required');
    }

    // Ensure phone number is in E.164 format
    const formattedPhone = to.startsWith('+') ? to : `+${to}`;

    const result = await twilioClient.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: formattedPhone
    });

    console.log(`SMS sent successfully to ${to}: ${result.sid}`);
    return { success: true, sid: result.sid };
  } catch (error) {
    console.error('Error sending SMS:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send bulk SMS notifications
 * @param {Array<{to: string, message: string}>} messages - Array of messages
 * @returns {Promise<Array>} - Results for each message
 */
const sendBulkSMS = async (messages) => {
  try {
    if (!twilioClient) {
      console.warn('Twilio not configured. Bulk SMS not sent.');
      return messages.map(msg => ({ 
        to: msg.to, 
        success: false, 
        error: 'Twilio not configured' 
      }));
    }

    const sendPromises = messages.map(({ to, message }) => 
      sendSMS(to, message)
        .then(result => ({ to, ...result }))
        .catch(error => ({ to, success: false, error: error.message }))
    );

    const results = await Promise.allSettled(sendPromises);
    
    return results.map(result => 
      result.status === 'fulfilled' ? result.value : { 
        success: false, 
        error: result.reason 
      }
    );
  } catch (error) {
    console.error('Error sending bulk SMS:', error);
    throw error;
  }
};

/**
 * SMS templates for different notification types
 */
const smsTemplates = {
  assignmentDue: (data) => 
    `Campus Connect: Assignment "${data.title}" is due on ${data.dueDate}. Submit before deadline!`,
  
  gradePublished: (data) => 
    `Campus Connect: Your grade for ${data.subject} has been published. Grade: ${data.grade}`,
  
  attendanceAlert: (data) => 
    `Campus Connect: Low attendance alert! Current: ${data.percentage}%. Minimum required: ${data.required}%`,
  
  newNotice: (data) => 
    `Campus Connect: New notice posted - ${data.title}. Check your dashboard for details.`,
  
  accountVerification: (data) => 
    `Campus Connect: Your verification code is ${data.code}. Valid for 10 minutes.`,
  
  scheduleChange: (data) => 
    `Campus Connect: Schedule change - ${data.subject} on ${data.date} has been ${data.change}.`,
  
  examReminder: (data) => 
    `Campus Connect: Exam reminder - ${data.subject} exam on ${data.date} at ${data.time}.`,
  
  feeReminder: (data) => 
    `Campus Connect: Fee payment reminder. Amount: ${data.amount}. Due: ${data.dueDate}.`
};

/**
 * Send templated SMS
 * @param {string} to - Phone number
 * @param {string} templateName - Template name
 * @param {Object} templateData - Data for template
 * @returns {Promise<Object>} - Send result
 */
const sendTemplateSMS = async (to, templateName, templateData) => {
  try {
    const template = smsTemplates[templateName];
    if (!template) {
      throw new Error(`SMS template "${templateName}" not found`);
    }

    const message = template(templateData);
    return await sendSMS(to, message);
  } catch (error) {
    console.error('Error sending templated SMS:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send verification code
 * @param {string} to - Phone number
 * @param {string} code - Verification code
 * @returns {Promise<Object>} - Send result
 */
const sendVerificationCode = async (to, code) => {
  return await sendTemplateSMS(to, 'accountVerification', { code });
};

/**
 * Validate phone number format
 * @param {string} phoneNumber - Phone number to validate
 * @returns {boolean} - Is valid
 */
const isValidPhoneNumber = (phoneNumber) => {
  // Basic E.164 format validation
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phoneNumber);
};

module.exports = {
  sendSMS,
  sendBulkSMS,
  sendTemplateSMS,
  sendVerificationCode,
  isValidPhoneNumber,
  smsTemplates
};
