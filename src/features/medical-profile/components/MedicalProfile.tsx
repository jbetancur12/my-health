import { useState } from 'react';
import { User, Heart, AlertCircle, Phone, FileText, Save, Edit2 } from 'lucide-react';
import type {
  InsuranceInfo,
  MedicalProfile as MedicalProfileData,
} from '../../../shared/api/contracts';

interface MedicalProfileProps {
  profile: MedicalProfileData;
  onUpdate: (profile: MedicalProfileData) => void;
}

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export function MedicalProfile({ profile, onUpdate }: MedicalProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<MedicalProfileData>(profile);
  const [newAllergy, setNewAllergy] = useState('');
  const [newCondition, setNewCondition] = useState('');
  const [newContact, setNewContact] = useState({ name: '', relationship: '', phone: '' });

  function handleSave() {
    onUpdate(editedProfile);
    setIsEditing(false);
  }

  function addAllergy() {
    if (newAllergy.trim()) {
      setEditedProfile({
        ...editedProfile,
        allergies: [...editedProfile.allergies, newAllergy.trim()],
      });
      setNewAllergy('');
    }
  }

  function removeAllergy(index: number) {
    setEditedProfile({
      ...editedProfile,
      allergies: editedProfile.allergies.filter((_, i) => i !== index),
    });
  }

  function addCondition() {
    if (newCondition.trim()) {
      setEditedProfile({
        ...editedProfile,
        chronicConditions: [...editedProfile.chronicConditions, newCondition.trim()],
      });
      setNewCondition('');
    }
  }

  function removeCondition(index: number) {
    setEditedProfile({
      ...editedProfile,
      chronicConditions: editedProfile.chronicConditions.filter((_, i) => i !== index),
    });
  }

  function addEmergencyContact() {
    if (newContact.name.trim() && newContact.phone.trim()) {
      setEditedProfile({
        ...editedProfile,
        emergencyContacts: [
          ...editedProfile.emergencyContacts,
          { id: crypto.randomUUID(), ...newContact },
        ],
      });
      setNewContact({ name: '', relationship: '', phone: '' });
    }
  }

  function removeContact(id: string) {
    setEditedProfile({
      ...editedProfile,
      emergencyContacts: editedProfile.emergencyContacts.filter((c) => c.id !== id),
    });
  }

  function updateInsurance(patch: Partial<InsuranceInfo>) {
    setEditedProfile({
      ...editedProfile,
      insurance: {
        provider: editedProfile.insurance?.provider ?? '',
        policyNumber: editedProfile.insurance?.policyNumber ?? '',
        groupNumber: editedProfile.insurance?.groupNumber,
        ...patch,
      },
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <User className="w-7 h-7 text-blue-600" />
            Información Médica Personal
          </h2>
          <p className="text-gray-600 mt-1">Información crítica para emergencias y tratamientos</p>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            Editar
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setEditedProfile(profile);
                setIsEditing(false);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              Guardar
            </button>
          </div>
        )}
      </div>

      {/* Tipo de Sangre */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Heart className="w-5 h-5 text-red-600" />
          <h3 className="font-semibold text-gray-900">Tipo de Sangre</h3>
        </div>
        {isEditing ? (
          <select
            value={editedProfile.bloodType || ''}
            onChange={(e) => setEditedProfile({ ...editedProfile, bloodType: e.target.value })}
            className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccionar</option>
            {BLOOD_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        ) : (
          <p className="text-3xl font-bold text-red-600">
            {profile.bloodType || 'No especificado'}
          </p>
        )}
      </div>

      {/* Alergias */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-5 h-5 text-orange-600" />
          <h3 className="font-semibold text-gray-900">Alergias</h3>
        </div>
        {isEditing && (
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newAllergy}
              onChange={(e) => setNewAllergy(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addAllergy()}
              placeholder="Medicamento, alimento, etc."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={addAllergy}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              Agregar
            </button>
          </div>
        )}
        <div className="space-y-2">
          {(isEditing ? editedProfile : profile).allergies.length === 0 ? (
            <p className="text-gray-400 italic">No hay alergias registradas</p>
          ) : (
            (isEditing ? editedProfile : profile).allergies.map((allergy, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-lg px-4 py-2"
              >
                <span className="text-orange-900 font-medium">{allergy}</span>
                {isEditing && (
                  <button
                    onClick={() => removeAllergy(index)}
                    className="text-orange-600 hover:text-orange-800"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Condiciones Crónicas */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">Condiciones Crónicas</h3>
        </div>
        {isEditing && (
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newCondition}
              onChange={(e) => setNewCondition(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCondition()}
              placeholder="Diabetes, hipertensión, etc."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={addCondition}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Agregar
            </button>
          </div>
        )}
        <div className="space-y-2">
          {(isEditing ? editedProfile : profile).chronicConditions.length === 0 ? (
            <p className="text-gray-400 italic">No hay condiciones registradas</p>
          ) : (
            (isEditing ? editedProfile : profile).chronicConditions.map((condition, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-lg px-4 py-2"
              >
                <span className="text-purple-900 font-medium">{condition}</span>
                {isEditing && (
                  <button
                    onClick={() => removeCondition(index)}
                    className="text-purple-600 hover:text-purple-800"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Contactos de Emergencia */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Phone className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-gray-900">Contactos de Emergencia</h3>
        </div>
        {isEditing && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
            <input
              type="text"
              value={newContact.name}
              onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
              placeholder="Nombre"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={newContact.relationship}
              onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
              placeholder="Relación (ej: Esposa)"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2">
              <input
                type="tel"
                value={newContact.phone}
                onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                placeholder="Teléfono"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={addEmergencyContact}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                +
              </button>
            </div>
          </div>
        )}
        <div className="space-y-3">
          {(isEditing ? editedProfile : profile).emergencyContacts.length === 0 ? (
            <p className="text-gray-400 italic">No hay contactos de emergencia registrados</p>
          ) : (
            (isEditing ? editedProfile : profile).emergencyContacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-3"
              >
                <div className="flex-1">
                  <p className="font-medium text-green-900">{contact.name}</p>
                  <p className="text-sm text-green-700">{contact.relationship}</p>
                  <p className="text-sm text-green-600 font-mono">{contact.phone}</p>
                </div>
                {isEditing && (
                  <button
                    onClick={() => removeContact(contact.id)}
                    className="text-green-600 hover:text-green-800"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Seguro Médico */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Seguro Médico</h3>
        {isEditing ? (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Aseguradora</label>
              <input
                type="text"
                value={editedProfile.insurance?.provider || ''}
                onChange={(e) => updateInsurance({ provider: e.target.value })}
                placeholder="Nombre de la aseguradora"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de Póliza
              </label>
              <input
                type="text"
                value={editedProfile.insurance?.policyNumber || ''}
                onChange={(e) => updateInsurance({ policyNumber: e.target.value })}
                placeholder="Número de póliza"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de Grupo (Opcional)
              </label>
              <input
                type="text"
                value={editedProfile.insurance?.groupNumber || ''}
                onChange={(e) => updateInsurance({ groupNumber: e.target.value })}
                placeholder="Número de grupo"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        ) : profile.insurance?.provider ? (
          <div className="space-y-2">
            <div>
              <span className="text-sm text-gray-600">Aseguradora:</span>
              <p className="font-medium text-gray-900">{profile.insurance.provider}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Póliza:</span>
              <p className="font-medium text-gray-900">{profile.insurance.policyNumber}</p>
            </div>
            {profile.insurance.groupNumber && (
              <div>
                <span className="text-sm text-gray-600">Grupo:</span>
                <p className="font-medium text-gray-900">{profile.insurance.groupNumber}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-400 italic">No hay información de seguro registrada</p>
        )}
      </div>

      {/* Notas Adicionales */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Notas Adicionales</h3>
        {isEditing ? (
          <textarea
            value={editedProfile.notes || ''}
            onChange={(e) => setEditedProfile({ ...editedProfile, notes: e.target.value })}
            placeholder="Información médica adicional importante..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        ) : (
          <p className="text-gray-700 whitespace-pre-wrap">
            {profile.notes || 'No hay notas adicionales'}
          </p>
        )}
      </div>
    </div>
  );
}
