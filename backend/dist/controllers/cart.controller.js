"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeCoupon = exports.applyCoupon = exports.clearCart = exports.removeFromCart = exports.updateCart = exports.addToCart = exports.getCart = void 0;
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const helpers_1 = require("../utils/helpers");
// @route GET /api/cart
const getCart = async (req, res, next) => {
    try {
        const userId = req.user.id;
        // Get user's pending cart items from orders
        // We store cart in a simple JSON approach
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true }
        });
        // For simplicity, cart is stored client-side
        // and synced here. Return empty for now.
        (0, helpers_1.sendResponse)(res, 200, true, 'Cart fetched', { items: [], total: 0 });
    }
    catch (err) {
        next(err);
    }
};
exports.getCart = getCart;
// @route POST /api/cart/add
const addToCart = async (req, res, next) => {
    try {
        const { productId, quantity = 1 } = req.body;
        if (!productId)
            throw new errorHandler_1.AppError('Product ID required', 400);
        const product = await database_1.prisma.product.findUnique({
            where: { id: productId },
            select: {
                id: true, title: true, price: true,
                mrp: true, images: true, stock: true,
                isActive: true
            }
        });
        if (!product)
            throw new errorHandler_1.AppError('Product not found', 404);
        if (!product.isActive)
            throw new errorHandler_1.AppError('Product not available', 400);
        if (product.stock < quantity) {
            throw new errorHandler_1.AppError('Insufficient stock', 400);
        }
        (0, helpers_1.sendResponse)(res, 200, true, 'Added to cart', {
            product,
            quantity
        });
    }
    catch (err) {
        next(err);
    }
};
exports.addToCart = addToCart;
// @route PUT /api/cart/update
const updateCart = async (req, res, next) => {
    try {
        const { productId, quantity } = req.body;
        if (!productId || !quantity) {
            throw new errorHandler_1.AppError('Product ID and quantity required', 400);
        }
        const product = await database_1.prisma.product.findUnique({
            where: { id: productId },
            select: { stock: true, title: true }
        });
        if (!product)
            throw new errorHandler_1.AppError('Product not found', 404);
        if (product.stock < quantity) {
            throw new errorHandler_1.AppError(`Only ${product.stock} items available`, 400);
        }
        (0, helpers_1.sendResponse)(res, 200, true, 'Cart updated', { productId, quantity });
    }
    catch (err) {
        next(err);
    }
};
exports.updateCart = updateCart;
// @route DELETE /api/cart/remove/:productId
const removeFromCart = async (req, res, next) => {
    try {
        const { productId } = req.params;
        (0, helpers_1.sendResponse)(res, 200, true, 'Item removed from cart', { productId });
    }
    catch (err) {
        next(err);
    }
};
exports.removeFromCart = removeFromCart;
// @route DELETE /api/cart/clear
const clearCart = async (req, res, next) => {
    try {
        (0, helpers_1.sendResponse)(res, 200, true, 'Cart cleared');
    }
    catch (err) {
        next(err);
    }
};
exports.clearCart = clearCart;
// @route POST /api/cart/apply-coupon
const applyCoupon = async (req, res, next) => {
    try {
        const { code, orderAmount } = req.body;
        if (!code)
            throw new errorHandler_1.AppError('Coupon code required', 400);
        const coupon = await database_1.prisma.coupon.findFirst({
            where: {
                code: code.toUpperCase(),
                isActive: true,
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } }
                ]
            }
        });
        if (!coupon)
            throw new errorHandler_1.AppError('Invalid or expired coupon', 400);
        if (orderAmount < coupon.minOrderValue) {
            throw new errorHandler_1.AppError(`Minimum order value ₹${coupon.minOrderValue} required`, 400);
        }
        if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
            throw new errorHandler_1.AppError('Coupon usage limit reached', 400);
        }
        const discountAmount = coupon.discountType === 'PERCENT'
            ? (orderAmount * coupon.discountValue) / 100
            : coupon.discountValue;
        (0, helpers_1.sendResponse)(res, 200, true, 'Coupon applied!', {
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            discountAmount: Math.round(discountAmount)
        });
    }
    catch (err) {
        next(err);
    }
};
exports.applyCoupon = applyCoupon;
// @route DELETE /api/cart/remove-coupon
const removeCoupon = async (req, res, next) => {
    try {
        (0, helpers_1.sendResponse)(res, 200, true, 'Coupon removed');
    }
    catch (err) {
        next(err);
    }
};
exports.removeCoupon = removeCoupon;
