"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const product_routes_1 = __importDefault(require("./routes/product.routes"));
const category_routes_1 = __importDefault(require("./routes/category.routes"));
const cart_routes_1 = __importDefault(require("./routes/cart.routes"));
const order_routes_1 = __importDefault(require("./routes/order.routes"));
const review_routes_1 = __importDefault(require("./routes/review.routes"));
const wishlist_routes_1 = __importDefault(require("./routes/wishlist.routes"));
const address_routes_1 = __importDefault(require("./routes/address.routes"));
const seller_routes_1 = __importDefault(require("./routes/seller.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const upload_routes_1 = __importDefault(require("./routes/upload.routes"));
const misc_routes_1 = __importDefault(require("./routes/misc.routes"));
const live_routes_1 = __importDefault(require("./routes/live.routes"));
const errorHandler_1 = require("./middleware/errorHandler");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)('dev'));
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json({ limit: '20mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '20mb' }));
app.use((0, cookie_parser_1.default)());
// Health Check
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '🛒 BELLMAK API is running!',
        version: '1.0.0'
    });
});
// Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/products', product_routes_1.default);
app.use('/api/categories', category_routes_1.default);
app.use('/api/cart', cart_routes_1.default);
app.use('/api/orders', order_routes_1.default);
app.use('/api/reviews', review_routes_1.default);
app.use('/api/wishlist', wishlist_routes_1.default);
app.use('/api/addresses', address_routes_1.default);
app.use('/api/seller', seller_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
app.use('/api/live', live_routes_1.default);
app.use('/api/upload', upload_routes_1.default);
app.use('/api', misc_routes_1.default);
// 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
    });
});
app.use(errorHandler_1.errorHandler);
app.listen(PORT, () => {
    console.log(`✅ BELLMAK Server running on http://localhost:${PORT}`);
});
exports.default = app;
