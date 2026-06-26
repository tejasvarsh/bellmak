import { Response, NextFunction } from 'express'
import { RtcTokenBuilder, RtcRole } from 'agora-access-token'
import { prisma } from '../config/database'
import { AuthRequest } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'
import { sendResponse } from '../utils/helpers'

const APP_ID = process.env.AGORA_APP_ID!
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE!

const generateToken = (channelName: string, uid: number, role: number) => {
  if (!APP_ID || !APP_CERTIFICATE) {
    throw new AppError('Agora configuration missing', 500)
  }

  const expireTime = Math.floor(Date.now() / 1000) + 3600 // 1 hour
  return RtcTokenBuilder.buildTokenWithUid(
    APP_ID,
    APP_CERTIFICATE,
    channelName,
    uid,
    role,
    expireTime
  )
}

// POST /api/live/start
export const startStream = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const seller = await prisma.seller.findUnique({
      where: { userId: req.user!.id }
    })

    if (!seller || !seller.isApproved) {
      throw new AppError('Seller account not approved', 403)
    }

    const { title, description = '', productIds = [] } = req.body

    if (!title || title.trim().length < 3) {
      throw new AppError('Stream title must be at least 3 characters', 400)
    }

    const channelName = `bellmak_${seller.id}_${Date.now()}`
    const uid = Math.floor(Math.random() * 1000000) + 1

    const token = generateToken(channelName, uid, RtcRole.PUBLISHER)

    const stream = await prisma.liveStream.create({
      data: {
        sellerId: seller.id,
        title: title.trim(),
        description,
        channelName,
        status: 'LIVE',
        productIds: Array.isArray(productIds) ? productIds : [],
        viewerCount: 0,
        startedAt: new Date(),
        thumbnail: null
      }
    })

    sendResponse(res, 200, true, 'Live stream started successfully', {
      stream,
      agora: {
        appId: APP_ID,
        channelName,
        uid,
        token,
        role: 'publisher'
      }
    })
  } catch (err) {
    next(err)
  }
}

// POST /api/live/:streamId/end
export const endStream = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stream = await prisma.liveStream.findFirst({
      where: {
        id: req.params.streamId,
        sellerId: (await prisma.seller.findUnique({ where: { userId: req.user!.id } }))?.id
      }
    })

    if (!stream) throw new AppError('Stream not found or you are not the owner', 404)

    const updated = await prisma.liveStream.update({
      where: { id: stream.id },
      data: { 
        status: 'ENDED', 
        endedAt: new Date() 
      }
    })

    sendResponse(res, 200, true, 'Live stream ended successfully', updated)
  } catch (err) {
    next(err)
  }
}

// GET /api/live
export const getLiveStreams = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const streams = await prisma.liveStream.findMany({
      where: { status: 'LIVE' },
      orderBy: { viewerCount: 'desc' },
      include: {
        seller: {
          select: {
            businessName: true,
            user: {
              select: { name: true, avatar: true }
            }
          }
        }
      }
    })

    sendResponse(res, 200, true, 'Live streams fetched', streams)
  } catch (err) {
    next(err)
  }
}

// GET /api/live/:streamId
export const getStream = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stream = await prisma.liveStream.findUnique({
      where: { id: req.params.streamId },
      include: {
        seller: {
          select: {
            businessName: true,
            user: { select: { name: true, avatar: true } }
          }
        }
      }
    })

    if (!stream) throw new AppError('Stream not found', 404)

    const uid = Math.floor(Math.random() * 1000000) + 1
    const token = generateToken(stream.channelName, uid, RtcRole.SUBSCRIBER)

    sendResponse(res, 200, true, 'Stream details', {
      stream,
      agora: {
        appId: APP_ID,
        channelName: stream.channelName,
        uid,
        token,
        role: 'subscriber'
      }
    })
  } catch (err) {
    next(err)
  }
}

// PUT /api/live/:streamId/viewers  → Yeh ab protected aur safe
export const updateViewers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { count } = req.body
    if (typeof count !== 'number' || count < 0) {
      throw new AppError('Invalid viewer count', 400)
    }

    await prisma.liveStream.update({
      where: { id: req.params.streamId },
      data: { viewerCount: count }
    })

    sendResponse(res, 200, true, 'Viewer count updated')
  } catch (err) {
    next(err)
  }
}

export const getRecordings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const where: any = { status: 'ENDED' }

    if (req.query.mine === 'true' && req.user) {
      const seller = await prisma.seller.findUnique({ where: { userId: req.user.id } })
      if (seller) where.sellerId = seller.id
    }

    const recordings = await prisma.liveStream.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      take: 20,
      include: {
        seller: {
          select: {
            businessName: true,
            user: { select: { name: true, avatar: true } }
          }
        }
      }
    })

    sendResponse(res, 200, true, 'Recordings fetched', recordings)
  } catch (err) {
    next(err)
  }
}

export const deleteStream = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const seller = await prisma.seller.findUnique({ where: { userId: req.user!.id } })
    const stream = await prisma.liveStream.findFirst({
      where: { 
        id: req.params.streamId, 
        sellerId: seller?.id 
      }
    })

    if (!stream) throw new AppError('Stream not found or unauthorized', 404)

    await prisma.liveStream.delete({ where: { id: stream.id } })
    sendResponse(res, 200, true, 'Recording deleted successfully')
  } catch (err) {
    next(err)
  }
}