// PDF Generation from Markdown — produces professional reports
import { NextRequest, NextResponse } from "next/server";
import { jsPDF } from "jspdf";

// Clean markdown for PDF rendering
function cleanMarkdown(md: string): string {
  return md
    // Remove pipeline/agent metadata
    .replace(/^#*\s*You are completing subtask.*$/gm, "")
    .replace(/ORIGINAL TASK:.*?\n/gi, "")
    .replace(/YOUR ROLE IN THIS PIPELINE:.*?\n/gi, "")
    .replace(/WHAT OTHER AGENTS ARE DOING:[\s\S]*?deliverable\.\s*/gi, "")
    .replace(/^- Subtask \d+:.*\n/gm, "")
    .replace(/Focus specifically on YOUR assigned role\..*$/gm, "")
    .replace(/\(Confidence: (?:High|Medium|Low)\)/gi, "")
    .replace(/\*[^\*]+\| Colosseum Network[^\*]*\*/g, "")
    .replace(/\*(?:Analysis|Written|Compiled|Synthesized) by [^\*]+\*/g, "")
    .replace(/---\s*\*[^\*]+\*\s*$/g, "")
    // Clean up whitespace
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Parse markdown into structured blocks
interface Block {
  type: "h1" | "h2" | "h3" | "p" | "bullet" | "table" | "hr";
  content: string;
  rows?: string[][];
}

function parseMarkdown(md: string): Block[] {
  const blocks: Block[] = [];
  const lines = md.split("\n");
  let inTable = false;
  let tableRows: string[][] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Table detection
    if (line.includes("|") && line.trim().startsWith("|")) {
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      // Skip separator rows (|---|---|)
      if (!/^\|[\s-:|]+\|$/.test(line)) {
        const cells = line.split("|").filter(c => c.trim()).map(c => c.trim());
        if (cells.length > 0) tableRows.push(cells);
      }
      continue;
    } else if (inTable) {
      // End of table
      blocks.push({ type: "table", content: "", rows: tableRows });
      inTable = false;
      tableRows = [];
    }

    // Headings
    if (line.startsWith("# ")) {
      blocks.push({ type: "h1", content: line.slice(2).trim() });
    } else if (line.startsWith("## ")) {
      blocks.push({ type: "h2", content: line.slice(3).trim() });
    } else if (line.startsWith("### ")) {
      blocks.push({ type: "h3", content: line.slice(4).trim() });
    }
    // Bullets
    else if (/^[-*•]\s/.test(line.trim())) {
      blocks.push({ type: "bullet", content: line.trim().slice(2).trim() });
    } else if (/^\d+\.\s/.test(line.trim())) {
      blocks.push({ type: "bullet", content: line.trim().replace(/^\d+\.\s*/, "") });
    }
    // Horizontal rule
    else if (/^---+$/.test(line.trim())) {
      blocks.push({ type: "hr", content: "" });
    }
    // Paragraph
    else if (line.trim()) {
      // Clean up bold/italic markdown
      const cleaned = line
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .replace(/\*([^*]+)\*/g, "$1")
        .replace(/`([^`]+)`/g, "$1")
        .trim();
      if (cleaned) {
        blocks.push({ type: "p", content: cleaned });
      }
    }
  }

  // Handle remaining table
  if (inTable && tableRows.length > 0) {
    blocks.push({ type: "table", content: "", rows: tableRows });
  }

  return blocks;
}

export async function POST(req: NextRequest) {
  try {
    const { markdown, title } = await req.json();
    
    if (!markdown) {
      return NextResponse.json({ error: "Missing markdown content" }, { status: 400 });
    }

    const cleanedMd = cleanMarkdown(markdown);
    const blocks = parseMarkdown(cleanedMd);

    // Create PDF
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - 2 * margin;
    let y = margin;

    // Helper to add new page if needed
    const checkPageBreak = (height: number) => {
      if (y + height > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
    };

    // Title (if provided)
    const reportTitle = title || blocks.find(b => b.type === "h1")?.content || "Report";
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(30, 30, 30);
    const titleLines = doc.splitTextToSize(reportTitle, contentWidth);
    checkPageBreak(titleLines.length * 10 + 10);
    doc.text(titleLines, margin, y);
    y += titleLines.length * 10 + 10;

    // Horizontal line under title
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    // Process blocks
    for (const block of blocks) {
      switch (block.type) {
        case "h1":
          // Skip if it's the same as title
          if (block.content === reportTitle) continue;
          checkPageBreak(15);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(18);
          doc.setTextColor(30, 30, 30);
          y += 5;
          doc.text(block.content, margin, y);
          y += 10;
          break;

        case "h2":
          checkPageBreak(12);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(14);
          doc.setTextColor(50, 50, 50);
          y += 4;
          doc.text(block.content, margin, y);
          y += 8;
          break;

        case "h3":
          checkPageBreak(10);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(11);
          doc.setTextColor(70, 70, 70);
          y += 3;
          doc.text(block.content, margin, y);
          y += 6;
          break;

        case "p":
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(40, 40, 40);
          const pLines = doc.splitTextToSize(block.content, contentWidth);
          checkPageBreak(pLines.length * 5 + 2);
          doc.text(pLines, margin, y);
          y += pLines.length * 5 + 3;
          break;

        case "bullet":
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(40, 40, 40);
          const bulletLines = doc.splitTextToSize(block.content, contentWidth - 8);
          checkPageBreak(bulletLines.length * 5 + 2);
          doc.text("•", margin, y);
          doc.text(bulletLines, margin + 6, y);
          y += bulletLines.length * 5 + 2;
          break;

        case "table":
          if (!block.rows || block.rows.length === 0) break;
          const colCount = block.rows[0].length;
          const colWidth = contentWidth / colCount;
          const rowHeight = 7;
          
          checkPageBreak(block.rows.length * rowHeight + 5);
          
          // Table header
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.setFillColor(245, 245, 245);
          doc.rect(margin, y - 4, contentWidth, rowHeight, "F");
          
          for (let c = 0; c < colCount; c++) {
            const cellText = block.rows[0][c] || "";
            const truncated = cellText.length > 20 ? cellText.slice(0, 18) + "…" : cellText;
            doc.text(truncated, margin + c * colWidth + 2, y);
          }
          y += rowHeight;

          // Table body
          doc.setFont("helvetica", "normal");
          for (let r = 1; r < block.rows.length; r++) {
            checkPageBreak(rowHeight);
            for (let c = 0; c < colCount; c++) {
              const cellText = block.rows[r]?.[c] || "";
              const truncated = cellText.length > 25 ? cellText.slice(0, 23) + "…" : cellText;
              doc.text(truncated, margin + c * colWidth + 2, y);
            }
            y += rowHeight - 1;
          }
          y += 5;
          break;

        case "hr":
          checkPageBreak(10);
          y += 3;
          doc.setDrawColor(220, 220, 220);
          doc.setLineWidth(0.3);
          doc.line(margin, y, pageWidth - margin, y);
          y += 7;
          break;
      }
    }

    // Footer on each page
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Page ${i} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
      );
    }

    // Generate PDF buffer
    const pdfBuffer = doc.output("arraybuffer");
    const pdfBase64 = Buffer.from(pdfBuffer).toString("base64");

    return NextResponse.json({
      success: true,
      pdf: pdfBase64,
      filename: `${(title || "report").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`,
    });
  } catch (error: any) {
    console.error("PDF generation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
