// import { and, eq, gte, lte } from 'drizzle-orm';
// // import { Expo, ExpoPushMessage } from 'expo-server-sdk';
// import type { NextFunction, Request, Response } from 'express';
//
// // import { SocketEventEnums, SocketRoom } from '@/constants';
// import db from '@/db';
// import { type TNotification, notifications } from '@/models';
// // import { emitSocketEvent } from '@/socket';
// import ApiError from '@/utils/api/ApiError';
// import ApiResponse from '@/utils/api/ApiResponse';
//
// import { asyncHandler } from '../utils/api/asyncHandler';
//
// // Initialize Expo client
// // const expo = new Expo();
// // const userPushTokens: Record<string, string> = {};
//
// const connectedUsers = new Set<string>();
// const connectedProviders = new Set<string>();
// //
// // const storePushToken = async (userId: string, token: string) => {
// //   if (!Expo.isExpoPushToken(token)) {
// //     throw new Error(`Push token ${token} is not a valid Expo push token`);
// //   }
// //   userPushTokens[userId] = token;
// // };
//
// const getNotifications = asyncHandler(
//   async (req: Request, res: Response, next: NextFunction) => {
//     const { markAsRead, fromDaysAgo, toDaysAgo } = req.body;
//
//     const foundNotifications = await db.query.notifications.findMany({
//       where: and(
//         gte(notifications.createdAt, fromDaysAgo),
//         lte(notifications.createdAt, toDaysAgo),
//         eq(notifications.deliveryStatus, markAsRead ? 'delivered' : 'pending')
//       ),
//     });
//
//     if (!foundNotifications) {
//       return res
//         .status(404)
//         .json(new ApiResponse(404, 'No notifications found', {}));
//     }
//
//     return res
//       .status(200)
//       .json(new ApiResponse(200, 'Notifications found', foundNotifications));
//   }
// );
//
// const createNotification = async (
//   data: Partial<TNotification>,
//   req?: Request
// ) => {
//   try {
//     if (!data.message || !data.type || !data.source || !data.userId) {
//       throw new Error('Missing required fields');
//     }
//
//     const inserted = await db
//       .insert(notifications)
//       .values({
//         message: data.message,
//         type: data.type,
//         source: data.source,
//         userId: data.userId,
//         serviceProviderId: data.serviceProviderId,
//         priority: data.priority || 'low',
//         metadata: data.metadata,
//         deliveryStatus: 'pending',
//         isRead: false,
//         doNotDisturb: false,
//         createdAt: new Date().toISOString(),
//         updatedAt: new Date().toISOString(),
//       })
//       .returning();
//
//     // const token = userPushTokens[data.userId];
//     const isConnected =
//       connectedUsers.has(data.userId) ||
//       (data.serviceProviderId &&
//         connectedProviders.has(data.serviceProviderId));
//
//     // Push only if offline or background
//     if (!isConnected && token && Expo.isExpoPushToken(token)) {
//       const messages: ExpoPushMessage[] = [
//         {
//           to: token,
//           sound: 'default',
//           title: `New ${data.type}`,
//           body: data.message,
//           data: { notificationId: inserted[0].id },
//         },
//       ];
//
//       try {
//         const chunks = expo.chunkPushNotifications(messages);
//         const tickets = [];
//
//         for (const chunk of chunks) {
//           try {
//             const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
//             tickets.push(...ticketChunk);
//           } catch (error) {
//             console.log('Error sending push notification chunk:', error);
//           }
//         }
//
//         // Update notification status if push was successful
//         if (tickets.length > 0) {
//           await db
//             .update(notifications)
//             .set({ deliveryStatus: 'delivered' })
//             .where(eq(notifications.id, inserted[0].id));
//         }
//       } catch (error) {
//         console.log('Error sending push notification:', error);
//       }
//     }
//
//     // Emit socket event for real-time notification
//     if (req) {
//       const room =
//         data.serviceProviderId != null
//           ? SocketRoom.PROVIDER(data.serviceProviderId)
//           : SocketRoom.USER(data.userId);
//       emitSocketEvent(
//         req,
//         room,
//         SocketEventEnums.NOTIFICATION_CREATED,
//         inserted[0]
//       );
//     }
//
//     return inserted[0];
//   } catch (error) {
//     console.log('Error in createNotification:', error);
//     throw new Error('Notification creation failed');
//   }
// };
//
// const markAsRead = asyncHandler(async (req: Request, res: Response) => {
//   const { id } = req.params;
//
//   const updatedNotification = await db
//     .update(notifications)
//     .set({
//       isRead: true,
//       deliveryStatus: 'delivered',
//       updatedAt: new Date().toISOString(),
//     })
//     .where(eq(notifications.id, id))
//     .returning();
//
//   if (!updatedNotification) {
//     throw new Error('Error updating notification');
//   }
//
//   return res
//     .status(200)
//     .json(new ApiResponse(200, 'Notification updated', updatedNotification[0]));
// });
//
// const getTokens = asyncHandler(async (req: Request, res: Response) => {
//   const { token } = req.body;
//   const userId = req.user.id;
//
//   if (!userId) {
//     throw new ApiError(401, 'Not authorized');
//   }
//
//   await storePushToken(userId, token);
//
//   return res.status(200).json({
//     success: true,
//     message: 'Push token stored successfully',
//   });
// });
//
// export {
//   getNotifications,
//   createNotification,
//   markAsRead,
//   storePushToken,
//   getTokens,
// };
