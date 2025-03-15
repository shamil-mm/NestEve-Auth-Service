import { NextFunction, Request, Response } from "express";

export interface IAdminController {
  getUser(req: Request, res: Response, next: NextFunction): Promise<void>;
  getOrganizers(req: Request, res: Response, next: NextFunction): Promise<void>;
  blockUser(req: Request, res: Response, next: NextFunction): Promise<void>;
}
