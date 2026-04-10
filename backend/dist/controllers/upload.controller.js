"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteImage = exports.uploadMultipleImages = exports.uploadImage = void 0;
const cloudinary_1 = require("cloudinary");
const helpers_1 = require("../utils/helpers");
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
const uploadImage = async (req, res, next) => {
    try {
        const { image, folder = 'bellmak/products' } = req.body;
        if (!image)
            throw new Error('No image provided');
        const result = await cloudinary_1.v2.uploader.upload(image, {
            folder,
            transformation: [
                { width: 800, height: 800, crop: 'limit' },
                { quality: 'auto', fetch_format: 'auto' }
            ]
        });
        (0, helpers_1.sendResponse)(res, 200, true, 'Image uploaded', {
            url: result.secure_url,
            publicId: result.public_id,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.uploadImage = uploadImage;
const uploadMultipleImages = async (req, res, next) => {
    try {
        const { images, folder = 'bellmak/products' } = req.body;
        if (!images || !Array.isArray(images) || images.length === 0)
            throw new Error('No images provided');
        if (images.length > 5)
            throw new Error('Max 5 images allowed');
        const uploads = await Promise.all(images.map((img) => cloudinary_1.v2.uploader.upload(img, {
            folder,
            transformation: [
                { width: 800, height: 800, crop: 'limit' },
                { quality: 'auto', fetch_format: 'auto' }
            ]
        })));
        (0, helpers_1.sendResponse)(res, 200, true, 'Images uploaded', {
            urls: uploads.map(r => r.secure_url),
            publicIds: uploads.map(r => r.public_id),
        });
    }
    catch (err) {
        next(err);
    }
};
exports.uploadMultipleImages = uploadMultipleImages;
const deleteImage = async (req, res, next) => {
    try {
        const { publicId } = req.body;
        if (!publicId)
            throw new Error('No publicId provided');
        await cloudinary_1.v2.uploader.destroy(publicId);
        (0, helpers_1.sendResponse)(res, 200, true, 'Image deleted');
    }
    catch (err) {
        next(err);
    }
};
exports.deleteImage = deleteImage;
