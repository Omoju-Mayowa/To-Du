const PRIORITIES = ['low', 'medium', 'high', 'utmost']
const VALID_STATUSES = ['pending', 'completed', 'cancelled']
const TASK_STATUS = ['pending', 'completed', 'cancelled']
const REMINDERS_PER_DAY = {
  low: 1,
  medium: 3,
  high: 6,
  utmost: 12
}


export { PRIORITIES, TASK_STATUS, REMINDERS_PER_DAY, VALID_STATUSES }