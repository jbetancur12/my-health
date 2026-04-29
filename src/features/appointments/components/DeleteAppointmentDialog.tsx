import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../app/components/ui/alert-dialog';
import type { Appointment } from '../../../shared/api/contracts';

interface DeleteAppointmentDialogProps {
  appointment: Appointment | null;
  open: boolean;
  onConfirm: () => void | Promise<void>;
  onOpenChange: (open: boolean) => void;
}

export function DeleteAppointmentDialog({
  appointment,
  open,
  onConfirm,
  onOpenChange,
}: DeleteAppointmentDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar cita</AlertDialogTitle>
          <AlertDialogDescription>
            {appointment
              ? `Se eliminará la cita de ${appointment.specialty} con ${appointment.doctor}, junto con sus controles y documentos asociados. Esta acción no se puede deshacer.`
              : 'Esta acción no se puede deshacer.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              void onConfirm();
            }}
            className="bg-red-600 hover:bg-red-700 focus-visible:ring-red-500"
          >
            Eliminar cita
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
