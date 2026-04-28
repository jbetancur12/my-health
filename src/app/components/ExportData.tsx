import { Download, FileJson, FileSpreadsheet } from 'lucide-react';

interface ExportDataProps {
  data: unknown;
  filename: string;
}

export function ExportData({ data, filename }: ExportDataProps) {
  const exportToJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    const appointments = (data as { appointments?: Array<{ date: Date; specialty: string; doctor: string; notes?: string; documents: unknown[] }> }).appointments;
    if (!appointments || appointments.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    const headers = ['Fecha', 'Especialidad', 'Médico', 'Notas', 'Documentos'];
    const rows = appointments.map((appointment) => [
      new Date(appointment.date).toLocaleDateString('es'),
      appointment.specialty,
      appointment.doctor,
      appointment.notes || '',
      appointment.documents.length,
    ]);

    const csv = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Download className="w-5 h-5 text-blue-600" />
        Exportar Datos
      </h3>
      <p className="text-sm text-gray-600 mb-4">Descarga una copia de tu información médica</p>
      <div className="flex gap-3">
        <button onClick={exportToJSON} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <FileJson className="w-5 h-5" />
          Exportar JSON
        </button>
        <button onClick={exportToCSV} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
          <FileSpreadsheet className="w-5 h-5" />
          Exportar CSV
        </button>
      </div>
    </div>
  );
}
