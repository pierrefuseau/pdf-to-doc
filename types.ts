export enum ProcessingStatus {
  PENDING = 'Pending',
  PROCESSING = 'Processing',
  SUCCESS = 'Success',
  ERROR = 'Error',
}

export enum DocCreationStatus {
  IDLE = 'Idle',
  CREATING = 'Creating',
  SUCCESS = 'Success',
  ERROR = 'Error',
}

export interface ProcessedFile {
  id: string;
  file: File;
  status: ProcessingStatus;
  report: string | null;
  error: string | null;
  docCreationStatus: DocCreationStatus;
  googleDocUrl: string | null;
  docCreationError: string | null;
}