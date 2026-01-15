export const getOtpMessage = (otpCode: string) => {
  return `Welcome to firstResQ. Your Login OTP Code is ${otpCode}`;
};

export const phoneRegex = /^[0-9]{10}$/;

export const adminEmails = ['test@admin.com'];
export * from './enums.constants';
