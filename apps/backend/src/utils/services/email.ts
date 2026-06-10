import nodemailer from 'nodemailer';

import Mailgen from 'mailgen';
import { Resend } from 'resend';

import { envConfig, logger } from '@/config';

import { generateOtpToken } from '../tokens/otpTokens';

const resend = new Resend(envConfig.resend_api_key);

const mailGenerator = new Mailgen({
  theme: 'default',
  product: {
    name: 'Resqconnect',
    link: 'https://resqconnect.com',
    logo: 'https://resqconnect.com/logo.png',
  },
});

type EmailPurpose = 'forgotPassword' | 'welcome' | 'welcomeVerification';

const welcomeEmailContent = (
  name: string,
  otpToken: string
): Mailgen.Content => ({
  body: {
    name: name || 'User',
    intro: 'Welcome to Resqconnect',
    action: {
      instructions:
        'To complete your verification, please use the following OTP code:',
      button: {
        color: '#E13333',
        text: otpToken,
        link: '#',
      },
    },
    outro:
      'This OTP will expire in 10 minutes. If you did not request this, please ignore this email.',
  },
});

const forgotPasswordEmailContent = (
  name: string,
  otpToken: string
): Mailgen.Content => ({
  body: {
    name: name || 'User',
    intro: 'You have requested to reset your password',
    action: {
      instructions:
        'To reset your password, please use the following OTP code:',
      button: {
        color: '#E13333',
        text: otpToken,
        link: '#',
      },
    },
    outro:
      'This OTP will expire in 10 minutes. If you did not request this, please ignore this email.',
  },
});

const transportOptions = {
  service: 'gmail',
  tls: {
    ciphers: 'SSLv3',
  },
  port: 587,
  secure: false,
  auth: {
    user: envConfig.google_mail,
    pass: envConfig.google_pass,
  },
};

const transporter = nodemailer.createTransport(transportOptions);
transporter.verify(error => {
  if (error) {
    logger.error('Mail transporter error:', error.message);
  } else {
    logger.debug('Mail transporter ready');
  }
});

export const sendOTPEmail = async (
  email: string,
  name: string,
  otpToken: string,
  purpose: EmailPurpose = 'welcome'
): Promise<boolean> => {
  try {
    let emailContent: Mailgen.Content;
    switch (purpose) {
      case 'forgotPassword':
        emailContent = forgotPasswordEmailContent(name, otpToken);
        break;
      case 'welcome':
      case 'welcomeVerification':
      default:
        emailContent = welcomeEmailContent(name, otpToken);
    }

    const emailBody = mailGenerator.generate(emailContent);
    const emailText = mailGenerator.generatePlaintext(emailContent);

    const mailData = {
      from: `"Resqconnect" <${envConfig.from_email}>`,
      to: email,
      subject:
        purpose === 'forgotPassword'
          ? 'Reset Your Password'
          : 'Welcome to Resqconnect',
      html: emailBody,
      text: emailText,
    };

    const { error } = await resend.emails.send(mailData);

    if (error) {
      logger.error('Resend error:', error);
      return false;
    }

    // Digital Ocean blocks the port for smtp so we are using resend for now,
    //  but keeping the nodemailer code for future reference when we move to a different hosting provider
    // await new Promise((resolve, reject) => {
    //   transporter.sendMail(mailData, (error, info) => {
    //     if (error) {
    //       logger.error('Error sending email:', error);
    //       reject(error);
    //     }
    //     logger.debug('Email sent:', info.response);
    //     resolve(info);
    //   });
    // });

    logger.debug('Email sent to', email);
    return true;
  } catch (error) {
    logger.error('Error sending email:', error);
    return false;
  }
};

export const sendEmergencyAlertEmail = async (
  email: string,
  contactName: string,
  userName: string,
  emergencyType: string,
  mapsUrl: string
): Promise<boolean> => {
  try {
    const emailContent: Mailgen.Content = {
      body: {
        name: contactName,
        intro: `🚨 ${userName} has requested emergency assistance!`,
        action: {
          instructions: `${userName} needs ${emergencyType.replace('_', ' ')} help. Tap below to view their location:`,
          button: {
            color: '#E13333',
            text: 'View Location on Maps',
            link: mapsUrl,
          },
        },
        outro:
          'Please check on them immediately or contact emergency services.',
      },
    };

    const emailBody = mailGenerator.generate(emailContent);
    const emailText = mailGenerator.generatePlaintext(emailContent);

    const { error } = await resend.emails.send({
      from: `"Resqconnect Emergency" <${envConfig.from_email}>`,
      to: email,
      subject: `🚨 EMERGENCY: ${userName} needs ${emergencyType.replace('_', ' ')} help`,
      html: emailBody,
      text: emailText,
    });

    if (error) {
      logger.error('Resend emergency alert error:', error);
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Error sending emergency alert email:', error);
    return false;
  }
};

export const sendOTP = async (
  email: string,
  name: string,
  purpose: EmailPurpose = 'welcome'
): Promise<string | null> => {
  const otpToken = generateOtpToken(email);

  try {
    if (envConfig.node_env === 'production') {
      const emailSent = await sendOTPEmail(email, name, otpToken, purpose);

      if (!emailSent) {
        throw new Error('Error sending OTP email');
      }

      logger.debug('Sending OTP Successful', otpToken);
    }
    return otpToken;
  } catch (error: unknown) {
    logger.debug('Error Sending OTP', error);
    throw new Error('Error Sending OTP. Please try again later');
  }
};
