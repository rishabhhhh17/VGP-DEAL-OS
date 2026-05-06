import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import * as XLSX from "xlsx";

// ── Normalisation helpers ─────────────────────────────────────────────────────

const VALID_TYPES = new Set([
  "Google Meet","Phone Call","Email","WhatsApp","WhatsApp Call",
  "LinkedIn","In-person","Zoom Call","Microsoft Teams","VGP Office","Other",
]);

function normaliseType(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = raw.trim();
  if (VALID_TYPES.has(s)) return s;
  const l = s.toLowerCase();
  if (l.includes("google meet") || l === "meet") return "Google Meet";
  if (l.includes("zoom")) return "Zoom Call";
  if (l.includes("teams") || l.includes("microsoft")) return "Microsoft Teams";
  if (l.includes("whatsapp call") || l.includes("whatsapp cal")) return "WhatsApp Call";
  if (l.includes("whatsapp")) return "WhatsApp";
  if (l.includes("linkedin") || l.includes("linked in")) return "LinkedIn";
  if (l.includes("phone") || l === "call") return "Phone Call";
  if (l.includes("email")) return "Email";
  if (l.includes("vgp")) return "VGP Office";
  if (l.includes("in-person") || l.includes("in person") || l.includes("inperson")) return "In-person";
  if (l.includes("office")) return "In-person";
  return "Other";
}

const VALID_OUTCOMES = new Set([
  "Mandated","In progress","To Follow-up","Handed over",
  "Investing Partners","KIT","Pass","Follow-up scheduled",
]);

function normaliseOutcome(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = raw.trim();
  if (VALID_OUTCOMES.has(s)) return s;
  const l = s.toLowerCase();
  for (const v of VALID_OUTCOMES) {
    if (v.toLowerCase() === l) return v;
  }
  if (l.includes("invest")) return "Investing Partners";
  if (l.includes("handed")) return "Handed over";
  if (l.includes("follow-up scheduled") || l.includes("follow up scheduled")) return "Follow-up scheduled";
  if (l.includes("follow")) return "To Follow-up";
  if (l.includes("in progress") || l.includes("inprogress")) return "In progress";
  if (l.includes("pass")) return "Pass";
  if (l.includes("mandate")) return "Mandated";
  if (l.includes("kit")) return "KIT";
  return s;
}

function normaliseOrigination(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const l = raw.trim().toLowerCase();
  if (l.includes("inbound")) return "Inbound";
  if (l.includes("outbound")) return "Outbound";
  if (l.includes("mutual")) return "Mutual";
  return raw.trim();
}

// ── Value coercers ────────────────────────────────────────────────────────────

function str(val: unknown): string | null {
  if (val === null || val === undefined) return null;
  const s = String(val).trim();
  return s === "" || s === "null" || s === "undefined" ? null : s;
}

// Handles: JS Date objects, Excel serial numbers, ISO strings,
// DD/MM/YYYY strings (Indian format), numeric strings that are serials.
function parseDate(val: unknown): Date | null {
  if (val == null) return null;

  // ① JS Date (from cellDates:true)
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val;
  }

  // ② Excel serial number
  if (typeof val === "number" && val > 0) {
    try {
      const p = XLSX.SSF.parse_date_code(val);
      if (p && p.y > 1899) {
        return new Date(p.y, p.m - 1, p.d, p.H ?? 0, p.M ?? 0, p.S ?? 0);
      }
    } catch { /* fall through */ }
    // Fallback: 25569 = Excel serial for Unix epoch
    const ms = Math.round((val - 25569) * 86_400_000);
    const d = new Date(ms);
    if (!isNaN(d.getTime()) && d.getFullYear() > 1900 && d.getFullYear() < 2100) return d;
    return null;
  }

  // ③ String
  if (typeof val === "string") {
    const s = val.trim();
    if (!s) return null;

    // Try standard JS parsing (ISO, US formats, long-form)
    const d1 = new Date(s);
    if (!isNaN(d1.getTime())) return d1;

    // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY  (Indian / European)
    const mSlash = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
    if (mSlash) {
      const [, a, b, cy] = mSlash;
      const year = cy.length === 2 ? 2000 + parseInt(cy) : parseInt(cy);
      const da = parseInt(a), db = parseInt(b);
      // Prefer DD/MM/YYYY when day > 12 (unambiguous)
      if (da > 12 && db <= 12) {
        const d2 = new Date(year, db - 1, da);
        if (!isNaN(d2.getTime())) return d2;
      }
      // Otherwise try DD/MM/YYYY first then MM/DD/YYYY
      const d3 = new Date(year, db - 1, da);
      if (!isNaN(d3.getTime()) && db <= 12) return d3;
      const d4 = new Date(year, da - 1, db);
      if (!isNaN(d4.getTime()) && da <= 12) return d4;
    }

    // Numeric string that might be an Excel serial stored as text
    const asNum = parseFloat(s);
    if (!isNaN(asNum) && asNum > 1000 && asNum < 100_000) {
      return parseDate(asNum);
    }

    return null;
  }

  return null;
}

function parseBool(val: unknown): boolean | null {
  if (val == null) return null;
  if (typeof val === "boolean") return val;
  if (typeof val === "string") {
    const l = val.trim().toLowerCase();
    if (l === "true" || l === "yes" || l === "1") return true;
    if (l === "false" || l === "no" || l === "0") return false;
  }
  if (typeof val === "number") return val !== 0;
  return null;
}

function parsePocArray(val: unknown): string | null {
  if (!val) return null;
  const s = String(val).trim();
  if (!s) return null;
  const parts = s.split(",").map(p => p.trim()).filter(Boolean);
  return parts.length ? JSON.stringify(parts) : null;
}

// ── Column auto-detection by header name ──────────────────────────────────────
//
// Reads header row and maps field names → column indices.
// Falls back to the documented positional defaults if a header isn't found.

type ColMap = Record<string, number>;

const HEADER_PATTERNS: Record<string, string[]> = {
  date:                    ["date", "meeting date", "interaction date"],
  name:                    ["name", "person name", "person's name", "contact", "contact name"],
  companyName:             ["company name", "company", "organisation", "organization"],
  context:                 ["context", "about", "description"],
  mandate:                 ["associated mandate", "mandate", "fund"],
  interactionType:         ["interaction type", "type", "meeting type"],
  origination:             ["origination", "origin", "direction"],
  referralTouchpoint:      ["referral touchpoint", "referral", "referred by", "touchpoint"],
  vgpPoc:                  ["vgp poc", "poc", "owner", "team member"],
  outcome:                 ["outcome", "status", "result"],
  takeaways:               ["takeaways", "key takeaways", "takeaway"],
  nextSteps:               ["next steps", "next step", "action items", "actions"],
  deadline:                ["deadline", "due date", "follow up date", "follow-up date"],
  complete:                ["complete?", "complete", "completed", "done"],
  linkToNotes:             ["link to notes", "notes link", "notes url"],
  contactEmail:            ["contact email", "email"],
  contactMobile:           ["contact mobile", "mobile", "phone number"],
  mandateInvestmentPartner:["mandate/investment partner?", "investment partner?", "partner?"],
  fathomNotes:             ["fathom notes", "fathom"],
};

// Positional defaults (0-based): A=0, B=1 … T=19
const POSITIONAL_DEFAULTS: ColMap = {
  date: 1, name: 2, companyName: 3, context: 4, mandate: 5,
  interactionType: 6, origination: 7, referralTouchpoint: 8,
  vgpPoc: 9, outcome: 10, takeaways: 11, nextSteps: 12,
  deadline: 13, complete: 14, linkToNotes: 15,
  contactEmail: 16, contactMobile: 17,
  mandateInvestmentPartner: 18, fathomNotes: 19,
};

function buildColMap(headerRow: unknown[]): { map: ColMap; detectedByHeader: boolean } {
  const map: ColMap = { ...POSITIONAL_DEFAULTS };
  let matched = 0;

  for (let i = 0; i < headerRow.length; i++) {
    if (!headerRow[i]) continue;
    const h = String(headerRow[i]).trim().toLowerCase();
    for (const [field, patterns] of Object.entries(HEADER_PATTERNS)) {
      if (patterns.some(p => h === p || h.startsWith(p) || p.startsWith(h))) {
        map[field] = i;
        matched++;
        break;
      }
    }
  }

  return { map, detectedByHeader: matched >= 3 };
}

// Pull a cell value from a row by field name using the column map
function cell(row: unknown[], map: ColMap, field: string): unknown {
  const idx = map[field];
  if (idx === undefined || idx >= row.length) return null;
  return row[idx] ?? null;
}

// True if a row has no meaningful data (skip silently)
function isMeaninglessRow(row: unknown[], map: ColMap): boolean {
  const keyCols = ["date", "name", "companyName", "context", "outcome", "takeaways", "nextSteps"];
  return keyCols.every(f => {
    const v = cell(row, map, f);
    return v === null || v === undefined || String(v).trim() === "";
  });
}

// ── CSV fallback ──────────────────────────────────────────────────────────────

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  function parseLine(line: string): string[] {
    const fields: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        fields.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    fields.push(current.trim());
    return fields;
  }

  const headers = parseLine(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, "_"));
  return lines.slice(1).map(line => {
    const vals = parseLine(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = vals[i] ?? ""; });
    return obj;
  });
}

function colCSV(row: Record<string, string>, ...keys: string[]): string {
  for (const k of keys) {
    const v = row[k.toLowerCase().replace(/\s+/g, "_")];
    if (v !== undefined && v !== "") return v.trim();
  }
  return "";
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return Response.json({ error: "No file" }, { status: 400 });

  const ext = file.name.split(".").pop()?.toLowerCase();
  const isExcel = ext === "xlsx" || ext === "xls";

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const created: string[] = [];
  const skipped: { row: number; reason: string }[] = [];
  let silentlySkipped = 0;

  const batch = await prisma.importBatch.create({
    data: { filename: file.name, rowCount: 0, errorCount: 0 },
  });

  if (isExcel) {
    const wb = XLSX.read(buffer, {
      type: "buffer",
      cellDates: true,  // date cells → JS Date objects
      cellNF: true,     // preserve number format info
      cellText: false,  // don't generate .w (we handle formatting)
    });

    const sheet = wb.Sheets[wb.SheetNames[0]];

    // ── CRITICAL FIX: expand !ref so xlsx reads ALL columns ──────────────
    // Excel sometimes under-reports the range, cutting off columns L-T.
    if (sheet["!ref"]) {
      const range = XLSX.utils.decode_range(sheet["!ref"]);
      // Ensure at least 26 columns (A-Z) are included
      if (range.e.c < 25) range.e.c = 25;
      sheet["!ref"] = XLSX.utils.encode_range(range);
    }

    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      defval: null,
      raw: true,  // Date objects for date cells, numbers for number cells
    });

    if (rows.length < 2) {
      await prisma.importBatch.delete({ where: { id: batch.id } });
      return Response.json({ error: "File appears empty or has no data rows" }, { status: 400 });
    }

    // Build column map from header row
    const { map, detectedByHeader } = buildColMap(rows[0] as unknown[]);

    // Data rows start at index 1
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] as unknown[];
      const humanRow = i + 1;

      if (isMeaninglessRow(row, map)) {
        silentlySkipped++;
        continue;
      }

      const personName = str(cell(row, map, "name"));
      const dateVal = cell(row, map, "date");
      const date = parseDate(dateVal);

      if (!personName) {
        skipped.push({ row: humanRow, reason: `Missing Name (col ${map.name}: "${dateVal ?? ""}")` });
        continue;
      }
      if (!date) {
        skipped.push({ row: humanRow, reason: `Unparseable Date "${dateVal ?? ""}" (type: ${typeof dateVal})` });
        continue;
      }

      try {
        const record = await prisma.interaction.create({
          data: {
            importBatchId:            batch.id,
            date,
            personName,
            companyName:              str(cell(row, map, "companyName")),
            context:                  str(cell(row, map, "context")),
            mandate:                  str(cell(row, map, "mandate")),
            interactionType:          normaliseType(str(cell(row, map, "interactionType"))),
            origination:              normaliseOrigination(str(cell(row, map, "origination"))),
            referralTouchpoint:       str(cell(row, map, "referralTouchpoint")),
            vgpPoc:                   parsePocArray(cell(row, map, "vgpPoc")),
            outcome:                  normaliseOutcome(str(cell(row, map, "outcome"))),
            takeaways:                str(cell(row, map, "takeaways")),
            nextSteps:                str(cell(row, map, "nextSteps")),
            deadline:                 parseDate(cell(row, map, "deadline")),
            complete:                 parseBool(cell(row, map, "complete")),
            linkToNotes:              str(cell(row, map, "linkToNotes")),
            contactEmail:             str(cell(row, map, "contactEmail")),
            contactMobile:            cell(row, map, "contactMobile") != null
                                        ? String(cell(row, map, "contactMobile")).trim() || null
                                        : null,
            mandateInvestmentPartner: parseBool(cell(row, map, "mandateInvestmentPartner")),
            fathomNotes:              str(cell(row, map, "fathomNotes")),
          },
        });
        created.push(record.id);
      } catch (e) {
        skipped.push({ row: humanRow, reason: String(e) });
      }
    }

    // Include column detection info in response for debugging
    const headerNote = detectedByHeader
      ? `Columns detected automatically from header row`
      : `Headers not recognised — used positional defaults (A=ignore, B=Date, C=Name…)`;

    await prisma.importBatch.update({
      where: { id: batch.id },
      data: { rowCount: created.length, errorCount: skipped.length },
    });

    if (created.length === 0) {
      await prisma.importBatch.delete({ where: { id: batch.id } });
    }

    return Response.json({
      imported: created.length,
      skipped: skipped.length,
      silentlySkipped,
      headerNote,
      errors: skipped.map(s => `Row ${s.row}: ${s.reason}`),
      batchId: created.length ? batch.id : null,
    });

  } else {
    // ── CSV path ──────────────────────────────────────────────────────────
    const text = buffer.toString("utf-8");
    const rows = parseCSV(text);

    if (rows.length === 0) {
      await prisma.importBatch.delete({ where: { id: batch.id } });
      return Response.json({ error: "No data rows found" }, { status: 400 });
    }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const humanRow = i + 2;
      const personName = colCSV(row, "name", "person_name", "contact", "person");
      const dateStr = colCSV(row, "date", "meeting_date", "interaction_date");
      const date = parseDate(dateStr);

      if (!personName && !dateStr && Object.values(row).every(v => !v?.trim())) {
        silentlySkipped++;
        continue;
      }

      if (!personName) { skipped.push({ row: humanRow, reason: `Missing Name` }); continue; }
      if (!date) { skipped.push({ row: humanRow, reason: `Unparseable Date "${dateStr}"` }); continue; }

      try {
        const record = await prisma.interaction.create({
          data: {
            importBatchId:      batch.id,
            date,
            personName,
            companyName:        colCSV(row, "company_name", "company", "organisation") || null,
            companyUrl:         colCSV(row, "company_url", "linkedin", "url") || null,
            context:            colCSV(row, "context", "notes", "description", "about") || null,
            mandate:            colCSV(row, "associated_mandate", "mandate", "fund") || null,
            interactionType:    normaliseType(colCSV(row, "interaction_type", "type")) || null,
            origination:        normaliseOrigination(colCSV(row, "origination", "origin")) || null,
            referralTouchpoint: colCSV(row, "referral_touchpoint", "referral", "referred_by") || null,
            vgpPoc:             parsePocArray(colCSV(row, "vgp_poc", "poc", "owner")) || null,
            outcome:            normaliseOutcome(colCSV(row, "outcome", "status", "result")) || null,
            takeaways:          colCSV(row, "takeaways", "key_takeaways", "summary") || null,
            nextSteps:          colCSV(row, "next_steps", "next_step", "action_items") || null,
            deadline:           parseDate(colCSV(row, "deadline", "due_date", "follow_up_date")),
            complete:           parseBool(colCSV(row, "complete", "completed", "done")) ?? null,
          },
        });
        created.push(record.id);
      } catch (e) {
        skipped.push({ row: humanRow, reason: String(e) });
      }
    }

    await prisma.importBatch.update({
      where: { id: batch.id },
      data: { rowCount: created.length, errorCount: skipped.length },
    });

    if (created.length === 0) {
      await prisma.importBatch.delete({ where: { id: batch.id } });
    }

    return Response.json({
      imported: created.length,
      skipped: skipped.length,
      silentlySkipped,
      errors: skipped.map(s => `Row ${s.row}: ${s.reason}`),
      batchId: created.length ? batch.id : null,
    });
  }
}
