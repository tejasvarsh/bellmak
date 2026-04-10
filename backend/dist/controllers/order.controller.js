"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sellerConfirmCODReceived = exports.confirmCODPayment = exports.confirmDelivery = exports.trackOrder = exports.returnOrder = exports.cancelOrder = exports.getOrder = exports.getOrders = exports.createOrder = void 0;
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const helpers_1 = require("../utils/helpers");
// ─────────────────────────────────────────────────────────────
// @route POST /api/orders
// ─────────────────────────────────────────────────────────────
const createOrder = async (req, res, next) => {
    try {
        const { items, shippingAddress, paymentMethod, couponCode, coinsUsed = 0 } = req.body;
        if (!items || items.length === 0) {
            throw new errorHandler_1.AppError('No items in order', 400);
        }
        let subtotal = 0;
        const orderItems = [];
        for (const item of items) {
            const product = await database_1.prisma.product.findUnique({
                where: { id: item.productId }
            });
            if (!product)
                throw new errorHandler_1.AppError(`Product not found: ${item.productId}`, 404);
            if (product.stock < item.quantity) {
                throw new errorHandler_1.AppError(`Insufficient stock for: ${product.title}`, 400);
            }
            subtotal += product.price * item.quantity;
            orderItems.push({
                productId: product.id,
                title: product.title,
                image: product.images[0] || '',
                quantity: item.quantity,
                price: product.price,
                mrp: product.mrp,
                variant: item.variant || null,
                sellerId: product.sellerId
            });
        }
        let discount = 0;
        if (couponCode) {
            const coupon = await database_1.prisma.coupon.findFirst({
                where: {
                    code: couponCode,
                    isActive: true,
                    OR: [
                        { expiresAt: null },
                        { expiresAt: { gt: new Date() } }
                    ]
                }
            });
            if (coupon && subtotal >= coupon.minOrderValue) {
                discount = coupon.discountType === 'PERCENT'
                    ? (subtotal * coupon.discountValue) / 100
                    : coupon.discountValue;
            }
        }
        const coinsDiscount = coinsUsed * 0.25;
        const deliveryCharge = (0, helpers_1.calculateDeliveryCharge)(subtotal - discount);
        const totalAmount = subtotal - discount - coinsDiscount + deliveryCharge;
        const order = await database_1.prisma.order.create({
            data: {
                orderId: (0, helpers_1.generateOrderId)(),
                userId: req.user.id,
                subtotal,
                discount,
                deliveryCharge,
                coinsDiscount,
                coinsUsed,
                totalAmount,
                couponCode: couponCode || null,
                paymentMethod,
                paymentStatus: 'PENDING',
                status: 'PENDING',
                shippingAddress,
                expectedDelivery: (0, helpers_1.getExpectedDelivery)(shippingAddress.city),
                items: {
                    create: orderItems
                }
            },
            include: { items: true }
        });
        for (const item of items) {
            await database_1.prisma.product.update({
                where: { id: item.productId },
                data: { stock: { decrement: item.quantity } }
            });
        }
        if (coinsUsed > 0) {
            await database_1.prisma.user.update({
                where: { id: req.user.id },
                data: { bellmakCoins: { decrement: coinsUsed } }
            });
        }
        (0, helpers_1.sendResponse)(res, 201, true, 'Order created successfully', order);
    }
    catch (err) {
        next(err);
    }
};
exports.createOrder = createOrder;
// ─────────────────────────────────────────────────────────────
// @route GET /api/orders
// ─────────────────────────────────────────────────────────────
const getOrders = async (req, res, next) => {
    try {
        const { status, page = '1', limit = '10' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const where = { userId: req.user.id };
        if (status)
            where.status = status;
        const [orders, total] = await Promise.all([
            database_1.prisma.order.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (pageNum - 1) * limitNum,
                take: limitNum,
                include: {
                    items: {
                        include: {
                            product: {
                                select: { title: true, images: true, slug: true }
                            }
                        }
                    }
                }
            }),
            database_1.prisma.order.count({ where })
        ]);
        (0, helpers_1.sendResponse)(res, 200, true, 'Orders fetched', orders, {
            page: pageNum, limit: limitNum, total,
            totalPages: Math.ceil(total / limitNum)
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getOrders = getOrders;
// ─────────────────────────────────────────────────────────────
// @route GET /api/orders/:orderId
// ─────────────────────────────────────────────────────────────
const getOrder = async (req, res, next) => {
    try {
        const order = await database_1.prisma.order.findFirst({
            where: {
                orderId: req.params.orderId,
                userId: req.user.id
            },
            include: {
                items: {
                    include: {
                        product: { select: { title: true, images: true, slug: true } }
                    }
                }
            }
        });
        if (!order)
            throw new errorHandler_1.AppError('Order not found', 404);
        (0, helpers_1.sendResponse)(res, 200, true, 'Order fetched', order);
    }
    catch (err) {
        next(err);
    }
};
exports.getOrder = getOrder;
// ─────────────────────────────────────────────────────────────
// @route POST /api/orders/:orderId/cancel
// ─────────────────────────────────────────────────────────────
const cancelOrder = async (req, res, next) => {
    try {
        const order = await database_1.prisma.order.findFirst({
            where: { orderId: req.params.orderId, userId: req.user.id }
        });
        if (!order)
            throw new errorHandler_1.AppError('Order not found', 404);
        if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
            throw new errorHandler_1.AppError('Order cannot be cancelled at this stage', 400);
        }
        await database_1.prisma.order.update({
            where: { id: order.id },
            data: { status: 'CANCELLED', cancelReason: req.body.reason }
        });
        const items = await database_1.prisma.orderItem.findMany({
            where: { orderId: order.id }
        });
        for (const item of items) {
            await database_1.prisma.product.update({
                where: { id: item.productId },
                data: { stock: { increment: item.quantity } }
            });
        }
        (0, helpers_1.sendResponse)(res, 200, true, 'Order cancelled');
    }
    catch (err) {
        next(err);
    }
};
exports.cancelOrder = cancelOrder;
// ─────────────────────────────────────────────────────────────
// @route POST /api/orders/:orderId/return
// ─────────────────────────────────────────────────────────────
const returnOrder = async (req, res, next) => {
    try {
        const order = await database_1.prisma.order.findFirst({
            where: { orderId: req.params.orderId, userId: req.user.id }
        });
        if (!order)
            throw new errorHandler_1.AppError('Order not found', 404);
        if (order.status !== 'DELIVERED') {
            throw new errorHandler_1.AppError('Only delivered orders can be returned', 400);
        }
        await database_1.prisma.order.update({
            where: { id: order.id },
            data: {
                status: 'RETURN_REQUESTED',
                returnReason: req.body.reason
            }
        });
        (0, helpers_1.sendResponse)(res, 200, true, 'Return request submitted');
    }
    catch (err) {
        next(err);
    }
};
exports.returnOrder = returnOrder;
// ─────────────────────────────────────────────────────────────
// @route GET /api/orders/:orderId/track
// ─────────────────────────────────────────────────────────────
const trackOrder = async (req, res, next) => {
    try {
        const order = await database_1.prisma.order.findFirst({
            where: { orderId: req.params.orderId, userId: req.user.id },
            select: {
                orderId: true,
                status: true,
                trackingId: true,
                deliveryPartner: true,
                expectedDelivery: true,
                createdAt: true,
                updatedAt: true
            }
        });
        if (!order)
            throw new errorHandler_1.AppError('Order not found', 404);
        const allStatuses = [
            'PENDING', 'CONFIRMED', 'PROCESSING',
            'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'
        ];
        const currentIndex = allStatuses.indexOf(order.status);
        const timeline = allStatuses.map((status, index) => ({
            status,
            completed: index <= currentIndex,
            current: index === currentIndex
        }));
        (0, helpers_1.sendResponse)(res, 200, true, 'Tracking info', { order, timeline });
    }
    catch (err) {
        next(err);
    }
};
exports.trackOrder = trackOrder;
// ─────────────────────────────────────────────────────────────
// @route POST /api/orders/:orderId/confirm-delivery
// Customer confirms: "Mujhe order mil gaya"
// ─────────────────────────────────────────────────────────────
const confirmDelivery = async (req, res, next) => {
    try {
        const order = await database_1.prisma.order.findFirst({
            where: { orderId: req.params.orderId, userId: req.user.id }
        });
        if (!order)
            throw new errorHandler_1.AppError('Order not found', 404);
        if (!['SHIPPED', 'OUT_FOR_DELIVERY'].includes(order.status)) {
            throw new errorHandler_1.AppError('Order is not in a deliverable state', 400);
        }
        await database_1.prisma.order.update({
            where: { id: order.id },
            data: {
                status: 'DELIVERED',
                // COD order: payment abhi confirm karna baaki hai
                // Non-COD order: payment already ho chuki thi
                paymentStatus: order.paymentMethod === 'COD'
                    ? 'COD_PENDING_CONFIRMATION'
                    : 'PAID',
                deliveredAt: new Date()
            }
        });
        (0, helpers_1.sendResponse)(res, 200, true, 'Delivery confirmed successfully! 🎉');
    }
    catch (err) {
        next(err);
    }
};
exports.confirmDelivery = confirmDelivery;
// ─────────────────────────────────────────────────────────────
// @route POST /api/orders/:orderId/confirm-cod-payment
// Customer confirms: "Maine cash de diya delivery boy ko"
// ─────────────────────────────────────────────────────────────
const confirmCODPayment = async (req, res, next) => {
    try {
        const order = await database_1.prisma.order.findFirst({
            where: { orderId: req.params.orderId, userId: req.user.id }
        });
        if (!order)
            throw new errorHandler_1.AppError('Order not found', 404);
        if (order.paymentMethod !== 'COD') {
            throw new errorHandler_1.AppError('This is not a COD order', 400);
        }
        if (order.status !== 'DELIVERED') {
            throw new errorHandler_1.AppError('Order must be delivered first', 400);
        }
        if (order.paymentStatus !== 'COD_PENDING_CONFIRMATION') {
            throw new errorHandler_1.AppError('Payment already confirmed', 400);
        }
        await database_1.prisma.order.update({
            where: { id: order.id },
            data: {
                paymentStatus: 'COD_PAID_BY_CUSTOMER'
            }
        });
        (0, helpers_1.sendResponse)(res, 200, true, 'COD payment confirmed! Seller will verify. ✅');
    }
    catch (err) {
        next(err);
    }
};
exports.confirmCODPayment = confirmCODPayment;
// ─────────────────────────────────────────────────────────────
// @route POST /api/seller/orders/:orderId/confirm-cod-received
// Seller confirms: "Mujhe cash mil gaya"
// ─────────────────────────────────────────────────────────────
const sellerConfirmCODReceived = async (req, res, next) => {
    try {
        const order = await database_1.prisma.order.findFirst({
            where: { orderId: req.params.orderId },
            include: { items: true }
        });
        if (!order)
            throw new errorHandler_1.AppError('Order not found', 404);
        const seller = await database_1.prisma.seller.findUnique({
            where: { userId: req.user.id }
        });
        if (!seller)
            throw new errorHandler_1.AppError('Seller not found', 404);
        const sellerOwnsItem = order.items.some((item) => item.sellerId === seller.id);
        if (!sellerOwnsItem)
            throw new errorHandler_1.AppError('Unauthorized', 403);
        if (order.paymentStatus !== 'COD_PAID_BY_CUSTOMER') {
            throw new errorHandler_1.AppError('Customer ne abhi payment confirm nahi ki', 400);
        }
        await database_1.prisma.order.update({
            where: { id: order.id },
            data: { paymentStatus: 'PAID' }
        });
        (0, helpers_1.sendResponse)(res, 200, true, 'COD payment received confirmed! Order complete. ✅');
    }
    catch (err) {
        next(err);
    }
};
exports.sellerConfirmCODReceived = sellerConfirmCODReceived;
