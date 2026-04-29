import { useState } from 'react';
import { Calculator, Heart, Scale, Activity, TrendingUp } from 'lucide-react';

export function MedicalCalculators() {
  const [activeCalc, setActiveCalc] = useState<'imc' | 'pressure' | 'hydration' | 'dose'>('imc');

  // IMC Calculator
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [imc, setImc] = useState<number | null>(null);

  // Blood Pressure
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [bpResult, setBpResult] = useState<string>('');

  // Hydration
  const [bodyWeight, setBodyWeight] = useState('');
  const [waterResult, setWaterResult] = useState<number | null>(null);

  // Dose calculator
  const [patientWeight, setPatientWeight] = useState('');
  const [mgPerKg, setMgPerKg] = useState('');
  const [doseResult, setDoseResult] = useState<number | null>(null);

  function calculateIMC() {
    const w = parseFloat(weight);
    const h = parseFloat(height) / 100; // convert cm to m

    if (w > 0 && h > 0) {
      const imcValue = w / (h * h);
      setImc(parseFloat(imcValue.toFixed(1)));
    }
  }

  function getIMCCategory(imc: number): { label: string; color: string; recommendation: string } {
    if (imc < 18.5) {
      return {
        label: 'Bajo peso',
        color: 'text-blue-600',
        recommendation: 'Consulta a un nutricionista para ganar peso de forma saludable.',
      };
    } else if (imc < 25) {
      return {
        label: 'Peso normal',
        color: 'text-green-600',
        recommendation: 'Tu peso es saludable. Mantén una dieta balanceada y ejercicio regular.',
      };
    } else if (imc < 30) {
      return {
        label: 'Sobrepeso',
        color: 'text-orange-600',
        recommendation: 'Considera reducir peso con dieta y ejercicio. Consulta a tu médico.',
      };
    } else {
      return {
        label: 'Obesidad',
        color: 'text-red-600',
        recommendation: 'Es importante consultar a un médico para un plan de pérdida de peso.',
      };
    }
  }

  function analyzePressure() {
    const sys = parseInt(systolic);
    const dia = parseInt(diastolic);

    if (sys > 0 && dia > 0) {
      if (sys < 120 && dia < 80) {
        setBpResult('Normal - Tu presión arterial está en rango saludable.');
      } else if (sys < 130 && dia < 80) {
        setBpResult('Elevada - Considera cambios en el estilo de vida.');
      } else if (sys < 140 || dia < 90) {
        setBpResult('Hipertensión Etapa 1 - Consulta a tu médico.');
      } else if (sys < 180 || dia < 120) {
        setBpResult('Hipertensión Etapa 2 - Consulta urgente con tu médico.');
      } else {
        setBpResult('Crisis Hipertensiva - Busca atención médica inmediata.');
      }
    }
  }

  function calculateHydration() {
    const w = parseFloat(bodyWeight);
    if (w > 0) {
      const liters = (w * 35) / 1000; // 35ml por kg
      setWaterResult(parseFloat(liters.toFixed(1)));
    }
  }

  function calculateDose() {
    const w = parseFloat(patientWeight);
    const dose = parseFloat(mgPerKg);
    if (w > 0 && dose > 0) {
      const totalDose = w * dose;
      setDoseResult(parseFloat(totalDose.toFixed(1)));
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-2">
          <Calculator className="w-7 h-7 text-blue-600" />
          Calculadoras Médicas
        </h2>
        <p className="text-gray-600">Herramientas útiles para tu salud</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveCalc('imc')}
          className={`px-4 py-2 font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeCalc === 'imc'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Scale className="w-4 h-4" />
          IMC
        </button>
        <button
          onClick={() => setActiveCalc('pressure')}
          className={`px-4 py-2 font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeCalc === 'pressure'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Heart className="w-4 h-4" />
          Presión Arterial
        </button>
        <button
          onClick={() => setActiveCalc('hydration')}
          className={`px-4 py-2 font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeCalc === 'hydration'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          Hidratación
        </button>
        <button
          onClick={() => setActiveCalc('dose')}
          className={`px-4 py-2 font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeCalc === 'dose'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Dosis
        </button>
      </div>

      {/* IMC Calculator */}
      {activeCalc === 'imc' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Calculadora de IMC</h3>
          <p className="text-gray-600 mb-6">
            Índice de Masa Corporal - Evalúa si tu peso es saludable
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Peso (kg)</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="70"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Altura (cm)</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="170"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            onClick={calculateIMC}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Calcular IMC
          </button>

          {imc !== null && (
            <div className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600 mb-1">Tu IMC es:</p>
                <p className="text-5xl font-bold text-blue-600">{imc}</p>
                <p className={`text-xl font-semibold mt-2 ${getIMCCategory(imc).color}`}>
                  {getIMCCategory(imc).label}
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 mt-4">
                <p className="text-sm text-gray-700">{getIMCCategory(imc).recommendation}</p>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <p className="font-medium text-gray-700">Referencia:</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-400 rounded"></div>
                    <span className="text-gray-600">&lt; 18.5: Bajo peso</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-400 rounded"></div>
                    <span className="text-gray-600">18.5-24.9: Normal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-400 rounded"></div>
                    <span className="text-gray-600">25-29.9: Sobrepeso</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-400 rounded"></div>
                    <span className="text-gray-600">≥ 30: Obesidad</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Blood Pressure */}
      {activeCalc === 'pressure' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Análisis de Presión Arterial</h3>
          <p className="text-gray-600 mb-6">Evalúa si tu presión está en rango saludable</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sistólica (mmHg)
              </label>
              <input
                type="number"
                value={systolic}
                onChange={(e) => setSystolic(e.target.value)}
                placeholder="120"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Diastólica (mmHg)
              </label>
              <input
                type="number"
                value={diastolic}
                onChange={(e) => setDiastolic(e.target.value)}
                placeholder="80"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            onClick={analyzePressure}
            className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Analizar Presión
          </button>

          {bpResult && (
            <div className="mt-6 p-6 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-center text-lg font-medium text-gray-900">{bpResult}</p>
            </div>
          )}
        </div>
      )}

      {/* Hydration */}
      {activeCalc === 'hydration' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Calculadora de Hidratación</h3>
          <p className="text-gray-600 mb-6">Cuánta agua deberías tomar según tu peso</p>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Peso Corporal (kg)
            </label>
            <input
              type="number"
              value={bodyWeight}
              onChange={(e) => setBodyWeight(e.target.value)}
              placeholder="70"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={calculateHydration}
            className="w-full px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors font-medium"
          >
            Calcular
          </button>

          {waterResult !== null && (
            <div className="mt-6 p-6 bg-cyan-50 border border-cyan-200 rounded-lg text-center">
              <p className="text-sm text-gray-600 mb-2">Deberías tomar aproximadamente:</p>
              <p className="text-5xl font-bold text-cyan-600 mb-2">{waterResult}L</p>
              <p className="text-gray-600">de agua por día</p>
              <p className="text-sm text-gray-500 mt-4">
                * Basado en 35ml por kg de peso corporal (recomendación general)
              </p>
            </div>
          )}
        </div>
      )}

      {/* Dose Calculator */}
      {activeCalc === 'dose' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Calculadora de Dosis</h3>
          <p className="text-gray-600 mb-6">Calcula dosis de medicamentos según peso</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Peso del Paciente (kg)
              </label>
              <input
                type="number"
                value={patientWeight}
                onChange={(e) => setPatientWeight(e.target.value)}
                placeholder="70"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Dosis (mg/kg)</label>
              <input
                type="number"
                step="0.1"
                value={mgPerKg}
                onChange={(e) => setMgPerKg(e.target.value)}
                placeholder="10"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            onClick={calculateDose}
            className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            Calcular Dosis
          </button>

          {doseResult !== null && (
            <div className="mt-6 p-6 bg-purple-50 border border-purple-200 rounded-lg text-center">
              <p className="text-sm text-gray-600 mb-2">Dosis total:</p>
              <p className="text-5xl font-bold text-purple-600 mb-2">{doseResult}</p>
              <p className="text-gray-600">mg</p>
              <p className="text-sm text-yellow-700 bg-yellow-50 rounded p-3 mt-4">
                ⚠️ Siempre consulta con un médico antes de administrar cualquier medicamento
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
