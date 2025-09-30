import React, { useState } from 'react';
import { HomePage } from './components/HomePage';
import { InspectionPage } from './components/InspectionPage';

type Page = 'home' | 'inspection';

interface InspectionData {
  inspector: string;
  date: string;
  zone: string;
}

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [inspectionData, setInspectionData] = useState<InspectionData | null>(null);

  const handleStartInspection = (inspector: string, date: string, zone: string) => {
    setInspectionData({ inspector, date, zone });
    setCurrentPage('inspection');
  };

  const handleGoBack = () => {
    setInspectionData(null);
    setCurrentPage('home');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'inspection':
        return (
          <InspectionPage
            key={inspectionData!.zone} // Add key for re-mounting on change
            zone={inspectionData!.zone}
            inspector={inspectionData!.inspector}
            date={inspectionData!.date}
            onBack={handleGoBack}
          />
        );
      case 'home':
      default:
        return <HomePage onNext={handleStartInspection} />;
    }
  };

  return (
    <main>
      {renderPage()}
    </main>
  );
};

export default App;
