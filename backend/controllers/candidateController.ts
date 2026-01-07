import { Request, Response, NextFunction } from 'express';
import CandidateProfile, { ICandidateProfile } from '../models/CandidateProfile';
import CareerRoadmap from '../models/CareerRoadmap';
import InterviewSession from '../models/InterviewSession';
import type { UserProfile, CareerRoadmap as CareerRoadmapType, InterviewSession as InterviewSessionType } from '../../types';

export const getCandidateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    let profile = await CandidateProfile.findOne({ user: req.user.userId });
    
    // If profile doesn't exist, create a default one
    if (!profile) {
      profile = new CandidateProfile({
        user: req.user.userId,
        fullName: '',
        linkedinUrl: '',
        skills: [],
        languages: [],
        profilePhotoUrl: '',
        resumeText: '',
        resumeData: {},
      });
      await profile.save();
    }

    res.status(200).json(profile);
  } catch (error) {
    next(error);
  }
};

export const updateCandidateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { fullName, linkedinUrl, skills, languages, profilePhotoUrl, resumeText, resumeData } = req.body;

    // Use upsert: true to create profile if it doesn't exist
    const profile = await CandidateProfile.findOneAndUpdate(
      { user: req.user.userId },
      {
        fullName: fullName || undefined,
        linkedinUrl: linkedinUrl || undefined,
        skills: skills || undefined,
        languages: languages || undefined,
        profilePhotoUrl: profilePhotoUrl || undefined,
        resumeText: resumeText || undefined,
        resumeData: resumeData || undefined,
      },
      { new: true, upsert: true }
    );

    res.status(200).json({
      message: 'Profile updated successfully',
      profile,
    });
  } catch (error) {
    next(error);
  }
};

export const getCareerRoadmap = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const roadmap = await CareerRoadmap.findOne({ user: req.user.userId });
    if (!roadmap) {
      res.status(404).json({ error: 'Career roadmap not found' });
      return;
    }

    res.status(200).json(roadmap);
  } catch (error) {
    next(error);
  }
};

export const updateCareerRoadmap = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { targetRole, skillGaps, shortTermPlan, longTermPlan } = req.body;

    let roadmap = await CareerRoadmap.findOne({ user: req.user.userId });

    if (!roadmap) {
      roadmap = new CareerRoadmap({
        user: req.user.userId,
        targetRole,
        skillGaps,
        shortTermPlan,
        longTermPlan,
      });
    } else {
      roadmap.targetRole = targetRole || roadmap.targetRole;
      roadmap.skillGaps = skillGaps || roadmap.skillGaps;
      roadmap.shortTermPlan = shortTermPlan || roadmap.shortTermPlan;
      roadmap.longTermPlan = longTermPlan || roadmap.longTermPlan;
    }

    await roadmap.save();

    res.status(200).json({
      message: 'Career roadmap updated successfully',
      roadmap,
    });
  } catch (error) {
    next(error);
  }
};

export const getInterviewHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const sessions = await InterviewSession.find({ user: req.user.userId }).sort({ date: -1 });

    res.status(200).json(sessions);
  } catch (error) {
    next(error);
  }
};

export const addInterviewSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { date, type, duration, averageScore, config, transcript, summary } = req.body;

    if (!date || !type || duration === undefined || averageScore === undefined) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const session = new InterviewSession({
      user: req.user.userId,
      date: new Date(date),
      type,
      duration,
      averageScore,
      config,
      transcript,
      summary,
    });

    await session.save();

    res.status(201).json({
      message: 'Interview session created successfully',
      session,
    });
  } catch (error) {
    next(error);
  }
};

export const getInterviewSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { interviewId } = req.params;

    const session = await InterviewSession.findOne({ _id: interviewId, user: req.user.userId });
    if (!session) {
      res.status(404).json({ error: 'Interview session not found' });
      return;
    }

    res.status(200).json(session);
  } catch (error) {
    next(error);
  }
};
