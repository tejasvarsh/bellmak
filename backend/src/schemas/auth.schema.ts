import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Naam kam se kam 2 characters ka hona chahiye').max(100),
  email: z.string().email('Sahi email address daaliye').optional().or(z.literal('')),
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone number 10 digits ka hona chahiye').optional().or(z.literal('')),
  password: z.string().min(6, 'Password kam se kam 6 characters ka hona chahiye').max(100),
  role: z.enum(['CUSTOMER', 'SELLER']).optional().default('CUSTOMER')
}).refine(data => data.email || data.phone, {
  message: "Email ya Phone number mein se ek toh zaroori hai",
  path: ["email"]
});

export const loginSchema = z.object({
  emailOrPhone: z.string().min(1, 'Email ya Phone number zaroori hai'),
  password: z.string().min(1, 'Password zaroori hai')
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Sahi email address daaliye')
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Sahi email address daaliye'),
  otp: z.string().length(6, 'OTP 6 digits ka hona chahiye'),
  newPassword: z.string().min(6, 'Password kam se kam 6 characters ka hona chahiye')
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password zaroori hai'),
  newPassword: z.string().min(6, 'New password kam se kam 6 characters ka hona chahiye')
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().regex(/^[0-9]{10}$/).optional()
}).refine(data => data.name || data.phone, {
  message: "Naam ya phone number mein se ek toh update karna hoga"
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;