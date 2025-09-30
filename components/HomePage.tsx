import React, { useState, useEffect } from 'react';
import { FirstAidKitIcon } from './FirstAidKitIcon';

interface HomePageProps {
  onNext: (inspector: string, date: string, zone: string) => void;
}

const ZONES = ["Planta Alta", "Planta Baja", "Recibo", "Bodega F"];

export const HomePage: React.FC<HomePageProps> = ({ onNext }) => {
  const [inspector, setInspector] = useState('');
  const [date, setDate] = useState('');
  const [zone, setZone] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    // Establecer la fecha predeterminada a hoy
    const today = new Date().toISOString().split('T')[0];
    setDate(today);
  }, []);

  useEffect(() => {
    setIsFormValid(inspector.trim() !== '' && date.trim() !== '' && zone.trim() !== '');
  }, [inspector, date, zone]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid) {
      onNext(inspector, date, zone);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100 fade-in">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-lg">
        <div className="flex flex-col items-center">
          <FirstAidKitIcon className="w-20 h-20 text-red-500" />
          <h1 className="mt-4 text-3xl font-bold text-center text-gray-800">Inspección de Botiquines</h1>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="inspector" className="block text-sm font-medium text-gray-700">
              Nombre de quien inspecciona
            </label>
            <input
              id="inspector"
              name="inspector"
              type="text"
              required
              aria-required="true"
              className="w-full px-3 py-2 mt-1 text-gray-900 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Nombre completo"
              value={inspector}
              onChange={(e) => setInspector(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700">
              Fecha de inspección
            </label>
            <input
              id="date"
              name="date"
              type="date"
              required
              aria-required="true"
              className="w-full px-3 py-2 mt-1 text-gray-900 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="zone" className="block text-sm font-medium text-gray-700">
              Zona de inspección
            </label>
            <select
              id="zone"
              name="zone"
              required
              aria-required="true"
              className="w-full px-3 py-2 mt-1 text-gray-900 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              value={zone}
              onChange={(e) => setZone(e.target.value)}
            >
              <option value="" disabled>Seleccione una zona</option>
              {ZONES.map((z) => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>
          </div>
          <div>
            <button
              type="submit"
              disabled={!isFormValid}
              className="w-full px-4 py-3 font-semibold text-white bg-red-600 rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
              aria-label="Siguiente paso de la inspección"
            >
              Siguiente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
