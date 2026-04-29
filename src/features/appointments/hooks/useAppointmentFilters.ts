import { useMemo, useState } from 'react';
import type { Appointment } from '../../../shared/api/contracts';
import type { SearchFilters } from '../components/AdvancedSearch';

export interface AppointmentStats {
  totalAppointments: number;
  totalDocuments: number;
  totalSpecialties: number;
}

interface UseAppointmentFiltersOptions {
  appointments: Appointment[];
  specialties: string[];
}

export function useAppointmentFilters({
  appointments,
  specialties,
}: UseAppointmentFiltersOptions) {
  const [filterSpecialty, setFilterSpecialty] = useState<string>('all');
  const [filterDoctor, setFilterDoctor] = useState<string>('all');
  const [filterDocType, setFilterDocType] = useState<string>('all');
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({ query: '', tags: [] });

  const filteredAppointments = useMemo(() => {
    return appointments
      .filter((appointment) => {
        const textQuery = searchFilters.query;
        const matchesSearch =
          textQuery === '' ||
          appointment.specialty.toLowerCase().includes(textQuery.toLowerCase()) ||
          appointment.doctor.toLowerCase().includes(textQuery.toLowerCase()) ||
          appointment.notes?.toLowerCase().includes(textQuery.toLowerCase()) ||
          appointment.documents.some((document) =>
            document.name.toLowerCase().includes(textQuery.toLowerCase())
          );

        const matchesDateFrom =
          !searchFilters.dateFrom || new Date(appointment.date) >= searchFilters.dateFrom;
        const matchesDateTo =
          !searchFilters.dateTo || new Date(appointment.date) <= searchFilters.dateTo;
        const matchesTags =
          searchFilters.tags.length === 0 ||
          (appointment.tags && searchFilters.tags.some((tag) => appointment.tags?.includes(tag)));

        const matchesSpecialty =
          filterSpecialty === 'all' || appointment.specialty === filterSpecialty;
        const matchesDoctor = filterDoctor === 'all' || appointment.doctor === filterDoctor;
        const matchesDocType =
          filterDocType === 'all' ||
          appointment.documents.some((document) => document.type === filterDocType);

        return (
          matchesSearch &&
          matchesDateFrom &&
          matchesDateTo &&
          matchesTags &&
          matchesSpecialty &&
          matchesDoctor &&
          matchesDocType
        );
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [appointments, filterDocType, filterDoctor, filterSpecialty, searchFilters]);

  const stats = useMemo<AppointmentStats>(
    () => ({
      totalAppointments: appointments.length,
      totalDocuments: appointments.reduce(
        (sum, appointment) => sum + appointment.documents.length,
        0
      ),
      totalSpecialties: specialties.length,
    }),
    [appointments, specialties]
  );

  return {
    filterSpecialty,
    filterDoctor,
    filterDocType,
    searchFilters,
    filteredAppointments,
    stats,
    setFilterSpecialty,
    setFilterDoctor,
    setFilterDocType,
    setSearchFilters,
  };
}
