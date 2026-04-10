"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteStream = exports.updateViewers = exports.getStream = exports.getRecordings = exports.getLiveStreams = exports.endStream = exports.startStream = void 0;
const agora_access_token_1 = require("agora-access-token");
const database_1 = require("../config/database");
const helpers_1 = require("../utils/helpers");
const APP_ID = process.env.AGORA_APP_ID;
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;
const generateToken = (channelName, uid, role) => {
    if (!APP_CERTIFICATE)
        return null;
    const expireTime = Math.floor(Date.now() / 1000) + 3600;
    return agora_access_token_1.RtcTokenBuilder.buildTokenWithUid(APP_ID, APP_CERTIFICATE, channelName, uid, role, expireTime);
};
// POST /api/live/start
const startStream = async (req, res, next) => {
    try {
        const seller = await database_1.prisma.seller.findUnique({ where: { userId: req.user.id } });
        if (!seller)
            throw new Error('Seller not found');
        const { title, description, productIds = [] } = req.body;
        if (!title)
            throw new Error('Stream title required');
        const channelName = `bellmak_${seller.id}_${Date.now()}`;
        const uid = Math.floor(Math.random() * 100000);
        const token = generateToken(channelName, uid, agora_access_token_1.RtcRole.PUBLISHER);
        const stream = await database_1.prisma.liveStream.create({
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
        });
        (0, helpers_1.sendResponse)(res, 200, true, 'Stream started', {
            stream, agoraToken: token, appId: APP_ID, channelName, uid,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.startStream = startStream;
// POST /api/live/:streamId/end
const endStream = async (req, res, next) => {
    try {
        const seller = await database_1.prisma.seller.findUnique({ where: { userId: req.user.id } });
        const stream = await database_1.prisma.liveStream.findFirst({
            where: { id: req.params.streamId, sellerId: seller?.id }
        });
        if (!stream)
            throw new Error('Stream not found');
        const updated = await database_1.prisma.liveStream.update({
            where: { id: stream.id },
            data: { status: 'ENDED', endedAt: new Date() }
        });
        (0, helpers_1.sendResponse)(res, 200, true, 'Stream ended', updated);
    }
    catch (err) {
        next(err);
    }
};
exports.endStream = endStream;
// GET /api/live
const getLiveStreams = async (req, res, next) => {
    try {
        const streams = await database_1.prisma.liveStream.findMany({
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
        });
        (0, helpers_1.sendResponse)(res, 200, true, 'Live streams', streams);
    }
    catch (err) {
        next(err);
    }
};
exports.getLiveStreams = getLiveStreams;
// GET /api/live/recordings
const getRecordings = async (req, res, next) => {
    try {
        const where = { status: 'ENDED' };
        if (req.user) {
            const seller = await database_1.prisma.seller.findUnique({ where: { userId: req.user.id } });
            if (seller && req.query.mine === 'true')
                where.sellerId = seller.id;
        }
        const recordings = await database_1.prisma.liveStream.findMany({
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
        });
        (0, helpers_1.sendResponse)(res, 200, true, 'Recordings', recordings);
    }
    catch (err) {
        next(err);
    }
};
exports.getRecordings = getRecordings;
// GET /api/live/:streamId
const getStream = async (req, res, next) => {
    try {
        const stream = await database_1.prisma.liveStream.findUnique({
            where: { id: req.params.streamId },
            include: {
                seller: {
                    select: {
                        businessName: true,
                        user: { select: { name: true, avatar: true } }
                    }
                }
            }
        });
        if (!stream)
            throw new Error('Stream not found');
        const uid = Math.floor(Math.random() * 100000);
        const token = generateToken(stream.channelName, uid, agora_access_token_1.RtcRole.SUBSCRIBER);
        (0, helpers_1.sendResponse)(res, 200, true, 'Stream details', {
            stream, agoraToken: token, appId: APP_ID, uid,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getStream = getStream;
// PUT /api/live/:streamId/viewers
const updateViewers = async (req, res, next) => {
    try {
        const { count } = req.body;
        await database_1.prisma.liveStream.update({
            where: { id: req.params.streamId },
            data: { viewerCount: count }
        });
        (0, helpers_1.sendResponse)(res, 200, true, 'Updated');
    }
    catch (err) {
        next(err);
    }
};
exports.updateViewers = updateViewers;
const deleteStream = async (req, res, next) => {
    try {
        const seller = await database_1.prisma.seller.findUnique({ where: { userId: req.user.id } });
        const stream = await database_1.prisma.liveStream.findFirst({
            where: { id: req.params.streamId, sellerId: seller?.id }
        });
        if (!stream)
            throw new Error('Stream not found');
        await database_1.prisma.liveStream.delete({ where: { id: stream.id } });
        (0, helpers_1.sendResponse)(res, 200, true, 'Recording deleted');
    }
    catch (err) {
        next(err);
    }
};
exports.deleteStream = deleteStream;
