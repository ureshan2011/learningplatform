/**
 * Builds the AI-use declaration template (.docx).
 *
 * The form universities are beginning to ask for and almost nobody supplies.
 * It is a page a student fills in and signs, not an essay: a table of what the
 * tool was used for, a statement of what is their own work, and a signature
 * line. Deliberately printable — some departments want it attached as a signed
 * page rather than pasted into the assignment.
 *
 * Run: node scripts/packs/ai-declaration.mjs <outDir>
 */
import { writeFileSync } from "node:fs";
import { repack } from "./repack.mjs";
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TabStopType,
  TextRun,
  WidthType,
} from "docx";

const OUT = process.argv[2] ?? ".";
const A4 = { width: 11906, height: 16838 };

/** Usable width inside 1-inch margins on A4. Column widths must sum to this. */
const TABLE_W = 9026;
const COLS = [3000, 4026, 2000];

const BLANK = "……………………………………………";

function cell(text, { bold = false, header = false, width } = {}) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: header
      ? { type: ShadingType.CLEAR, fill: "EFEFEF", color: "auto" }
      : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({ children: [new TextRun({ text, bold: bold || header })] })],
  });
}

function useRow(activity) {
  return new TableRow({
    children: [
      cell(activity, { width: COLS[0] }),
      cell("", { width: COLS[1] }),
      cell("", { width: COLS[2] }),
    ],
  });
}

function signatureLine(label) {
  return new Paragraph({
    spacing: { before: 360 },
    tabStops: [{ type: TabStopType.LEFT, position: 2600 }],
    children: [new TextRun({ text: label, bold: true }), new TextRun({ text: "\t" + BLANK })],
  });
}

function body(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 160, line: 340 },
    children: [
      new TextRun({ text, italics: opts.italics, color: opts.grey ? "666666" : undefined }),
    ],
  });
}

const doc = new Document({
  creator: "ICT Campus",
  title: "AI-use declaration",
  description: "A declaration of how generative AI was used in preparing a piece of coursework.",
  styles: { default: { document: { run: { font: "Calibri", size: 24 } } } },
  sections: [
    {
      properties: { page: { size: A4 } },
      children: [
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun("Declaration of AI use")],
        }),
        body(
          "Complete this and attach it to your submission, or paste the statement at the end into your assignment — whichever your department asks for. Check your module handbook first: some modules do not permit AI use at all, and where the handbook and this form disagree, the handbook governs your work.",
          { italics: true, grey: true },
        ),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 240 },
          children: [new TextRun("1. Your details")],
        }),
        signatureLine("Name"),
        signatureLine("Index number"),
        signatureLine("Module code"),
        signatureLine("Assignment title"),
        signatureLine("Date"),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400 },
          children: [new TextRun("2. What you used, and what for")],
        }),
        body(
          "Name the tool and the version or the date you used it. Leave a row blank if it does not apply. Add rows if you need them.",
          { italics: true, grey: true },
        ),
        new Table({
          columnWidths: COLS,
          width: { size: TABLE_W, type: WidthType.DXA },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                cell("What it was used for", { header: true, width: COLS[0] }),
                cell("Which tool, and how", { header: true, width: COLS[1] }),
                cell("Date used", { header: true, width: COLS[2] }),
              ],
            }),
            useRow("Understanding the topic"),
            useRow("Planning the structure"),
            useRow("Finding sources"),
            useRow("Summarising sources I read myself"),
            useRow("Grammar and spelling"),
            useRow("Translating my own notes"),
            useRow("Explaining or debugging my code"),
            useRow("Anything else"),
          ],
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400 },
          children: [new TextRun("3. What is your own work")],
        }),
        body(
          "Tick each statement that is true. If one is not true, do not tick it — an inaccurate declaration is a more serious matter than the AI use it was meant to cover.",
          { italics: true, grey: true },
        ),
        ...[
          "The analysis, the argument and the conclusions are my own.",
          "The final wording is my own. No text was submitted as written by an AI tool.",
          "I opened and read every source I cite. None of them came from an AI tool unchecked.",
          "Every number and quotation in this work comes from a source I can point to.",
          "Any code I submitted was written by me.",
        ].map(
          (line) =>
            new Paragraph({
              spacing: { after: 120 },
              children: [new TextRun({ text: "☐   " + line })],
            }),
        ),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400 },
          children: [new TextRun("4. Statement and signature")],
        }),
        new Paragraph({
          spacing: { after: 200, line: 340 },
          border: {
            top: { style: BorderStyle.SINGLE, size: 6, color: "CCCCCC", space: 8 },
            bottom: { style: BorderStyle.SINGLE, size: 6, color: "CCCCCC", space: 8 },
            left: { style: BorderStyle.SINGLE, size: 6, color: "CCCCCC", space: 8 },
            right: { style: BorderStyle.SINGLE, size: 6, color: "CCCCCC", space: 8 },
          },
          children: [
            new TextRun(
              "I confirm that the use of generative AI in preparing this assignment is described in full above, that it falls within what my module permits, and that the work submitted is my own. I take full responsibility for its content, including the accuracy of every source cited.",
            ),
          ],
        }),
        signatureLine("Signed"),
        signatureLine("Date"),

        new Paragraph({
          spacing: { before: 600 },
          alignment: AlignmentType.LEFT,
          children: [
            new TextRun({
              text: "From the Campus Survival Pack — ictcampus.lk",
              italics: true,
              size: 18,
              color: "888888",
            }),
          ],
        }),
      ],
    },
  ],
});

const out = `${OUT}/ai-use-declaration.docx`;
writeFileSync(out, await Packer.toBuffer(doc));
repack(out);
console.log("wrote ai-use-declaration.docx");
