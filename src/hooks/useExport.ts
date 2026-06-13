import { useState, useCallback } from 'react';
import { useItinerary } from '../context/ItineraryContext';
import { exportToPdf } from '../services/pdfExportService';
import { exportToWord } from '../services/wordExportService';

export type ExportFormat = 'pdf' | 'word';

export function useExport() {
  const { state } = useItinerary();
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const itinerary = state.current;

  const handleExport = useCallback(async () => {
    if (!itinerary) return;

    setExporting(true);
    setExportError(null);

    try {
      let success = false;
      if (format === 'pdf') {
        success = await exportToPdf('export-preview-content', `旅行攻略_${itinerary.title}.pdf`);
      } else {
        success = await exportToWord(itinerary, `旅行攻略_${itinerary.title}.docx`);
      }

      if (!success) {
        setExportError('导出失败，请重试');
      }
    } catch (err) {
      setExportError('导出过程中发生错误');
      console.error(err);
    } finally {
      setExporting(false);
    }
  }, [itinerary, format]);

  return {
    format,
    setFormat,
    exporting,
    exportError,
    handleExport,
    itinerary,
  };
}