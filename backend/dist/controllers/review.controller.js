"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markHelpful = exports.deleteReview = exports.updateReview = exports.createReview = exports.getReviews = void 0;
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const helpers_1 = require("../utils/helpers");
// @route GET /api/reviews/product/:productId
const getReviews = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const { rating, sort = 'recent', page = '1', limit = '10' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const where = { productId };
        if (rating)
            where.rating = parseInt(rating);
        let orderBy = { createdAt: 'desc' };
        if (sort === 'helpful')
            orderBy = { helpfulVotes: 'desc' };
        if (sort === 'rating_high')
            orderBy = { rating: 'desc' };
        if (sort === 'rating_low')
            orderBy = { rating: 'asc' };
        const [reviews, total] = await Promise.all([
            database_1.prisma.review.findMany({
                where,
                orderBy,
                skip: (pageNum - 1) * limitNum,
                take: limitNum,
                include: {
                    user: { select: { name: true, avatar: true } }
                }
            }),
            database_1.prisma.review.count({ where })
        ]);
        // Rating breakdown
        const breakdown = await database_1.prisma.review.groupBy({
            by: ['rating'],
            where: { productId },
            _count: { rating: true }
        });
        (0, helpers_1.sendResponse)(res, 200, true, 'Reviews fetched', {
            reviews,
            breakdown
        }, {
            page: pageNum, limit: limitNum, total,
            totalPages: Math.ceil(total / limitNum)
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getReviews = getReviews;
// @route POST /api/reviews
const createReview = async (req, res, next) => {
    try {
        const { productId, rating, title, body, images } = req.body;
        if (!productId || !rating) {
            throw new errorHandler_1.AppError('Product ID and rating required', 400);
        }
        if (rating < 1 || rating > 5) {
            throw new errorHandler_1.AppError('Rating must be between 1 and 5', 400);
        }
        // Check if already reviewed
        const existing = await database_1.prisma.review.findFirst({
            where: { productId, userId: req.user.id }
        });
        if (existing)
            throw new errorHandler_1.AppError('You already reviewed this product', 409);
        // Check if purchased
        const purchased = await database_1.prisma.orderItem.findFirst({
            where: {
                productId,
                order: {
                    userId: req.user.id,
                    status: 'DELIVERED'
                }
            }
        });
        const review = await database_1.prisma.review.create({
            data: {
                productId,
                userId: req.user.id,
                rating,
                title,
                body,
                images: images || [],
                isVerifiedPurchase: !!purchased
            },
            include: {
                user: { select: { name: true, avatar: true } }
            }
        });
        // Update product average rating
        const allReviews = await database_1.prisma.review.aggregate({
            where: { productId },
            _avg: { rating: true },
            _count: { rating: true }
        });
        await database_1.prisma.product.update({
            where: { id: productId },
            data: {
                avgRating: allReviews._avg.rating || 0,
                totalReviews: allReviews._count.rating
            }
        });
        (0, helpers_1.sendResponse)(res, 201, true, 'Review submitted', review);
    }
    catch (err) {
        next(err);
    }
};
exports.createReview = createReview;
// @route PUT /api/reviews/:id
const updateReview = async (req, res, next) => {
    try {
        const review = await database_1.prisma.review.findFirst({
            where: { id: req.params.id, userId: req.user.id }
        });
        if (!review)
            throw new errorHandler_1.AppError('Review not found', 404);
        const updated = await database_1.prisma.review.update({
            where: { id: req.params.id },
            data: {
                rating: req.body.rating,
                title: req.body.title,
                body: req.body.body
            }
        });
        (0, helpers_1.sendResponse)(res, 200, true, 'Review updated', updated);
    }
    catch (err) {
        next(err);
    }
};
exports.updateReview = updateReview;
// @route DELETE /api/reviews/:id
const deleteReview = async (req, res, next) => {
    try {
        const review = await database_1.prisma.review.findFirst({
            where: {
                id: req.params.id,
                OR: [
                    { userId: req.user.id },
                    { user: { role: 'ADMIN' } }
                ]
            }
        });
        if (!review)
            throw new errorHandler_1.AppError('Review not found', 404);
        await database_1.prisma.review.delete({ where: { id: req.params.id } });
        (0, helpers_1.sendResponse)(res, 200, true, 'Review deleted');
    }
    catch (err) {
        next(err);
    }
};
exports.deleteReview = deleteReview;
// @route POST /api/reviews/:id/helpful
const markHelpful = async (req, res, next) => {
    try {
        const review = await database_1.prisma.review.update({
            where: { id: req.params.id },
            data: { helpfulVotes: { increment: 1 } }
        });
        (0, helpers_1.sendResponse)(res, 200, true, 'Marked as helpful', review);
    }
    catch (err) {
        next(err);
    }
};
exports.markHelpful = markHelpful;
