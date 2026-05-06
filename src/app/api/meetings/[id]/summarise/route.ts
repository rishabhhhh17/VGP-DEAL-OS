import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db";

export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/meetings/[id]/summarise">
) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "ANTHROPIC_API_KEY not set in .env" }, { status: 500 });
  }

  const { id } = await ctx.params;
  const { transcript } = await request.json();

  if (!transcript?.trim()) {
    return Response.json({ error: "No transcript provided" }, { status: 400 });
  }

  // Fetch meeting to get dealId (skip for the "new" placeholder id)
  const meeting = id !== "new"
    ? await prisma.meeting.findUnique({ where: { id } })
    : null;

  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 2048,
    system: `You are an expert venture capital analyst assistant. You analyse meeting transcripts and notes with precision, extracting structured intelligence for investment decision-making. Be concise, specific, and actionable. Always respond with valid JSON only — no markdown, no prose outside the JSON.`,
    messages: [
      {
        role: "user",
        content: `Analyse the following meeting transcript or notes and return a JSON object with exactly this structure:

{
  "summary": "A clear 3-5 sentence summary covering what was discussed, who was involved (if mentioned), and the overall tone/outcome of the meeting.",
  "keyTakeaways": [
    "Specific, concrete takeaway 1",
    "Specific, concrete takeaway 2"
  ],
  "risks": [
    "Risk or concern raised 1",
    "Risk or concern raised 2"
  ],
  "nextSteps": [
    "Next step or follow-up 1",
    "Next step or follow-up 2"
  ],
  "actionItems": [
    { "title": "Concrete, assignable action item", "priority": "HIGH" },
    { "title": "Another action item", "priority": "MEDIUM" },
    { "title": "Lower priority item", "priority": "LOW" }
  ]
}

Rules:
- keyTakeaways: 3-6 bullets, each a crisp insight from the meeting
- risks: 1-5 bullets, only genuine concerns raised — use [] if none
- nextSteps: 2-6 bullets, concrete follow-ups agreed or implied
- actionItems: 2-6 discrete tasks suitable for a task manager, with priority HIGH/MEDIUM/LOW
- If the input is rough notes rather than a transcript, infer intelligently
- All fields are required. Use empty arrays [] if a section genuinely has nothing.

TRANSCRIPT / NOTES:
${transcript}`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text.trim() : "";

  let parsed: {
    summary: string;
    keyTakeaways: string[];
    risks: string[];
    nextSteps: string[];
    actionItems: { title: string; priority: string }[];
  };

  try {
    // Strip markdown code fences if model wraps anyway
    const clean = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    parsed = JSON.parse(clean);
  } catch {
    return Response.json({ error: "AI returned unexpected format", raw: text }, { status: 500 });
  }

  const summaryData = {
    summary: parsed.summary ?? "",
    keyTakeaways: JSON.stringify(parsed.keyTakeaways ?? []),
    risks: JSON.stringify(parsed.risks ?? []),
    nextSteps: JSON.stringify(parsed.nextSteps ?? []),
  };

  // Persist transcript + summary to meeting
  if (meeting) {
    await prisma.meeting.update({
      where: { id },
      data: { transcript, ...summaryData },
    });
  }

  // Auto-create tasks from actionItems, linked to the deal
  let tasksCreated = 0;
  if (meeting?.dealId && parsed.actionItems?.length) {
    const validPriorities = ["HIGH", "MEDIUM", "LOW"];
    await prisma.task.createMany({
      data: parsed.actionItems
        .filter((a) => a.title?.trim())
        .map((a) => ({
          dealId: meeting.dealId,
          title: a.title.trim(),
          priority: validPriorities.includes(a.priority) ? a.priority : "MEDIUM",
          status: "TODO",
        })),
    });
    tasksCreated = parsed.actionItems.filter((a) => a.title?.trim()).length;
  }

  return Response.json({
    ...summaryData,
    actionItems: parsed.actionItems ?? [],
    tasksCreated,
    dealId: meeting?.dealId ?? null,
  });
}
