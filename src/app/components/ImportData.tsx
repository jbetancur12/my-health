import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { Upload, FileJson, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';

interface ImportDataProps {
  onImport: (data: any) => void | Promise<void>;
}

export function ImportData({ onImport }: ImportDataProps) {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        let data;

        if (file.name.endsWith('.json')) {
          data = JSON.parse(content);
          await validateAndImport(data);
        } else if (file.name.endsWith('.csv')) {
          setStatus('error');
          setMessage('Importación desde CSV aún no soportada. Por favor usa formato JSON.');
        } else {
          setStatus('error');
          setMessage('Formato de archivo no soportado. Use JSON o CSV.');
        }
      } catch (error) {
        setStatus('error');
        setMessage('Error al leer el archivo: ' + (error as Error).message);
      }
    };

    reader.onerror = () => {
      setStatus('error');
      setMessage('Error al leer el archivo');
    };

    reader.readAsText(file);
    event.target.value = '';
  }

  async function validateAndImport(data: any) {
    try {
      // Validar estructura básica
      if (!data.appointments || !Array.isArray(data.appointments)) {
        throw new Error('El archivo no contiene un formato válido de datos');
      }

      // Convertir fechas de strings a Date objects
      const processedData = {
        appointments: data.appointments.map((apt: any) => ({
          ...apt,
          date: new Date(apt.date),
          documents: apt.documents?.map((doc: any) => ({
            ...doc,
            date: new Date(doc.date)
          })) || []
        })),
        controls: data.controls?.map((ctrl: any) => ({
          ...ctrl,
          date: new Date(ctrl.date)
        })) || [],
        medications: data.medications?.map((med: any) => ({
          ...med,
          startDate: new Date(med.startDate),
          endDate: med.endDate ? new Date(med.endDate) : undefined
        })) || [],
        tags: data.tags || [],
        medicalProfile: data.medicalProfile || undefined,
        notificationPreferences: data.notificationPreferences || undefined,
        vitalSigns: data.vitalSigns?.map((reading: any) => ({
          ...reading,
          date: new Date(reading.date)
        })) || [],
        vaccines: data.vaccines?.map((vaccine: any) => ({
          ...vaccine,
          date: new Date(vaccine.date),
          nextDose: vaccine.nextDose ? new Date(vaccine.nextDose) : undefined
        })) || []
      };

      await onImport(processedData);
      setStatus('success');
      setMessage(`Datos importados exitosamente: ${processedData.appointments.length} citas, ${processedData.controls.length} controles, ${processedData.medications.length} medicamentos y ${processedData.vaccines.length} vacunas`);
    } catch (error) {
      setStatus('error');
      setMessage('Error al procesar los datos: ' + (error as Error).message);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Importar Datos</h2>
        <p className="text-gray-600">Restaura tu información desde un archivo de backup</p>
      </div>

      {status !== 'idle' && (
        <div className={`rounded-lg p-4 ${
          status === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-start gap-3">
            {status === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className={`font-medium ${status === 'success' ? 'text-green-900' : 'text-red-900'}`}>
                {status === 'success' ? 'Importación Exitosa' : 'Error de Importación'}
              </p>
              <p className={`text-sm mt-1 ${status === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                {message}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-8 text-center hover:border-blue-500 transition-colors">
          <label htmlFor="json-upload" className="cursor-pointer">
            <FileJson className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">Importar desde JSON</h3>
            <p className="text-sm text-gray-600 mb-4">
              Archivo de backup completo exportado desde esta aplicación
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Upload className="w-4 h-4" />
              Seleccionar Archivo JSON
            </div>
            <input
              id="json-upload"
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-8 text-center opacity-50">
          <FileSpreadsheet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">Importar desde CSV</h3>
          <p className="text-sm text-gray-600 mb-4">
            Próximamente - Importación desde archivos CSV
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed">
            <Upload className="w-4 h-4" />
            Próximamente
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Instrucciones de Importación
        </h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex gap-2">
            <span className="font-bold">1.</span>
            <span>Usa un archivo JSON exportado previamente desde esta aplicación</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">2.</span>
            <span>Los datos importados se <strong>combinarán</strong> con tus datos existentes</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">3.</span>
            <span>Si hay duplicados, los datos nuevos reemplazarán a los existentes</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">4.</span>
            <span>Se recomienda hacer un backup antes de importar datos</span>
          </li>
        </ul>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="font-semibold text-yellow-900 mb-3">⚠️ Advertencia</h3>
        <p className="text-sm text-yellow-800">
          Esta acción modificará tus datos actuales. Asegúrate de tener un backup antes de proceder.
          Si importas datos incorrectos, puedes perder información.
        </p>
      </div>
    </div>
  );
}
