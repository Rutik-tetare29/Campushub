const nodemailer = require('nodemailer');

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Email templates
const templates = {
  welcome: (name) => ({
    subject: 'Welcome to Campus Connect!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #667eea;">Welcome to Campus Connect, ${name}!</h2>
        <p>Your account has been successfully created.</p>
        <p>You can now access all campus resources, schedules, and communications.</p>
        <a href="${process.env.FRONTEND_URL}/login" style="display: inline-block; padding: 10px 20px; background: #667eea; color: white; text-decoration: none; border-radius: 5px;">Login Now</a>
      </div>
    `
  }),
  
  assignmentDue: (studentName, assignmentTitle, dueDate) => ({
    subject: `Assignment Due: ${assignmentTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f6ad55;">Assignment Reminder</h2>
        <p>Hi ${studentName},</p>
        <p>This is a reminder that your assignment <strong>${assignmentTitle}</strong> is due on <strong>${new Date(dueDate).toLocaleDateString()}</strong>.</p>
        <a href="${process.env.FRONTEND_URL}/assignments" style="display: inline-block; padding: 10px 20px; background: #f6ad55; color: white; text-decoration: none; border-radius: 5px;">View Assignment</a>
      </div>
    `
  }),
  
  gradePublished: (studentName, subjectName, grade) => ({
    subject: `Grade Published: ${subjectName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #48bb78;">Grade Published</h2>
        <p>Hi ${studentName},</p>
        <p>Your grade for <strong>${subjectName}</strong> has been published.</p>
        <p>Grade: <strong style="font-size: 24px; color: #48bb78;">${grade}</strong></p>
        <a href="${process.env.FRONTEND_URL}/grades" style="display: inline-block; padding: 10px 20px; background: #48bb78; color: white; text-decoration: none; border-radius: 5px;">View Details</a>
      </div>
    `
  }),
  
  newNotice: (userName, noticeTitle, noticeContent) => ({
    subject: `New Notice: ${noticeTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #667eea;">New Notice Posted</h2>
        <p>Hi ${userName},</p>
        <h3>${noticeTitle}</h3>
        <p>${noticeContent}</p>
        <a href="${process.env.FRONTEND_URL}/notices" style="display: inline-block; padding: 10px 20px; background: #667eea; color: white; text-decoration: none; border-radius: 5px;">View All Notices</a>
      </div>
    `
  }),
  
  attendanceAlert: (studentName, subject, date, status) => ({
    subject: `Attendance Alert: ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${status === 'absent' ? '#f56565' : '#48bb78'};">Attendance Update</h2>
        <p>Hi ${studentName},</p>
        <p>Your attendance has been marked as <strong>${status.toUpperCase()}</strong> for ${subject} on ${new Date(date).toLocaleDateString()}.</p>
        <a href="${process.env.FRONTEND_URL}/attendance" style="display: inline-block; padding: 10px 20px; background: #667eea; color: white; text-decoration: none; border-radius: 5px;">View Attendance</a>
      </div>
    `
  }),
  
  passwordReset: (name, resetToken) => ({
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #667eea;">Password Reset</h2>
        <p>Hi ${name},</p>
        <p>You requested to reset your password. Click the button below to proceed:</p>
        <a href="${process.env.FRONTEND_URL}/reset-password?token=${resetToken}" style="display: inline-block; padding: 10px 20px; background: #667eea; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>If you didn't request this, please ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
      </div>
    `
  })
};

// Send email function
const sendEmail = async (to, templateName, templateData) => {
  try {
    if (!process.env.EMAIL_USER) {
      console.log('Email service not configured. Skipping email send.');
      return { success: false, message: 'Email service not configured' };
    }

    const template = templates[templateName];
    if (!template) {
      throw new Error(`Template '${templateName}' not found`);
    }

    const { subject, html } = typeof template === 'function' 
      ? template(...(Array.isArray(templateData) ? templateData : [templateData]))
      : template;

    const info = await transporter.sendMail({
      from: `"Campus Connect" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });

    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Bulk email sending
const sendBulkEmails = async (recipients, templateName, templateData) => {
  const results = await Promise.allSettled(
    recipients.map(recipient => sendEmail(recipient, templateName, templateData))
  );
  
  const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
  const failed = results.length - successful;
  
  return { total: results.length, successful, failed };
};

module.exports = {
  sendEmail,
  sendBulkEmails,
  templates
};
