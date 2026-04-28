import { useState } from 'react';
import { FileText, Download, Check, Printer } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PDFReportProps {
  appointments: any[];
  medications: any[];
  vaccines: any[];
  vitalSigns: any[];
  medicalProfile: any;
  controls: any[];
}

export function PDFReport({ appointments, medications, vaccines, vitalSigns, medicalProfile, controls }: PDFReportProps) {
  const [includeProfile, setIncludeProfile] = useState(true);
  const [includeAppointments, setIncludeAppointments] = useState(true);
  const [includeMedications, setIncludeMedications] = useState(true);
  const [includeVaccines, setIncludeVaccines] = useState(true);
  const [includeVitals, setIncludeVitals] = useState(false);
  const [dateRange, setDateRange] = useState<'all' | '6months' | '1year'>('6months');
  const [generating, setGenerating] = useState(false);

  function filterByDate(items: any[]) {
    if (dateRange === 'all') return items;

    const now = new Date();
    const cutoffDate = new Date();

    if (dateRange === '6months') {
      cutoffDate.setMonth(now.getMonth() - 6);
    } else if (dateRange === '1year') {
      cutoffDate.setFullYear(now.getFullYear() - 1);
    }

    return items.filter(item => new Date(item.date) >= cutoffDate);
  }

  function generatePDF() {
    setGenerating(true);

    try {
      const doc = new jsPDF();
      let yPosition = 20;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      const lineHeight = 7;

      // Helper to add new page if needed
      const checkAddPage = (neededSpace: number = 20) => {
        if (yPosition + neededSpace > pageHeight - margin) {
          doc.addPage();
          yPosition = 20;
          return true;
        }
        return false;
      };

      // Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Reporte Médico Personal', margin, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generado el ${format(new Date(), "d 'de' MMMM, yyyy", { locale: es })}`, margin, yPosition);
      yPosition += 15;

      // Medical Profile
      if (includeProfile && medicalProfile) {
        checkAddPage(40);

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Información Personal Médica', margin, yPosition);
        yPosition += lineHeight + 3;

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');

        if (medicalProfile.bloodType) {
          doc.setFont('helvetica', 'bold');
          doc.text('Tipo de Sangre:', margin, yPosition);
          doc.setFont('helvetica', 'normal');
          doc.text(medicalProfile.bloodType, margin + 35, yPosition);
          yPosition += lineHeight;
        }

        if (medicalProfile.allergies && medicalProfile.allergies.length > 0) {
          checkAddPage(20);
          doc.setFont('helvetica', 'bold');
          doc.text('Alergias:', margin, yPosition);
          yPosition += lineHeight;
          doc.setFont('helvetica', 'normal');
          medicalProfile.allergies.forEach((allergy: string) => {
            checkAddPage();
            doc.text(`• ${allergy}`, margin + 5, yPosition);
            yPosition += lineHeight;
          });
        }

        if (medicalProfile.chronicConditions && medicalProfile.chronicConditions.length > 0) {
          checkAddPage(20);
          doc.setFont('helvetica', 'bold');
          doc.text('Condiciones Crónicas:', margin, yPosition);
          yPosition += lineHeight;
          doc.setFont('helvetica', 'normal');
          medicalProfile.chronicConditions.forEach((condition: string) => {
            checkAddPage();
            doc.text(`• ${condition}`, margin + 5, yPosition);
            yPosition += lineHeight;
          });
        }

        if (medicalProfile.emergencyContacts && medicalProfile.emergencyContacts.length > 0) {
          checkAddPage(30);
          doc.setFont('helvetica', 'bold');
          doc.text('Contactos de Emergencia:', margin, yPosition);
          yPosition += lineHeight;
          doc.setFont('helvetica', 'normal');
          medicalProfile.emergencyContacts.forEach((contact: any) => {
            checkAddPage(15);
            doc.text(`• ${contact.name} (${contact.relationship})`, margin + 5, yPosition);
            yPosition += lineHeight;
            doc.text(`  Tel: ${contact.phone}`, margin + 5, yPosition);
            yPosition += lineHeight;
          });
        }

        yPosition += 5;
      }

      // Appointments
      if (includeAppointments && appointments.length > 0) {
        const filteredApts = filterByDate(appointments).sort((a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        if (filteredApts.length > 0) {
          checkAddPage(30);

          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
          doc.text(`Citas Médicas (${filteredApts.length})`, margin, yPosition);
          yPosition += lineHeight + 3;

          doc.setFontSize(11);

          filteredApts.forEach((apt, index) => {
            checkAddPage(25);

            doc.setFont('helvetica', 'bold');
            doc.text(`${index + 1}. ${apt.specialty}`, margin, yPosition);
            yPosition += lineHeight;

            doc.setFont('helvetica', 'normal');
            doc.text(`Fecha: ${format(new Date(apt.date), "d 'de' MMMM, yyyy", { locale: es })}`, margin + 5, yPosition);
            yPosition += lineHeight;
            doc.text(`Médico: ${apt.doctor}`, margin + 5, yPosition);
            yPosition += lineHeight;

            if (apt.documents && apt.documents.length > 0) {
              doc.text(`Documentos: ${apt.documents.length}`, margin + 5, yPosition);
              yPosition += lineHeight;
            }

            if (apt.notes) {
              checkAddPage(15);
              const notes = apt.notes.length > 100 ? apt.notes.substring(0, 100) + '...' : apt.notes;
              doc.text(`Notas: ${notes}`, margin + 5, yPosition);
              yPosition += lineHeight;
            }

            yPosition += 3;
          });
        }
      }

      // Medications
      if (includeMedications && medications.length > 0) {
        checkAddPage(30);

        const activeMeds = medications.filter(m => m.active);

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(`Medicamentos (${activeMeds.length} activos)`, margin, yPosition);
        yPosition += lineHeight + 3;

        doc.setFontSize(11);

        activeMeds.forEach((med, index) => {
          checkAddPage(20);

          doc.setFont('helvetica', 'bold');
          doc.text(`${index + 1}. ${med.name}`, margin, yPosition);
          yPosition += lineHeight;

          doc.setFont('helvetica', 'normal');
          doc.text(`Dosis: ${med.dosage}`, margin + 5, yPosition);
          yPosition += lineHeight;
          doc.text(`Frecuencia: ${med.frequency}`, margin + 5, yPosition);
          yPosition += lineHeight;
          doc.text(`Inicio: ${format(new Date(med.startDate), "d 'de' MMM, yyyy", { locale: es })}`, margin + 5, yPosition);
          yPosition += lineHeight;

          if (med.notes) {
            checkAddPage(10);
            const notes = med.notes.length > 80 ? med.notes.substring(0, 80) + '...' : med.notes;
            doc.text(`Notas: ${notes}`, margin + 5, yPosition);
            yPosition += lineHeight;
          }

          yPosition += 3;
        });
      }

      // Vaccines
      if (includeVaccines && vaccines.length > 0) {
        checkAddPage(30);

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(`Historial de Vacunas (${vaccines.length})`, margin, yPosition);
        yPosition += lineHeight + 3;

        doc.setFontSize(11);

        const sortedVaccines = [...vaccines].sort((a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        sortedVaccines.forEach((vac, index) => {
          checkAddPage(20);

          doc.setFont('helvetica', 'bold');
          doc.text(`${index + 1}. ${vac.name}`, margin, yPosition);
          yPosition += lineHeight;

          doc.setFont('helvetica', 'normal');
          doc.text(`Fecha: ${format(new Date(vac.date), "d 'de' MMMM, yyyy", { locale: es })}`, margin + 5, yPosition);
          yPosition += lineHeight;

          if (vac.doseNumber && vac.totalDoses) {
            doc.text(`Dosis: ${vac.doseNumber}/${vac.totalDoses}`, margin + 5, yPosition);
            yPosition += lineHeight;
          }

          if (vac.location) {
            doc.text(`Lugar: ${vac.location}`, margin + 5, yPosition);
            yPosition += lineHeight;
          }

          if (vac.nextDose) {
            checkAddPage(10);
            doc.text(`Próxima dosis: ${format(new Date(vac.nextDose), "d 'de' MMM, yyyy", { locale: es })}`, margin + 5, yPosition);
            yPosition += lineHeight;
          }

          yPosition += 3;
        });
      }

      // Vital Signs
      if (includeVitals && vitalSigns.length > 0) {
        const filteredVitals = filterByDate(vitalSigns).sort((a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        if (filteredVitals.length > 0) {
          checkAddPage(30);

          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
          doc.text(`Signos Vitales (últimos ${filteredVitals.length})`, margin, yPosition);
          yPosition += lineHeight + 3;

          doc.setFontSize(11);

          filteredVitals.slice(0, 10).forEach((vs, index) => {
            checkAddPage(20);

            doc.setFont('helvetica', 'bold');
            doc.text(`${format(new Date(vs.date), "d 'de' MMM, yyyy", { locale: es })}`, margin, yPosition);
            yPosition += lineHeight;

            doc.setFont('helvetica', 'normal');
            const vitals = [];
            if (vs.bloodPressureSystolic) vitals.push(`PA: ${vs.bloodPressureSystolic}/${vs.bloodPressureDiastolic}`);
            if (vs.heartRate) vitals.push(`FC: ${vs.heartRate} bpm`);
            if (vs.weight) vitals.push(`Peso: ${vs.weight} kg`);
            if (vs.glucose) vitals.push(`Glucosa: ${vs.glucose} mg/dL`);

            vitals.forEach(vital => {
              checkAddPage();
              doc.text(`• ${vital}`, margin + 5, yPosition);
              yPosition += lineHeight;
            });

            yPosition += 3;
          });
        }
      }

      // Footer on last page
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.text(`Página ${i} de ${totalPages}`, margin, pageHeight - 10);
        doc.text('Archivo Médico Personal - Uso exclusivo médico', doc.internal.pageSize.width / 2, pageHeight - 10, { align: 'center' });
      }

      // Save PDF
      const filename = `reporte-medico-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      doc.save(filename);

      setTimeout(() => setGenerating(false), 1000);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setGenerating(false);
      alert('Error al generar el PDF. Por favor intenta nuevamente.');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-2">
          <FileText className="w-7 h-7 text-blue-600" />
          Generar Reporte PDF
        </h2>
        <p className="text-gray-600">Crea un reporte profesional para llevar al médico</p>
      </div>

      {/* Preview Card */}
      <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-8 text-white">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/20 rounded-lg">
            <Printer className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold mb-2">Reporte Médico Profesional</h3>
            <p className="text-blue-100 mb-4">
              Genera un documento PDF completo con tu historial médico listo para imprimir o enviar por email a tu médico.
            </p>
            <div className="flex flex-wrap gap-2">
              <div className="px-3 py-1 bg-white/20 rounded-full text-sm">Formato profesional</div>
              <div className="px-3 py-1 bg-white/20 rounded-full text-sm">Imprimible</div>
              <div className="px-3 py-1 bg-white/20 rounded-full text-sm">Multi-página</div>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">¿Qué incluir en el reporte?</h3>

        <div className="space-y-3 mb-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={includeProfile}
              onChange={(e) => setIncludeProfile(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex-1">
              <p className="font-medium text-gray-900">Información Personal Médica</p>
              <p className="text-sm text-gray-600">Tipo de sangre, alergias, condiciones crónicas, contactos</p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={includeAppointments}
              onChange={(e) => setIncludeAppointments(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex-1">
              <p className="font-medium text-gray-900">Citas Médicas</p>
              <p className="text-sm text-gray-600">Historial de consultas y especialistas</p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={includeMedications}
              onChange={(e) => setIncludeMedications(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex-1">
              <p className="font-medium text-gray-900">Medicamentos Activos</p>
              <p className="text-sm text-gray-600">Tratamientos actuales con dosis y frecuencia</p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={includeVaccines}
              onChange={(e) => setIncludeVaccines(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex-1">
              <p className="font-medium text-gray-900">Historial de Vacunas</p>
              <p className="text-sm text-gray-600">Vacunas aplicadas y próximas dosis</p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={includeVitals}
              onChange={(e) => setIncludeVitals(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex-1">
              <p className="font-medium text-gray-900">Signos Vitales Recientes</p>
              <p className="text-sm text-gray-600">Últimas mediciones (presión, peso, glucosa, etc.)</p>
            </div>
          </label>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Período de Tiempo</label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="6months">Últimos 6 meses</option>
            <option value="1year">Último año</option>
            <option value="all">Todo el historial</option>
          </select>
        </div>

        <button
          onClick={generatePDF}
          disabled={generating}
          className={`w-full px-6 py-4 rounded-lg font-medium text-white transition-all flex items-center justify-center gap-2 ${
            generating
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'
          }`}
        >
          {generating ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Generando PDF...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Generar y Descargar PDF
            </>
          )}
        </button>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <Check className="w-5 h-5" />
          Consejos para usar el reporte
        </h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex gap-2">
            <span className="font-bold">•</span>
            <span>Imprime el PDF y llévalo a tus citas médicas para tener toda tu información a mano</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">•</span>
            <span>Envíalo por email a tu médico antes de la consulta</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">•</span>
            <span>Guarda copias para emergencias (en tu teléfono, email, etc.)</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">•</span>
            <span>Actualiza y genera un nuevo reporte cada 3-6 meses</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
