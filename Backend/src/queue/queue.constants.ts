export const QUEUES = {
  EMAIL: 'emailQueue',
  NOTIFICATION: 'notificationQueue',
  DOCUMENT_PROCESSING: 'documentProcessingQueue',
  EMBEDDING: 'embeddingQueue',
  ANALYTICS: 'analyticsQueue',
  REPORT: 'reportQueue',
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];
export const ALL_QUEUES: QueueName[] = Object.values(QUEUES);
