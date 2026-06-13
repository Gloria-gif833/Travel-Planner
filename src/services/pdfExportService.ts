/* ========================================
   PDF 导出服务（html2pdf.js）
   ======================================== */

export async function exportToPdf(
  elementId: string,
  filename: string = 'travel-itinerary.pdf'
): Promise<boolean> {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('未找到要导出的元素');
    }

    const html2pdf = (await import('html2pdf.js')).default;

    const opt = {
      margin: [10, 10] as [number, number],
      filename,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
      },
      jsPDF: {
        unit: 'mm' as const,
        format: 'a4' as const,
        orientation: 'portrait' as const,
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    };

    await html2pdf().set(opt).from(element).save();
    return true;
  } catch (error) {
    console.error('PDF 导出失败:', error);
    return false;
  }
}