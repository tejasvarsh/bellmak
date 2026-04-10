"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getCategory = exports.getCategories = void 0;
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const helpers_1 = require("../utils/helpers");
// @route GET /api/categories
const getCategories = async (req, res, next) => {
    try {
        const categories = await database_1.prisma.category.findMany({
            where: { isActive: true, parentId: null },
            include: {
                children: {
                    where: { isActive: true },
                    select: {
                        id: true, name: true,
                        slug: true, icon: true
                    }
                }
            },
            orderBy: { sortOrder: 'asc' }
        });
        (0, helpers_1.sendResponse)(res, 200, true, 'Categories fetched', categories);
    }
    catch (err) {
        next(err);
    }
};
exports.getCategories = getCategories;
// @route GET /api/categories/:slug
const getCategory = async (req, res, next) => {
    try {
        const category = await database_1.prisma.category.findUnique({
            where: { slug: req.params.slug },
            include: {
                children: { where: { isActive: true } },
                _count: { select: { products: true } }
            }
        });
        if (!category)
            throw new errorHandler_1.AppError('Category not found', 404);
        (0, helpers_1.sendResponse)(res, 200, true, 'Category fetched', category);
    }
    catch (err) {
        next(err);
    }
};
exports.getCategory = getCategory;
// @route POST /api/categories
const createCategory = async (req, res, next) => {
    try {
        const { name, slug, parentId, image, icon, commissionRate } = req.body;
        if (!name || !slug)
            throw new errorHandler_1.AppError('Name and slug required', 400);
        const category = await database_1.prisma.category.create({
            data: {
                name, slug,
                parentId: parentId || null,
                image, icon,
                commissionRate: commissionRate || 10
            }
        });
        (0, helpers_1.sendResponse)(res, 201, true, 'Category created', category);
    }
    catch (err) {
        next(err);
    }
};
exports.createCategory = createCategory;
// @route PUT /api/categories/:id
const updateCategory = async (req, res, next) => {
    try {
        const category = await database_1.prisma.category.update({
            where: { id: req.params.id },
            data: req.body
        });
        (0, helpers_1.sendResponse)(res, 200, true, 'Category updated', category);
    }
    catch (err) {
        next(err);
    }
};
exports.updateCategory = updateCategory;
// @route DELETE /api/categories/:id
const deleteCategory = async (req, res, next) => {
    try {
        await database_1.prisma.category.update({
            where: { id: req.params.id },
            data: { isActive: false }
        });
        (0, helpers_1.sendResponse)(res, 200, true, 'Category deleted');
    }
    catch (err) {
        next(err);
    }
};
exports.deleteCategory = deleteCategory;
