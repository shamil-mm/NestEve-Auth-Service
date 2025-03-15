import { Router } from "express";

export interface IAuthRoutes {
  path: string;
  router: Router;
}
export interface IAdminRoutes {
  path: string;
  router: Router;
}
