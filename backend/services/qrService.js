const QRCode = require('qrcode');
const crypto = require('crypto');

/**
 * Generate unique QR code data
 * @param {Object} data - Data to encode
 * @returns {string} - Unique token
 */
const generateQRData = (data) => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(16).toString('hex');
  const payload = JSON.stringify({ ...data, timestamp, randomString });
  return Buffer.from(payload).toString('base64');
};

/**
 * Parse QR code data
 * @param {string} qrData - Base64 encoded data
 * @returns {Object} - Parsed data
 */
const parseQRData = (qrData) => {
  try {
    const payload = Buffer.from(qrData, 'base64').toString('utf-8');
    return JSON.parse(payload);
  } catch (error) {
    console.error('Error parsing QR data:', error);
    return null;
  }
};

/**
 * Generate QR code image as base64
 * @param {Object} data - Data to encode
 * @param {Object} options - QR code options
 * @returns {Promise<string>} - Base64 QR code image
 */
const generateQRCode = async (data, options = {}) => {
  try {
    const qrData = generateQRData(data);
    
    const qrOptions = {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      width: options.width || 300,
      color: {
        dark: options.darkColor || '#000000',
        light: options.lightColor || '#FFFFFF'
      }
    };

    const qrCodeImage = await QRCode.toDataURL(qrData, qrOptions);
    
    return {
      qrCode: qrCodeImage,
      qrData: qrData,
      expiresAt: new Date(Date.now() + (options.expiryMinutes || 5) * 60000)
    };
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

/**
 * Generate attendance session QR code
 * @param {Object} sessionData - Session data
 * @returns {Promise<Object>} - QR code data
 */
const generateAttendanceQR = async (sessionData) => {
  const { scheduleId, subjectId, teacherId, location } = sessionData;
  
  return await generateQRCode({
    type: 'attendance',
    scheduleId,
    subjectId,
    teacherId,
    location
  }, {
    expiryMinutes: 10, // Attendance QR valid for 10 minutes
    width: 400
  });
};

/**
 * Verify QR code is valid and not expired
 * @param {string} qrData - QR data to verify
 * @param {Date} expiresAt - Expiry date
 * @returns {Object} - Verification result
 */
const verifyQRCode = (qrData, expiresAt) => {
  try {
    const parsedData = parseQRData(qrData);
    
    if (!parsedData) {
      return { valid: false, reason: 'Invalid QR code data' };
    }

    const now = new Date();
    if (now > new Date(expiresAt)) {
      return { valid: false, reason: 'QR code has expired' };
    }

    return { valid: true, data: parsedData };
  } catch (error) {
    console.error('Error verifying QR code:', error);
    return { valid: false, reason: 'Verification failed' };
  }
};

/**
 * Generate event check-in QR code
 * @param {Object} eventData - Event data
 * @returns {Promise<Object>} - QR code data
 */
const generateEventQR = async (eventData) => {
  const { eventId, eventName, eventDate } = eventData;
  
  return await generateQRCode({
    type: 'event',
    eventId,
    eventName,
    eventDate
  }, {
    expiryMinutes: 60, // Event QR valid for 1 hour
    width: 350
  });
};

/**
 * Generate document/assignment QR code
 * @param {Object} documentData - Document data
 * @returns {Promise<Object>} - QR code data
 */
const generateDocumentQR = async (documentData) => {
  const { documentId, title, uploadedBy } = documentData;
  
  return await generateQRCode({
    type: 'document',
    documentId,
    title,
    uploadedBy
  }, {
    expiryMinutes: 0, // No expiry for document QR
    width: 250
  });
};

/**
 * Generate access QR code (for room/facility access)
 * @param {Object} accessData - Access data
 * @returns {Promise<Object>} - QR code data
 */
const generateAccessQR = async (accessData) => {
  const { userId, roomId, accessLevel, validUntil } = accessData;
  
  const expiryMinutes = validUntil 
    ? Math.floor((new Date(validUntil) - Date.now()) / 60000)
    : 30;
  
  return await generateQRCode({
    type: 'access',
    userId,
    roomId,
    accessLevel
  }, {
    expiryMinutes,
    width: 300
  });
};

/**
 * Generate batch QR codes
 * @param {Array<Object>} dataArray - Array of data objects
 * @param {string} type - QR type
 * @returns {Promise<Array>} - Array of QR codes
 */
const generateBatchQRCodes = async (dataArray, type = 'general') => {
  try {
    const qrPromises = dataArray.map(data =>
      generateQRCode({ ...data, type })
        .catch(error => {
          console.error(`Failed to generate QR for ${data}:`, error);
          return null;
        })
    );

    const results = await Promise.all(qrPromises);
    return results.filter(r => r !== null);
  } catch (error) {
    console.error('Error generating batch QR codes:', error);
    throw error;
  }
};

/**
 * Validate attendance QR code with geolocation
 * @param {string} qrData - QR data
 * @param {Date} expiresAt - Expiry date
 * @param {Object} userLocation - User's location {latitude, longitude}
 * @param {Object} sessionLocation - Session location {latitude, longitude, radius}
 * @returns {Object} - Validation result
 */
const validateAttendanceQR = (qrData, expiresAt, userLocation, sessionLocation) => {
  // First verify QR code validity
  const verification = verifyQRCode(qrData, expiresAt);
  if (!verification.valid) {
    return verification;
  }

  // Check if geolocation validation is required
  if (sessionLocation && sessionLocation.latitude && sessionLocation.longitude) {
    if (!userLocation || !userLocation.latitude || !userLocation.longitude) {
      return { valid: false, reason: 'Location permission required' };
    }

    // Calculate distance using Haversine formula
    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      sessionLocation.latitude,
      sessionLocation.longitude
    );

    const maxDistance = sessionLocation.radius || 100; // Default 100 meters
    if (distance > maxDistance) {
      return {
        valid: false,
        reason: `You must be within ${maxDistance}m of the location. Current distance: ${Math.round(distance)}m`
      };
    }
  }

  return { valid: true, data: verification.data };
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @param {number} lat1 - Latitude 1
 * @param {number} lon1 - Longitude 1
 * @param {number} lat2 - Latitude 2
 * @param {number} lon2 - Longitude 2
 * @returns {number} - Distance in meters
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

/**
 * Generate QR code as SVG
 * @param {Object} data - Data to encode
 * @returns {Promise<string>} - SVG string
 */
const generateQRCodeSVG = async (data) => {
  try {
    const qrData = generateQRData(data);
    const svg = await QRCode.toString(qrData, { type: 'svg' });
    return svg;
  } catch (error) {
    console.error('Error generating QR SVG:', error);
    throw error;
  }
};

module.exports = {
  generateQRCode,
  generateQRData,
  parseQRData,
  verifyQRCode,
  generateAttendanceQR,
  generateEventQR,
  generateDocumentQR,
  generateAccessQR,
  generateBatchQRCodes,
  validateAttendanceQR,
  calculateDistance,
  generateQRCodeSVG
};
