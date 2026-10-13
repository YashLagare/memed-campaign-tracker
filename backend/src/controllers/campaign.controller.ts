import { Request, Response } from 'express';
import { createCampaignSchema } from '../validators/campaign.validator';
import * as campaignService from '../services/campaign.service';

export async function create(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.role !== 'brand') {
      res.status(403).json({ error: 'Only brands can create campaigns' });
      return;
    }

    const parseResult = createCampaignSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const campaign = await campaignService.createCampaign(req.user.userId, parseResult.data);
    res.status(201).json({
      message: 'Campaign created successfully',
      campaign,
    });
  } catch (error) {
    console.error('[campaign.controller.create] Error:', error);
    res.status(500).json({ error: 'Internal server error while creating campaign' });
  }
}

export async function listLive(_req: Request, res: Response): Promise<void> {
  try {
    const campaigns = await campaignService.getActiveCampaigns();
    res.status(200).json({
      count: campaigns.length,
      campaigns,
    });
  } catch (error) {
    console.error('[campaign.controller.listLive] Error:', error);
    res.status(500).json({ error: 'Internal server error while fetching live campaigns' });
  }
}

export async function listMine(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.role !== 'brand') {
      res.status(403).json({ error: 'Only brands can access their created campaigns' });
      return;
    }

    const campaigns = await campaignService.getBrandCampaigns(req.user.userId);
    res.status(200).json({
      count: campaigns.length,
      campaigns,
    });
  } catch (error) {
    console.error('[campaign.controller.listMine] Error:', error);
    res.status(500).json({ error: 'Internal server error while fetching brand campaigns' });
  }
}

export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const campaign = await campaignService.getCampaignById(id);

    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    res.status(200).json({ campaign });
  } catch (error) {
    console.error('[campaign.controller.getById] Error:', error);
    res.status(500).json({ error: 'Internal server error while fetching campaign' });
  }
}
