"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCoinsHistory = exports.changePassword = exports.updateProfile = exports.switchRole = exports.resetPassword = exports.forgotPassword = exports.verifyOTP = exports.sendOTP = exports.refreshToken = exports.getMe = exports.logout = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const helpers_1 = require("../utils/helpers");
const mailer_1 = require("../utils/mailer");
// ─── OTP Store ────────────────────────────────────────────────
const otpStore = new Map();
const makeOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
const storeOTP = (key, otp) => {
    otpStore.set(key, { otp, expiresAt: Date.now() + 10 * 60 * 1000, attempts: 0 });
};
const checkOTP = (key, input) => {
    const s = otpStore.get(key);
    if (!s)
        return { valid: false, error: 'OTP expired ya invalid. Dobara request karo.' };
    if (Date.now() > s.expiresAt) {
        otpStore.delete(key);
        return { valid: false, error: 'OTP expire ho gaya. Dobara request karo.' };
    }
    if (s.attempts >= 5) {
        otpStore.delete(key);
        return { valid: false, error: 'Too many attempts. Naya OTP request karo.' };
    }
    s.attempts++;
    if (s.otp !== input)
        return { valid: false, error: `OTP galat hai. ${5 - s.attempts} attempts bache hain.` };
    otpStore.delete(key);
    return { valid: true };
};
// ─── Token Helpers ────────────────────────────────────────────
const makeTokens = (id, role, email) => ({
    accessToken: jsonwebtoken_1.default.sign({ id, role, email }, process.env.JWT_SECRET, { expiresIn: '7d' }),
    refreshToken: jsonwebtoken_1.default.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' })
});
const saveRT = async (userId, token) => {
    await database_1.prisma.refreshToken.create({
        data: { userId, token, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
    });
};
const setCookie = (res, token) => {
    res.cookie('refreshToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000
    });
};
// ─── Register ─────────────────────────────────────────────────
const register = async (req, res, next) => {
    try {
        const { name, email, phone, password, role } = req.body;
        if (!name || !password || (!email && !phone))
            throw new errorHandler_1.AppError('Name, password and email or phone required', 400);
        const existing = await database_1.prisma.user.findFirst({
            where: { OR: [email ? { email } : {}, phone ? { phone } : {}] }
        });
        if (existing)
            throw new errorHandler_1.AppError('User already exists', 409);
        const hashed = await bcryptjs_1.default.hash(password, 12);
        const user = await database_1.prisma.user.create({
            data: {
                name, email: email || null, phone: phone || null,
                password: hashed, role: role === 'SELLER' ? 'SELLER' : 'CUSTOMER'
            },
            select: { id: true, name: true, email: true, phone: true, role: true, bellmakCoins: true, createdAt: true }
        });
        if (role === 'SELLER') {
            await database_1.prisma.seller.create({
                data: { userId: user.id, businessName: name + "'s Store", kycStatus: 'APPROVED', isApproved: true }
            });
        }
        const { accessToken, refreshToken } = makeTokens(user.id, user.role);
        await saveRT(user.id, refreshToken);
        setCookie(res, refreshToken);
        (0, helpers_1.sendResponse)(res, 201, true, 'Registration successful', { user, accessToken });
    }
    catch (err) {
        next(err);
    }
};
exports.register = register;
// ─── Login ────────────────────────────────────────────────────
const login = async (req, res, next) => {
    try {
        const { emailOrPhone, password } = req.body;
        if (!emailOrPhone || !password)
            throw new errorHandler_1.AppError('Email/Phone and password required', 400);
        const user = await database_1.prisma.user.findFirst({
            where: { OR: [{ email: emailOrPhone }, { phone: emailOrPhone }] }
        });
        if (!user || !user.password)
            throw new errorHandler_1.AppError('Invalid credentials', 401);
        if (!user.isActive)
            throw new errorHandler_1.AppError('Account banned. Contact support.', 403);
        const ok = await bcryptjs_1.default.compare(password, user.password);
        if (!ok)
            throw new errorHandler_1.AppError('Invalid credentials', 401);
        const { accessToken, refreshToken } = makeTokens(user.id, user.role, user.email || undefined);
        await saveRT(user.id, refreshToken);
        setCookie(res, refreshToken);
        (0, helpers_1.sendResponse)(res, 200, true, 'Login successful', {
            user: {
                id: user.id, name: user.name, email: user.email,
                phone: user.phone, role: user.role, avatar: user.avatar,
                bellmakCoins: user.bellmakCoins
            },
            accessToken
        });
    }
    catch (err) {
        next(err);
    }
};
exports.login = login;
// ─── Logout ───────────────────────────────────────────────────
const logout = async (req, res, next) => {
    try {
        const token = req.cookies.refreshToken;
        if (token)
            await database_1.prisma.refreshToken.deleteMany({ where: { token } });
        res.clearCookie('refreshToken');
        (0, helpers_1.sendResponse)(res, 200, true, 'Logged out successfully');
    }
    catch (err) {
        next(err);
    }
};
exports.logout = logout;
// ─── Get Me ───────────────────────────────────────────────────
const getMe = async (req, res, next) => {
    try {
        const user = await database_1.prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true, name: true, email: true, phone: true,
                role: true, avatar: true, bellmakCoins: true,
                isVerified: true, createdAt: true,
                _count: { select: { orders: true, wishlist: true } }
            }
        });
        if (!user)
            throw new errorHandler_1.AppError('User not found', 404);
        (0, helpers_1.sendResponse)(res, 200, true, 'User fetched', user);
    }
    catch (err) {
        next(err);
    }
};
exports.getMe = getMe;
// ─── Refresh Token ────────────────────────────────────────────
const refreshToken = async (req, res, next) => {
    try {
        const token = req.cookies.refreshToken;
        if (!token)
            throw new errorHandler_1.AppError('No refresh token', 401);
        const stored = await database_1.prisma.refreshToken.findUnique({ where: { token }, include: { user: true } });
        if (!stored || stored.expiresAt < new Date())
            throw new errorHandler_1.AppError('Invalid or expired refresh token', 401);
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_REFRESH_SECRET);
        const { accessToken, refreshToken: newRT } = makeTokens(decoded.id, stored.user.role);
        await database_1.prisma.refreshToken.delete({ where: { token } });
        await saveRT(decoded.id, newRT);
        setCookie(res, newRT);
        (0, helpers_1.sendResponse)(res, 200, true, 'Token refreshed', { accessToken });
    }
    catch (err) {
        next(err);
    }
};
exports.refreshToken = refreshToken;
// ─── Send OTP (Phone) ─────────────────────────────────────────
const sendOTP = async (req, res, next) => {
    try {
        const { phone } = req.body;
        if (!phone)
            throw new errorHandler_1.AppError('Phone number required', 400);
        const otp = makeOTP();
        storeOTP(`phone:${phone}`, otp);
        console.log(`📱 SMS OTP for ${phone}: ${otp}`); // TODO: Twilio/MSG91
        await database_1.prisma.user.upsert({
            where: { phone },
            update: {},
            create: { phone, name: 'User', role: 'CUSTOMER' }
        });
        (0, helpers_1.sendResponse)(res, 200, true, 'OTP sent to your phone');
    }
    catch (err) {
        next(err);
    }
};
exports.sendOTP = sendOTP;
// ─── Verify OTP (Phone Login) ─────────────────────────────────
const verifyOTP = async (req, res, next) => {
    try {
        const { phone, otp } = req.body;
        if (!phone || !otp)
            throw new errorHandler_1.AppError('Phone and OTP required', 400);
        const result = checkOTP(`phone:${phone}`, otp);
        if (!result.valid)
            throw new errorHandler_1.AppError(result.error, 400);
        const user = await database_1.prisma.user.findUnique({ where: { phone } });
        if (!user)
            throw new errorHandler_1.AppError('User not found', 404);
        const { accessToken, refreshToken } = makeTokens(user.id, user.role);
        await saveRT(user.id, refreshToken);
        setCookie(res, refreshToken);
        (0, helpers_1.sendResponse)(res, 200, true, 'Login successful', {
            user: { id: user.id, name: user.name, phone: user.phone, role: user.role },
            accessToken
        });
    }
    catch (err) {
        next(err);
    }
};
exports.verifyOTP = verifyOTP;
// ─── Forgot Password ──────────────────────────────────────────
const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email)
            throw new errorHandler_1.AppError('Email required', 400);
        const normalizedEmail = email.toLowerCase().trim();
        const user = await database_1.prisma.user.findUnique({ where: { email: normalizedEmail } });
        // Security: same message chahe email ho ya na ho
        if (!user) {
            (0, helpers_1.sendResponse)(res, 200, true, 'Agar ye email registered hai toh OTP bheja gaya hai.');
            return;
        }
        const otp = makeOTP();
        storeOTP(`reset:${normalizedEmail}`, otp);
        // ✅ REAL EMAIL BHEJO
        try {
            await (0, mailer_1.sendOTPEmail)(normalizedEmail, otp, user.name);
            console.log(`✅ OTP email sent to ${normalizedEmail}`);
        }
        catch (emailErr) {
            console.error(`❌ Email failed:`, emailErr.message);
            // OTP store raho even if email fails — debug ke liye
            console.log(`🔑 DEBUG OTP for ${normalizedEmail}: ${otp}`);
            throw new errorHandler_1.AppError('Email bhejne mein problem. Dobara try karo.', 500);
        }
        (0, helpers_1.sendResponse)(res, 200, true, 'OTP aapke email par bheja gaya hai!');
    }
    catch (err) {
        next(err);
    }
};
exports.forgotPassword = forgotPassword;
// ─── Reset Password ───────────────────────────────────────────
const resetPassword = async (req, res, next) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword)
            throw new errorHandler_1.AppError('Email, OTP aur new password required', 400);
        if (newPassword.length < 6)
            throw new errorHandler_1.AppError('Password minimum 6 characters', 400);
        const normalizedEmail = email.toLowerCase().trim();
        const result = checkOTP(`reset:${normalizedEmail}`, otp);
        if (!result.valid)
            throw new errorHandler_1.AppError(result.error, 400);
        const user = await database_1.prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (!user)
            throw new errorHandler_1.AppError('User not found', 404);
        const hashed = await bcryptjs_1.default.hash(newPassword, 12);
        await database_1.prisma.user.update({ where: { email: normalizedEmail }, data: { password: hashed } });
        await database_1.prisma.refreshToken.deleteMany({ where: { userId: user.id } });
        (0, helpers_1.sendResponse)(res, 200, true, 'Password reset successful! Ab login karo.');
    }
    catch (err) {
        next(err);
    }
};
exports.resetPassword = resetPassword;
// ─── Switch Role ──────────────────────────────────────────────
const switchRole = async (req, res, next) => {
    try {
        const { role } = req.body;
        const userId = req.user.id;
        if (!['CUSTOMER', 'SELLER'].includes(role))
            throw new errorHandler_1.AppError('Invalid role!', 400);
        if (role === 'SELLER') {
            const existing = await database_1.prisma.seller.findUnique({ where: { userId } });
            if (!existing) {
                const u = await database_1.prisma.user.findUnique({ where: { id: userId } });
                await database_1.prisma.seller.create({
                    data: { userId, businessName: u.name + "'s Store", kycStatus: 'APPROVED', isApproved: true }
                });
            }
        }
        const user = await database_1.prisma.user.update({ where: { id: userId }, data: { role } });
        const { accessToken, refreshToken } = makeTokens(user.id, user.role, user.email || undefined);
        await saveRT(user.id, refreshToken);
        setCookie(res, refreshToken);
        (0, helpers_1.sendResponse)(res, 200, true, 'Role switched', {
            user: {
                id: user.id, name: user.name, email: user.email,
                phone: user.phone, role: user.role, bellmakCoins: user.bellmakCoins
            },
            accessToken
        });
    }
    catch (err) {
        next(err);
    }
};
exports.switchRole = switchRole;
// ─── Update Profile ───────────────────────────────────────────
const updateProfile = async (req, res, next) => {
    try {
        const { name, phone } = req.body;
        const userId = req.user.id;
        if (!name && !phone)
            throw new errorHandler_1.AppError('Name ya phone required', 400);
        if (phone) {
            const existing = await database_1.prisma.user.findFirst({ where: { phone, NOT: { id: userId } } });
            if (existing)
                throw new errorHandler_1.AppError('Phone already use ho raha hai', 409);
        }
        const user = await database_1.prisma.user.update({
            where: { id: userId },
            data: { ...(name && { name }), ...(phone && { phone }) },
            select: { id: true, name: true, email: true, phone: true, role: true, avatar: true, bellmakCoins: true }
        });
        (0, helpers_1.sendResponse)(res, 200, true, 'Profile updated', user);
    }
    catch (err) {
        next(err);
    }
};
exports.updateProfile = updateProfile;
// ─── Change Password ──────────────────────────────────────────
const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;
        if (!currentPassword || !newPassword)
            throw new errorHandler_1.AppError('Current aur new password required', 400);
        if (newPassword.length < 6)
            throw new errorHandler_1.AppError('Password minimum 6 characters', 400);
        const user = await database_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.password)
            throw new errorHandler_1.AppError('User not found', 404);
        const ok = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!ok)
            throw new errorHandler_1.AppError('Current password galat hai', 401);
        const hashed = await bcryptjs_1.default.hash(newPassword, 12);
        await database_1.prisma.user.update({ where: { id: userId }, data: { password: hashed } });
        await database_1.prisma.refreshToken.deleteMany({ where: { userId } });
        res.clearCookie('refreshToken');
        (0, helpers_1.sendResponse)(res, 200, true, 'Password changed. Please login again.');
    }
    catch (err) {
        next(err);
    }
};
exports.changePassword = changePassword;
// ─── Coins History ────────────────────────────────────────────
const getCoinsHistory = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId },
            select: { bellmakCoins: true, name: true }
        });
        if (!user)
            throw new errorHandler_1.AppError('User not found', 404);
        const orders = await database_1.prisma.order.findMany({
            where: { userId },
            select: { orderId: true, coinsUsed: true, totalAmount: true, status: true, createdAt: true },
            orderBy: { createdAt: 'desc' }, take: 20
        });
        const transactions = [];
        orders.forEach(o => {
            if (o.coinsUsed > 0)
                transactions.push({
                    id: `spent-${o.orderId}`, type: 'SPENT', amount: o.coinsUsed,
                    description: `Coins used on #${o.orderId}`, orderId: o.orderId, createdAt: o.createdAt
                });
            if (o.status === 'DELIVERED') {
                const earned = Math.floor(o.totalAmount * 0.01);
                if (earned > 0)
                    transactions.push({
                        id: `earned-${o.orderId}`, type: 'EARNED', amount: earned,
                        description: `Coins earned on #${o.orderId}`, orderId: o.orderId, createdAt: o.createdAt
                    });
            }
        });
        transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        (0, helpers_1.sendResponse)(res, 200, true, 'Coins history fetched', {
            currentBalance: user.bellmakCoins,
            coinValue: user.bellmakCoins * 0.25,
            transactions
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getCoinsHistory = getCoinsHistory;
