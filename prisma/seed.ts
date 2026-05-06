import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

const dbPath = path.join(process.cwd(), "dev.db");
const adapter = new PrismaLibSql({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

const daysFromNow = (d: number) => {
  const date = new Date();
  date.setDate(date.getDate() + d);
  return date;
};

async function main() {
  await prisma.screeningResult.deleteMany();
  await prisma.screenerCriteria.deleteMany();
  await prisma.document.deleteMany();
  await prisma.task.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.interaction.deleteMany();
  await prisma.importBatch.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.config.deleteMany();

  const deals = await Promise.all([
    prisma.deal.create({
      data: {
        companyName: "Lumen AI",
        stage: "DILIGENCE",
        sector: "AI Infrastructure",
        checkSize: "$2M",
        source: "Inbound — Founder intro",
        thesis:
          "Distributed inference layer for low-latency LLM serving. Strong founding team ex-OpenAI / Stripe.",
      },
    }),
    prisma.deal.create({
      data: {
        companyName: "Northwind Robotics",
        stage: "TERM_SHEET",
        sector: "Industrial Robotics",
        checkSize: "$5M",
        source: "Sequoia partner referral",
        thesis:
          "Autonomous warehouse picking arms with 4x throughput vs. incumbent Symbotic at lower capex.",
      },
    }),
    prisma.deal.create({
      data: {
        companyName: "Pavilion Health",
        stage: "SOURCING",
        sector: "Digital Health",
        checkSize: "$1.5M",
        source: "Cold inbound",
        thesis:
          "AI-powered prior-auth automation for mid-market payors. Targeting $40B claims-ops TAM.",
      },
    }),
    prisma.deal.create({
      data: {
        companyName: "Ferrous Labs",
        stage: "FIRST_MEETING",
        sector: "Climate / Materials",
        checkSize: "$3M",
        source: "Conference — ClimateWeek NYC",
        thesis:
          "Green-steel reduction process using hydrogen plasma. 70% lower carbon than blast furnace.",
      },
    }),
    prisma.deal.create({
      data: {
        companyName: "Halcyon Security",
        stage: "PASSED",
        sector: "Cybersecurity",
        checkSize: "$2.5M",
        source: "YC W26 demo day",
        thesis:
          "Runtime container security. Passed — too crowded vs. Wiz / Aqua.",
      },
    }),
    prisma.deal.create({
      data: {
        companyName: "Quill Finance",
        stage: "INVESTED",
        sector: "Fintech",
        checkSize: "$4M",
        source: "Founders Fund co-invest",
        thesis:
          "B2B treasury automation for mid-market CFOs. Closed Series A at $40M post.",
      },
    }),
    prisma.deal.create({
      data: {
        companyName: "Mosaic Bio",
        stage: "DILIGENCE",
        sector: "Biotech",
        checkSize: "$3M",
        source: "Scientific advisor referral",
        thesis:
          "Cell-free protein synthesis platform. 10x faster iteration than CHO cell lines.",
      },
    }),
    prisma.deal.create({
      data: {
        companyName: "Atlas Logistics",
        stage: "SOURCING",
        sector: "Supply Chain",
        checkSize: "$2M",
        source: "LinkedIn outbound",
        thesis:
          "Cross-border freight optimization. Booking 15% of India ↔ EU route in stealth.",
      },
    }),
  ]);

  const [lumen, northwind, pavilion, ferrous, , quill, mosaic] = deals;

  const importBatch = await prisma.importBatch.create({
    data: {
      filename: "interactions_2026_q1.xlsx",
      rowCount: 3,
      errorCount: 0,
    },
  });

  await Promise.all([
    prisma.interaction.create({
      data: {
        dealId: lumen.id,
        date: daysFromNow(-3),
        personName: "Aria Chen",
        companyName: "Lumen AI",
        companyUrl: "https://lumen.ai",
        context: "Follow-up on benchmarks",
        mandate: "Series A",
        interactionType: "Call",
        origination: "Inbound",
        vgpPoc: "Rishabh",
        outcome: "Diligence",
        takeaways:
          "Latency numbers check out vs. claimed; need infra-cost model from CTO.",
        nextSteps: "Send DD list; schedule technical deep-dive next week.",
        deadline: daysFromNow(5),
        complete: false,
        contactEmail: "aria@lumen.ai",
        mandateInvestmentPartner: true,
      },
    }),
    prisma.interaction.create({
      data: {
        dealId: northwind.id,
        date: daysFromNow(-7),
        personName: "Marcus Vega",
        companyName: "Northwind Robotics",
        interactionType: "Meeting",
        origination: "Referral",
        referralTouchpoint: "Sequoia — Roelof",
        vgpPoc: "Rishabh",
        outcome: "Term Sheet",
        takeaways: "Aligned on $25M pre. Want lead role.",
        nextSteps: "Draft term sheet; legal review.",
        deadline: daysFromNow(2),
        complete: false,
      },
    }),
    prisma.interaction.create({
      data: {
        dealId: pavilion.id,
        date: daysFromNow(-1),
        personName: "Sasha Patel",
        companyName: "Pavilion Health",
        interactionType: "Email",
        origination: "Inbound",
        vgpPoc: "Rishabh",
        outcome: "Sourcing",
        takeaways:
          "Sent deck. Pre-revenue but 3 LOIs from Tier-2 payors.",
        nextSteps: "First meeting Thursday.",
        deadline: daysFromNow(3),
        complete: false,
      },
    }),
    prisma.interaction.create({
      data: {
        dealId: ferrous.id,
        date: daysFromNow(-14),
        personName: "Dr. Ingrid Holm",
        companyName: "Ferrous Labs",
        interactionType: "Meeting",
        origination: "Conference",
        vgpPoc: "Rishabh",
        outcome: "First Meeting",
        takeaways: "Pilot with ArcelorMittal H2 2026.",
        nextSteps: "Tech diligence call with materials advisor.",
        deadline: daysFromNow(-2),
        complete: true,
      },
    }),
    prisma.interaction.create({
      data: {
        dealId: quill.id,
        date: daysFromNow(-30),
        personName: "Daniel Okafor",
        companyName: "Quill Finance",
        interactionType: "Call",
        origination: "Co-invest",
        vgpPoc: "Rishabh",
        outcome: "Mandated",
        takeaways: "Series A closed. $4M check.",
        nextSteps: "Onboard to portfolio ops.",
        complete: true,
      },
    }),
    prisma.interaction.create({
      data: {
        dealId: null,
        importBatchId: importBatch.id,
        date: daysFromNow(-21),
        personName: "Priya Raman",
        companyName: "Stealth Co.",
        interactionType: "Email",
        origination: "Inbound",
        vgpPoc: "Rishabh",
        outcome: "Pass",
        takeaways: "Out of mandate (consumer social).",
      },
    }),
    prisma.interaction.create({
      data: {
        dealId: mosaic.id,
        date: daysFromNow(-5),
        personName: "Leo Barber",
        companyName: "Mosaic Bio",
        interactionType: "Meeting",
        origination: "Referral",
        referralTouchpoint: "MIT Bioworks",
        vgpPoc: "Rishabh",
        outcome: "Diligence",
        takeaways: "Strong IP moat. Need market-pull validation.",
        nextSteps: "Customer reference calls.",
        deadline: daysFromNow(7),
        complete: false,
      },
    }),
  ]);

  await Promise.all([
    prisma.meeting.create({
      data: {
        dealId: lumen.id,
        title: "Lumen AI — Founder Deep Dive",
        date: daysFromNow(-3),
        duration: 60,
        summary:
          "Aria walked through inference architecture. CUDA kernel optimizations net 3.2x throughput on H100.",
        keyTakeaways:
          "1) 18 enterprise pilots\n2) $1.4M ARR\n3) GTM via AWS Marketplace",
        risks:
          "Margin compression as hyperscalers ship comparable native features.",
        nextSteps: "Customer references; hyperscaler partnership review.",
      },
    }),
    prisma.meeting.create({
      data: {
        dealId: northwind.id,
        title: "Northwind — Term Sheet Negotiation",
        date: daysFromNow(-7),
        duration: 90,
        summary: "Aligned on $25M pre, $5M check, 1x liquidation, board observer.",
        keyTakeaways: "Lead role confirmed. Sequoia co-investing.",
        nextSteps: "Legal drafting.",
      },
    }),
    prisma.meeting.create({
      data: {
        dealId: mosaic.id,
        title: "Mosaic Bio — Tech Review",
        date: daysFromNow(-5),
        duration: 45,
        summary: "Reviewed lead protein expression yields. 4-week cycle vs. industry 12-week.",
        keyTakeaways: "Platform technically credible.",
        risks: "Customer concentration: 70% revenue from one BigPharma.",
        nextSteps: "Schedule reference call with their pilot customer.",
      },
    }),
  ]);

  await Promise.all([
    prisma.contact.create({
      data: {
        dealId: lumen.id,
        name: "Aria Chen",
        role: "CEO & Co-founder",
        email: "aria@lumen.ai",
        linkedin: "https://linkedin.com/in/ariachen",
        notes: "Ex-OpenAI infra lead. Stanford CS PhD.",
      },
    }),
    prisma.contact.create({
      data: {
        dealId: lumen.id,
        name: "Sam Wu",
        role: "CTO",
        email: "sam@lumen.ai",
        notes: "Ex-Stripe payments infra.",
      },
    }),
    prisma.contact.create({
      data: {
        dealId: northwind.id,
        name: "Marcus Vega",
        role: "CEO",
        email: "marcus@northwind.io",
        linkedin: "https://linkedin.com/in/marcusvega",
      },
    }),
    prisma.contact.create({
      data: {
        dealId: pavilion.id,
        name: "Sasha Patel",
        role: "Founder",
        email: "sasha@pavilionhealth.com",
      },
    }),
    prisma.contact.create({
      data: {
        dealId: mosaic.id,
        name: "Leo Barber",
        role: "CEO",
        email: "leo@mosaic.bio",
        notes: "MIT bio + 10y at Ginkgo.",
      },
    }),
    prisma.contact.create({
      data: {
        dealId: ferrous.id,
        name: "Dr. Ingrid Holm",
        role: "Founder & CSO",
        email: "ingrid@ferrouslabs.com",
        notes: "Ex-Boston Metal materials lead.",
      },
    }),
  ]);

  await Promise.all([
    prisma.task.create({
      data: {
        dealId: lumen.id,
        title: "Send technical DD checklist",
        priority: "HIGH",
        status: "TODO",
        dueDate: daysFromNow(2),
      },
    }),
    prisma.task.create({
      data: {
        dealId: lumen.id,
        title: "Reference call: Acme Corp pilot",
        priority: "HIGH",
        status: "IN_PROGRESS",
        dueDate: daysFromNow(5),
      },
    }),
    prisma.task.create({
      data: {
        dealId: northwind.id,
        title: "Review redlines from counsel",
        priority: "HIGH",
        status: "TODO",
        dueDate: daysFromNow(1),
      },
    }),
    prisma.task.create({
      data: {
        dealId: pavilion.id,
        title: "Schedule first meeting with Sasha",
        priority: "MEDIUM",
        status: "DONE",
        dueDate: daysFromNow(-1),
      },
    }),
    prisma.task.create({
      data: {
        dealId: mosaic.id,
        title: "Customer reference outreach",
        priority: "MEDIUM",
        status: "TODO",
        dueDate: daysFromNow(7),
      },
    }),
    prisma.task.create({
      data: {
        dealId: ferrous.id,
        title: "Materials science advisor review",
        priority: "LOW",
        status: "TODO",
        dueDate: daysFromNow(14),
      },
    }),
  ]);

  await Promise.all([
    prisma.document.create({
      data: {
        dealId: lumen.id,
        name: "Lumen AI — Pitch Deck v3.pdf",
        category: "PITCH_DECK",
        size: 4_300_000,
        mimeType: "application/pdf",
        filePath: "uploads/lumen/deck-v3.pdf",
      },
    }),
    prisma.document.create({
      data: {
        dealId: lumen.id,
        name: "Lumen — Financial Model.xlsx",
        category: "FINANCIALS",
        subcategory: "Projections",
        size: 850_000,
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filePath: "uploads/lumen/model.xlsx",
      },
    }),
    prisma.document.create({
      data: {
        dealId: northwind.id,
        name: "Northwind — Term Sheet Draft.pdf",
        category: "LEGAL",
        subcategory: "Term Sheet",
        size: 220_000,
        mimeType: "application/pdf",
        filePath: "uploads/northwind/ts-draft.pdf",
      },
    }),
    prisma.document.create({
      data: {
        dealId: mosaic.id,
        name: "Mosaic — IP Whitepaper.pdf",
        category: "TECHNICAL",
        size: 1_900_000,
        mimeType: "application/pdf",
        filePath: "uploads/mosaic/ip.pdf",
      },
    }),
    prisma.document.create({
      data: {
        dealId: null,
        name: "Fund Mandate — VGP I.pdf",
        category: "MISC",
        size: 540_000,
        mimeType: "application/pdf",
        filePath: "uploads/_fund/mandate.pdf",
      },
    }),
  ]);

  await prisma.screenerCriteria.create({
    data: {
      fundMandate:
        "Early-stage (Seed–Series A) deep-tech and frontier infra. $1–5M checks, lead or co-lead.",
      sectorPrefs:
        "AI infra, robotics, climate hardware, biotech tools, fintech infra. Avoid consumer social.",
      teamRequirements:
        "Technical founders with deep domain expertise. Bonus for repeat founders or ex-FAANG senior IC.",
      tractionReqs:
        "Seed: pilot revenue or 3+ design partners. Series A: $1M+ ARR with 10%+ MoM growth.",
      marketSize: "TAM ≥ $5B, with credible bottoms-up to $100M+ ARR in 5 years.",
      dealStructure: "Lead/co-lead preferred. Board seat at $3M+. Pro-rata rights mandatory.",
      redFlags:
        "Single-founder; vibes-only diligence; capital-intensive without clear unit economics; pre-product after 18m.",
      otherCriteria:
        "Diversity-positive teams weighted up. India / SEA exposure preferred where relevant.",
    },
  });

  await Promise.all([
    prisma.screeningResult.create({
      data: {
        companyName: "Lumen AI",
        dealId: lumen.id,
        sector: "AI Infrastructure",
        stage: "Series A",
        context: "Distributed inference layer for low-latency LLM serving.",
        overallScore: 87,
        fitLevel: "STRONG_FIT",
        fullResult: JSON.stringify({
          team: 9,
          market: 8,
          traction: 8,
          mandate: 9,
          notes: "Top-quartile team, hot category, growth ahead of plan.",
        }),
      },
    }),
    prisma.screeningResult.create({
      data: {
        companyName: "Pavilion Health",
        dealId: pavilion.id,
        sector: "Digital Health",
        stage: "Seed",
        context: "AI-powered prior-auth automation for payors.",
        overallScore: 72,
        fitLevel: "FIT",
        fullResult: JSON.stringify({
          team: 7,
          market: 8,
          traction: 6,
          mandate: 7,
          notes: "Solid team but pre-revenue; LOIs not yet signed.",
        }),
      },
    }),
    prisma.screeningResult.create({
      data: {
        companyName: "Halcyon Security",
        sector: "Cybersecurity",
        stage: "Seed",
        context: "Runtime container security.",
        overallScore: 41,
        fitLevel: "WEAK_FIT",
        fullResult: JSON.stringify({
          team: 7,
          market: 5,
          traction: 4,
          mandate: 3,
          notes: "Crowded category vs Wiz/Aqua. Limited differentiation.",
        }),
      },
    }),
  ]);

  await prisma.config.create({
    data: { id: "fundName", value: "VGP Ventures I" },
  });
  await prisma.config.create({
    data: { id: "currentQuarter", value: "Q2 2026" },
  });

  const counts = {
    deals: await prisma.deal.count(),
    interactions: await prisma.interaction.count(),
    meetings: await prisma.meeting.count(),
    contacts: await prisma.contact.count(),
    tasks: await prisma.task.count(),
    documents: await prisma.document.count(),
    screeningResults: await prisma.screeningResult.count(),
  };
  console.log("Seed complete:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
