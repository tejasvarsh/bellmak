"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setDefaultAddress = exports.deleteAddress = exports.updateAddress = exports.addAddress = exports.getAddresses = void 0;
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const helpers_1 = require("../utils/helpers");
// @route GET /api/addresses
const getAddresses = async (req, res, next) => {
    try {
        const addresses = await database_1.prisma.address.findMany({
            where: { userId: req.user.id },
            orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }]
        });
        (0, helpers_1.sendResponse)(res, 200, true, 'Addresses fetched', addresses);
    }
    catch (err) {
        next(err);
    }
};
exports.getAddresses = getAddresses;
// @route POST /api/addresses
const addAddress = async (req, res, next) => {
    try {
        const count = await database_1.prisma.address.count({
            where: { userId: req.user.id }
        });
        if (count >= 5)
            throw new errorHandler_1.AppError('Maximum 5 addresses allowed', 400);
        const { fullName, phone, addressLine1, addressLine2, city, state, pincode, label, isDefault } = req.body;
        if (!fullName || !phone || !addressLine1 || !city || !state || !pincode) {
            throw new errorHandler_1.AppError('All required fields must be filled', 400);
        }
        // If setting as default, unset others
        if (isDefault) {
            await database_1.prisma.address.updateMany({
                where: { userId: req.user.id },
                data: { isDefault: false }
            });
        }
        const address = await database_1.prisma.address.create({
            data: {
                userId: req.user.id,
                fullName, phone, addressLine1,
                addressLine2: addressLine2 || null,
                city, state, pincode,
                label: label || 'HOME',
                isDefault: isDefault || count === 0
            }
        });
        (0, helpers_1.sendResponse)(res, 201, true, 'Address added', address);
    }
    catch (err) {
        next(err);
    }
};
exports.addAddress = addAddress;
// @route PUT /api/addresses/:id
const updateAddress = async (req, res, next) => {
    try {
        const address = await database_1.prisma.address.findFirst({
            where: { id: req.params.id, userId: req.user.id }
        });
        if (!address)
            throw new errorHandler_1.AppError('Address not found', 404);
        const updated = await database_1.prisma.address.update({
            where: { id: req.params.id },
            data: req.body
        });
        (0, helpers_1.sendResponse)(res, 200, true, 'Address updated', updated);
    }
    catch (err) {
        next(err);
    }
};
exports.updateAddress = updateAddress;
// @route DELETE /api/addresses/:id
const deleteAddress = async (req, res, next) => {
    try {
        const address = await database_1.prisma.address.findFirst({
            where: { id: req.params.id, userId: req.user.id }
        });
        if (!address)
            throw new errorHandler_1.AppError('Address not found', 404);
        await database_1.prisma.address.delete({ where: { id: req.params.id } });
        (0, helpers_1.sendResponse)(res, 200, true, 'Address deleted');
    }
    catch (err) {
        next(err);
    }
};
exports.deleteAddress = deleteAddress;
// @route PUT /api/addresses/:id/default
const setDefaultAddress = async (req, res, next) => {
    try {
        const address = await database_1.prisma.address.findFirst({
            where: { id: req.params.id, userId: req.user.id }
        });
        if (!address)
            throw new errorHandler_1.AppError('Address not found', 404);
        // Unset all defaults
        await database_1.prisma.address.updateMany({
            where: { userId: req.user.id },
            data: { isDefault: false }
        });
        // Set new default
        const updated = await database_1.prisma.address.update({
            where: { id: req.params.id },
            data: { isDefault: true }
        });
        (0, helpers_1.sendResponse)(res, 200, true, 'Default address updated', updated);
    }
    catch (err) {
        next(err);
    }
};
exports.setDefaultAddress = setDefaultAddress;
