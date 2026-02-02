import { serviceEnum } from "@/constants";
import z from "zod";

export const CreateNewRequestSchema = z.object({
  emergencyType: z.enum(serviceEnum),
  emergencyDescription: z.string().optional(),
  userLocation: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
});
