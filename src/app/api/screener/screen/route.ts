import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildCriteriaText(criteria: {
  fundMandate?: string | null;
  sectorPrefs?: string | null;
  teamRequirements?: string | null;
  tractionReqs?: string | null;
  marketSize?: string | null;
  dealStructure?: string | null;
  redFlags?: string | null;
  otherCriteria?: string | null;
}): string {
  const sections: string[] = [];
  if (criteria.fundMandate) sections.push(`FUND MANDATE:\n${criteria.fundMandate}`);
  if (criteria.sectorPrefs) sections.push(`SECTOR PREFERENCES:\n${criteria.sectorPrefs}`);
  if (criteria.teamRequirements) sections.push(`FOUNDING TEAM REQUIREMENTS:\n${criteria.teamRequirements}`);
  if (criteria.tractionReqs) sections.push(`TRACTION REQUIREMENTS:\n${criteria.tractionReqs}`);
  if (criteria.marketSize) sections.push(`MARKET SIZE:\n${criteria.marketSize}`);
  if (criteria.dealStructure) sections.push(`DEAL STRUCTURE PREFERENCES:\n${criteria.dealStructure}`);
  if (criteria.redFlags) sections.push(`RED FLAGS (automatic disqualifiers):\n${criteria.redFlags}`);
  if (criteria.otherCriteria) sections.push(`ADDITIONAL CRITERIA:\n${criteria.otherCriteria}`);
  return sections.join("\n\n");
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const files = formData.getAll("files") as File[];
    const companyName = (formData.get("companyName") as string) || "Unknown Company";
    const sector = (formData.get("sector") as string) || null;
    const stage = (formData.get("stage") as string) || null;
    const additionalContext = (formData.get("additionalContext") as string) || null;
    const dealId = (formData.get("dealId") as string) || null;

    // Load saved criteria
    const criteria = await prisma.screenerCriteria.findFirst();
    if (!criteria) {
      return Response.json(
        { error: "No screener criteria configured. Please set up your investment criteria first." },
        { status: 400 }
      );
    }

    const criteriaText = buildCriteriaText(criteria);

    // Build document content blocks from uploaded PDFs
    const contentBlocks: Anthropic.MessageParam["content"] = [];

    for (const file of files) {
      if (file.size > 0) {
        const buffer = await file.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        const mediaType = file.type === "application/pdf" ? "application/pdf" : "application/pdf";

        contentBlocks.push({
          type: "document",
          source: {
            type: "base64",
            media_type: mediaType,
            data: base64,
          },
        } as Anthropic.DocumentBlockParam);
      }
    }

    // Build user prompt
    const contextLines: string[] = [];
    if (companyName) contextLines.push(`Company: ${companyName}`);
    if (sector) contextLines.push(`Sector: ${sector}`);
    if (stage) contextLines.push(`Stage: ${stage}`);
    if (additionalContext) contextLines.push(`Additional context: ${additionalContext}`);
    const contextText = contextLines.length > 0 ? contextLines.join("\n") : "";

    const userPrompt = `Here is our fund's investment criteria:

${criteriaText}

${contextText ? `Here is additional context about the company:\n${contextText}\n\n` : ""}${
      files.length > 0
        ? "The uploaded documents (pitch deck, financials, or other collateral) have been provided above. Analyse them carefully against our criteria."
        : "No documents were uploaded. Score based on the company context provided."
    }

Score this company against our criteria. Return ONLY a valid JSON object with this exact structure (no markdown, no explanation outside the JSON):
{
  "overall_score": <number 0-100>,
  "overall_verdict": "<one clear sentence verdict>",
  "fit_level": "<strong|potential|weak|poor>",
  "criteria_scores": [
    {
      "category": "<category name>",
      "score": <number 0-20>,
      "max_score": 20,
      "status": "<strong|gap|misaligned>",
      "reasoning": "<2-3 sentences with specific evidence from the deck or context>"
    }
  ],
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "concerns": ["<concern 1>", "<concern 2>", "<concern 3>"],
  "suggested_next_steps": ["<step 1>", "<step 2>", "<step 3>"]
}

The criteria_scores array must include one entry for each of these categories (only include categories where criteria was provided):
- Sector Fit
- Founding Team
- Traction & Revenue
- Market Size
- Deal Structure
- Red Flags

For "Red Flags", a high score (18-20) means no red flags found (good). A low score means red flags were identified.
Score objectively. Do not inflate scores. Base scores only on evidence in the documents.`;

    contentBlocks.push({ type: "text", text: userPrompt });

    const response = await anthropic.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 4000,
      system:
        "You are a senior venture capital analyst. You evaluate pitch decks and investment collateral against a specific fund's investment criteria. You are precise, direct, and financially literate. You score objectively based only on evidence in the provided documents. You do not inflate scores. You respond only in valid JSON with no markdown formatting or code blocks.",
      messages: [
        {
          role: "user",
          content: contentBlocks,
        },
      ],
    });

    const textContent = response.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text response from AI");
    }

    // Strip any markdown code blocks if present
    let jsonText = textContent.text.trim();
    jsonText = jsonText.replace(/^```json\n?/, "").replace(/^```\n?/, "").replace(/\n?```$/, "");

    const result = JSON.parse(jsonText);

    // Validate deal link
    let validDealId: string | null = null;
    if (dealId) {
      const deal = await prisma.deal.findUnique({ where: { id: dealId } });
      if (deal) validDealId = dealId;
    }

    // Save result to database
    const saved = await prisma.screeningResult.create({
      data: {
        companyName,
        dealId: validDealId,
        sector: sector || null,
        stage: stage || null,
        context: additionalContext || null,
        overallScore: Math.round(result.overall_score ?? 0),
        fitLevel: result.fit_level ?? "poor",
        fullResult: JSON.stringify(result),
      },
    });

    return Response.json({ ...result, resultId: saved.id });
  } catch (err: unknown) {
    console.error("Screening error:", err);
    const message = err instanceof Error ? err.message : "Screening failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
