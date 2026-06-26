import { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../config/database'
import { AppError } from '../middleware/errorHandler'
import { AuthRequest } from '../middleware/auth'
import { sendResponse } from '../utils/helpers'
import { sendOTPEmail } from '../utils/mailer'
import { 
  registerSchema, 
  loginSchema 
} from '../schemas/auth.schema'

// ── OTP Store ─────────────────────────────────────
const otpStore = new Map<string, { otp: string; expiresAt: number; attempts: number }>()

const makeOTP = () => Math.floor(100000 + Math.random() * 900000).toString()

const storeOTP = (key: string, otp: string) => {
  otpStore.set(key, { otp, expiresAt: Date.now() + 10 * 60 * 1000, attempts: 0 })
}

const checkOTP = (key: string, input: string): { valid: boolean; error?: string } => {
  const s = otpStore.get(key)
  if (!s) return { valid: false, error: 'OTP expired ya invalid. Dobara request karo.' }
  
  if (Date.now() > s.expiresAt) {
    otpStore.delete(key)
    return { valid: false, error: 'OTP expire ho gaya. Dobara request karo.' }
  }
  
  if (s.attempts >= 5) {
    otpStore.delete(key)
    return { valid: false, error: 'Too many attempts. Naya OTP request karo.' }
  }

  s.attempts++
  if (s.otp !== input) 
    return { valid: false, error: `OTP galat hai. ${5 - s.attempts} attempts bache hain.` }

  otpStore.delete(key)
  return { valid: true }
}

// ── Token Helpers ─────────────────────────────────
const makeTokens = (id: string, role: string, email?: string) => ({
  accessToken: jwt.sign({ id, role, email }, process.env.JWT_SECRET!, { expiresIn: '7d' }),
  refreshToken: jwt.sign({ id }, process.env.JWT_REFRESH_SECRET!, { expiresIn: '30d' })
})

const saveRT = async (userId: string, token: string) => {
  await prisma.refreshToken.create({
    data: { userId, token, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
  })
}

const setCookie = (res: Response, token: string) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000
  })
}

// ── Register with Validation ──────────────────────
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = registerSchema.parse(req.body);

    const existing = await prisma.user.findFirst({
      where: { 
        OR: [
          validated.email ? { email: validated.email } : {}, 
          validated.phone ? { phone: validated.phone } : {} 
        ] 
      }
    });

    if (existing) throw new AppError('Yeh email ya phone number pehle se registered hai', 409);

    const hashed = await bcrypt.hash(validated.password, 12);

    const user = await prisma.user.create({
      data: {
        name: validated.name,
        email: validated.email || null,
        phone: validated.phone || null,
        password: hashed,
        role: validated.role
      },
      select: {
        id: true, name: true, email: true, phone: true, role: true, 
        bellmakCoins: true, createdAt: true
      }
    });

    if (validated.role === 'SELLER') {
      await prisma.seller.create({
        data: {
          userId: user.id,
          businessName: validated.name + "'s Store",
          kycStatus: 'APPROVED',
          isApproved: true
        }
      });
    }

    const { accessToken, refreshToken } = makeTokens(user.id, user.role);
    await saveRT(user.id, refreshToken);
    setCookie(res, refreshToken);

    sendResponse(res, 201, true, 'Registration successful', { user, accessToken });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return next(new AppError(err.errors[0].message, 400));
    }
    next(err);
  }
};

// ── Login with Validation ─────────────────────────
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = loginSchema.parse(req.body);

    const normalizedInput = validated.emailOrPhone.toLowerCase().trim();

    const user = await prisma.user.findFirst({
      where: { 
        OR: [
          { email: normalizedInput }, 
          { phone: validated.emailOrPhone } 
        ] 
      }
    });

    if (!user || !user.password) 
      throw new AppError('Email/Phone ya password galat hai', 401);

    if (!user.isActive) 
      throw new AppError('Aapka account temporarily band hai. Support se contact karein.', 403);

    const ok = await bcrypt.compare(validated.password, user.password);
    if (!ok) 
      throw new AppError('Email/Phone ya password galat hai', 401);

    const { accessToken, refreshToken } = makeTokens(user.id, user.role, user.email || undefined);
    
    await saveRT(user.id, refreshToken);
    setCookie(res, refreshToken);

    sendResponse(res, 200, true, 'Login successful', {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        bellmakCoins: user.bellmakCoins
      },
      accessToken
    });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return next(new AppError(err.errors[0].message, 400));
    }
    next(err);
  }
};

// ── Baaki Functions (No Change) ─────────────────────
export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) await prisma.refreshToken.deleteMany({ where: { token } });
    res.clearCookie('refreshToken');
    sendResponse(res, 200, true, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true, name: true, email: true, phone: true, role: true,
        avatar: true, bellmakCoins: true, isVerified: true, createdAt: true,
        _count: { select: { orders: true, wishlist: true } }
      }
    });
    if (!user) throw new AppError('User not found', 404);
    sendResponse(res, 200, true, 'User fetched', user);
  } catch (err) {
    next(err);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) throw new AppError('No refresh token', 401);

    const stored = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!stored || stored.expiresAt < new Date()) 
      throw new AppError('Invalid or expired refresh token', 401);

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as any;

    const { accessToken, refreshToken: newRT } = makeTokens(decoded.id, stored.user.role);

    await prisma.refreshToken.delete({ where: { token } });
    await saveRT(decoded.id, newRT);
    setCookie(res, newRT);

    sendResponse(res, 200, true, 'Token refreshed', { accessToken });
  } catch (err) {
    next(err);
  }
};

export const sendOTP = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone } = req.body;
    if (!phone) throw new AppError('Phone number required', 400);

    const otp = makeOTP();
    storeOTP(`phone:${phone}`, otp);
    console.log(`📱 SMS OTP for ${phone}: ${otp}`);

    await prisma.user.upsert({
      where: { phone },
      update: {},
      create: { phone, name: 'User', role: 'CUSTOMER' }
    });

    sendResponse(res, 200, true, 'OTP sent to your phone');
  } catch (err) {
    next(err);
  }
};

export const verifyOTP = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) throw new AppError('Phone and OTP required', 400);

    const result = checkOTP(`phone:${phone}`, otp);
    if (!result.valid) throw new AppError(result.error!, 400);

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) throw new AppError('User not found', 404);

    const { accessToken, refreshToken } = makeTokens(user.id, user.role);
    await saveRT(user.id, refreshToken);
    setCookie(res, refreshToken);

    sendResponse(res, 200, true, 'Login successful', {
      user: { id: user.id, name: user.name, phone: user.phone, role: user.role },
      accessToken
    });
  } catch (err) {
    next(err);
  }
};

// ForgotPassword, ResetPassword, SwitchRole, UpdateProfile, ChangePassword, GetCoinsHistory 
// abhi ke liye same rakh rahe hain. Agar chahein toh baad mein unme bhi validation add kar sakte hain.

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email) throw new AppError('Email required', 400);

    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      sendResponse(res, 200, true, 'Agar ye email registered hai toh OTP bheja gaya hai.');
      return;
    }

    const otp = makeOTP();
    storeOTP(`reset:${normalizedEmail}`, otp);

    try {
      await sendOTPEmail(normalizedEmail, otp, user.name);
    } catch (emailErr: any) {
      console.error(`Email failed:`, emailErr.message);
      console.log(`DEBUG OTP for ${normalizedEmail}: ${otp}`);
      throw new AppError('Email bhejne mein problem. Dobara try karo.', 500);
    }

    sendResponse(res, 200, true, 'OTP aapke email par bheja gaya hai!');
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) throw new AppError('Email, OTP aur new password required', 400);
    if (newPassword.length < 6) throw new AppError('Password minimum 6 characters', 400);

    const normalizedEmail = email.toLowerCase().trim();
    const result = checkOTP(`reset:${normalizedEmail}`, otp);
    if (!result.valid) throw new AppError(result.error!, 400);

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) throw new AppError('User not found', 404);

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { email: normalizedEmail },
      data: { password: hashed }
    });

    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
    sendResponse(res, 200, true, 'Password reset successful! Ab login karo.');
  } catch (err) {
    next(err);
  }
};

export const switchRole = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { role } = req.body;
    const userId = req.user!.id;
    if (!['CUSTOMER', 'SELLER'].includes(role)) throw new AppError('Invalid role!', 400);

    if (role === 'SELLER') {
      const existing = await prisma.seller.findUnique({ where: { userId } });
      if (!existing) {
        const u = await prisma.user.findUnique({ where: { id: userId } });
        await prisma.seller.create({
          data: { userId, businessName: u!.name + "'s Store", kycStatus: 'APPROVED', isApproved: true }
        });
      }
    }

    const user = await prisma.user.update({ where: { id: userId }, data: { role } });

    const { accessToken, refreshToken } = makeTokens(user.id, user.role, user.email || undefined);
    await saveRT(user.id, refreshToken);
    setCookie(res, refreshToken);

    sendResponse(res, 200, true, 'Role switched', {
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, bellmakCoins: user.bellmakCoins },
      accessToken
    });
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, phone } = req.body;
    const userId = req.user!.id;
    if (!name && !phone) throw new AppError('Name ya phone required', 400);

    if (phone) {
      const existing = await prisma.user.findFirst({ where: { phone, NOT: { id: userId } } });
      if (existing) throw new AppError('Phone already use ho raha hai', 409);
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { ...(name && { name }), ...(phone && { phone }) },
      select: { id: true, name: true, email: true, phone: true, role: true, avatar: true, bellmakCoins: true }
    });

    sendResponse(res, 200, true, 'Profile updated', user);
  } catch (err) {
    next(err);
  }
};

export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user!.id;

    if (!currentPassword || !newPassword) throw new AppError('Current aur new password required', 400);
    if (newPassword.length < 6) throw new AppError('Password minimum 6 characters', 400);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.password) throw new AppError('User not found', 404);

    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) throw new AppError('Current password galat hai', 401);

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
    await prisma.refreshToken.deleteMany({ where: { userId } });
    res.clearCookie('refreshToken');

    sendResponse(res, 200, true, 'Password changed. Please login again.');
  } catch (err) {
    next(err);
  }
};

export const getCoinsHistory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { bellmakCoins: true, name: true }
    });
    if (!user) throw new AppError('User not found', 404);

    const orders = await prisma.order.findMany({
      where: { userId },
      select: { orderId: true, coinsUsed: true, totalAmount: true, status: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    const transactions: any[] = [];
    orders.forEach(o => {
      if (o.coinsUsed > 0) {
        transactions.push({
          id: `spent-${o.orderId}`,
          type: 'SPENT',
          amount: o.coinsUsed,
          description: `Coins used on #${o.orderId}`,
          orderId: o.orderId,
          createdAt: o.createdAt
        });
      }
      if (o.status === 'DELIVERED') {
        const earned = Math.floor(o.totalAmount * 0.01);
        if (earned > 0) {
          transactions.push({
            id: `earned-${o.orderId}`,
            type: 'EARNED',
            amount: earned,
            description: `Coins earned on #${o.orderId}`,
            orderId: o.orderId,
            createdAt: o.createdAt
          });
        }
      }
    });

    transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    sendResponse(res, 200, true, 'Coins history fetched', {
      currentBalance: user.bellmakCoins,
      coinValue: user.bellmakCoins * 0.25,
      transactions
    });
  } catch (err) {
    next(err);
  }
};