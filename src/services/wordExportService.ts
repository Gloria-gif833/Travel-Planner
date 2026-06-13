/* ========================================
   Word 导出服务（docx.js + file-saver）
   ======================================== */

import type { ItineraryData } from '../types/itinerary';

export async function exportToWord(
  itinerary: ItineraryData,
  filename: string = 'travel-itinerary.docx'
): Promise<boolean> {
  try {
    const {
      Document,
      Packer,
      Paragraph,
      TextRun,
      HeadingLevel,
      Table,
      TableRow,
      TableCell,
      WidthType,
      AlignmentType,
      BorderStyle,
    } = await import('docx');
    const { saveAs } = await import('file-saver');

    // 构建文档
    const sections = [];

    // 标题
    sections.push(
      new Paragraph({
        text: itinerary.title,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    );

    sections.push(new Paragraph({ spacing: { after: 200 } }));

    // 每日行程
    for (const day of itinerary.days) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Day ${day.dayNumber} — ${day.title}`,
              bold: true,
              size: 28,
            }),
          ],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 100 },
        })
      );

      for (const slot of day.slots) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${slot.label}`,
                bold: true,
                size: 22,
              }),
            ],
            spacing: { before: 200, after: 80 },
          })
        );

        for (const spot of slot.spots) {
          const spotLines: (string | TextRun)[] = [];

          spotLines.push(
            new TextRun({
              text: `📍 ${spot.name}`,
              bold: true,
              size: 20,
            })
          );
          spotLines.push(new TextRun({ text: `  ⏱ ${spot.duration}`, size: 20 }));
          spotLines.push(new TextRun({ text: `\n${spot.description}`, size: 20 }));

          if (spot.transport) {
            spotLines.push(
              new TextRun({
                text: `\n🚗 交通：${spot.transport.mode}（${spot.transport.duration}）`,
                size: 18,
                color: '666666',
              })
            );
          }

          sections.push(
            new Paragraph({
              children: spotLines,
              spacing: { before: 100, after: 60 },
              indent: { left: 400 },
            })
          );
        }
      }

      if (day.tips && day.tips.length > 0) {
        sections.push(new Paragraph({ spacing: { before: 100 } }));
        for (const tip of day.tips) {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({ text: `💡 ${tip}`, size: 18, italics: true }),
              ],
              indent: { left: 400 },
              spacing: { after: 40 },
            })
          );
        }
      }
    }

    // 实用信息
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: '\n实用信息',
            bold: true,
            size: 28,
          }),
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    );

    sections.push(
      new Paragraph({
        children: [
          new TextRun({ text: '交通建议', bold: true, size: 22 }),
        ],
        spacing: { before: 200, after: 80 },
      }),
      new Paragraph({
        text: itinerary.practicalInfo.transport,
        spacing: { after: 100 },
        indent: { left: 400 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: '住宿建议', bold: true, size: 22 }),
        ],
        spacing: { before: 200, after: 80 },
      }),
      new Paragraph({
        text: itinerary.practicalInfo.accommodation,
        spacing: { after: 100 },
        indent: { left: 400 },
      })
    );

    // 预算表格
    const budget = itinerary.practicalInfo.budget;
    const total = budget.transport + budget.hotel + budget.food + budget.tickets + budget.other;

    sections.push(
      new Paragraph({
        children: [
          new TextRun({ text: '预算明细', bold: true, size: 22 }),
        ],
        spacing: { before: 200, after: 100 },
      }),
      new Table({
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ text: '项目' })],
                width: { size: 3000, type: WidthType.DXA },
              }),
              new TableCell({
                children: [new Paragraph({ text: '金额' })],
                width: { size: 3000, type: WidthType.DXA },
              }),
            ],
          }),
          ...(['大交通', '住宿', '餐饮', '门票', '其他'] as const).map((label, i) => {
            const amounts = [budget.transport, budget.hotel, budget.food, budget.tickets, budget.other];
            return new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ text: label })],
                }),
                new TableCell({
                  children: [new Paragraph({ text: `¥${amounts[i].toLocaleString()}` })],
                }),
              ],
            });
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ text: '合计', bold: true })],
              }),
              new TableCell({
                children: [new Paragraph({ text: `¥${total.toLocaleString()}`, bold: true })],
              }),
            ],
          }),
        ],
      })
    );

    // 注意事项
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: '\n注意事项',
            bold: true,
            size: 28,
          }),
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    );

    for (const notice of itinerary.notices) {
      sections.push(
        new Paragraph({
          text: `• ${notice}`,
          spacing: { after: 60 },
          indent: { left: 400 },
        })
      );
    }

    // 生成文档
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: sections,
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, filename);
    return true;
  } catch (error) {
    console.error('Word 导出失败:', error);
    return false;
  }
}