"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkWishlist = exports.removeFromWishlist = exports.addToWishlist = exports.getWishlist = void 0;
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const helpers_1 = require("../utils/helpers");
// @route GET /api/wishlist
const getWishlist = async (req, res, next) => {
    try {
        const wishlist = await database_1.prisma.wishlist.findMany({
            where: { userId: req.user.id },
            include: {
                product: {
                    select: {
                        id: true, title: true, slug: true,
                        price: true, mrp: true, discount: true,
                        images: true, avgRating: true,
                        totalReviews: true, stock: true,
                        isAssured: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        (0, helpers_1.sendResponse)(res, 200, true, 'Wishlist fetched', wishlist);
    }
    catch (err) {
        next(err);
    }
};
exports.getWishlist = getWishlist;
// @route POST /api/wishlist/add
const addToWishlist = async (req, res, next) => {
    try {
        const { productId } = req.body;
        if (!productId)
            throw new errorHandler_1.AppError('Product ID required', 400);
        const product = await database_1.prisma.product.findUnique({
            where: { id: productId }
        });
        if (!product)
            throw new errorHandler_1.AppError('Product not found', 404);
        const wishlist = await database_1.prisma.wishlist.upsert({
            where: {
                userId_productId: {
                    userId: req.user.id,
                    productId
                }
            },
            update: {},
            create: {
                userId: req.user.id,
                productId
            }
        });
        (0, helpers_1.sendResponse)(res, 201, true, 'Added to wishlist', wishlist);
    }
    catch (err) {
        next(err);
    }
};
exports.addToWishlist = addToWishlist;
// @route DELETE /api/wishlist/remove/:productId
const removeFromWishlist = async (req, res, next) => {
    try {
        await database_1.prisma.wishlist.deleteMany({
            where: {
                userId: req.user.id,
                productId: req.params.productId
            }
        });
        (0, helpers_1.sendResponse)(res, 200, true, 'Removed from wishlist');
    }
    catch (err) {
        next(err);
    }
};
exports.removeFromWishlist = removeFromWishlist;
// @route GET /api/wishlist/check/:productId
const checkWishlist = async (req, res, next) => {
    try {
        const item = await database_1.prisma.wishlist.findUnique({
            where: {
                userId_productId: {
                    userId: req.user.id,
                    productId: req.params.productId
                }
            }
        });
        (0, helpers_1.sendResponse)(res, 200, true, 'Checked', { inWishlist: !!item });
    }
    catch (err) {
        next(err);
    }
};
exports.checkWishlist = checkWishlist;
