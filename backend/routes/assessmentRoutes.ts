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

export default router;
