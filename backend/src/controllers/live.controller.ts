import { Response, NextFunction } from 'express'
import { RtcTokenBuilder, RtcRole } from 'agora-access-token'
import { prisma } from '../config/database'
import { AuthRequest } from '../middleware/auth'
import { sendResponse } from '../utils/helpers'

const APP_ID = process.env.AGORA_APP_ID!
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE!

const generateToken = (channelName: string, uid: number, role: number) => {
  if (!APP_CERTIFICATE) return null
  const expireTime = Math.floor(Date.now() / 1000) + 3600
  return RtcTokenBuilder.buildTokenWithUid(
    APP_ID, APP_CERTIFICATE, channelName, uid, role, expireTime
  )
}

// POST /api/live/start
export const startStream = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const seller = await prisma.seller.findUnique({ where: { userId: req.user!.id } })
    if (!seller) throw new Error('Seller not found')

    const { title, description, productIds = [] } = req.body
    if (!title) throw new Error('Stream title required')

    const channelName = `bellmak_${seller.id}_${Date.now()}`
    const uid = Math.floor(Math.random() * 100000)
    const token = generateToken(channelName, uid, RtcRole.PUBLISHER)

    const stream = await prisma.liveStream.create({
      data: {
        sellerId: seller.id,
        title,
        description: description || '',
        channelName,
        status: 'LIVE',
        productIds,
        viewerCount: 0,
        startedAt: new Date(),
      }
    })

    sendResponse(res, 200, true, 'Stream started', {
      stream, agoraToken: token, appId: APP_ID, channelName, uid,
    })
  } catch (err) { next(err) }
}

// POST /api/live/:streamId/end
export const endStream = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const seller = await prisma.seller.findUnique({ where: { userId: req.user!.id } })
    const stream = await prisma.liveStream.findFirst({
      where: { id: req.params.streamId, sellerId: seller?.id }
    })
    if (!stream) throw new Error('Stream not found')

    const updated = await prisma.liveStream.update({
      where: { id: stream.id },
      data: { status: 'ENDED', endedAt: new Date() }
    })
    sendResponse(res, 200, true, 'Stream ended', updated)
  } catch (err) { next(err) }
}

// GET /api/live
export const getLiveStreams = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const streams = await prisma.liveStream.findMany({
      where: { status: 'LIVE' },
      orderBy: { viewerCount: 'desc' },
      include: {
        seller: {
          select: {
            businessName: true,
            user: { select: { name: true, avatar: true } }
          }
        }
      }
    })
    sendResponse(res, 200, true, 'Live streams', streams)
  } catch (err) { next(err) }
}

// GET /api/live/recordings
export const getRecordings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const where: any = { status: 'ENDED' }
    if (req.user) {
      const seller = await prisma.seller.findUnique({ where: { userId: req.user.id } })
      if (seller && req.query.mine === 'true') where.sellerId = seller.id
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
    sendResponse(res, 200, true, 'Recordings', recordings)
  } catch (err) { next(err) }
}

// GET /api/live/:streamId
export const getStream = async (req: AuthRequest, res: Response, next: NextFunction) => {
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
    if (!stream) throw new Error('Stream not found')

    const uid = Math.floor(Math.random() * 100000)
    const token = generateToken(stream.channelName, uid, RtcRole.SUBSCRIBER)

    sendResponse(res, 200, true, 'Stream details', {
      stream, agoraToken: token, appId: APP_ID, uid,
    })
  } catch (err) { next(err) }
}

// PUT /api/live/:streamId/viewers
export const updateViewers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { count } = req.body
    await prisma.liveStream.update({
      where: { id: req.params.streamId },
      data: { viewerCount: count }
    })
    sendResponse(res, 200, true, 'Updated')
  } catch (err) { next(err) }
}

export const deleteStream = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const seller = await prisma.seller.findUnique({ where: { userId: req.user!.id } })
    const stream = await prisma.liveStream.findFirst({
      where: { id: req.params.streamId, sellerId: seller?.id }
    })
    if (!stream) throw new Error('Stream not found')
    await prisma.liveStream.delete({ where: { id: stream.id } })
    sendResponse(res, 200, true, 'Recording deleted')
  } catch (err) { next(err) }
}