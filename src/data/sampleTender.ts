import type { Analysis, DocumentRecord } from "@/lib/types";
import { verifyEvidence } from "@/lib/services/evidence";

export const DEMO_DOC_ID = "demo-tender";
export const DEMO_LABEL =
  "DEMO DATA — Illustrative analysis, not extracted from a real procurement document.";

// Fictional document text. Every demo excerpt below is quoted from these pages.
const pages: string[] = [
  `CITY OF NORTHBRIDGE — DEPARTMENT OF PUBLIC WORKS
Invitation to Tender NB-2026-114
Supply, Installation and Maintenance of Smart LED Street Lighting

1. Introduction
The City of Northbridge invites qualified suppliers to submit tenders for the replacement of existing sodium street lights with networked LED luminaires across the Eastgate and Riverside districts. The contract term is 36 months with an optional 24-month maintenance extension.

1.1 Estimated contract value: to be confirmed by the Finance Committee.
1.2 All tenders must be submitted electronically via the Northbridge eProcurement Portal.`,
  `2. Eligibility and Qualification
2.1 Tenderers must hold a valid electrical contractor licence issued by the State Electrical Safety Board.
2.2 Tenderers shall demonstrate at least three (3) completed street lighting projects of comparable scope within the last five years.
2.3 The tenderer must provide audited financial statements for the last two financial years.
2.4 Minimum annual turnover of 2.5 million is required.
2.5 Joint ventures are permitted subject to conditions described in Annex D.`,
  `3. Technical Requirements
3.1 Supply of 1,250 LED luminaires rated between 40W and 120W.
3.2 Luminaires shall have a minimum efficacy of 150 lumens per watt.
3.3 All luminaires must carry an IP66 ingress protection rating.
3.4 Supply of 1,250 networked lighting control nodes compatible with the City's central management system.
3.5 Colour temperature shall not exceed 3000K in residential zones.
3.6 Supply of 40 replacement poles of 8 m height in the Riverside district.`,
  `4. Delivery and Installation
4.1 Installation of the first 400 luminaires must be completed within 90 days of contract award.
4.2 Full installation shall be completed no later than 30 June 2027.
4.3 The contractor shall provide a traffic management plan prior to any works on arterial roads.
4.4 Warranty: luminaires shall be warranted for a minimum of 10 years.`,
  `5. Submission Requirements and Timeline
5.1 Clarification questions must be submitted by 12 January 2027, 17:00 local time.
5.2 Tender closing date: 2 February 2027 at 14:00 local time.
5.3 A mandatory site briefing will be held on 8 January 2027.
5.4 Tenderers shall submit a completed Schedule of Rates (Form F-3).
5.5 Proof of public liability insurance of not less than 10 million must be included.
5.6 Tenders shall remain valid for 120 days after the closing date.`,
  `6. Contract Conditions
6.1 Performance security equal to 5% of the contract value is required upon award.
6.2 Liquidated damages apply for delays beyond the completion date as specified in Schedule 4.
6.3 The control nodes shall comply with the City's data protection policy.
Annex A: Technical drawings (attached separately).
Annex B: Schedule of Rates template.
Annex C: Pricing schedule.`,
];

const ev = (page: number, excerpt: string) => verifyEvidence(pages, page, excerpt);

export function buildDemoDocument(): DocumentRecord {
  const analysis: Analysis = {
    mode: "demo",
    engine: "Prepared sample analysis (simulated)",
    generatedAt: "2026-11-10T09:00:00.000Z",
    summary:
      "The City of Northbridge seeks a supplier to replace sodium street lights with 1,250 networked LED luminaires across two districts over a 36-month term. Bidders must be licensed electrical contractors with three comparable projects and audited financials. Key dates include a mandatory site briefing on 8 January 2027 and tender closing on 2 February 2027. The estimated contract value is not yet confirmed, Annex D is referenced but not included, and the delivery schedule and liquidated damages references need verification.",
    requirements: [
      {
        id: "r1",
        description:
          "Hold a valid electrical contractor licence from the State Electrical Safety Board",
        category: "Eligibility",
        mandatory: true,
        confidence: 0.95,
        evidence: ev(
          2,
          "Tenderers must hold a valid electrical contractor licence issued by the State Electrical Safety Board.",
        ),
      },
      {
        id: "r2",
        description:
          "Demonstrate at least three comparable street lighting projects in the last five years",
        category: "Eligibility",
        mandatory: true,
        confidence: 0.92,
        evidence: ev(
          2,
          "Tenderers shall demonstrate at least three (3) completed street lighting projects of comparable scope within the last five years.",
        ),
      },
      {
        id: "r3",
        description: "Provide audited financial statements for the last two financial years",
        category: "Financial",
        mandatory: true,
        confidence: 0.93,
        evidence: ev(
          2,
          "The tenderer must provide audited financial statements for the last two financial years.",
        ),
      },
      {
        id: "r4",
        description: "Minimum annual turnover of 2.5 million (currency not specified)",
        category: "Financial",
        mandatory: true,
        confidence: 0.6,
        evidence: ev(2, "Minimum annual turnover of 2.5 million is required."),
      },
      {
        id: "r5",
        description: "Luminaires must have minimum efficacy of 150 lm/W",
        category: "Technical",
        mandatory: true,
        confidence: 0.94,
        evidence: ev(3, "Luminaires shall have a minimum efficacy of 150 lumens per watt."),
      },
      {
        id: "r6",
        description: "All luminaires must carry IP66 ingress protection",
        category: "Technical",
        mandatory: true,
        confidence: 0.95,
        evidence: ev(3, "All luminaires must carry an IP66 ingress protection rating."),
      },
      {
        id: "r7",
        description: "Submit electronically via the Northbridge eProcurement Portal",
        category: "Administrative",
        mandatory: true,
        confidence: 0.9,
        evidence: ev(
          1,
          "All tenders must be submitted electronically via the Northbridge eProcurement Portal.",
        ),
      },
      {
        id: "r8",
        description: "Submit completed Schedule of Rates (Form F-3)",
        category: "Documentation",
        mandatory: true,
        confidence: 0.88,
        evidence: ev(5, "Tenderers shall submit a completed Schedule of Rates (Form F-3)."),
      },
      {
        id: "r9",
        description: "Include proof of public liability insurance of at least 10 million",
        category: "Legal",
        mandatory: true,
        confidence: 0.86,
        evidence: ev(
          5,
          "Proof of public liability insurance of not less than 10 million must be included.",
        ),
      },
      {
        id: "r10",
        description: "Provide a traffic management plan before works on arterial roads",
        category: "Delivery",
        mandatory: true,
        confidence: 0.84,
        evidence: ev(
          4,
          "The contractor shall provide a traffic management plan prior to any works on arterial roads.",
        ),
      },
      {
        id: "r11",
        description: "Joint venture conditions (described in Annex D)",
        category: "Legal",
        mandatory: false,
        confidence: 0.4,
        evidence: { page: null, excerpt: null, verified: false },
      },
    ],
    deadlines: [
      {
        id: "d1",
        description: "Mandatory site briefing",
        date: "8 January 2027",
        relatedRequirement: null,
        evidence: ev(5, "A mandatory site briefing will be held on 8 January 2027."),
      },
      {
        id: "d2",
        description: "Clarification questions due",
        date: "12 January 2027, 17:00",
        relatedRequirement: null,
        evidence: ev(
          5,
          "Clarification questions must be submitted by 12 January 2027, 17:00 local time.",
        ),
      },
      {
        id: "d3",
        description: "Tender closing",
        date: "2 February 2027, 14:00",
        relatedRequirement: "r7",
        evidence: ev(5, "Tender closing date: 2 February 2027 at 14:00 local time."),
      },
      {
        id: "d4",
        description: "First 400 luminaires installed",
        date: "90 days after award (award date unknown)",
        relatedRequirement: null,
        evidence: ev(
          4,
          "Installation of the first 400 luminaires must be completed within 90 days of contract award.",
        ),
      },
      {
        id: "d5",
        description: "Full installation complete",
        date: "30 June 2027",
        relatedRequirement: null,
        evidence: ev(4, "Full installation shall be completed no later than 30 June 2027."),
      },
    ],
    specifications: [
      {
        id: "s1",
        item: "LED luminaires",
        quantity: "1,250",
        unit: "units",
        details: "40W–120W rated, ≥150 lm/W, IP66",
        notes: "",
        evidence: ev(3, "Supply of 1,250 LED luminaires rated between 40W and 120W."),
      },
      {
        id: "s2",
        item: "Networked lighting control nodes",
        quantity: "1,250",
        unit: "units",
        details: "Compatible with City central management system",
        notes: "CMS vendor/protocol not specified",
        evidence: ev(
          3,
          "Supply of 1,250 networked lighting control nodes compatible with the City's central management system.",
        ),
      },
      {
        id: "s3",
        item: "Replacement poles",
        quantity: "40",
        unit: "poles",
        details: "8 m height, Riverside district",
        notes: "",
        evidence: ev(3, "Supply of 40 replacement poles of 8 m height in the Riverside district."),
      },
      {
        id: "s4",
        item: "Colour temperature (residential)",
        quantity: null,
        unit: "K",
        details: "Max 3000K in residential zones",
        notes: "Limit for non-residential zones unknown",
        evidence: ev(3, "Colour temperature shall not exceed 3000K in residential zones."),
      },
      {
        id: "s5",
        item: "Luminaire warranty",
        quantity: "10",
        unit: "years",
        details: "Minimum warranty period",
        notes: "",
        evidence: ev(4, "Warranty: luminaires shall be warranted for a minimum of 10 years."),
      },
    ],
    risks: [
      {
        id: "k1",
        title: "Referenced Annex D not found",
        severity: "High",
        kind: "detected",
        explanation:
          "Joint venture conditions are referenced in Annex D, but the annex list only includes Annexes A–C.",
        evidence: ev(2, "Joint ventures are permitted subject to conditions described in Annex D."),
      },
      {
        id: "k2",
        title: "Contract value not confirmed",
        severity: "Medium",
        kind: "detected",
        explanation:
          "Performance security is 5% of contract value, but the estimated value is still to be confirmed — bidders cannot size the security.",
        evidence: ev(1, "Estimated contract value: to be confirmed by the Finance Committee."),
      },
      {
        id: "k3",
        title: "Tight early installation milestone",
        severity: "Critical",
        kind: "suggestion",
        explanation:
          "400 luminaires within 90 days of award, combined with liquidated damages, may be hard to meet if supply lead times exceed 8 weeks. Requires human assessment.",
        evidence: ev(
          4,
          "Installation of the first 400 luminaires must be completed within 90 days of contract award.",
        ),
      },
      {
        id: "k4",
        title: "Currency not specified for financial thresholds",
        severity: "Medium",
        kind: "detected",
        explanation: "Turnover and insurance thresholds give amounts without currency.",
        evidence: ev(2, "Minimum annual turnover of 2.5 million is required."),
      },
      {
        id: "k5",
        title: "Schedule 4 referenced but not provided",
        severity: "High",
        kind: "detected",
        explanation:
          "Liquidated damages refer to Schedule 4, which is not included in this document.",
        evidence: ev(
          6,
          "Liquidated damages apply for delays beyond the completion date as specified in Schedule 4.",
        ),
      },
    ],
    missing: [
      "Annex D (joint venture conditions)",
      "Schedule 4 (liquidated damages)",
      "Estimated contract value",
      "Currency for financial thresholds",
      "Central management system protocol",
    ],
    inconsistencies: [
      "Annex B is described as 'Schedule of Rates template' while section 5.4 refers to Form F-3 — confirm they are the same document.",
    ],
  };
  return {
    id: DEMO_DOC_ID,
    name: "Riverside Civic Centre - Construction Tender.pdf",
    project: "Riverside City Council",
    size: 8_808_038, // 8.4 MB
    source: "demo",
    format: "pdf",
    pages,
    sourceLocations: pages.map((_, index) => `Page ${index + 1}`),
    addedAt: "2026-11-10T09:00:00.000Z",
    analysedOn: "12 May 2025 10:24",
    status: "Analysed",
    analysis,
  };
}

export const DEFAULT_WORKSPACE_DOCUMENTS: DocumentRecord[] = [
  {
    id: "doc-1",
    name: "City Infrastructure Modernisation RFP.pdf",
    project: "Riverside City Council",
    size: 13_002_342, // 12.4 MB
    source: "demo",
    format: "pdf",
    pages: new Array(42).fill("Sample extracted text for infrastructure project."),
    sourceLocations: new Array(42).fill("").map((_, i) => `Page ${i + 1}`),
    addedAt: "2025-05-12T10:24:00.000Z",
    analysedOn: "12 May 2025 10:24",
    status: "Analysed",
  },
  {
    id: "doc-2",
    name: "Healthcare Services Tender.docx",
    project: "Northvale Health",
    size: 8_493_465, // 8.1 MB
    source: "demo",
    format: "docx",
    pages: new Array(28).fill("Sample extracted text for healthcare services."),
    sourceLocations: new Array(28).fill("").map((_, i) => `Paragraph ${i + 1}`),
    addedAt: "2025-05-11T16:03:00.000Z",
    analysedOn: "11 May 2025 16:03",
    status: "Analysed",
  },
  {
    id: "doc-3",
    name: "IT Managed Services RFT.pdf",
    project: "Brighton Government",
    size: 15_518_924, // 14.8 MB
    source: "demo",
    format: "pdf",
    pages: new Array(56).fill("Sample extracted text for IT managed services."),
    sourceLocations: new Array(56).fill("").map((_, i) => `Page ${i + 1}`),
    addedAt: "2025-05-10T09:17:00.000Z",
    analysedOn: "10 May 2025 09:17",
    status: "Analysed",
  },
  {
    id: "doc-4",
    name: "Facilities Management Schedule.xlsx",
    project: "Summit University",
    size: 3_355_443, // 3.2 MB
    source: "demo",
    format: "xlsx",
    pages: new Array(18).fill("Sample sheet data for facilities schedule."),
    sourceLocations: new Array(18).fill("").map((_, i) => `Sheet 1, Row ${i * 10 + 1}`),
    addedAt: "2025-05-09T14:38:00.000Z",
    analysedOn: "9 May 2025 14:38",
    status: "Processing",
  },
  {
    id: "doc-5",
    name: "Sustainable Transport Initiative.pdf",
    project: "Greenfield Authority",
    size: 12_163_481, // 11.6 MB
    source: "demo",
    format: "pdf",
    pages: new Array(37).fill("Sample extracted text for transport initiative."),
    sourceLocations: new Array(37).fill("").map((_, i) => `Page ${i + 1}`),
    addedAt: "2025-05-08T11:52:00.000Z",
    analysedOn: "8 May 2025 11:52",
    status: "Analysed",
  },
];

export const DEFAULT_ACTIVITIES: WorkspaceActivity[] = [
  {
    id: "act-1",
    type: "analysis-completed",
    title: "Analysis completed",
    documentId: "doc-1",
    documentName: "City Infrastructure Modernisation RFP.pdf",
    timeAgo: "10 minutes ago",
    tone: "blue",
    at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  {
    id: "act-2",
    type: "document-added",
    title: "12 new requirements extracted",
    documentId: "doc-2",
    documentName: "Healthcare Services Tender.docx",
    timeAgo: "2 hours ago",
    tone: "purple",
    at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "act-3",
    type: "analysis-completed",
    title: "2 critical risks identified",
    documentId: "doc-3",
    documentName: "IT Managed Services RFT.pdf",
    timeAgo: "5 hours ago",
    tone: "orange",
    at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "act-4",
    type: "review-updated",
    title: "Document marked for review",
    documentId: "doc-4",
    documentName: "Facilities Management Schedule.xlsx",
    timeAgo: "1 day ago",
    tone: "green",
    at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

export interface ComplianceMatrixItem {
  id: string;
  num: number;
  requirement: string;
  category: string;
  mandatory: boolean;
  evidenceFile: string;
  page: number | null;
  reviewStatus: "satisfied" | "reviewed" | "pending" | "unclear";
  reviewScore: number | null;
  notes: string;
  extractedText: string;
  relevance: number;
}

export const DEFAULT_COMPLIANCE_ITEMS: ComplianceMatrixItem[] = [
  {
    id: "cm-1",
    num: 1,
    requirement: "Provide evidence of ISO 27001 certification or equivalent.",
    category: "Information Security",
    mandatory: true,
    evidenceFile: "security-cert.pdf",
    page: 12,
    reviewStatus: "satisfied",
    reviewScore: 92,
    notes: "Certificate provided and in date.",
    extractedText:
      "... has been assessed and found to comply with the requirements of ISO/IEC 27001:2022. This certificate is valid from 01 Jan 2023 to 31 Dec 2025.",
    relevance: 92,
  },
  {
    id: "cm-2",
    num: 2,
    requirement: "Detail your data backup and disaster recovery arrangements.",
    category: "Business Continuity",
    mandatory: true,
    evidenceFile: "bcp-overview.pdf",
    page: 18,
    reviewStatus: "reviewed",
    reviewScore: 85,
    notes: "Covers RTO/RPO requirements.",
    extractedText:
      "All production data is snapshotted every 15 minutes and asynchronously replicated to a secondary availability zone with 4-hour RTO and 1-hour RPO guarantees.",
    relevance: 85,
  },
  {
    id: "cm-3",
    num: 3,
    requirement: "Confirm availability of 24/7 customer support.",
    category: "Service Management",
    mandatory: true,
    evidenceFile: "service-model.pdf",
    page: 7,
    reviewStatus: "pending",
    reviewScore: null,
    notes: "Need clearer evidence of 24/7 coverage.",
    extractedText:
      "Support operations operate Monday to Friday 08:00 to 18:00 with on-call critical incident escalation for severity 1 outages.",
    relevance: 70,
  },
  {
    id: "cm-4",
    num: 4,
    requirement: "Provide details of sub-contractors used in service delivery.",
    category: "Supply Chain",
    mandatory: false,
    evidenceFile: "suppliers-list.pdf",
    page: 24,
    reviewStatus: "unclear",
    reviewScore: 56,
    notes: "Partial list provided. More detail required.",
    extractedText:
      "Specialist cabling sub-contractors and logistics handlers are engaged as needed under standard non-disclosure frameworks.",
    relevance: 56,
  },
  {
    id: "cm-5",
    num: 5,
    requirement: "Demonstrate compliance with data protection regulations (e.g. GDPR).",
    category: "Legal & Regulatory",
    mandatory: true,
    evidenceFile: "privacy-policy.pdf",
    page: 15,
    reviewStatus: "satisfied",
    reviewScore: 88,
    notes: "Policy aligns with GDPR requirements.",
    extractedText:
      "All processing of personal data is carried out in strict accordance with the General Data Protection Regulation (EU 2016/679) and applicable UK laws.",
    relevance: 88,
  },
  {
    id: "cm-6",
    num: 6,
    requirement: "Provide a statement of financial stability (last 3 years).",
    category: "Financial",
    mandatory: true,
    evidenceFile: "financials-2023.pdf",
    page: 31,
    reviewStatus: "reviewed",
    reviewScore: 83,
    notes: "Financial statements provided.",
    extractedText:
      "Independent auditor's report confirms healthy solvency, positive net cash flows from operating activities, and zero debt defaults over the 2021-2023 period.",
    relevance: 83,
  },
  {
    id: "cm-7",
    num: 7,
    requirement: "Outline your approach to environmental sustainability.",
    category: "Environmental",
    mandatory: false,
    evidenceFile: "—",
    page: null,
    reviewStatus: "pending",
    reviewScore: null,
    notes: "No evidence provided yet.",
    extractedText: "",
    relevance: 0,
  },
  {
    id: "cm-8",
    num: 8,
    requirement: "Confirm agreement to standard contract terms and conditions.",
    category: "Commercial",
    mandatory: true,
    evidenceFile: "tcs-acceptance.pdf",
    page: 5,
    reviewStatus: "unclear",
    reviewScore: 62,
    notes: "Minor deviations noted. Requires legal review.",
    extractedText:
      "Bidder agrees in principle to the Model Services Agreement clauses, reserving commentary on limitation of liability in Section 18.4.",
    relevance: 62,
  },
];
