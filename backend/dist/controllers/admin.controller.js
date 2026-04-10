"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCoupon = exports.getCoupons = exports.deleteBanner = exports.createBanner = exports.getBanners = exports.updateOrderStatus = exports.getAllOrders = exports.deleteProduct = exports.updateProduct = exports.featureProduct = exports.approveProduct = exports.getAllProducts = exports.approveSeller = exports.getAllSellers = exports.updateUser = exports.banUser = exports.toggleUserStatus = exports.changeUserRole = exports.getAllUsers = exports.getAdminDashboard = void 0;
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const helpers_1 = require("../utils/helpers");
// @route GET /api/admin/dashboard
const getAdminDashboard = async (req, res, next) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [totalUsers, totalSellers, totalProducts, totalOrders, pendingKYC, pendingProducts, todayOrders, deliveredOrders, cancelledOrders, pendingOrders] = await Promise.all([
            database_1.prisma.user.count({ where: { role: 'CUSTOMER' } }),
            database_1.prisma.seller.count({ where: { isApproved: true } }),
            database_1.prisma.product.count({ where: { isActive: true } }),
            database_1.prisma.order.count(),
            database_1.prisma.seller.count({ where: { kycStatus: 'SUBMITTED' } }),
            database_1.prisma.product.count({ where: { isApproved: false, isActive: true } }),
            database_1.prisma.order.count({ where: { createdAt: { gte: today } } }),
            database_1.prisma.order.count({ where: { status: 'DELIVERED' } }),
            database_1.prisma.order.count({ where: { status: 'CANCELLED' } }),
            database_1.prisma.order.count({ where: { status: 'PENDING' } }),
        ]);
        const [revenue, todayRevenue] = await Promise.all([
            database_1.prisma.order.aggregate({ where: { paymentStatus: 'PAID' }, _sum: { totalAmount: true } }),
            database_1.prisma.order.aggregate({ where: { paymentStatus: 'PAID', createdAt: { gte: today } }, _sum: { totalAmount: true } })
        ]);
        const recentOrders = await database_1.prisma.order.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { name: true, email: true } },
                items: { take: 1 }
            }
        });
        (0, helpers_1.sendResponse)(res, 200, true, 'Dashboard data', {
            stats: {
                totalUsers, totalSellers, totalProducts,
                totalOrders, pendingKYC, pendingProducts,
                totalRevenue: revenue._sum.totalAmount || 0,
                todayOrders, todayRevenue: todayRevenue._sum.totalAmount || 0,
                deliveredOrders, cancelledOrders, pendingOrders
            },
            recentOrders
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getAdminDashboard = getAdminDashboard;
// @route GET /api/admin/users
const getAllUsers = async (req, res, next) => {
    try {
        const { search, role, page = '1', limit = '20' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const where = {};
        if (role)
            where.role = role;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search } }
            ];
        }
        const [users, total] = await Promise.all([
            database_1.prisma.user.findMany({
                where,
                skip: (pageNum - 1) * limitNum,
                take: limitNum,
                select: {
                    id: true, name: true, email: true, phone: true,
                    role: true, isActive: true, isVerified: true,
                    bellmakCoins: true, createdAt: true,
                    _count: { select: { orders: true } }
                },
                orderBy: { createdAt: 'desc' }
            }),
            database_1.prisma.user.count({ where })
        ]);
        (0, helpers_1.sendResponse)(res, 200, true, 'Users fetched', users, {
            page: pageNum, limit: limitNum, total,
            totalPages: Math.ceil(total / limitNum)
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getAllUsers = getAllUsers;
// @route PATCH /api/admin/users/:id/role
const changeUserRole = async (req, res, next) => {
    try {
        const { role } = req.body;
        const validRoles = ['CUSTOMER', 'SELLER', 'ADMIN'];
        if (!validRoles.includes(role))
            throw new errorHandler_1.AppError('Invalid role', 400);
        if (req.params.id === req.user.id && role !== 'ADMIN') {
            throw new errorHandler_1.AppError('Aap apna admin role nahi hata sakte!', 403);
        }
        const user = await database_1.prisma.user.update({
            where: { id: req.params.id },
            data: { role },
            select: { id: true, name: true, email: true, role: true }
        });
        if (role === 'SELLER') {
            const existing = await database_1.prisma.seller.findUnique({ where: { userId: user.id } });
            if (!existing) {
                await database_1.prisma.seller.create({
                    data: { userId: user.id, businessName: user.name + "'s Store", kycStatus: 'APPROVED', isApproved: true }
                });
            }
        }
        (0, helpers_1.sendResponse)(res, 200, true, `${user.name} ka role ${role} ho gaya!`, user);
    }
    catch (err) {
        next(err);
    }
};
exports.changeUserRole = changeUserRole;
// @route PATCH /api/admin/users/:id/status
const toggleUserStatus = async (req, res, next) => {
    try {
        const { isActive } = req.body;
        if (req.params.id === req.user.id)
            throw new errorHandler_1.AppError('Aap khud ko deactivate nahi kar sakte!', 403);
        const user = await database_1.prisma.user.update({
            where: { id: req.params.id },
            data: { isActive },
            select: { id: true, name: true, isActive: true }
        });
        (0, helpers_1.sendResponse)(res, 200, true, `User ${isActive ? 'activated' : 'deactivated'}`, user);
    }
    catch (err) {
        next(err);
    }
};
exports.toggleUserStatus = toggleUserStatus;
// @route PUT /api/admin/users/:id/ban
const banUser = async (req, res, next) => {
    try {
        const user = await database_1.prisma.user.findUnique({ where: { id: req.params.id } });
        if (!user)
            throw new errorHandler_1.AppError('User not found', 404);
        const updated = await database_1.prisma.user.update({
            where: { id: req.params.id },
            data: { isActive: !user.isActive }
        });
        (0, helpers_1.sendResponse)(res, 200, true, updated.isActive ? 'User unbanned' : 'User banned', { isActive: updated.isActive });
    }
    catch (err) {
        next(err);
    }
};
exports.banUser = banUser;
// @route PATCH /api/admin/users/:id
const updateUser = async (req, res, next) => {
    try {
        const user = await database_1.prisma.user.update({ where: { id: req.params.id }, data: req.body });
        (0, helpers_1.sendResponse)(res, 200, true, 'User updated', user);
    }
    catch (err) {
        next(err);
    }
};
exports.updateUser = updateUser;
// @route GET /api/admin/sellers
const getAllSellers = async (req, res, next) => {
    try {
        const { kycStatus, page = '1', limit = '20' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const where = {};
        if (kycStatus)
            where.kycStatus = kycStatus;
        const [sellers, total] = await Promise.all([
            database_1.prisma.seller.findMany({
                where,
                skip: (pageNum - 1) * limitNum,
                take: limitNum,
                include: {
                    user: { select: { name: true, email: true, phone: true } },
                    _count: { select: { products: true } }
                },
                orderBy: { createdAt: 'desc' }
            }),
            database_1.prisma.seller.count({ where })
        ]);
        (0, helpers_1.sendResponse)(res, 200, true, 'Sellers fetched', sellers, {
            page: pageNum, limit: limitNum, total,
            totalPages: Math.ceil(total / limitNum)
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getAllSellers = getAllSellers;
// @route PUT /api/admin/sellers/:id/approve
const approveSeller = async (req, res, next) => {
    try {
        const { approved } = req.body;
        const seller = await database_1.prisma.seller.update({
            where: { id: req.params.id },
            data: { isApproved: approved, kycStatus: approved ? 'APPROVED' : 'REJECTED' }
        });
        (0, helpers_1.sendResponse)(res, 200, true, approved ? 'Seller approved' : 'Seller rejected', seller);
    }
    catch (err) {
        next(err);
    }
};
exports.approveSeller = approveSeller;
// @route GET /api/admin/products
const getAllProducts = async (req, res, next) => {
    try {
        const { approved, page = '1', limit = '50' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const where = {};
        if (approved === 'false')
            where.isApproved = false;
        if (approved === 'true')
            where.isApproved = true;
        const [products, total] = await Promise.all([
            database_1.prisma.product.findMany({
                where,
                skip: (pageNum - 1) * limitNum,
                take: limitNum,
                include: {
                    seller: { select: { businessName: true } },
                    category: { select: { name: true } }
                },
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
exports.getAllProducts = getAllProducts;
// @route PUT /api/admin/products/:id/approve
const approveProduct = async (req, res, next) => {
    try {
        const product = await database_1.prisma.product.update({
            where: { id: req.params.id },
            data: { isApproved: req.body.approved }
        });
        (0, helpers_1.sendResponse)(res, 200, true, req.body.approved ? 'Product approved' : 'Product rejected', product);
    }
    catch (err) {
        next(err);
    }
};
exports.approveProduct = approveProduct;
// @route PUT /api/admin/products/:id/feature
const featureProduct = async (req, res, next) => {
    try {
        const product = await database_1.prisma.product.findUnique({ where: { id: req.params.id } });
        if (!product)
            throw new errorHandler_1.AppError('Product not found', 404);
        const updated = await database_1.prisma.product.update({
            where: { id: req.params.id },
            data: { isFeatured: !product.isFeatured }
        });
        (0, helpers_1.sendResponse)(res, 200, true, 'Product featured status updated', updated);
    }
    catch (err) {
        next(err);
    }
};
exports.featureProduct = featureProduct;
// @route PATCH /api/admin/products/:id
const updateProduct = async (req, res, next) => {
    try {
        const product = await database_1.prisma.product.update({ where: { id: req.params.id }, data: req.body });
        (0, helpers_1.sendResponse)(res, 200, true, 'Product updated', product);
    }
    catch (err) {
        next(err);
    }
};
exports.updateProduct = updateProduct;
// @route DELETE /api/admin/products/:id
const deleteProduct = async (req, res, next) => {
    try {
        await database_1.prisma.product.delete({ where: { id: req.params.id } });
        (0, helpers_1.sendResponse)(res, 200, true, 'Product deleted');
    }
    catch (err) {
        next(err);
    }
};
exports.deleteProduct = deleteProduct;
// @route GET /api/admin/orders
const getAllOrders = async (req, res, next) => {
    try {
        const { status, page = '1', limit = '20', search } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const where = {};
        if (status && status !== 'ALL')
            where.status = status;
        if (search) {
            where.OR = [
                { orderId: { contains: search, mode: 'insensitive' } },
                { user: { name: { contains: search, mode: 'insensitive' } } },
                { user: { phone: { contains: search } } }
            ];
        }
        const [orders, total] = await Promise.all([
            database_1.prisma.order.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (pageNum - 1) * limitNum,
                take: limitNum,
                include: {
                    user: { select: { name: true, email: true, phone: true } },
                    items: true
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
exports.getAllOrders = getAllOrders;
// @route PATCH /api/admin/orders/:id/status
const updateOrderStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const validStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
        if (!validStatuses.includes(status))
            throw new errorHandler_1.AppError('Invalid status', 400);
        const order = await database_1.prisma.order.findUnique({
            where: { id: req.params.id },
            include: { items: true }
        });
        if (!order)
            throw new errorHandler_1.AppError('Order not found', 404);
        const updateData = { status };
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
// @route GET /api/admin/banners
const getBanners = async (req, res, next) => {
    try {
        const banners = await database_1.prisma.banner.findMany({ orderBy: { sortOrder: 'asc' } });
        (0, helpers_1.sendResponse)(res, 200, true, 'Banners fetched', banners);
    }
    catch (err) {
        next(err);
    }
};
exports.getBanners = getBanners;
// @route POST /api/admin/banners
const createBanner = async (req, res, next) => {
    try {
        const banner = await database_1.prisma.banner.create({ data: req.body });
        (0, helpers_1.sendResponse)(res, 201, true, 'Banner created', banner);
    }
    catch (err) {
        next(err);
    }
};
exports.createBanner = createBanner;
// @route DELETE /api/admin/banners/:id
const deleteBanner = async (req, res, next) => {
    try {
        await database_1.prisma.banner.delete({ where: { id: req.params.id } });
        (0, helpers_1.sendResponse)(res, 200, true, 'Banner deleted');
    }
    catch (err) {
        next(err);
    }
};
exports.deleteBanner = deleteBanner;
// @route GET /api/admin/coupons
const getCoupons = async (req, res, next) => {
    try {
        const coupons = await database_1.prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
        (0, helpers_1.sendResponse)(res, 200, true, 'Coupons fetched', coupons);
    }
    catch (err) {
        next(err);
    }
};
exports.getCoupons = getCoupons;
// @route POST /api/admin/coupons
const createCoupon = async (req, res, next) => {
    try {
        const coupon = await database_1.prisma.coupon.create({
            data: { ...req.body, code: req.body.code.toUpperCase() }
        });
        (0, helpers_1.sendResponse)(res, 201, true, 'Coupon created', coupon);
    }
    catch (err) {
        next(err);
    }
};
exports.createCoupon = createCoupon;
