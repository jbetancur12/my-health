import { useState } from 'react';
import { FileText, Download, Check, Printer, Sparkles } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type {
  Appointment,
  MedicalProfile,
  Medication,
  ReportDateRange,
  Vaccine,
  VitalSignReading,
} from '../../../shared/api/contracts';
import { generateExecutiveReport as requestExecutiveReport } from '../../../shared/api/api';

interface PDFReportProps {
  appointments: Appointment[];
  medications: Medication[];
  vaccines: Vaccine[];
  vitalSigns: VitalSignReading[];
  medicalProfile: MedicalProfile;
}

type DateRange = ReportDateRange;

function wrapPdfLines(doc: jsPDF, text: string, maxWidth: number) {
  return doc.splitTextToSize(text, maxWidth) as string[];
}

function formatExecutiveSummary(summary: string) {
  const lines = summary
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const sections: Array<{ heading: string; items: string[] }> = [];
  let currentSection: { heading: string; items: string[] } | null = null;

  for (const line of lines) {
    if (!line.startsWith('- ')) {
      currentSection = { heading: line, items: [] };
      sections.push(currentSection);
      continue;
    }

    if (!currentSection) {
      currentSection = { heading: 'Resumen ejecutivo', items: [] };
      sections.push(currentSection);
    }

    currentSection.items.push(line.slice(2).trim());
  }

  return sections;
}

const pdfColors = {
  navy: [20, 47, 91] as const,
  blue: [33, 99, 171] as const,
  slate: [81, 95, 111] as const,
  lightBlue: [232, 240, 250] as const,
  paleBlue: [244, 248, 252] as const,
  border: [212, 224, 236] as const,
  text: [37, 52, 67] as const,
  muted: [107, 119, 140] as const,
  white: [255, 255, 255] as const,
} satisfies Record<string, readonly [number, number, number]>;

function setPdfTextColor(doc: jsPDF, color: readonly [number, number, number]) {
  doc.setTextColor(color[0], color[1], color[2]);
}

function setPdfFillColor(doc: jsPDF, color: readonly [number, number, number]) {
  doc.setFillColor(color[0], color[1], color[2]);
}

function setPdfDrawColor(doc: jsPDF, color: readonly [number, number, number]) {
  doc.setDrawColor(color[0], color[1], color[2]);
}

export function PDFReport({
  appointments,
  medications,
  vaccines,
  vitalSigns,
  medicalProfile,
}: PDFReportProps) {
  const [includeProfile, setIncludeProfile] = useState(true);
  const [includeAppointments, setIncludeAppointments] = useState(true);
  const [includeMedications, setIncludeMedications] = useState(true);
  const [includeVaccines, setIncludeVaccines] = useState(true);
  const [includeVitals, setIncludeVitals] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>('6months');
  const [includeExecutiveSummary, setIncludeExecutiveSummary] = useState(true);
  const [generating, setGenerating] = useState(false);

  function filterByDate<T extends { date: Date }>(items: T[]) {
    if (dateRange === 'all') return items;

    const now = new Date();
    const cutoffDate = new Date();

    if (dateRange === '6months') {
      cutoffDate.setMonth(now.getMonth() - 6);
    } else if (dateRange === '1year') {
      cutoffDate.setFullYear(now.getFullYear() - 1);
    }

    return items.filter((item) => new Date(item.date) >= cutoffDate);
  }

  async function generatePDF() {
    setGenerating(true);

    try {
      let executiveReport:
        | {
            summary: string;
            generatedAt: Date;
            provider: 'openai' | 'gemini';
          }
        | undefined;

      if (includeExecutiveSummary) {
        try {
          executiveReport = await requestExecutiveReport({
            appointments: appointments.map((appointment) => ({
              id: appointment.id,
              date: appointment.date.toISOString(),
              specialty: appointment.specialty,
              doctor: appointment.doctor,
              notes: appointment.notes,
              tags: appointment.tags,
              createdAt: appointment.date.toISOString(),
              documents: appointment.documents.map((document) => ({
                id: document.id,
                type: document.type,
                name: document.name,
                date: document.date.toISOString(),
                fileUrl: document.fileUrl,
                aiSummary: document.aiSummary,
                aiSummaryStatus: document.aiSummaryStatus,
                aiSummaryError: document.aiSummaryError,
                aiSummaryUpdatedAt: document.aiSummaryUpdatedAt?.toISOString(),
              })),
            })),
            medications: medications.map((medication) => ({
              id: medication.id,
              name: medication.name,
              dosage: medication.dosage,
              frequency: medication.frequency,
              startDate: medication.startDate.toISOString(),
              endDate: medication.endDate?.toISOString(),
              notes: medication.notes,
              active: medication.active,
              createdAt: medication.startDate.toISOString(),
            })),
            vaccines: vaccines.map((vaccine) => ({
              id: vaccine.id,
              name: vaccine.name,
              date: vaccine.date.toISOString(),
              nextDose: vaccine.nextDose?.toISOString(),
              doseNumber: vaccine.doseNumber,
              totalDoses: vaccine.totalDoses,
              location: vaccine.location,
              lot: vaccine.lot,
              notes: vaccine.notes,
              createdAt: vaccine.date.toISOString(),
            })),
            vitalSigns: vitalSigns.map((reading) => ({
              id: reading.id,
              date: reading.date.toISOString(),
              bloodPressureSystolic: reading.bloodPressureSystolic,
              bloodPressureDiastolic: reading.bloodPressureDiastolic,
              heartRate: reading.heartRate,
              weight: reading.weight,
              glucose: reading.glucose,
              temperature: reading.temperature,
              oxygenSaturation: reading.oxygenSaturation,
              notes: reading.notes,
              createdAt: reading.date.toISOString(),
            })),
            medicalProfile: {
              id: medicalProfile.id,
              bloodType: medicalProfile.bloodType,
              allergies: medicalProfile.allergies,
              chronicConditions: medicalProfile.chronicConditions,
              emergencyContacts: medicalProfile.emergencyContacts,
              insurance: medicalProfile.insurance,
              notes: medicalProfile.notes,
            },
            dateRange,
            includeProfile,
            includeAppointments,
            includeMedications,
            includeVaccines,
            includeVitals,
          });
        } catch (error) {
          console.error('Error generating executive report:', error);
          alert(
            'No pudimos generar el reporte ejecutivo con IA. Continuaremos con el PDF estructurado.'
          );
        }
      }

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 18;
      const lineHeight = 7;
      let yPosition = 48;

      const drawPageFrame = () => {
        setPdfDrawColor(doc, pdfColors.border);
        doc.setLineWidth(0.4);
        doc.rect(8, 8, pageWidth - 16, pageHeight - 16);
      };

      const drawTopBand = (isCover = false) => {
        setPdfFillColor(doc, pdfColors.navy);
        doc.rect(0, 0, pageWidth, isCover ? 32 : 24, 'F');
        setPdfFillColor(doc, pdfColors.lightBlue);
        doc.rect(0, isCover ? 32 : 24, pageWidth, 8, 'F');
        drawPageFrame();
      };

      const drawCoverHeader = () => {
        drawTopBand(true);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        setPdfTextColor(doc, pdfColors.white);
        doc.text('Informe Clínico Personal', margin, 18);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text('Resumen médico consolidado para consulta y continuidad de atención', margin, 25);

        setPdfTextColor(doc, pdfColors.navy);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(`Fecha de emisión: ${format(new Date(), "d 'de' MMMM, yyyy", { locale: es })}`, margin, 45);
        doc.text(`Periodo analizado: ${dateRange === 'all' ? 'Todo el historial' : dateRange === '1year' ? 'Último año' : 'Últimos 6 meses'}`, margin, 52);
        yPosition = 64;
      };

      const drawRunningHeader = () => {
        drawTopBand(false);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        setPdfTextColor(doc, pdfColors.white);
        doc.text('Informe Clínico Personal', margin, 14.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.text('Documento consolidado para apoyo clínico', pageWidth - margin, 14.5, {
          align: 'right',
        });

        yPosition = 38;
      };

      const addStyledPage = () => {
        doc.addPage();
        drawRunningHeader();
      };

      // Helper to add new page if needed
      const checkAddPage = (neededSpace: number = 20) => {
        if (yPosition + neededSpace > pageHeight - margin) {
          addStyledPage();
          return true;
        }
        return false;
      };

      const drawSectionHeader = (title: string, tone: 'primary' | 'executive' = 'primary') => {
        checkAddPage(18);
        const fill = tone === 'executive' ? pdfColors.lightBlue : pdfColors.paleBlue;
        const accent = tone === 'executive' ? pdfColors.blue : pdfColors.navy;

        setPdfFillColor(doc, fill);
        doc.roundedRect(margin, yPosition - 4, pageWidth - margin * 2, 11, 2, 2, 'F');
        setPdfFillColor(doc, accent);
        doc.rect(margin, yPosition - 4, 4, 11, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        setPdfTextColor(doc, pdfColors.navy);
        doc.text(title, margin + 8, yPosition + 2.5);
        yPosition += 14;
      };

      const drawLabeledLine = (label: string, value: string) => {
        const labelWidth = 34;
        const wrappedLines = wrapPdfLines(doc, value, pageWidth - margin * 2 - labelWidth - 6);
        checkAddPage(wrappedLines.length * lineHeight + 4);
        doc.setFont('helvetica', 'bold');
        setPdfTextColor(doc, pdfColors.text);
        doc.text(`${label}:`, margin + 4, yPosition);
        doc.setFont('helvetica', 'normal');
        setPdfTextColor(doc, pdfColors.text);
        doc.text(wrappedLines, margin + labelWidth, yPosition);
        yPosition += wrappedLines.length * lineHeight;
      };

      const drawBullet = (text: string, indent = 5) => {
        const wrappedLines = wrapPdfLines(doc, `• ${text}`, pageWidth - margin * 2 - indent - 4);
        checkAddPage(wrappedLines.length * lineHeight + 3);
        doc.setFont('helvetica', 'normal');
        setPdfTextColor(doc, pdfColors.text);
        doc.text(wrappedLines, margin + indent, yPosition);
        yPosition += wrappedLines.length * lineHeight;
      };

      const drawCard = (title: string, lines: string[]) => {
        const wrappedLineGroups = lines.map((line) => wrapPdfLines(doc, line, pageWidth - margin * 2 - 12));
        const contentHeight =
          wrappedLineGroups.reduce((sum, group) => sum + group.length * lineHeight, 0) + 12;
        checkAddPage(contentHeight + 8);

        setPdfFillColor(doc, pdfColors.white);
        setPdfDrawColor(doc, pdfColors.border);
        doc.roundedRect(margin, yPosition - 5, pageWidth - margin * 2, contentHeight, 3, 3, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11.5);
        setPdfTextColor(doc, pdfColors.navy);
        doc.text(title, margin + 5, yPosition + 1);
        yPosition += 8;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10.5);
        for (const group of wrappedLineGroups) {
          doc.text(group, margin + 5, yPosition);
          yPosition += group.length * lineHeight;
        }

        yPosition += 5;
      };

      drawCoverHeader();

      if (executiveReport) {
        drawSectionHeader('Síntesis ejecutiva asistida por IA', 'executive');

        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        setPdfTextColor(doc, pdfColors.muted);
        doc.text(
          `Generado con ${executiveReport.provider === 'openai' ? 'OpenAI' : 'Gemini'} el ${format(executiveReport.generatedAt, "d 'de' MMMM, yyyy h:mm a", { locale: es })}`,
          margin,
          yPosition
        );
        yPosition += lineHeight + 3;

        const sections = formatExecutiveSummary(executiveReport.summary);
        doc.setFontSize(11);

        for (const section of sections) {
          drawCard(
            section.heading,
            (section.items.length > 0 ? section.items : ['Sin datos relevantes']).map(
              (item) => `• ${item}`
            )
          );
        }
      }

      // Medical Profile
      if (includeProfile && medicalProfile) {
        drawSectionHeader('Información personal y antecedentes');

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        setPdfTextColor(doc, pdfColors.text);

        if (medicalProfile.bloodType) {
          drawLabeledLine('Tipo de sangre', medicalProfile.bloodType);
        }

        if (medicalProfile.allergies && medicalProfile.allergies.length > 0) {
          doc.setFont('helvetica', 'bold');
          setPdfTextColor(doc, pdfColors.slate);
          doc.text('Alergias registradas', margin + 4, yPosition);
          yPosition += lineHeight;
          medicalProfile.allergies.forEach((allergy: string) => {
            drawBullet(allergy, 5);
          });
        }

        if (medicalProfile.chronicConditions && medicalProfile.chronicConditions.length > 0) {
          doc.setFont('helvetica', 'bold');
          setPdfTextColor(doc, pdfColors.slate);
          doc.text('Condiciones o antecedentes crónicos', margin + 4, yPosition);
          yPosition += lineHeight;
          medicalProfile.chronicConditions.forEach((condition: string) => {
            drawBullet(condition, 5);
          });
        }

        if (medicalProfile.emergencyContacts && medicalProfile.emergencyContacts.length > 0) {
          doc.setFont('helvetica', 'bold');
          setPdfTextColor(doc, pdfColors.slate);
          doc.text('Contactos de emergencia', margin + 4, yPosition);
          yPosition += lineHeight;
          medicalProfile.emergencyContacts.forEach((contact) => {
            drawCard(`${contact.name} (${contact.relationship})`, [`Teléfono: ${contact.phone}`]);
          });
        }

        yPosition += 5;
      }

      // Appointments
      if (includeAppointments && appointments.length > 0) {
        const filteredApts = filterByDate(appointments).sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        if (filteredApts.length > 0) {
          drawSectionHeader(`Citas médicas y atención especializada (${filteredApts.length})`);

          doc.setFontSize(11);

          filteredApts.forEach((apt, index) => {
            const lines = [
              `Fecha: ${format(new Date(apt.date), "d 'de' MMMM, yyyy", { locale: es })}`,
              `Médico tratante: ${apt.doctor}`,
            ];

            if (apt.documents && apt.documents.length > 0) {
              lines.push(`Documentos adjuntos: ${apt.documents.length}`);
            }

            if (apt.notes) {
              const notes =
                apt.notes.length > 100 ? apt.notes.substring(0, 100) + '...' : apt.notes;
              lines.push(`Notas clínicas: ${notes}`);
            }

            drawCard(`${index + 1}. ${apt.specialty}`, lines);
          });
        }
      }

      // Medications
      if (includeMedications && medications.length > 0) {
        const activeMeds = medications.filter((m) => m.active);

        drawSectionHeader(`Medicamentos activos (${activeMeds.length})`);

        doc.setFontSize(11);

        activeMeds.forEach((med, index) => {
          const lines = [
            `Dosis: ${med.dosage}`,
            `Frecuencia: ${med.frequency}`,
            `Inicio: ${format(new Date(med.startDate), "d 'de' MMM, yyyy", { locale: es })}`,
          ];

          if (med.notes) {
            const notes = med.notes.length > 80 ? med.notes.substring(0, 80) + '...' : med.notes;
            lines.push(`Observaciones: ${notes}`);
          }

          drawCard(`${index + 1}. ${med.name}`, lines);
        });
      }

      // Vaccines
      if (includeVaccines && vaccines.length > 0) {
        drawSectionHeader(`Historial de vacunación (${vaccines.length})`);

        doc.setFontSize(11);

        const sortedVaccines = [...vaccines].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        sortedVaccines.forEach((vac, index) => {
          const lines = [
            `Fecha: ${format(new Date(vac.date), "d 'de' MMMM, yyyy", { locale: es })}`,
          ];

          if (vac.doseNumber && vac.totalDoses) {
            lines.push(`Dosis: ${vac.doseNumber}/${vac.totalDoses}`);
          }

          if (vac.location) {
            lines.push(`Lugar: ${vac.location}`);
          }

          if (vac.nextDose) {
            lines.push(
              `Próxima dosis: ${format(new Date(vac.nextDose), "d 'de' MMM, yyyy", { locale: es })}`
            );
          }

          drawCard(`${index + 1}. ${vac.name}`, lines);
        });
      }

      // Vital Signs
      if (includeVitals && vitalSigns.length > 0) {
        const filteredVitals = filterByDate(vitalSigns).sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        if (filteredVitals.length > 0) {
          drawSectionHeader(`Signos vitales recientes (${filteredVitals.length})`);

          doc.setFontSize(11);

          filteredVitals.slice(0, 10).forEach((vs) => {
            const vitals = [
              `Fecha: ${format(new Date(vs.date), "d 'de' MMM, yyyy", { locale: es })}`,
            ];
            if (vs.bloodPressureSystolic)
              vitals.push(`PA: ${vs.bloodPressureSystolic}/${vs.bloodPressureDiastolic}`);
            if (vs.heartRate) vitals.push(`FC: ${vs.heartRate} bpm`);
            if (vs.weight) vitals.push(`Peso: ${vs.weight} kg`);
            if (vs.glucose) vitals.push(`Glucosa: ${vs.glucose} mg/dL`);
            if (vs.temperature) vitals.push(`Temperatura: ${vs.temperature} °C`);
            if (vs.oxygenSaturation) vitals.push(`Saturación O2: ${vs.oxygenSaturation}%`);
            if (vs.notes) vitals.push(`Notas: ${vs.notes}`);

            drawCard('Registro de control', vitals);
          });
        }
      }

      // Footer on last page
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        setPdfDrawColor(doc, pdfColors.border);
        doc.line(margin, pageHeight - 16, pageWidth - margin, pageHeight - 16);
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        setPdfTextColor(doc, pdfColors.muted);
        doc.text(`Página ${i} de ${totalPages}`, margin, pageHeight - 10);
        doc.text(
          'Documento clínico de referencia - uso informativo y apoyo médico',
          doc.internal.pageSize.width / 2,
          pageHeight - 10,
          { align: 'center' }
        );
        doc.text(
          'Confidencial',
          pageWidth - margin,
          pageHeight - 10,
          { align: 'right' }
        );
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
              Genera un documento PDF completo con tu historial médico listo para imprimir o enviar
              por email a tu médico.
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
              <p className="text-sm text-gray-600">
                Tipo de sangre, alergias, condiciones crónicas, contactos
              </p>
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
              <p className="text-sm text-gray-600">
                Últimas mediciones (presión, peso, glucosa, etc.)
              </p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={includeExecutiveSummary}
              onChange={(e) => setIncludeExecutiveSummary(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex-1">
              <p className="font-medium text-gray-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Reporte ejecutivo con IA
              </p>
              <p className="text-sm text-gray-600">
                Sintetiza evolución reciente, hallazgos por especialidad, laboratorios y próximos
                pasos usando las últimas citas y documentos resumidos.
              </p>
            </div>
          </label>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Período de Tiempo</label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
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
              Generando reporte...
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
            <span>
              Imprime el PDF y llévalo a tus citas médicas para tener toda tu información a mano
            </span>
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
