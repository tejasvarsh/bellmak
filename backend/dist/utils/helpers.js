"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExpectedDelivery = exports.calculateDeliveryCharge = exports.sendResponse = exports.generateSlug = exports.calculateDiscount = exports.formatPrice = exports.generateOrderId = exports.param = void 0;
// Generate Order ID like BLM-2024-XXXXX
// Fix for Express 5 params type issue
const param = (p) => {
    return Array.isArray(p) ? p[0] : p;
};
exports.param = param;
const generateOrderId = () => {
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `BLM-${year}-${random}`;
};
exports.generateOrderId = generateOrderId;
// Format price in Indian format ₹1,00,000
const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0
    }).format(price);
};
exports.formatPrice = formatPrice;
// Calculate discount percentage
const calculateDiscount = (mrp, price) => {
    return Math.round(((mrp - price) / mrp) * 100);
};
exports.calculateDiscount = calculateDiscount;
// Generate slug from title
const generateSlug = (title) => {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
};
exports.generateSlug = generateSlug;
// Standard API response
const sendResponse = (res, statusCode, success, message, data, pagination) => {
    const response = { success, message };
    if (data !== undefined)
        response.data = data;
    if (pagination)
        response.pagination = pagination;
    return res.status(statusCode).json(response);
};
exports.sendResponse = sendResponse;
// Delivery charge logic
const calculateDeliveryCharge = (orderAmount) => {
    return orderAmount >= 499 ? 0 : 40;
};
exports.calculateDeliveryCharge = calculateDeliveryCharge;
// Calculate expected delivery date
const getExpectedDelivery = (city) => {
    const days = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad'].includes(city)
        ? 2 // Metro: 2 days
        : 5; // Others: 5 days
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
};
exports.getExpectedDelivery = getExpectedDelivery;
