import { Request, Response } from 'express';
import { createSubmissionSchema } from '../validators/submission.validator';
import { updateViewsSchema } from '../validators/view-update.validator';
import * as submissionService from '../services/submission.service';

export async function create(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.role !== 'creator') {
      res.status(403).json({ error: 'Only creators can submit campaign posts' });
      return;
    }

    const parseResult = createSubmissionSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const result = await submissionService.createSubmission(req.user.userId, parseResult.data);
    if (!result.success) {
      res.status(result.status).json({ error: result.error });
      return;
    }

    res.status(201).json({
      message: 'Post submitted successfully',
      submission: result.submission,
    });
  } catch (error) {
    console.error('[submission.controller.create] Error:', error);
    res.status(500).json({ error: 'Internal server error while creating submission' });
  }
}

export async function listMine(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.role !== 'creator') {
      res.status(403).json({ error: 'Only creators can view their submissions' });
      return;
    }

    const submissions = await submissionService.getCreatorSubmissions(req.user.userId);
    res.status(200).json({
      count: submissions.length,
      submissions,
    });
  } catch (error) {
    console.error('[submission.controller.listMine] Error:', error);
    res.status(500).json({ error: 'Internal server error while fetching submissions' });
  }
}

export async function getEarnings(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.role !== 'creator') {
      res.status(403).json({ error: 'Only creators can view earnings analytics' });
      return;
    }

    const earnings = await submissionService.getCreatorEarnings(req.user.userId);
    res.status(200).json({ earnings });
  } catch (error) {
    console.error('[submission.controller.getEarnings] Error:', error);
    res.status(500).json({ error: 'Internal server error while fetching creator earnings' });
  }
}

/**
 * PATCH /api/submissions/:id/views
 * Simulates platform view updates from Instagram/YouTube crawlers.
 * No role check required as specified in the assignment PDF.
 */
export async function updateViews(req: Request, res: Response): Promise<void> {
  try {
    const submissionId = req.params.id as string;

    const parseResult = updateViewsSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const result = await submissionService.updateViews(submissionId, parseResult.data.views);
    if (!result.success) {
      res.status(result.status).json({ error: result.error });
      return;
    }

    res.status(200).json(result.data);
  } catch (error) {
    console.error('[submission.controller.updateViews] Error:', error);
    res.status(500).json({ error: 'Internal server error while updating views' });
  }
}
