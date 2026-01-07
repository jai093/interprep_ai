import { Request, Response, NextFunction } from 'express';
import Assessment from '../models/Assessment';
import AssessmentResult from '../models/AssessmentResult';
import type { InterviewSession as InterviewSessionType } from '../../types';

export const getPublicAssessment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { assessmentId } = req.params;

    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      res.status(404).json({ error: 'Assessment not found' });
      return;
    }

    res.status(200).json(assessment);
  } catch (error) {
    next(error);
  }
};

export const submitAssessmentResult = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { assessmentId } = req.params;
    const { candidateName, candidateEmail, session } = req.body;

    if (!candidateName || !candidateEmail || !session) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      res.status(404).json({ error: 'Assessment not found' });
      return;
    }

    const result = new AssessmentResult({
      assessment: assessmentId,
      candidateName,
      candidateEmail,
      candidateUser: req.user?.userId || undefined,
      session,
    });

    await result.save();

    res.status(201).json({
      message: 'Assessment result submitted successfully',
      result,
    });
  } catch (error) {
    next(error);
  }
};

export const getAssessmentResultsPublic = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { assessmentId } = req.params;

    const results = await AssessmentResult.find({ assessment: assessmentId });

    res.status(200).json(results);
  } catch (error) {
    next(error);
  }
};
