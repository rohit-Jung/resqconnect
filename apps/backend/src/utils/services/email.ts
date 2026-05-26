import nodemailer from 'nodemailer';
import SMTPPool from 'nodemailer/lib/smtp-pool';

import Mailgen from 'mailgen';

import { envConfig } from '@/config';

import { generateOtpToken } from '../tokens/otpTokens';

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

export const sendOTPEmail = async (
  email: string,
  name: string,
  otpToken: string,
  purpose: EmailPurpose = 'welcome'
): Promise<boolean> => {
  try {
    let emailContent: Mailgen.Content;
    switch (purpose) {
      case 'welcome':
      case 'welcomeVerification':
        emailContent = welcomeEmailContent(name, otpToken);
        break;
      case 'forgotPassword':
        emailContent = forgotPasswordEmailContent(name, otpToken);
        break;
      default:
        emailContent = welcomeEmailContent(name, otpToken);
    }

    const emailBody = mailGenerator.generate(emailContent);
    const emailText = mailGenerator.generatePlaintext(emailContent);

    const transportOptions: SMTPPool.Options = {
      service: 'gmail',
      pool: true,
      auth: {
        user: envConfig.google_mail,
        pass: envConfig.google_pass,
      },
    };

    const transporter = nodemailer.createTransport(transportOptions);

    const info = await transporter.sendMail({
      from: envConfig.google_mail,
      to: email,
      subject:
        purpose === 'forgotPassword'
          ? 'Reset Your Password'
          : 'Welcome to Resqconnect',
      html: emailBody,
      text: emailText,
    });

    console.log('Email sent:', info.messageId, info);
    return true;
  } catch (error) {
    console.log('Error sending email:', error);
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

      console.log('Sending OTP Successful', otpToken);
    }
    return otpToken;
  } catch (error: unknown) {
    console.log('Error Sending OTP', error);
    throw new Error('Error Sending OTP. Please try again later');
  }
};
