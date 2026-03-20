import { Router } from 'express'
import { startStream, endStream, getLiveStreams, getRecordings, getStream, updateViewers, deleteStream } from '../controllers/live.controller'
import { protect, sellerOnly } from '../middleware/auth'

const router = Router()

router.get('/', getLiveStreams)
router.get('/recordings', getRecordings)
router.get('/:streamId', getStream)
router.post('/start', protect, sellerOnly, startStream)
router.post('/:streamId/end', protect, sellerOnly, endStream)
router.put('/:streamId/viewers', updateViewers)
router.delete('/:streamId', protect, sellerOnly, deleteStream)

export default router