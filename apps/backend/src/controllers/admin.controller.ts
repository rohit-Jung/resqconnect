import { HttpStatusCode } from 'axios';
import { asc, count, desc, sql } from 'drizzle-orm';
import type { Request, Response } from 'express';

import db from '@/db';
import { organization, serviceProvider, user } from '@/models';
import ApiError from '@/utils/api/ApiError';
import ApiResponse from '@/utils/api/ApiResponse';
import { asyncHandler } from '@/utils/api/asyncHandler';
import { getRouteParamSchema } from '@/validations/route-params.validations';

function getStatsQuery(
  role: 'serviceProvider' | 'user' | 'organization',
  startOfMonth: Date,
  startOfLastMonth: Date,
  endOfLastMonth: Date
) {
  let entity;
  switch (role) {
    case 'serviceProvider':
      entity = serviceProvider;
      break;
    case 'user':
      entity = user;
      break;
    case 'organization':
      entity = organization;
      break;
  }

  return {
    total: count(),
    thisMonth: sql<number>`count(*) filter (where ${entity.createdAt} >= ${startOfMonth.toISOString()}) `,
    lastMonth: sql<number>`count(*) filter (where ${entity.createdAt} >= ${startOfLastMonth.toISOString()} and ${entity.createdAt} <= ${endOfLastMonth.toISOString()})`,
  };
}

function getFieldMap(role: 'serviceProvider' | 'user' | 'organization') {
  let entity;
  switch (role) {
    case 'serviceProvider':
      entity = serviceProvider;
      break;
    case 'user':
      entity = user;
      break;
    case 'organization':
      entity = organization;
      break;
  }

  return {
    createdAt: entity.createdAt,
    name: entity.name,
    email: entity.email,
  };
}

const getDashboardAnalytics = asyncHandler(
  async (req: Request, res: Response) => {
    const paramsData = getRouteParamSchema.safeParse(req.query);

    if (!paramsData.success) {
      const validationError = new ApiError(
        400,
        'Error validating data',
        paramsData.error.issues.map(
          issue => `${issue.path.join('.')} : ${issue.message}`
        )
      );

      return res.status(400).json(validationError);
    }

    const { page, limit, sortBy, sortField } = paramsData.data;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59
    ); // last day of last month

    const orgMap = getFieldMap('organization');
    const userMap = getFieldMap('user');
    const providerMap = getFieldMap('serviceProvider');

    const order = sortBy === 'asc' ? asc : desc;

    const [orgs, users, providers, orgInfo, userInfo, providerInfo] =
      await Promise.all([
        db
          .select(
            getStatsQuery(
              'organization',
              startOfMonth,
              startOfLastMonth,
              endOfLastMonth
            )
          )
          .from(organization),
        db
          .select(
            getStatsQuery(
              'user',
              startOfMonth,
              startOfLastMonth,
              endOfLastMonth
            )
          )
          .from(user),
        db
          .select(
            getStatsQuery(
              'serviceProvider',
              startOfMonth,
              startOfLastMonth,
              endOfLastMonth
            )
          )
          .from(serviceProvider),

        db
          .select({
            name: organization.name,
            email: organization.email,
            createdAt: organization.createdAt,
          })
          .from(organization)
          .orderBy(order(orgMap[sortField]))
          .limit(limit)
          .offset((page - 1) * limit),

        db
          .select({
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
          })
          .from(user)
          .orderBy(order(userMap[sortField]))
          .limit(limit)
          .offset((page - 1) * limit),

        db
          .select({
            name: serviceProvider.name,
            email: serviceProvider.email,
            createdAt: serviceProvider.createdAt,
          })
          .from(serviceProvider)
          .orderBy(order(providerMap[sortField]))
          .limit(limit)
          .offset((page - 1) * limit),
      ]);

    res.status(HttpStatusCode.Ok).json(
      new ApiResponse(HttpStatusCode.Ok, 'Fetched admin dashboard', {
        orgs: {
          ...orgs[0],
          info: [...orgInfo],
        },
        users: {
          ...users[0],
          info: [...userInfo],
        },
        providers: {
          ...providers[0],
          info: [...providerInfo],
        },
      })
    );
  }
);

export { getDashboardAnalytics };
