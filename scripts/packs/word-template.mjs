/**
 * Builds the university assignment template (.docx).
 *
 * The point of the file is the *styles*, not the words in it. A student who
 * types into this gets a real Heading 1/2/3 tree, so the contents page builds
 * itself and the marker's navigation pane works — which is most of what
 * "proper formatting" means in a first-year brief.
 *
 * Run: node scripts/packs/word-template.mjs <outDir>
 * `docx` is not a project dependency — this is a build tool for a file that is
 * generated once and uploaded, not something the app imports.
 */
import { writeFileSync } from "node:fs";
import { repack } from "./repack.mjs";
import {
  AlignmentType,
  Document,
  Footer,
  HeadingLevel,
  LevelFormat,
  PageBreak,
  PageNumber,
  Packer,
  Paragraph,
  TabStopType,
  TableOfContents,
  TextRun,
} from "docx";

const OUT = process.argv[2] ?? ".";

/** A4 in DXA (1440 = one inch). The default is A4 already; stated so it cannot drift. */
const A4 = { width: 11906, height: 16838 };

const BLANK = "………………………………………………";

function coverLine(label) {
  return new Paragraph({
    spacing: { after: 200 },
    tabStops: [{ type: TabStopType.LEFT, position: 3200 }],
    children: [
      new TextRun({ text: label, bold: true }),
      new TextRun({ text: "\t" + BLANK }),
    ],
  });
}

function body(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 160, line: 360 },
    children: [new TextRun({ text, italics: opts.italics, color: opts.grey ? "666666" : undefined })],
  });
}

/** Guidance the student deletes. Grey and italic so it is obviously not their work. */
function hint(text) {
  return body(text, { italics: true, grey: true });
}

const doc = new Document({
  creator: "ICT Campus",
  title: "University assignment template",
  description: "Assignment template with heading styles, automatic contents, captions and page numbers.",
  styles: {
    default: {
      document: { run: { font: "Calibri", size: 24 } },
    },
    paragraphStyles: [
      {
        id: "Caption",
        name: "Caption",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 20, italics: true, color: "444444" },
        paragraph: { spacing: { before: 80, after: 240 }, alignment: AlignmentType.CENTER },
      },
    ],
  },
  numbering: {
    config: [
      {
        reference: "ref-list",
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "•",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
        ],
      },
    ],
  },
  sections: [
    {
      properties: { page: { size: A4 } },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ children: ["Page ", PageNumber.CURRENT, " of ", PageNumber.TOTAL_PAGES] }),
              ],
            }),
          ],
        }),
      },
      children: [
        /* ---------------- Cover page ---------------- */
        new Paragraph({ spacing: { before: 1200, after: 400 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
          children: [new TextRun({ text: "TITLE OF YOUR ASSIGNMENT", bold: true, size: 40 })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 800 },
          children: [
            new TextRun({
              text: "Replace this with the exact title from your assignment brief",
              italics: true,
              color: "666666",
            }),
          ],
        }),

        coverLine("Your name"),
        coverLine("Index number"),
        coverLine("Module code"),
        coverLine("Module name"),
        coverLine("Lecturer"),
        coverLine("Department"),
        coverLine("University"),
        coverLine("Date submitted"),
        coverLine("Word count"),

        new Paragraph({ spacing: { before: 600 }, children: [new PageBreak()] }),

        /* ---------------- Contents ---------------- */
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun("Contents")],
        }),
        hint(
          "This page fills itself in. Right-click it and choose Update Field, then Update entire table — do it once more just before you submit. It picks up anything you format as Heading 1, 2 or 3.",
        ),
        new TableOfContents("Contents", { hyperlinks: true, headingStyleRange: "1-3" }),

        new Paragraph({ children: [new PageBreak()] }),

        /* ---------------- Body ---------------- */
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("1. Introduction")] }),
        hint(
          "Say what the assignment is about, why it matters, and what the rest of the document does. Three or four sentences. Write this last.",
        ),
        body(
          "Type here. Use the Styles gallery on the Home tab to mark your headings — do not make text big and bold by hand, because the contents page cannot see that.",
        ),

        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("2. Main section")] }),
        hint("Rename this to whatever your brief asks for."),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2.1 A sub-section")] }),
        body("Type here."),

        new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("2.1.1 A smaller point")] }),
        body("Type here."),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2.2 Figures and tables")] }),
        hint(
          "Every figure and table needs a number and a caption, and must be referred to in the text — 'as Figure 1 shows'. A figure caption goes below it; a table caption goes above it.",
        ),
        body("[ Paste your chart or image here ]"),
        new Paragraph({
          style: "Caption",
          children: [new TextRun("Figure 1: What the figure shows, and where the data came from."),],
        }),
        new Paragraph({
          style: "Caption",
          children: [new TextRun("Table 1: What the table shows, and where the data came from."),],
        }),
        body("[ Paste your table here ]"),

        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("3. Discussion")] }),
        body("Type here."),

        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("4. Conclusion")] }),
        hint("No new information here. Answer the question you were asked, in a short paragraph."),
        body("Type here."),

        new Paragraph({ children: [new PageBreak()] }),

        /* ---------------- References ---------------- */
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("References")] }),
        hint(
          "Alphabetical by the first author's surname. Not numbered. Every source cited in the text appears here, and nothing appears here that is not cited in the text. Use the style your department asks for — the APA 7 and Harvard guide in the pack has worked Sri Lankan examples.",
        ),
        new Paragraph({
          numbering: { reference: "ref-list", level: 0 },
          spacing: { after: 120 },
          children: [new TextRun({ text: "Delete this bullet and paste your references here.", italics: true, color: "666666" })],
        }),

        new Paragraph({ children: [new PageBreak()] }),

        /* ---------------- Appendix ---------------- */
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Appendix A")] }),
        hint(
          "Anything too long for the body: a questionnaire, full output tables, code. Refer to it from the text — an appendix nobody is pointed to does not get read. Appendices usually do not count towards the word limit, but check your brief.",
        ),
        body("Type here."),

        new Paragraph({ spacing: { before: 400 } }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Template from the Campus Survival Pack — ictcampus.lk. Delete this line before you submit.",
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

const buffer = await Packer.toBuffer(doc);
const out = `${OUT}/university-assignment-template.docx`;
writeFileSync(out, buffer);
repack(out);
console.log("wrote university-assignment-template.docx");
