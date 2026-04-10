"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSellerProfile = exports.getSellerPayments = exports.confirmCODReceived = exports.shipOrder = exports.updateOrderStatus = exports.getSellerOrders = exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getSellerProducts = exports.getSellerDashboard = exports.registerSeller = void 0;
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const helpers_1 = require("../utils/helpers");
// ─── Helper ──────────────────────────────────────────────────
const getOrCreateSeller = async (userId) => {
    let seller = await database_1.prisma.seller.findUnique({ where: { userId } });
    if (!seller) {
        const user = await database_1.prisma.user.findUnique({ where: { id: userId } });
        seller = await database_1.prisma.seller.create({
            data: {
                userId,
                businessName: user.name + "'s Store",
                kycStatus: 'APPROVED',
                isApproved: true
            }
        });
    }
    return seller;
};
// @route POST /api/seller/register
const registerSeller = async (req, res, next) => {
    try {
        const existing = await database_1.prisma.seller.findUnique({ where: { userId: req.user.id } });
        if (existing)
            throw new errorHandler_1.AppError('Already registered as seller', 409);
        const { businessName, gstin, panNumber, bankAccount } = req.body;
        if (!businessName)
            throw new errorHandler_1.AppError('Business name required', 400);
        const seller = await database_1.prisma.seller.create({
            data: {
                userId: req.user.id,
                businessName, gstin, panNumber, bankAccount,
                kycStatus: 'APPROVED', isApproved: true
            }
        });
        await database_1.prisma.user.update({
            where: { id: req.user.id },
            data: { role: 'SELLER' }
        });
        (0, helpers_1.sendResponse)(res, 201, true, 'Seller registered successfully', seller);
    }
    catch (err) {
        next(err);
    }
};
exports.registerSeller = registerSeller;
// @route GET /api/seller/dashboard
const getSellerDashboard = async (req, res, next) => {
    try {
        const seller = await getOrCreateSeller(req.user.id);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [totalProducts, todayOrders, totalOrders, pendingOrders, lowStockProducts, codPendingCount] = await Promise.all([
            database_1.prisma.product.count({ where: { sellerId: seller.id } }),
            database_1.prisma.orderItem.count({ where: { sellerId: seller.id, order: { createdAt: { gte: today } } } }),
            database_1.prisma.orderItem.count({ where: { sellerId: seller.id } }),
            database_1.prisma.orderItem.count({ where: { sellerId: seller.id, order: { status: 'CONFIRMED' } } }),
            database_1.prisma.product.count({ where: { sellerId: seller.id, stock: { lte: 5 }, isActive: true } }),
            database_1.prisma.order.count({
                where: {
                    items: { some: { sellerId: seller.id } },
                    paymentStatus: 'COD_PAID_BY_CUSTOMER'
                }
            })
        ]);
        const revenueData = await database_1.prisma.orderItem.aggregate({
            where: { sellerId: seller.id, order: { paymentStatus: 'PAID' } },
            _sum: { price: true },
            _count: { id: true }
        });
        const totalRevenue = (revenueData._sum.price || 0) * (1 - seller.commissionRate / 100);
        const recentOrders = await database_1.prisma.orderItem.findMany({
            where: { sellerId: seller.id },
            take: 5,
            include: {
                order: {
                    select: {
                        orderId: true, status: true, createdAt: true,
                        paymentMethod: true, paymentStatus: true,
                        user: { select: { name: true } }
                    }
                }
            },
            orderBy: { order: { createdAt: 'desc' } }
        });
        (0, helpers_1.sendResponse)(res, 200, true, 'Dashboard data', {
            stats: {
                totalProducts, todayOrders, totalOrders,
                pendingOrders, lowStockProducts,
                totalRevenue: Math.round(totalRevenue),
                avgRating: seller.sellerRating,
                codPendingCount
            },
            recentOrders: recentOrders.map(item => ({
                id: item.id,
                orderId: item.order.orderId,
                customerName: item.order.user.name,
                amount: item.price * item.quantity,
                status: item.order.status,
                paymentMethod: item.order.paymentMethod,
                paymentStatus: item.order.paymentStatus,
                createdAt: item.order.createdAt
            }))
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getSellerDashboard = getSellerDashboard;
// @route GET /api/seller/products
const getSellerProducts = async (req, res, next) => {
    try {
        const seller = await getOrCreateSeller(req.user.id);
        const { page = '1', limit = '20', status } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const where = { sellerId: seller.id };
        if (status === 'active')
            where.isActive = true;
        if (status === 'inactive')
            where.isActive = false;
        const [products, total] = await Promise.all([
            database_1.prisma.product.findMany({
                where,
                skip: (pageNum - 1) * limitNum,
                take: limitNum,
                include: { category: { select: { name: true } } },
                orderBy: { createdAt: 'desc' }
            }),
            database_1.prisma.product.count({ where })
        ]);
        (0, helpers_1.sendResponse)(res, 200, true, 'Products fetched', products, {
            page: pageNum, limit: limitNum, total,
            totalPages: Math.ceil(total / limitNum)
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getSellerProducts = getSellerProducts;
// @route POST /api/seller/products
const createProduct = async (req, res, next) => {
    try {
        const seller = await getOrCreateSeller(req.user.id);
        const { title, description, price, mrp, stock, brand, category, images, specifications, isAssured } = req.body;
        if (!title || !price || !mrp || !stock || !category) {
            throw new errorHandler_1.AppError('Title, price, mrp, stock and category are required', 400);
        }
        let categoryRecord = await database_1.prisma.category.findFirst({
            where: { name: { equals: category, mode: 'insensitive' } }
        });
        if (!categoryRecord) {
            categoryRecord = await database_1.prisma.category.create({
                data: {
                    name: category,
                    slug: category.toLowerCase().replace(/\s+/g, '-').replace('&', '')
                }
            });
        }
        const discount = Math.round(((Number(mrp) - Number(price)) / Number(mrp)) * 100);
        const slug = title.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '-') + '-' + Date.now();
        const product = await database_1.prisma.product.create({
            data: {
                title, slug,
                description: description || '',
                price: Number(price), mrp: Number(mrp), discount,
                stock: Number(stock), brand: brand || '',
                images: images || [], specifications: specifications || {},
                isAssured: isAssured || false, isActive: true,
                sellerId: seller.id, categoryId: categoryRecord.id
            }
        });
        (0, helpers_1.sendResponse)(res, 201, true, 'Product created successfully', product);
    }
    catch (err) {
        next(err);
    }
};
exports.createProduct = createProduct;
// @route PUT /api/seller/products/:id
const updateProduct = async (req, res, next) => {
    try {
        const seller = await getOrCreateSeller(req.user.id);
        const product = await database_1.prisma.product.findFirst({
            where: { id: req.params.id, sellerId: seller.id }
        });
        if (!product)
            throw new errorHandler_1.AppError('Product not found', 404);
        const { title, description, price, mrp, stock, brand, images, specifications, isAssured, isActive } = req.body;
        const discount = price && mrp ? Math.round(((Number(mrp) - Number(price)) / Number(mrp)) * 100) : product.discount;
        const updated = await database_1.prisma.product.update({
            where: { id: req.params.id },
            data: {
                title: title || product.title,
                description: description || product.description,
                price: price ? Number(price) : product.price,
                mrp: mrp ? Number(mrp) : product.mrp,
                discount,
                stock: stock ? Number(stock) : product.stock,
                brand: brand || product.brand,
                images: images || product.images,
                specifications: specifications || product.specifications,
                isAssured: isAssured !== undefined ? isAssured : product.isAssured,
                isActive: isActive !== undefined ? isActive : product.isActive,
            }
        });
        (0, helpers_1.sendResponse)(res, 200, true, 'Product updated successfully', updated);
    }
    catch (err) {
        next(err);
    }
};
exports.updateProduct = updateProduct;
// @route DELETE /api/seller/products/:id
const deleteProduct = async (req, res, next) => {
    try {
        const seller = await getOrCreateSeller(req.user.id);
        const product = await database_1.prisma.product.findFirst({
            where: { id: req.params.id, sellerId: seller.id }
        });
        if (!product)
            throw new errorHandler_1.AppError('Product not found', 404);
        await database_1.prisma.product.delete({ where: { id: req.params.id } });
        (0, helpers_1.sendResponse)(res, 200, true, 'Product deleted successfully');
    }
    catch (err) {
        next(err);
    }
};
exports.deleteProduct = deleteProduct;
// @route GET /api/seller/orders
const getSellerOrders = async (req, res, next) => {
    try {
        const seller = await getOrCreateSeller(req.user.id);
        const { status, page = '1', limit = '20' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const orderItems = await database_1.prisma.orderItem.findMany({
            where: { sellerId: seller.id },
            select: { orderId: true },
            distinct: ['orderId']
        });
        const orderIds = orderItems.map((oi) => oi.orderId);
        const where = { id: { in: orderIds } };
        if (status && status !== 'ALL')
            where.status = status;
        const [orders, total] = await Promise.all([
            database_1.prisma.order.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (pageNum - 1) * limitNum,
                take: limitNum,
                include: {
                    user: { select: { name: true, email: true, phone: true } },
                    items: {
                        where: { sellerId: seller.id },
                        include: { product: { select: { title: true, images: true } } }
                    }
                }
            }),
            database_1.prisma.order.count({ where })
        ]);
        const formatted = orders.map((o) => ({
            id: o.id,
            orderId: o.orderId,
            customerName: o.user?.name || 'Customer',
            customerPhone: o.user?.phone || '',
            amount: o.totalAmount,
            status: o.status,
            paymentMethod: o.paymentMethod,
            paymentStatus: o.paymentStatus,
            trackingId: o.trackingId || '',
            deliveryPartner: o.deliveryPartner || '',
            createdAt: o.createdAt,
            city: o.shippingAddress?.city || '',
            state: o.shippingAddress?.state || '',
            shippingAddress: o.shippingAddress,
            items: o.items.map((item) => ({
                id: item.id,
                title: item.title,
                quantity: item.quantity,
                price: item.price,
                image: item.image
            }))
        }));
        (0, helpers_1.sendResponse)(res, 200, true, 'Seller orders fetched', formatted, {
            page: pageNum, limit: limitNum, total,
            totalPages: Math.ceil(total / limitNum)
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getSellerOrders = getSellerOrders;
// @route PATCH /api/seller/orders/:id/status
const updateOrderStatus = async (req, res, next) => {
    try {
        const { status, trackingId, deliveryPartner } = req.body;
        const seller = await getOrCreateSeller(req.user.id);
        const order = await database_1.prisma.order.findUnique({
            where: { id: req.params.id },
            include: { items: true }
        });
        if (!order)
            throw new errorHandler_1.AppError('Order not found', 404);
        const sellerOwnsItem = order.items.some((item) => item.sellerId === seller.id);
        if (!sellerOwnsItem)
            throw new errorHandler_1.AppError('Unauthorized', 403);
        const validNext = {
            PENDING: ['CONFIRMED', 'CANCELLED'],
            CONFIRMED: ['PROCESSING', 'CANCELLED'],
            PROCESSING: ['SHIPPED', 'CANCELLED'],
            SHIPPED: ['OUT_FOR_DELIVERY', 'DELIVERED'],
            OUT_FOR_DELIVERY: ['DELIVERED']
        };
        if (!validNext[order.status]?.includes(status)) {
            throw new errorHandler_1.AppError(`Cannot change from ${order.status} to ${status}`, 400);
        }
        const updateData = { status };
        if (trackingId)
            updateData.trackingId = trackingId;
        if (deliveryPartner)
            updateData.deliveryPartner = deliveryPartner;
        if (status === 'DELIVERED') {
            updateData.deliveredAt = new Date();
            updateData.paymentStatus = order.paymentMethod === 'COD' ? 'COD_PENDING_CONFIRMATION' : 'PAID';
        }
        if (status === 'CANCELLED') {
            for (const item of order.items) {
                await database_1.prisma.product.update({
                    where: { id: item.productId },
                    data: { stock: { increment: item.quantity } }
                });
            }
        }
        await database_1.prisma.order.update({ where: { id: order.id }, data: updateData });
        (0, helpers_1.sendResponse)(res, 200, true, `Order updated to ${status}`);
    }
    catch (err) {
        next(err);
    }
};
exports.updateOrderStatus = updateOrderStatus;
// @route PUT /api/seller/orders/:id/ship
const shipOrder = async (req, res, next) => {
    try {
        const { trackingId, deliveryPartner } = req.body;
        if (!trackingId)
            throw new errorHandler_1.AppError('Tracking ID required', 400);
        const order = await database_1.prisma.order.update({
            where: { id: req.params.id },
            data: { status: 'SHIPPED', trackingId, deliveryPartner: deliveryPartner || 'Standard' }
        });
        (0, helpers_1.sendResponse)(res, 200, true, 'Order marked as shipped', order);
    }
    catch (err) {
        next(err);
    }
};
exports.shipOrder = shipOrder;
// @route POST /api/seller/orders/:orderId/confirm-cod-received
const confirmCODReceived = async (req, res, next) => {
    try {
        const seller = await getOrCreateSeller(req.user.id);
        const order = await database_1.prisma.order.findFirst({
            where: { orderId: req.params.orderId },
            include: { items: true }
        });
        if (!order)
            throw new errorHandler_1.AppError('Order not found', 404);
        const sellerOwnsItem = order.items.some((item) => item.sellerId === seller.id);
        if (!sellerOwnsItem)
            throw new errorHandler_1.AppError('Unauthorized', 403);
        if (order.paymentMethod !== 'COD')
            throw new errorHandler_1.AppError('Yeh COD order nahi hai', 400);
        if (order.paymentStatus !== 'COD_PAID_BY_CUSTOMER') {
            throw new errorHandler_1.AppError('Customer ne abhi payment confirm nahi ki hai', 400);
        }
        await database_1.prisma.order.update({ where: { id: order.id }, data: { paymentStatus: 'PAID' } });
        (0, helpers_1.sendResponse)(res, 200, true, 'COD payment confirmed! Order complete. ✅');
    }
    catch (err) {
        next(err);
    }
};
exports.confirmCODReceived = confirmCODReceived;
// @route GET /api/seller/payments
const getSellerPayments = async (req, res, next) => {
    try {
        const seller = await getOrCreateSeller(req.user.id);
        const payments = await database_1.prisma.orderItem.findMany({
            where: { sellerId: seller.id, order: { paymentStatus: 'PAID' } },
            include: { order: { select: { orderId: true, createdAt: true, paymentMethod: true } } },
            orderBy: { order: { createdAt: 'desc' } }
        });
        const totalEarnings = payments.reduce((sum, item) => {
            return sum + item.price * item.quantity * (1 - seller.commissionRate / 100);
        }, 0);
        (0, helpers_1.sendResponse)(res, 200, true, 'Payments fetched', {
            payments,
            totalEarnings: Math.round(totalEarnings),
            commissionRate: seller.commissionRate
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getSellerPayments = getSellerPayments;
// @route PUT /api/seller/profile
const updateSellerProfile = async (req, res, next) => {
    try {
        const seller = await database_1.prisma.seller.update({
            where: { userId: req.user.id },
            data: req.body
        });
        (0, helpers_1.sendResponse)(res, 200, true, 'Profile updated', seller);
    }
    catch (err) {
        next(err);
    }
};
exports.updateSellerProfile = updateSellerProfile;
