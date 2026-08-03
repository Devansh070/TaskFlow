import { prisma } from "../lib/prisma";
import { ActivityTargetType } from "@prisma/client";

export async function logActivity(
  boardId: string,
  userId: string,
  action: string,
  targetType: ActivityTargetType,
  targetId: string,
) {
  return prisma.activityLog.create({
    data: { boardId, userId, action, targetType, targetId },
  });
}

export async function getRecentActivity(boardId: string, limit = 30) {
  return prisma.activityLog.findMany({
    where: { boardId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { user: { select: { id: true, name: true } } },
  });
}