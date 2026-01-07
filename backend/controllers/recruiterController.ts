import { Request, Response, NextFunction } from 'express';
import RecruiterProfile from '../models/RecruiterProfile';
import RecruiterSettings from '../models/RecruiterSettings';
import Assessment from '../models/Assessment';
import AssessmentResult from '../models/AssessmentResult';
import type { RecruiterProfile as RecruiterProfileType, RecruiterSettings as RecruiterSettingsType } from '../../types';

export const getRecruiterProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const profile = await RecruiterProfile.findOne({ user: req.user.userId });
    if (!profile) {
      res.status(404).json({ error: 'Recruiter profile not found' });
      return;
    }

    res.status(200).json(profile);
  } catch (error) {
    next(error);
  }
};

export const updateRecruiterProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { fullName, company } = req.body;

    const profile = await RecruiterProfile.findOneAndUpdate(
      { user: req.user.userId },
      {
        fullName: fullName || undefined,
        company: company || undefined,
      },
      { new: true }
    );

    if (!profile) {
      res.status(404).json({ error: 'Recruiter profile not found' });
      return;
    }

    res.status(200).json({
      message: 'Profile updated successfully',
      profile,
    });
  } catch (error) {
    next(error);
  }
};

export const getRecruiterSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const settings = await RecruiterSettings.findOne({ user: req.user.userId });
    if (!settings) {
      res.status(404).json({ error: 'Recruiter settings not found' });
      return;
    }

    res.status(200).json(settings);
  } catch (error) {
    next(error);
  }
};

export const updateRecruiterSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { emailNotifications, assessmentReminders, weeklyReports, autoReject, passingScore, timeLimit } =
      req.body;

    const settings = await RecruiterSettings.findOneAndUpdate(
      { user: req.user.userId },
      {
        emailNotifications: emailNotifications !== undefined ? emailNotifications : undefined,
        assessmentReminders: assessmentReminders !== undefined ? assessmentReminders : undefined,
        weeklyReports: weeklyReports !== undefined ? weeklyReports : undefined,
        autoReject: autoReject !== undefined ? autoReject : undefined,
        passingScore: passingScore !== undefined ? passingScore : undefined,
        timeLimit: timeLimit !== undefined ? timeLimit : undefined,
      },
      { new: true }
    );

    if (!settings) {
      res.status(404).json({ error: 'Recruiter settings not found' });
      return;
    }

    res.status(200).json({
      message: 'Settings updated successfully',
      settings,
    });
  } catch (error) {
    next(error);
  }
};

export const getAssessments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // createdBy is stored as the recruiter's email to match frontend expectations
    const assessments = await Assessment.find({ createdBy: req.user.email }).sort({ createdAt: -1 });

    // Transform MongoDB documents to match frontend Assessment interface (convert _id to id)
    const serialized = assessments.map(doc => ({
      id: doc._id.toString(),
      jobRole: doc.jobRole,
      createdBy: doc.createdBy,
      createdAt: doc.createdAt.toISOString(),
      config: doc.config,
      questions: doc.questions,
    }));

    res.status(200).json(serialized);
  } catch (error) {
    next(error);
  }
};

export const createAssessment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { jobRole, config, questions } = req.body;

    if (!jobRole || !config || !questions || !Array.isArray(questions) || questions.length === 0) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Store createdBy as the recruiter's email so the frontend can match on email
    const assessment = new Assessment({
      createdBy: req.user.email,
      jobRole,
      config,
      questions,
    });

    await assessment.save();

    // Transform MongoDB document to match frontend Assessment interface (convert _id to id)
    const serialized = {
      id: assessment._id.toString(),
      jobRole: assessment.jobRole,
      createdBy: assessment.createdBy,
      createdAt: assessment.createdAt.toISOString(),
      config: assessment.config,
      questions: assessment.questions,
    };

    res.status(201).json({
      message: 'Assessment created successfully',
      assessment: serialized,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAssessment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { assessmentId } = req.params;

    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      res.status(404).json({ error: 'Assessment not found' });
      return;
    }
    
    // createdBy is stored as email; verify it matches the requesting user's email
    if (assessment.createdBy !== req.user.email) {
      res.status(403).json({ error: 'Not authorized to delete this assessment' });
      return;
    }

    await Assessment.findByIdAndDelete(assessmentId);

    res.status(200).json({ message: 'Assessment deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getAssessmentResults = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Find results and ensure we only return those for assessments created by this recruiter (by email)
    const results = await AssessmentResult.find()
      .populate({
        path: 'assessment',
        match: { createdBy: req.user.email },
      })
      .sort({ createdAt: -1 });

    // Filter out results where the assessment was not found (not created by this recruiter)
    const filteredResults = results.filter((result) => result.assessment);

    res.status(200).json(filteredResults);
  } catch (error) {
    next(error);
  }
};

export const getAssessmentResult = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { resultId } = req.params;

    const result = await AssessmentResult.findById(resultId).populate('assessment');
    if (!result) {
      res.status(404).json({ error: 'Assessment result not found' });
      return;
    }

    if ((result.assessment as any).createdBy !== req.user.email) {
      res.status(403).json({ error: 'Not authorized to view this result' });
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
