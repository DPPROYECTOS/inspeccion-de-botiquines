import React, { useState, useMemo, useEffect } from 'react';

// Let TypeScript know that XLSX is available on the window object
declare const XLSX: any;

interface InspectionPageProps {
  zone: string;
  inspector: string;
  date: string;
  onBack: () => void;
}

type Response = {
    answer: string;
    comment: string;
};

type Responses = Record<string, Response>;

// Reusable component for a single question row
const InspectionQuestion: React.FC<{ 
    question: string;
    sectionTitle: string;
    response: Response;
    onChange: (sectionTitle: string, question: string, value: Partial<Response>) => void;
}> = ({ question, sectionTitle, response, onChange }) => {
  const questionId = `${sectionTitle}-${question}`.replace(/\s+/g, '-').toLowerCase();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center py-4 border-b border-gray-200 last:border-b-0">
      <p className="text-gray-700 font-medium md:col-span-1">{question}</p>
      <div className="flex items-center space-x-4 md:col-span-1">
        {["SI", "NO", "N/A"].map((option) => (
          <label key={option} className="flex items-center space-x-2 text-gray-600 cursor-pointer">
            <input
              type="radio"
              name={`${questionId}-answer`}
              value={option}
              checked={response.answer === option}
              onChange={(e) => onChange(sectionTitle, question, { answer: e.target.value })}
              className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
      <div className="md:col-span-1">
        <input
          type="text"
          placeholder="Comentarios..."
          value={response.comment}
          onChange={(e) => onChange(sectionTitle, question, { comment: e.target.value })}
          className="w-full px-3 py-2 text-gray-900 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
          aria-label={`Comentario para la pregunta: ${question}`}
        />
      </div>
    </div>
  );
};

// Reusable component for a section of questions
const InspectionSection: React.FC<{ 
    title: string; 
    questions: string[];
    responses: Responses;
    onResponseChange: (sectionTitle: string, question: string, value: Partial<Response>) => void;
}> = ({ title, questions, responses, onResponseChange }) => (
    <div className="mt-6">
        <h3 className="text-xl font-semibold text-gray-700 pb-2 mb-4 border-b-2 border-red-500">{title}</h3>
        <div>
            {questions.map((q, index) => {
                const key = `${title} - ${q}`;
                const response = responses[key] || { answer: '', comment: '' };
                return (
                    <InspectionQuestion 
                        key={index} 
                        question={q} 
                        sectionTitle={title}
                        response={response}
                        onChange={onResponseChange}
                    />
                );
            })}
        </div>
    </div>
);

const questionsTemplate = [
    "¿El botiquin se encuentra libre de obtaculos?",
    "¿Cuenta con señalización visible para todos?",
    "¿Presenta daños fisicos?",
    "¿Cuenta con todos los materiales?",
    "¿Cuenta con checklist?"
];

const sectionsByZone: Record<string, string[]> = {
    'Planta Alta': ['Botiquín Planta Alta/Empaque', 'Botiquín de Alto Valor', 'Botiquín Reacondicionado'],
    'Planta Baja': ['Botiquín Devoluciones', 'Botiquín Mensajería'],
    'Recibo': ['Botiquín Recibo'],
    'Bodega F': ['Botiquín Empaque Retail', 'Botiquín Maquila/Mantenimiento'],
};

const titlesByZone: Record<string, string> = {
    'Planta Alta': 'Botiquines de Planta Alta',
    'Planta Baja': 'Botiquines de Planta Baja',
    'Recibo': 'Botiquín de Recibo',
    'Bodega F': 'Botiquines de Bodega F',
};

export const InspectionPage: React.FC<InspectionPageProps> = ({ zone, inspector, date, onBack }) => {
  const [responses, setResponses] = useState<Responses>({});
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<{ status: 'success' | 'error' | 'idle'; message: string; }>({ status: 'idle', message: '' });

  const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  const sections = sectionsByZone[zone] || [];
  const totalQuestions = sections.length * questionsTemplate.length;

  useEffect(() => {
    if (uploadStatus.status === 'success') {
      const timer = setTimeout(() => {
        onBack();
      }, 3000); // Redirect after 3 seconds

      return () => clearTimeout(timer); // Cleanup timer on unmount
    }
  }, [uploadStatus.status, onBack]);

  const isFormComplete = useMemo(() => {
    // FIX: Explicitly type 'r' as 'Response' to resolve ambiguity from Object.values return type.
    const answeredQuestions = Object.values(responses).filter((r: Response) => r.answer.trim() !== '').length;
    return answeredQuestions === totalQuestions;
  }, [responses, totalQuestions]);

  const handleResponseChange = (sectionTitle: string, question: string, value: Partial<Response>) => {
    const key = `${sectionTitle} - ${question}`;
    setResponses(prev => ({
        ...prev,
        [key]: {
            ...(prev[key] || { answer: '', comment: '' }),
            ...value,
        }
    }));
  };
  
  const handleFinalize = async () => {
    setIsUploading(true);
    setUploadStatus({ status: 'idle', message: '' });

    const dataForSheet: (string | undefined)[][] = [];
    dataForSheet.push(['Reporte de Inspección de Botiquines']);
    dataForSheet.push([]);
    dataForSheet.push(['Fecha', formattedDate]);
    dataForSheet.push(['Inspector', inspector]);
    dataForSheet.push(['Zona Inspeccionada', zone]);
    dataForSheet.push([]);
    dataForSheet.push(['Sección', 'Pregunta', 'Respuesta', 'Comentario']);

    sections.forEach(sectionTitle => {
        questionsTemplate.forEach(question => {
            const key = `${sectionTitle} - ${question}`;
            const response = responses[key] || { answer: 'N/A', comment: '' };
            dataForSheet.push([
                sectionTitle,
                question,
                response.answer,
                response.comment
            ]);
        });
    });

    const ws = XLSX.utils.aoa_to_sheet(dataForSheet);
    ws['!cols'] = [{ wch: 30 }, { wch: 40 }, { wch: 15 }, { wch: 50 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inspección');

    const base64String = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });

    const fileName = `Reporte Botiquines ${date}.xlsx`;
    const apiUrl = 'https://script.google.com/macros/s/AKfycbwa8FJi0wRnGAZqevfpJEe4E4OqMgt8U6yzLjhQa2nco8zlBB_Dip9FIIp5tlJkwfWD/exec';

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                // Using 'text/plain' is a common workaround for CORS issues with Google Apps Script,
                // as it avoids a preflight OPTIONS request that complex content types like 'application/json' would trigger.
                // The Apps Script can still parse the JSON string from the request body.
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify({
                file: base64String,
                fileName: fileName,
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            }),
        });

        const result = await response.json();

        if (result.status === 'success') {
            setUploadStatus({ status: 'success', message: 'Reporte subido exitosamente.' });
        } else {
            setUploadStatus({ status: 'error', message: result.message || 'Ocurrió un error desconocido en el servidor.' });
        }
    } catch (error) {
        console.error('Error uploading file:', error);
        setUploadStatus({ status: 'error', message: 'No se pudo conectar con el servidor. Revise su conexión a internet.' });
    } finally {
        setIsUploading(false);
    }
  };

  const renderContent = () => {
    const title = titlesByZone[zone] || `Inspección de ${zone}`;
    if (sections.length === 0) {
      return (
        <div className="p-6 text-center border-2 border-dashed rounded-lg border-gray-300">
          <p className="text-gray-500">
            Contenido de inspección para "{zone}" no definido.
          </p>
        </div>
      );
    }
    return (
      <>
        <h2 className="text-2xl font-bold text-center text-gray-800">{title}</h2>
        {sections.map(sectionTitle => (
          <InspectionSection 
            key={sectionTitle}
            title={sectionTitle}
            questions={questionsTemplate}
            responses={responses}
            onResponseChange={handleResponseChange}
          />
        ))}
      </>
    );
  };

  return (
    <>
      {(isUploading || uploadStatus.status !== 'idle') && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 fade-in">
          <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
            {isUploading && (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-red-600 mx-auto"></div>
                <p className="mt-4 text-lg text-gray-700 font-medium">Generando y enviando reporte...</p>
                <p className="mt-2 text-sm text-gray-500">Por favor, espere.</p>
              </>
            )}
            {uploadStatus.status === 'success' && (
              <>
                <svg className="w-16 h-16 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <h3 className="text-2xl font-bold text-gray-800 mt-4">¡Éxito!</h3>
                <p className="mt-2 text-gray-600">{uploadStatus.message}</p>
                <p className="mt-4 text-sm text-gray-500">Regresando a la página de inicio...</p>
              </>
            )}
            {uploadStatus.status === 'error' && (
              <>
                <svg className="w-16 h-16 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <h3 className="text-2xl font-bold text-gray-800 mt-4">Error</h3>
                <p className="mt-2 text-gray-600 bg-red-50 p-3 rounded-md">{uploadStatus.message}</p>
                <button
                  onClick={() => setUploadStatus({ status: 'idle', message: '' })}
                  className="mt-6 w-full px-4 py-3 font-semibold text-white bg-gray-600 rounded-md shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
                >
                  Cerrar
                </button>
              </>
            )}
          </div>
        </div>
      )}
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100 fade-in">
        <div className="w-full max-w-4xl p-8 space-y-6 bg-white rounded-2xl shadow-lg">
          <header className="text-center">
              <h1 className="text-3xl font-bold text-gray-800">Inspección - {zone}</h1>
              <p className="mt-2 text-gray-600">
                  Realizada por: <span className="font-semibold">{inspector}</span> el <span className="font-semibold">{formattedDate}</span>
              </p>
          </header>

          <main className="mt-8">
              {renderContent()}
          </main>
          
          <footer className="mt-8 space-y-4">
              <button
                  onClick={handleFinalize}
                  disabled={!isFormComplete || isUploading}
                  className="w-full px-4 py-3 font-semibold text-white bg-red-600 rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
                  aria-label="Finalizar y generar reporte"
              >
                  {isUploading ? 'Finalizando...' : 'Finalizar'}
              </button>
              <button
                  onClick={onBack}
                  className="w-full px-4 py-3 font-semibold text-white bg-gray-600 rounded-md shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
                  aria-label="Volver a la página de inicio"
              >
                  Atrás
              </button>
          </footer>
        </div>
      </div>
    </>
  );
};