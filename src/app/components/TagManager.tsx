import { useState } from 'react';
import { Tag, Plus, X } from 'lucide-react';

export interface AppointmentTag {
  id: string;
  name: string;
  color: string;
}

interface TagManagerProps {
  tags: AppointmentTag[];
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  onCreateTag?: (tag: Omit<AppointmentTag, 'id'>) => void;
  availableTags?: AppointmentTag[];
}

const TAG_COLORS = [
  { name: 'Azul', value: '#3B82F6', bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  { name: 'Verde', value: '#10B981', bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  { name: 'Rojo', value: '#EF4444', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
  { name: 'Naranja', value: '#F59E0B', bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
  { name: 'Morado', value: '#8B5CF6', bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
  { name: 'Rosa', value: '#EC4899', bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-300' },
];

export function TagManager({ tags, selectedTags, onTagsChange, onCreateTag, availableTags }: TagManagerProps) {
  const [showCreateTag, setShowCreateTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0].value);

  const allAvailableTags = availableTags || tags;
  const colorInfo = (color: string) => TAG_COLORS.find((item) => item.value === color) || TAG_COLORS[0];

  const handleToggleTag = (tagId: string) => {
    onTagsChange(
      selectedTags.includes(tagId)
        ? selectedTags.filter((id) => id !== tagId)
        : [...selectedTags, tagId],
    );
  };

  const handleCreateTag = () => {
    if (!newTagName.trim() || !onCreateTag) return;
    onCreateTag({ name: newTagName.trim(), color: newTagColor });
    setNewTagName('');
    setNewTagColor(TAG_COLORS[0].value);
    setShowCreateTag(false);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Etiquetas</label>
      <div className="flex flex-wrap gap-2 mb-3">
        {allAvailableTags.map((tag) => {
          const isSelected = selectedTags.includes(tag.id);
          const color = colorInfo(tag.color);

          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => handleToggleTag(tag.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                isSelected
                  ? `${color.bg} ${color.text} border-2 ${color.border}`
                  : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              {tag.name}
              {isSelected && <X className="w-3.5 h-3.5" />}
            </button>
          );
        })}

        {onCreateTag && (
          <button type="button" onClick={() => setShowCreateTag(!showCreateTag)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors">
            <Plus className="w-3.5 h-3.5" />
            Nueva etiqueta
          </button>
        )}
      </div>

      {showCreateTag && onCreateTag && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg mb-3">
          <div className="space-y-3">
            <input
              type="text"
              value={newTagName}
              onChange={(event) => setNewTagName(event.target.value)}
              placeholder="Ej: Urgente, Crónico, Seguimiento..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <div className="flex flex-wrap gap-2">
              {TAG_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setNewTagColor(color.value)}
                  className={`w-8 h-8 rounded-full transition-all ${newTagColor === color.value ? 'ring-2 ring-offset-2 ring-blue-600 scale-110' : 'hover:scale-105'}`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={handleCreateTag} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                Crear
              </button>
              <button type="button" onClick={() => setShowCreateTag(false)} className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function TagDisplay({ tags, appointmentTags }: { tags: AppointmentTag[]; appointmentTags: string[] }) {
  const displayTags = tags.filter((tag) => appointmentTags.includes(tag.id));
  if (displayTags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {displayTags.map((tag) => {
        const color = TAG_COLORS.find((item) => item.value === tag.color) || TAG_COLORS[0];
        return (
          <span key={tag.id} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${color.bg} ${color.text}`}>
            <Tag className="w-3 h-3" />
            {tag.name}
          </span>
        );
      })}
    </div>
  );
}
