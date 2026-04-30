export type {
  ScheduledAppointmentPayload as ScheduledAppointmentInput,
  ScheduledAppointmentStatus,
} from '../../../../shared/contracts/http.js';

export interface ScheduledAppointmentConvertInput {
  appointmentId: string;
}
