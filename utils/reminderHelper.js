import { PRIORITIES, TASK_STATUS, REMINDERS_PER_DAY } from "./constants.js";

export const getReminderLimit = (priority) => {
  return REMINDERS_PER_DAY[priority] || 1;
};
