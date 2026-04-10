"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProduct = exports.getTrending = exports.getDeals = exports.getFeaturedProducts = exports.searchProducts = exports.getProducts = void 0;
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const helpers_1 = require("../utils/helpers");
// @route GET /api/products
const getProducts = async (req, res, next) => {
    try {
        const { category, brand, minPrice, maxPrice, rating, sort = 'createdAt', page = '1', limit = '20', inStock } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const where = { isActive: true };
        if (category) {
            const cat = await database_1.prisma.category.findFirst({
                where: { OR: [{ slug: category }, { name: { equals: category, mode: 'insensitive' } }] }
            });
            if (cat)
                where.categoryId = cat.id;
        }
        if (brand)
            where.brand = { contains: brand, mode: 'insensitive' };
        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice)
                where.price.gte = parseFloat(minPrice);
            if (maxPrice)
                where.price.lte = parseFloat(maxPrice);
        }
        if (rating)
            where.avgRating = { gte: parseFloat(rating) };
        if (inStock === 'true')
            where.stock = { gt: 0 };
        let orderBy = { createdAt: 'desc' };
        if (sort === 'price_asc')
            orderBy = { price: 'asc' };
        else if (sort === 'price_desc')
            orderBy = { price: 'desc' };
        else if (sort === 'rating')
            orderBy = { avgRating: 'desc' };
        else if (sort === 'popular')
            orderBy = { totalSales: 'desc' };
        const [products, total] = await Promise.all([
            database_1.prisma.product.findMany({
                where, orderBy, skip, take: limitNum,
                include: {
                    category: { select: { name: true, slug: true } },
                    seller: { select: { businessName: true } }
                }
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
exports.getProducts = getProducts;
// @route GET /api/products/search
const searchProducts = async (req, res, next) => {
    try {
        const { q, page = '1', limit = '20' } = req.query;
        if (!q)
            throw new errorHandler_1.AppError('Search query required', 400);
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const [products, total] = await Promise.all([
            database_1.prisma.product.findMany({
                where: {
                    isActive: true,
                    OR: [
                        { title: { contains: q, mode: 'insensitive' } },
                        { description: { contains: q, mode: 'insensitive' } },
                        { brand: { contains: q, mode: 'insensitive' } },
                    ]
                },
                skip: (pageNum - 1) * limitNum,
                take: limitNum,
                include: { category: { select: { name: true, slug: true } } }
            }),
            database_1.prisma.product.count({
                where: {
                    isActive: true,
                    OR: [
                        { title: { contains: q, mode: 'insensitive' } },
                        { brand: { contains: q, mode: 'insensitive' } }
                    ]
                }
            })
        ]);
        (0, helpers_1.sendResponse)(res, 200, true, 'Search results', products, {
            page: pageNum, limit: limitNum, total,
            totalPages: Math.ceil(total / limitNum)
        });
    }
    catch (err) {
        next(err);
    }
};
exports.searchProducts = searchProducts;
// @route GET /api/products/featured
const getFeaturedProducts = async (req, res, next) => {
    try {
        // Pehle featured products try karo
        let products = await database_1.prisma.product.findMany({
            where: { isActive: true, isFeatured: true },
            take: 12,
            include: { category: { select: { name: true } } }
        });
        // Agar featured nahi hain toh latest products lo
        if (products.length === 0) {
            products = await database_1.prisma.product.findMany({
                where: { isActive: true },
                take: 12,
                orderBy: { createdAt: 'desc' },
                include: { category: { select: { name: true } } }
            });
        }
        (0, helpers_1.sendResponse)(res, 200, true, 'Featured products', products);
    }
    catch (err) {
        next(err);
    }
};
exports.getFeaturedProducts = getFeaturedProducts;
// @route GET /api/products/deals
const getDeals = async (req, res, next) => {
    try {
        let products = await database_1.prisma.product.findMany({
            where: { isActive: true, discount: { gte: 20 } },
            orderBy: { discount: 'desc' },
            take: 12
        });
        // Agar deals nahi hain toh sabhi products lo
        if (products.length === 0) {
            products = await database_1.prisma.product.findMany({
                where: { isActive: true },
                take: 12,
                orderBy: { createdAt: 'desc' }
            });
        }
        (0, helpers_1.sendResponse)(res, 200, true, 'Deals fetched', products);
    }
    catch (err) {
        next(err);
    }
};
exports.getDeals = getDeals;
// @route GET /api/products/trending
const getTrending = async (req, res, next) => {
    try {
        let products = await database_1.prisma.product.findMany({
            where: { isActive: true },
            orderBy: { totalSales: 'desc' },
            take: 12
        });
        // Agar trending nahi hain toh latest lo
        if (products.length === 0) {
            products = await database_1.prisma.product.findMany({
                where: { isActive: true },
                take: 12,
                orderBy: { createdAt: 'desc' }
            });
        }
        (0, helpers_1.sendResponse)(res, 200, true, 'Trending products', products);
    }
    catch (err) {
        next(err);
    }
};
exports.getTrending = getTrending;
// @route GET /api/products/:slug
const getProduct = async (req, res, next) => {
    try {
        const product = await database_1.prisma.product.findUnique({
            where: { slug: req.params.slug },
            include: {
                category: true,
                seller: {
                    include: {
                        user: { select: { name: true, avatar: true } }
                    }
                },
                reviews: {
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        user: { select: { name: true, avatar: true } }
                    }
                }
            }
        });
        if (!product)
            throw new errorHandler_1.AppError('Product not found', 404);
        (0, helpers_1.sendResponse)(res, 200, true, 'Product fetched', product);
    }
    catch (err) {
        next(err);
    }
};
exports.getProduct = getProduct;
// @route POST /api/products
const createProduct = async (req, res, next) => {
    try {
        const seller = await database_1.prisma.seller.findUnique({ where: { userId: req.user.id } });
        if (!seller)
            throw new errorHandler_1.AppError('Seller not found', 403);
        const { title, description, price, mrp, stock, images, categoryId, brand, tags, specifications, variants, weight } = req.body;
        const discount = Math.round(((mrp - price) / mrp) * 100);
        const slug = (0, helpers_1.generateSlug)(title) + '-' + Date.now();
        const product = await database_1.prisma.product.create({
            data: {
                title, description, price, mrp, discount,
                stock, images: images || [], categoryId,
                brand, tags: tags || [], specifications,
                variants, weight, slug,
                sellerId: seller.id,
                isActive: true,
                isApproved: true
            }
        });
        (0, helpers_1.sendResponse)(res, 201, true, 'Product created successfully', product);
    }
    catch (err) {
        next(err);
    }
};
exports.createProduct = createProduct;
// @route PUT /api/products/:id
const updateProduct = async (req, res, next) => {
    try {
        const seller = await database_1.prisma.seller.findUnique({ where: { userId: req.user.id } });
        const product = await database_1.prisma.product.findFirst({
            where: { id: req.params.id, sellerId: seller?.id }
        });
        if (!product)
            throw new errorHandler_1.AppError('Product not found', 404);
        const updated = await database_1.prisma.product.update({
            where: { id: req.params.id },
            data: req.body
        });
        (0, helpers_1.sendResponse)(res, 200, true, 'Product updated', updated);
    }
    catch (err) {
        next(err);
    }
};
exports.updateProduct = updateProduct;
// @route DELETE /api/products/:id
const deleteProduct = async (req, res, next) => {
    try {
        await database_1.prisma.product.update({
            where: { id: req.params.id },
            data: { isActive: false }
        });
        (0, helpers_1.sendResponse)(res, 200, true, 'Product deleted');
    }
    catch (err) {
        next(err);
    }
};
exports.deleteProduct = deleteProduct;
