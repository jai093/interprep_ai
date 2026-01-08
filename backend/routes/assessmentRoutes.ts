import { Router } from 'express';
import {
  getPublicAssessment,
  submitAssessmentResult,
  getAssessmentResultsPublic,
} from '../controllers/assessmentController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public assessment routes
router.get('/:assessmentId', getPublicAssessment);
router.post('/:assessmentId/submit', submitAssessmentResult);
router.get('/:assessmentId/results', getAssessmentResultsPublic);

// AI Engine Routes
import { startAssessment, submitAnswer, getSession } from '../controllers/assessmentController';

router.post('/engine/start', authenticateToken, startAssessment);
router.post('/engine/submit', authenticateToken, submitAnswer);
router.get('/engine/session/:sessionId', authenticateToken, getSession);

export default router;
