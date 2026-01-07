import { Router } from 'express';
import {
  getRecruiterProfile,
  updateRecruiterProfile,
  getRecruiterSettings,
  updateRecruiterSettings,
  getAssessments,
  createAssessment,
  deleteAssessment,
  getAssessmentResults,
  getAssessmentResult,
} from '../controllers/recruiterController';
import { authenticateToken, authorizeRole } from '../middleware/auth';

const router = Router();

// All recruiter routes require authentication and recruiter role
router.use(authenticateToken, authorizeRole(['recruiter']));

// Profile routes
router.get('/profile', getRecruiterProfile);
router.put('/profile', updateRecruiterProfile);

// Settings routes
router.get('/settings', getRecruiterSettings);
router.put('/settings', updateRecruiterSettings);

// Assessment routes
router.get('/assessments', getAssessments);
router.post('/assessments', createAssessment);
router.delete('/assessments/:assessmentId', deleteAssessment);

// Assessment results routes
router.get('/results', getAssessmentResults);
router.get('/results/:resultId', getAssessmentResult);

export default router;
