import { Request, Response } from "express";
import * as authService from "../services/auth.service";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export async function signup(req: Request, res: Response) {
  const { email, password, name } = req.body;
  const { token, user } = await authService.signup(email, password, name);
  res.cookie("token", token, COOKIE_OPTIONS);
  res.status(201).json({ user });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  const { token, user } = await authService.login(email, password);
  res.cookie("token", token, COOKIE_OPTIONS);
  res.status(200).json({ user });
}

export async function logout(_req: Request, res: Response) {
  res.clearCookie("token");
  res.status(204).send();
}