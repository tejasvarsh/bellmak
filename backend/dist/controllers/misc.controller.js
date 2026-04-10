"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contactForm = exports.subscribeNewsletter = exports.checkPincode = exports.validateCoupon = exports.getBanners = void 0;
const database_1 = require("../config/database");
const helpers_1 = require("../utils/helpers");
// @route GET /api/banners
const getBanners = async (req, res, next) => {
    try {
        const banners = await database_1.prisma.banner.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' }
        });
        (0, helpers_1.sendResponse)(res, 200, true, 'Banners fetched', banners);
    }
    catch (err) {
        next(err);
    }
};
exports.getBanners = getBanners;
// @route GET /api/coupons/validate/:code
const validateCoupon = async (req, res, next) => {
    try {
        const coupon = await database_1.prisma.coupon.findFirst({
            where: {
                code: req.params.code.toUpperCase(),
                isActive: true,
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } }
                ]
            }
        });
        if (!coupon) {
            return (0, helpers_1.sendResponse)(res, 404, false, 'Invalid or expired coupon');
        }
        (0, helpers_1.sendResponse)(res, 200, true, 'Valid coupon', {
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            minOrderValue: coupon.minOrderValue
        });
    }
    catch (err) {
        next(err);
    }
};
exports.validateCoupon = validateCoupon;
// @route GET /api/pincode/:pincode
const checkPincode = async (req, res, next) => {
    try {
        const { pincode } = req.params;
        // Simulate pincode check
        // In production: integrate with delivery partner API
        const isServiceable = pincode.length === 6;
        const deliveryDays = ['110', '400', '560', '600', '500'].some(p => pincode.startsWith(p)) ? 2 : 5;
        const deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + deliveryDays);
        (0, helpers_1.sendResponse)(res, 200, true, 'Pincode checked', {
            pincode,
            isServiceable,
            deliveryDays,
            deliveryDate,
            message: isServiceable
                ? `Delivery by ${deliveryDate.toDateString()}`
                : 'Delivery not available at this location'
        });
    }
    catch (err) {
        next(err);
    }
};
exports.checkPincode = checkPincode;
// @route POST /api/newsletter
const subscribeNewsletter = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            return (0, helpers_1.sendResponse)(res, 400, false, 'Email required');
        }
        await database_1.prisma.newsletterSubscriber.upsert({
            where: { email },
            update: {},
            create: { email }
        });
        (0, helpers_1.sendResponse)(res, 200, true, 'Subscribed successfully!');
    }
    catch (err) {
        next(err);
    }
};
exports.subscribeNewsletter = subscribeNewsletter;
// @route POST /api/contact
const contactForm = async (req, res, next) => {
    try {
        const { name, email, subject, message } = req.body;
        if (!name || !email || !message) {
            return (0, helpers_1.sendResponse)(res, 400, false, 'Name, email and message required');
        }
        // In production: send email via Nodemailer
        console.log('Contact form submission:', { name, email, subject, message });
        (0, helpers_1.sendResponse)(res, 200, true, 'Message received! We will contact you soon.');
    }
    catch (err) {
        next(err);
    }
};
exports.contactForm = contactForm;
