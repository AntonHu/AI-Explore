import { EventEmitter } from "events";

export enum SystemEvents {
  RESOURCE_UPDATED = "resource-updated",
  LOGS_UPDATED = "logs-updated",
}

export interface ResourceUpdatedPayload {
  uri: string;
}

class AppEventEmitter extends EventEmitter {}
export const appEvents = new AppEventEmitter();
