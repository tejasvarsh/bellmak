"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sellerOnly = exports.adminOnly = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errorHandler_1 = require("./errorHandler");
const protect = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token)
            throw new errorHandler_1.AppError('Not authorized, no token', 401);
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = {
            id: decoded.id,
            role: decoded.role,
            email: decoded.email
        };
        next();
    }
    catch (err) {
        next(new errorHandler_1.AppError('Not authorized', 401));
    }
};
exports.protect = protect;
const adminOnly = (req, res, next) => {
    if (req.user?.role !== 'ADMIN') {
        return next(new errorHandler_1.AppError('Admin access only', 403));
    }
    next();
};
exports.adminOnly = adminOnly;
const sellerOnly = (req, res, next) => {
    if (req.user?.role !== 'SELLER' && req.user?.role !== 'ADMIN') {
        return next(new errorHandler_1.AppError('Seller access only', 403));
    }
    next();
};
exports.sellerOnly = sellerOnly;
