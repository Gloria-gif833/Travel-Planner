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
      margin: [10, 10],
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait',
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