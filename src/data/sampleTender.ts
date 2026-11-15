import type { Analysis, DocumentRecord } from "@/lib/types";
import { verifyEvidence } from "@/lib/services/evidence";

export const DEMO_DOC_ID = "demo-tender";
export const DEMO_LABEL = "DEMO DATA — Illustrative analysis, not extracted from a real procurement document.";

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
      { id: "r1", description: "Hold a valid electrical contractor licence from the State Electrical Safety Board", category: "Eligibility", mandatory: true, confidence: 0.95, evidence: ev(2, "Tenderers must hold a valid electrical contractor licence issued by the State Electrical Safety Board.") },
      { id: "r2", description: "Demonstrate at least three comparable street lighting projects in the last five years", category: "Eligibility", mandatory: true, confidence: 0.92, evidence: ev(2, "Tenderers shall demonstrate at least three (3) completed street lighting projects of comparable scope within the last five years.") },
      { id: "r3", description: "Provide audited financial statements for the last two financial years", category: "Financial", mandatory: true, confidence: 0.93, evidence: ev(2, "The tenderer must provide audited financial statements for the last two financial years.") },
      { id: "r4", description: "Minimum annual turnover of 2.5 million (currency not specified)", category: "Financial", mandatory: true, confidence: 0.6, evidence: ev(2, "Minimum annual turnover of 2.5 million is required.") },
      { id: "r5", description: "Luminaires must have minimum efficacy of 150 lm/W", category: "Technical", mandatory: true, confidence: 0.94, evidence: ev(3, "Luminaires shall have a minimum efficacy of 150 lumens per watt.") },
      { id: "r6", description: "All luminaires must carry IP66 ingress protection", category: "Technical", mandatory: true, confidence: 0.95, evidence: ev(3, "All luminaires must carry an IP66 ingress protection rating.") },
      { id: "r7", description: "Submit electronically via the Northbridge eProcurement Portal", category: "Administrative", mandatory: true, confidence: 0.9, evidence: ev(1, "All tenders must be submitted electronically via the Northbridge eProcurement Portal.") },
      { id: "r8", description: "Submit completed Schedule of Rates (Form F-3)", category: "Documentation", mandatory: true, confidence: 0.88, evidence: ev(5, "Tenderers shall submit a completed Schedule of Rates (Form F-3).") },
      { id: "r9", description: "Include proof of public liability insurance of at least 10 million", category: "Legal", mandatory: true, confidence: 0.86, evidence: ev(5, "Proof of public liability insurance of not less than 10 million must be included.") },
      { id: "r10", description: "Provide a traffic management plan before works on arterial roads", category: "Delivery", mandatory: true, confidence: 0.84, evidence: ev(4, "The contractor shall provide a traffic management plan prior to any works on arterial roads.") },
      { id: "r11", description: "Joint venture conditions (described in Annex D)", category: "Legal", mandatory: false, confidence: 0.4, evidence: { page: null, excerpt: null, verified: false } },
    ],
    deadlines: [
      { id: "d1", description: "Mandatory site briefing", date: "8 January 2027", relatedRequirement: null, evidence: ev(5, "A mandatory site briefing will be held on 8 January 2027.") },
      { id: "d2", description: "Clarification questions due", date: "12 January 2027, 17:00", relatedRequirement: null, evidence: ev(5, "Clarification questions must be submitted by 12 January 2027, 17:00 local time.") },
      { id: "d3", description: "Tender closing", date: "2 February 2027, 14:00", relatedRequirement: "r7", evidence: ev(5, "Tender closing date: 2 February 2027 at 14:00 local time.") },
      { id: "d4", description: "First 400 luminaires installed", date: "90 days after award (award date unknown)", relatedRequirement: null, evidence: ev(4, "Installation of the first 400 luminaires must be completed within 90 days of contract award.") },
      { id: "d5", description: "Full installation complete", date: "30 June 2027", relatedRequirement: null, evidence: ev(4, "Full installation shall be completed no later than 30 June 2027.") },
    ],
    specifications: [
      { id: "s1", item: "LED luminaires", quantity: "1,250", unit: "units", details: "40W–120W rated, ≥150 lm/W, IP66", notes: "", evidence: ev(3, "Supply of 1,250 LED luminaires rated between 40W and 120W.") },
      { id: "s2", item: "Networked lighting control nodes", quantity: "1,250", unit: "units", details: "Compatible with City central management system", notes: "CMS vendor/protocol not specified", evidence: ev(3, "Supply of 1,250 networked lighting control nodes compatible with the City's central management system.") },
      { id: "s3", item: "Replacement poles", quantity: "40", unit: "poles", details: "8 m height, Riverside district", notes: "", evidence: ev(3, "Supply of 40 replacement poles of 8 m height in the Riverside district.") },
      { id: "s4", item: "Colour temperature (residential)", quantity: null, unit: "K", details: "Max 3000K in residential zones", notes: "Limit for non-residential zones unknown", evidence: ev(3, "Colour temperature shall not exceed 3000K in residential zones.") },
      { id: "s5", item: "Luminaire warranty", quantity: "10", unit: "years", details: "Minimum warranty period", notes: "", evidence: ev(4, "Warranty: luminaires shall be warranted for a minimum of 10 years.") },
    ],
    risks: [
      { id: "k1", title: "Referenced Annex D not found", severity: "High", kind: "detected", explanation: "Joint venture conditions are referenced in Annex D, but the annex list only includes Annexes A–C.", evidence: ev(2, "Joint ventures are permitted subject to conditions described in Annex D.") },
      { id: "k2", title: "Contract value not confirmed", severity: "Medium", kind: "detected", explanation: "Performance security is 5% of contract value, but the estimated value is still to be confirmed — bidders cannot size the security.", evidence: ev(1, "Estimated contract value: to be confirmed by the Finance Committee.") },
      { id: "k3", title: "Tight early installation milestone", severity: "Critical", kind: "suggestion", explanation: "400 luminaires within 90 days of award, combined with liquidated damages, may be hard to meet if supply lead times exceed 8 weeks. Requires human assessment.", evidence: ev(4, "Installation of the first 400 luminaires must be completed within 90 days of contract award.") },
      { id: "k4", title: "Currency not specified for financial thresholds", severity: "Medium", kind: "detected", explanation: "Turnover and insurance thresholds give amounts without currency.", evidence: ev(2, "Minimum annual turnover of 2.5 million is required.") },
      { id: "k5", title: "Schedule 4 referenced but not provided", severity: "High", kind: "detected", explanation: "Liquidated damages refer to Schedule 4, which is not included in this document.", evidence: ev(6, "Liquidated damages apply for delays beyond the completion date as specified in Schedule 4.") },
    ],
    missing: ["Annex D (joint venture conditions)", "Schedule 4 (liquidated damages)", "Estimated contract value", "Currency for financial thresholds", "Central management system protocol"],
    inconsistencies: ["Annex B is described as 'Schedule of Rates template' while section 5.4 refers to Form F-3 — confirm they are the same document."],
  };
  return { id: DEMO_DOC_ID, name: "NB-2026-114 Smart LED Street Lighting Tender (sample).pdf", size: 1_843_200, source: "demo", pages, addedAt: "2026-11-10T09:00:00.000Z", analysis };
}
