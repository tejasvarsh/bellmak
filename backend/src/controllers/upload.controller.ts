import { Request, Response, NextFunction } from 'express'
import { v2 as cloudinary } from 'cloudinary'
import { AuthRequest } from '../middleware/auth'
import { sendResponse } from '../utils/helpers'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export const uploadImage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { image, folder = 'bellmak/products' } = req.body
    if (!image) throw new Error('No image provided')
    const result = await cloudinary.uploader.upload(image, {
      folder,
      transformation: [
        { width: 800, height: 800, crop: 'limit' },
        { quality: 'auto', fetch_format: 'auto' }
      ]
    })
    sendResponse(res, 200, true, 'Image uploaded', {
      url: result.secure_url,
      publicId: result.public_id,
    })
  } catch (err) { next(err) }
}

export const uploadMultipleImages = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { images, folder = 'bellmak/products' } = req.body
    if (!images || !Array.isArray(images) || images.length === 0) throw new Error('No images provided')
    if (images.length > 5) throw new Error('Max 5 images allowed')
    const uploads = await Promise.all(
      images.map((img: string) =>
        cloudinary.uploader.upload(img, {
          folder,
          transformation: [
            { width: 800, height: 800, crop: 'limit' },
            { quality: 'auto', fetch_format: 'auto' }
          ]
        })
      )
    )
    sendResponse(res, 200, true, 'Images uploaded', {
      urls: uploads.map(r => r.secure_url),
      publicIds: uploads.map(r => r.public_id),
    })
  } catch (err) { next(err) }
}

export const deleteImage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { publicId } = req.body
    if (!publicId) throw new Error('No publicId provided')
    await cloudinary.uploader.destroy(publicId)
    sendResponse(res, 200, true, 'Image deleted')
  } catch (err) { next(err) }
}