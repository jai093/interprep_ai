import { Router } from 'express';
import {
  getCandidateProfile,
  updateCandidateProfile,
  getCareerRoadmap,
  updateCareerRoadmap,
  getInterviewHistory,
  addInterviewSession,
  getInterviewSession,
} from '../controllers/candidateController';
import { authenticateToken, authorizeRole } from '../middleware/auth';

const router = Router();

// All candidate routes require authentication and candidate role
router.use(authenticateToken, authorizeRole(['candidate']));

// Profile routes
router.get('/profile', getCandidateProfile);
router.put('/profile', updateCandidateProfile);

// Career roadmap routes
router.get('/roadmap', getCareerRoadmap);
router.put('/roadmap', updateCareerRoadmap);

// Interview history routes
router.get('/interviews', getInterviewHistory);
router.post('/interviews', addInterviewSession);
router.get('/interviews/:interviewId', getInterviewSession);

export default router;
