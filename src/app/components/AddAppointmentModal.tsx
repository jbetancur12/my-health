import { X, Plus, Upload, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Document {
  id: string;
  type: 'historia_clinica' | 'orden_procedimiento' | 'orden_medicamento' | 'orden_control' | 'laboratorio';
  name: string;
  date: Date;
  file?: File;
  fileUrl?: string;
}

interface Control {
  id: string;
  date: Date;
  type: string;
}

interface AddAppointmentModalProps {
  onClose: () => void;
  onAdd: (appointment: {
    date: Date;
    specialty: string;
    doctor: string;
    documents: Document[];
    notes?: string;
    controls?: Control[];
  }) => void;
  existingDoctors: string[];
  existingSpecialties: string[];
}

const documentTypes = [
  { value: 'historia_clinica', label: 'Historia Clínica' },
  { value: 'orden_procedimiento', label: 'Orden de Procedimiento' },
  { value: 'orden_medicamento', label: 'Orden de Medicamento' },
  { value: 'orden_control', label: 'Orden de Control' },
  { value: 'laboratorio', label: 'Laboratorio' }
];

export function AddAppointmentModal({ onClose, onAdd, existingDoctors, existingSpecialties }: AddAppointmentModalProps) {
  const [date, setDate] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [doctor, setDoctor] = useState('');
  const [notes, setNotes] = useState('');
  const [documents, setDocuments] = useState<Omit<Document, 'id'>[]>([]);
  const [controls, setControls] = useState<Omit<Control, 'id'>[]>([]);

  const handleAddDocument = () => {
    setDocuments([...documents, {
      type: 'historia_clinica',
      name: '',
      date: new Date(),
      file: undefined,
      fileUrl: undefined
    }]);
  };

  const handleAddControl = () => {
    setControls([...controls, {
      date: new Date(),
      type: ''
    }]);
  };

  const handleRemoveDocument = (index: number) => {
    const doc = documents[index];
    if (doc.fileUrl) {
      URL.revokeObjectURL(doc.fileUrl);
    }
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const handleRemoveControl = (index: number) => {
    setControls(controls.filter((_, i) => i !== index));
  };

  const handleDocumentChange = (index: number, field: keyof Omit<Document, 'id'>, value: any) => {
    const newDocs = [...documents];
    newDocs[index] = { ...newDocs[index], [field]: value };
    setDocuments(newDocs);
  };

  const handleFileUpload = (index: number, file: File) => {
    const newDocs = [...documents];
    if (newDocs[index].fileUrl) {
      URL.revokeObjectURL(newDocs[index].fileUrl!);
    }
    newDocs[index] = {
      ...newDocs[index],
      file: file,
      fileUrl: URL.createObjectURL(file),
      name: newDocs[index].name || file.name
    };
    setDocuments(newDocs);
  };

  const handleControlChange = (index: number, field: keyof Omit<Control, 'id'>, value: any) => {
    const newControls = [...controls];
    newControls[index] = { ...newControls[index], [field]: value };
    setControls(newControls);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !specialty || !doctor) return;

    onAdd({
      date: new Date(date),
      specialty,
      doctor,
      notes: notes || undefined,
      documents: documents.map(doc => ({
        ...doc,
        id: Math.random().toString(36).substr(2, 9)
      })),
      controls: controls.length > 0 ? controls.map(ctrl => ({
        ...ctrl,
        id: Math.random().toString(36).substr(2, 9)
      })) : undefined
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Nueva Cita Médica</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de la cita
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Especialidad
              </label>
              <input
                type="text"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="Ej: Cardiología, Medicina General"
                list="specialties-list"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <datalist id="specialties-list">
                {existingSpecialties.map(s => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Médico
              </label>
              <input
                type="text"
                value={doctor}
                onChange={(e) => setDoctor(e.target.value)}
                placeholder="Nombre del médico"
                list="doctors-list"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <datalist id="doctors-list">
                {existingDoctors.map(d => (
                  <option key={d} value={d} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas (opcional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observaciones adicionales"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">Documentos</h3>
              <button
                type="button"
                onClick={handleAddDocument}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Agregar documento
              </button>
            </div>

            <div className="space-y-3">
              {documents.map((doc, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Tipo de documento
                      </label>
                      <select
                        value={doc.type}
                        onChange={(e) => handleDocumentChange(index, 'type', e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {documentTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Fecha del documento
                      </label>
                      <input
                        type="date"
                        value={doc.date instanceof Date ? doc.date.toISOString().split('T')[0] : ''}
                        onChange={(e) => handleDocumentChange(index, 'date', new Date(e.target.value))}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={doc.name}
                      onChange={(e) => handleDocumentChange(index, 'name', e.target.value)}
                      placeholder="Nombre o descripción del documento"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                    />

                    <div className="flex gap-2">
                      <label className="flex-1">
                        <div className="flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-gray-300 rounded text-sm cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                          <Upload className="w-4 h-4" />
                          <span>{doc.file ? doc.file.name : 'Subir archivo (PDF, imagen)'}</span>
                        </div>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(index, file);
                          }}
                          className="hidden"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => handleRemoveDocument(index)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">Controles Programados</h3>
              <button
                type="button"
                onClick={handleAddControl}
                className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Agregar control
              </button>
            </div>

            <div className="space-y-3">
              {controls.map((control, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3 bg-green-50">
                  <div className="flex gap-2 mb-2">
                    <input
                      type="date"
                      value={control.date instanceof Date ? control.date.toISOString().split('T')[0] : ''}
                      onChange={(e) => handleControlChange(index, 'date', new Date(e.target.value))}
                      className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveControl(index)}
                      className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={control.type}
                    onChange={(e) => handleControlChange(index, 'type', e.target.value)}
                    placeholder="Tipo de control (ej: Control en 3 meses, Revisión anual)"
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Guardar Cita
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
