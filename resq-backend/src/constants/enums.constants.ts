import { pgEnum } from "drizzle-orm/pg-core";

export const serviceTypeEnum = pgEnum("service_type", [
  "ambulance",
  "police",
  "rescue_team",
  "fire_truck",
]);

export enum serviceStatusEnum {
  AVAILABLE = "available",
  ASSIGNED = "assigned",
  OFF_DUTY = "off_duty",
}

export enum serviceEnum {
  AMBULANCE = "ambulance",
  POLICE = "police",
  RESCUE_TEAM = "rescue_team",
  FIRE_TRUCK = "fire_truck",
}
