'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Assessment {
  id: string
  company_name: string
  respondent_name: string | null
  respondent_title: string | null
  homes_per_year: string | null
  state_region: string | null
  overall_score: number
  maturity_level: string | null
  maturity_level_key: string | null
  domain_scores: Record<string, { pct: number; answered: number; total: number }>
  ai_recommendations: string | null
  answers: Record<string, string>
  completed_at: string
  created_at: string
}

interface Subscription {
  plan_type: 'annual' | 'onetime'
  status: string
}

const DOMAIN_ORDER = ['org', 'customer', 'trade', 'internal', 'builder_rep', 'systems']

const DOMAIN_NAMES: Record<string, string> = {
  org: 'Organizational Structure',
  customer: 'Customer Experience',
  trade: 'Trade Partner / Supplier',
  internal: 'Internal Operations',
  builder_rep: 'Builder Rep Experience',
  systems: 'Supporting Systems',
}

const DOMAIN_ICONS: Record<string, string> = {
  org: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  customer: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  trade: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0',
  internal: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  builder_rep: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  systems: 'M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18',
}

// Full question data for response summary
const DOMAIN_QUESTIONS: Record<string, { id: string; label: string; levels: Record<string, string> }[]> = {
  org: [
    { id: '0.1', label: 'Contribution of Homebuilding Business Owner', levels: { '-1': 'Minimal involvement in process. No understanding of alternatives. Just focused on business as usual. Reactive owner influence.', '0': 'Minimal involvement in process. Looked at alternatives but decided not to change. Open to change if business case is presented clearly. Owner wants to influence but unsure how to engage.', '1': 'Some active involvement in process improvement in all phases of lifecycle. Looked at alternatives and sampling some proof of concepts. Owner aligning process so they can influence it.', '2': 'Complete involvement in all phases of the lifecycle. Active pilots in projects and existing portfolio. Starting to link pilots to support proven concepts. Desire to proactively influence process.', '3': 'Driving involvement and influence in process with desire to control it. Continuous improvements in projects and existing systems. Evolving to a complete integrated delivery lifecycle for whole supply chain.' } },
    { id: '0.2', label: 'Home Buyer Experience (Digital Engagement)', levels: { '-1': 'Shops builders taking magazine snips and paper plans to a builder.', '0': 'May find the builder online; makes purchase decisions at builder office or model based on builder system through agent.', '1': 'Builder has online presence with capability for buyer to select site, model, options and request custom changes.', '2': 'Buyer has web-based access to complete buying process and construction cycle.', '3': 'Builder turns over digital twin login at closing. Home maintenance and improvements all managed through digital twin platform including smart home systems.' } },
    { id: '0.3', label: 'Capability of ERP System', levels: { '-1': 'QuickBooks or no system.', '0': 'Using one of the Scheduling/Purchasing/Accounting systems at a 50% implementation level.', '1': 'Leveraging CRM in the prospect stages then moving to ERP system when a prospect becomes a buyer.', '2': 'Automated AP, Scheduling, Itemized Purchasing, complete push notifications of management by exception.', '3': 'No single ERP. Leverage integrated, best-of-class, purpose-defined tools for primary functions like Scheduling, Purchasing, Accounting, team/stakeholder communication.' } },
    { id: '0.4', label: 'Design Systems', levels: { '-1': '2D paper plans.', '0': '2D CAD PDF of paper plans.', '1': 'Online home design fully accessible to buyer.', '2': 'Generative design able to be customized online in real time by homeowner with complete 3D, 4D, 5D BIM content generated simultaneously.', '3': 'Defined product offering able to be configured then output as DfMA.' } },
    { id: '0.5', label: 'Value Engineering', levels: { '-1': 'No formal process.', '0': 'How can we find someone to do it cheaper?', '1': 'Understands true total cost. Tracks variances to improve existing process.', '2': 'Internal design team and key Trade Partners discuss best practice materials and methods.', '3': 'AI/ML leveraged in product design.' } },
    { id: '0.6', label: 'Cost Definition', levels: { '-1': 'No formal cost system. Costs discovered at closing.', '0': 'Job-specific estimates created per project. Limited visibility into actual margins.', '1': 'Catalog-based cost system with itemized unit pricing. Variance tracking in place.', '2': 'Real-time cost visibility across all jobs. Automated variance alerts. Margin managed proactively.', '3': 'AI-assisted cost optimization. Generative design linked directly to cost model. Dynamic pricing.' } },
    { id: '0.7', label: 'Purchasing Process', levels: { '-1': 'Calling Trade Partners for bids. Takes lowest. Invoice after job complete.', '0': 'Purchasing team manages Trade Partner/Supplier quotes; sends in invoices for payment.', '1': 'Purchasing manages cost-based system for monitoring gross margin. Issues Purchase Orders to TPS.', '2': 'All Purchasing generated on just-in-time automated process. Purchasing team focused on value-added solutions.', '3': 'Purchasing team seeks value-adding solutions for materials and methods. Builder-facing representative to TPS.' } },
    { id: '0.8', label: 'Trade Partner/Supplier Engagement Model', levels: { '-1': 'Ad hoc. Builder calls whoever answers.', '0': 'Established vendor list. Relationships managed informally.', '1': 'Formal qualification process. Vendors onboarded with documented scopes and pricing.', '2': 'Online portal for TPS onboarding, pricing, scheduling capacity, and communication.', '3': 'Machine learning manages all pricing solicitation and change requests. Web-based system for TPS lifecycle management.' } },
    { id: '0.9', label: 'Production Management', levels: { '-1': 'Superintendent manages by walking around. No formal schedule system.', '0': 'Static schedule provided. Superintendent expected to visit each job site daily.', '1': 'Scheduling is system-generated. Builder Rep may call to verify.', '2': 'Scheduling is fully system managed. Only variances input by Builder Rep.', '3': 'Capacity-driven scheduling system. All TPS schedules configured based on resource loading. Drone reality capture.' } },
  ],
  customer: [
    { id: '1.1', label: 'Customer Discovery', levels: { '-1': 'Stopped in to Model Home open house, print ads, bandit signs, cold call purchased lead lists.', '0': 'Walk-ins, home shows, open houses, or a Contact-Us form on website. Leads collected in a shared spreadsheet.', '1': 'Customer engaged through search ads. CRM system manages all communication - email, phone, SMS, online video.', '2': 'Customers engaged through inbound digital marketing. Pre-qualified, pre-interested customers only.', '3': 'AI builds algorithms to identify prospective customers from life events, lifestyle signals, and consumer behavior.' } },
    { id: '1.2', label: 'Customer Decision Process', levels: { '-1': 'Customer calls to schedule time to meet with Sales person.', '0': 'Customer contact may be initiated through follow-up tasks from spreadsheet.', '1': 'Customer can shop for plans and building sites online. Standard pricing for plans and lot premiums available online.', '2': 'Customer can choose a specific plan and building site to complete the sale. Everything predefined in a 3D digital model.', '3': 'AI bots create a compatible configuration from lifestyle and living data. Upsell suggestions offered automatically.' } },
    { id: '1.3', label: 'Contract Execution', levels: { '-1': 'Met with Sales Agent, picked lot and base plan, hardcopy signed.', '0': 'Customer may access builder website to view spec homes or standard models. Hardcopies/PDFs.', '1': 'Customer may be able to interact with Sales Agent online for final contract execution through Docusign.', '2': 'Customer able to complete entire process remotely online. Full configuration pricing available on demand real-time.', '3': 'Customer defines all aspects of their home. Digital model locks as manufacturing occurs. Cost data reflected real-time.' } },
    { id: '1.4', label: 'Lifestyle Choice / Option Selection', levels: { '-1': 'Met with Sales Agent. Agent asked what changes they might want. Ad hoc customization.', '0': 'Customer may be able to view multiple structural options specific to a plan model. Interactive 2D plans available.', '1': 'Customer may have access to standard 3D digital interactive model online to make what-if scenarios.', '2': 'Customer has access to 3D digital interactive model with all options, customizations, and decorating. Cost and schedule impacts reflected real-time.', '3': 'Full digital configuration engine with AI-assisted selections and automated constructability checks.' } },
    { id: '1.5', label: 'Decorating Selections', levels: { '-1': 'Customer gets a list of suppliers to visit with allowances.', '0': 'Customer makes selections at builder office, model home, or remote suppliers. Collected in a spreadsheet and emailed.', '1': 'Customer may have access to 3D digital model online for decorating options. Can request customizations.', '2': 'Full online selection experience integrated into the 3D model. All selections reflected in real-time cost model.', '3': 'AI-assisted selection process. Virtual reality showroom. Selections flow directly to purchasing and construction system.' } },
    { id: '1.6', label: 'Construction Communication with Buyer', levels: { '-1': 'Customer calls the superintendent when worried. No scheduled updates.', '0': 'Builder sends periodic email updates. Customer may receive photos occasionally.', '1': 'Customer has access to an online portal showing job progress milestones.', '2': 'Customer receives automated progress notifications with photos at each milestone. Can track in real-time.', '3': 'Customer has live access to digital twin showing construction status, inspections passed, and upcoming milestones.' } },
    { id: '1.7', label: 'Warranty and Post-Close Service', levels: { '-1': 'Customer calls builder when something breaks. No formal warranty process.', '0': 'Warranty items collected via email or phone. Tracked in a spreadsheet.', '1': 'Online warranty portal for submitting and tracking warranty requests.', '2': 'Proactive warranty management. AI predicts common warranty items. Automated scheduling of warranty work.', '3': 'Digital twin monitors home systems. Predictive maintenance alerts. Warranty data feeds back into product design improvement.' } },
    { id: '1.8', label: 'Customer Satisfaction Measurement', levels: { '-1': 'Word of mouth. Builder hears about problems indirectly.', '0': 'Exit survey sent after closing. Results compiled manually.', '1': 'Formal NPS or satisfaction survey process. Results tracked over time.', '2': 'Real-time satisfaction monitoring. Surveys triggered at each phase. Results feed into operational improvement process.', '3': 'AI analyzes all customer touchpoints to identify satisfaction trends. Predictive risk scoring for at-risk customers.' } },
    { id: '1.9', label: 'Online Reviews and Reputation Management', levels: { '-1': 'No formal process. Builder reacts to reviews when noticed.', '0': 'Builder monitors Google/social reviews manually. Occasional response.', '1': 'Formal process to solicit reviews from satisfied customers. Monitors and responds to all reviews.', '2': 'Automated review solicitation tied to CRM. Dashboard tracks reputation metrics across all platforms.', '3': 'AI monitors brand sentiment across all channels. Automated response suggestions. Real-time reputation scoring.' } },
    { id: '1.10', label: 'Referral Program', levels: { '-1': 'No formal referral program. Referrals happen by chance.', '0': 'Informal referral acknowledgment. May pay a referral fee ad hoc.', '1': 'Documented referral program with defined incentives. Tracked in CRM.', '2': 'Active referral marketing program integrated into customer journey. Automated trigger and reward system.', '3': 'AI-optimized referral engine. Identifies highest-probability referral sources. Personalized referral incentives.' } },
    { id: '1.11', label: 'Model Home / Sales Center Experience', levels: { '-1': 'Physical model home only. No digital component.', '0': 'Model home with some digital displays. Website with basic info.', '1': 'Model home supplemented by virtual tour capability. 3D renderings of options.', '2': 'Interactive digital design center. Virtual reality experience of model and options.', '3': 'Fully virtual sales center. AI-guided home design experience. Physical model optional.' } },
  ],
  trade: [
    { id: '2.1', label: 'Trade Partner Discovery', levels: { '-1': 'Builder saw TPS on a job or TPS stopped to get contact info. Builder asks other TPS for recommendations.', '0': 'TPS calls builder office to see if interested in a bid. Builder connects with TPS at local Builder Association meetings.', '1': 'Purchasing team actively seeks and solicits potential TPSs based on resource needs. Sourcing from internet searches and supplier recommendations.', '2': 'Builder has web-based TPS invitation system. Inbound digital advertising for TPSs. Any offline discovery directed to TPS web page.', '3': 'AI-driven solicitation and discovery system. Automated evaluation of TPS experience, history, business viability, and reference validation.' } },
    { id: '2.2', label: 'TPS Qualification Process', levels: { '-1': 'When can you start?', '0': 'Builder may ask TPS for other builder references.', '1': 'Builder asks for prices, providing list of prices needed whether unit price or lump sum. May call provided references.', '2': 'Formal qualification scorecard. Online reference validation. Insurance and capacity verification automated.', '3': 'Machine learning evaluates TPS qualification data continuously. Predictive scoring of TPS performance risk.' } },
    { id: '2.3', label: 'TPS Onboarding', levels: { '-1': 'Here is a set of plans.', '0': 'Plans and materials/fixtures shared. Information gathered to set up as vendor in accounting. Insurance certificates collected. Pay cycles shared.', '1': 'In addition to typical: complete list of lump sum or unit prices collected. Scheduling capacity addressed. On-site work rules shared.', '2': 'TPS able to complete entire onboarding remotely online. Scopes of work, material specifications, and pricing managed in online portal.', '3': 'Machine learning manages all pricing solicitation and change requests, even soliciting additional TPS candidates for loading capacity.' } },
    { id: '2.4', label: 'Price Management', levels: { '-1': 'What is your price? That is too high. If you can do it for 10% less you get the job.', '0': 'Job-specific pricing requested per job for TPS lump sum quote.', '1': 'Unit price catalog established. Job-specific adjustments applied. Pricing changes require formal submittal.', '2': 'Real-time pricing portal. Automated variance flagging. Builder-TPS pricing negotiations handled digitally.', '3': 'AI-optimized pricing. Automated market benchmarking. Dynamic pricing adjustments based on capacity and demand.' } },
    { id: '2.5', label: 'Product Development Value Engagement', levels: { '-1': 'No formal engagement.', '0': 'TPS suggests alternate materials/methods informally.', '1': 'Builder engages TPS in building prototype of model or potential spec modifications. Work together to carry improvements forward.', '2': 'Product Development team includes all affected stakeholders. TPS has access to submit ideas and engage in the discussion.', '3': 'Full generative design engagement with TPS. AI leveraged for market viability and constructability. All as Adaptive Innovators.' } },
    { id: '2.6', label: 'Scheduling and Capacity Management', levels: { '-1': 'Builder calls each TPS to verify ability to meet schedule.', '0': 'Static schedule shared with TPS. Follow-up phone calls for confirmation.', '1': 'System-generated schedule shared digitally with TPS. TPS confirms availability electronically.', '2': 'TPS inputs own scheduling capacity into builder portal. Automated conflict detection and resolution.', '3': 'Capacity-driven scheduling across all TPS. AI optimizes TPS assignments based on capacity, performance history, and project requirements.' } },
    { id: '2.7', label: 'TPS Performance Measurement', levels: { '-1': 'No formal measurement. Builder knows good from bad subjectively.', '0': 'Informal performance feedback. Problem TPSs dropped over time.', '1': 'Formal scorecard. Quality, schedule, and cost variance tracked per TPS.', '2': 'Real-time TPS performance dashboard. Automated alerts for underperformance. Structured corrective action process.', '3': 'AI predicts TPS performance risk before it occurs. Proactive capacity and quality management. Continuous benchmarking.' } },
    { id: '2.8', label: 'TPS Communication During Construction', levels: { '-1': 'Phone calls and voicemails. No documentation.', '0': 'Email-based communication. No central tracking.', '1': 'Field management app for TPS communication. Issues logged digitally.', '2': 'TPS portal for all construction communication, issue resolution, and sign-offs.', '3': 'AI-driven communication routing. Predictive issue identification before TPS arrives on site. Automated documentation.' } },
    { id: '2.9', label: 'Material/Supplier Management', levels: { '-1': 'TPS buys their own materials. Builder has no visibility.', '0': 'Builder provides material lists. Supplier relationships mostly managed by TPS.', '1': 'Builder manages key material supplier relationships. Pricing contracts in place for major material categories.', '2': 'Centralized material management. Supplier portal for ordering, delivery tracking, and invoicing.', '3': 'Just-in-time material delivery orchestrated by AI. Automated ordering triggered by construction schedule. Real-time inventory visibility.' } },
    { id: '2.10', label: 'TPS Payment Process', levels: { '-1': 'Invoice after job complete. Checks written manually.', '0': 'TPS submits invoice. Accounts Payable processes check.', '1': 'Purchase Order system in place. Payment tied to PO completion and approval.', '2': 'Automated payment release upon completion verification. EFT payments. Portal-based payment tracking for TPS.', '3': 'Real-time payment processing triggered by automated completion verification. Blockchain-based payment records.' } },
    { id: '2.11', label: 'Warranty Work by TPS', levels: { '-1': 'Builder calls TPS when homeowner complains. TPS may or may not respond.', '0': 'Warranty work assigned to TPS via phone or email. Completion tracked manually.', '1': 'TPS assigned warranty work through online portal. Completion required before payment release.', '2': 'Warranty performance tracked by TPS. Repeat warranty items drive product and training improvements.', '3': 'AI predicts TPS-driven warranty risk. Proactive corrective action. Warranty data feeds directly into TPS qualification scoring.' } },
    { id: '2.12', label: 'TPS Relationship and Retention', levels: { '-1': 'No retention strategy. TPS comes and goes.', '0': 'Builder maintains preferred TPS list. Relationship is volume-dependent.', '1': 'Annual TPS performance review. Clear expectations communicated. Volume commitments offered for preferred TPS.', '2': 'Strategic TPS partnerships. Shared investment in tools, training, and process improvement.', '3': 'TPS are true partners in product development and delivery. Shared gain/risk models. AI-optimized TPS portfolio management.' } },
  ],
  internal: [
    { id: '3.1', label: 'Plan Designers', levels: { '-1': 'May not be a designer on staff. Builder using outside designer or customer design.', '0': 'Maintains stock plans. May redline stock plans to create job-specific plans. May provide custom change designs.', '1': 'Creates content for online home design fully accessible to buyer. Available for custom design changes for a fee.', '2': 'In-house designers develop foundation and parameters for generative design with complete 3D, 4D, 5D BIM content.', '3': 'Plan Designer now manages configuration engine from full digital lifecycle. Pre-defined product offering output as DfMA.' } },
    { id: '3.2', label: 'Sales Team', levels: { '-1': 'Sales typically handled through 3rd party real estate agents.', '0': 'Sales Team occupies builder model homes. Guides Customer through purchase decisions at office or model.', '1': 'Sales team optional. May have 3rd party Customer real estate agent. Internal sales team becomes online consultant and digital marketing coordinator.', '2': 'If there are internal sales people, they are mainly an online advisor. Buyer has web-based access to complete buying process.', '3': 'Sales not involved beyond Customer legal representation. Builder turns over digital twin login at closing.' } },
    { id: '3.3', label: 'Accounting Team', levels: { '-1': 'If there is Accounting staff, typically using QuickBooks.', '0': 'Using Scheduling/Purchasing/Accounting system at 50% implementation. Outside firm manages financial reporting and taxes.', '1': 'Accounting team manages all AP, Construction Loan draws, closing financial data, payroll. May have interfacing systems.', '2': 'Automated AP. Accounting manages AP for G&A items. Sets up and manages Vendors. All transactions are EFT.', '3': 'Accounting team is now only a financial manager. Most involvement managing exceptions and G&A.' } },
    { id: '3.4', label: 'Purchasing Team', levels: { '-1': 'Calling Trade Partners for bids. Takes lowest. Invoice after job complete.', '0': 'Purchasing Team manages Trade Partner quotes; sends invoices for payment.', '1': 'Purchasing Team manages cost-based system for monitoring gross margin. Issues Purchase Orders.', '2': 'All Purchasing generated on just-in-time automated process. Purchasing Team focused on value-added solutions.', '3': 'Purchasing Team now seeks value-adding solutions for materials and methods. Builder-facing representative to TPS.' } },
  ],
  builder_rep: [
    { id: '4.1', label: 'Engagement in Sales Process', levels: { '-1': 'May be asked if a customization can be done.', '0': 'May validate plan fit on site.', '1': 'Any customization requests pass to a remote specialist. Builder Rep not involved in sales.', '2': 'Builder Rep provides construction feasibility input through digital portal. Not required on-site for sales.', '3': 'Builder Rep role is construction management only. AI handles all feasibility checks automatically.' } },
    { id: '4.2', label: 'Scheduling', levels: { '-1': 'Given a closing date with some level of job start info.', '0': 'Generally given a static schedule of each activity with a target date for closing.', '1': 'Scheduling is system generated. Builder Rep may call to verify.', '2': 'Scheduling is fully system managed. Only schedule variances are input by the Builder Rep.', '3': 'Scheduling is defined company-wide with a capacity-driven system. All TPS schedules configured based on resource loading.' } },
    { id: '4.3', label: 'Pre-Construction', levels: { '-1': 'Given a set of plans with a list of options or redlined plans. May get a list of TPS.', '0': 'Additionally, may engage in TPS selection.', '1': 'Builder Rep meets Customer on-site after stakeout. Shares construction phase overview and contact info with Customer.', '2': 'All communication is digital-based. Pre-construction orientation done through online portal.', '3': 'Fully automated pre-construction process. AI coordinates all stakeholders. Builder Rep focuses on exception management.' } },
    { id: '4.4', label: 'During Construction', levels: { '-1': 'Checks job occasionally. Handles TPS questions. Calls each TPS to verify ability to meet schedule.', '0': 'Builder Rep expected to visit each job site daily. Responds to TPS calls and on-site queries.', '1': 'Builder Rep manages exceptions. TPS-driven schedule updates in system. Remote monitoring beginning.', '2': 'Builder Rep responds to TPS questions as needed. System manages routine communication.', '3': 'Automated through drone reality capture. Builder Rep manages escalations and exceptions only.' } },
    { id: '4.5', label: 'Commissioning / Closing', levels: { '-1': 'May do a closing punchlist walkthrough. Gives keys and equipment manuals to homeowner.', '0': 'Completes a closing punchlist with Customer.', '1': 'Builder Rep conducts on-site home orientation, notes remaining punch items. Warranty and system documentation provided digitally.', '2': 'Takes a zero-defect approach. Trains Customer on systems, operations and warranty. Defect resolution defined at point of discovery.', '3': 'Builder Rep may conduct Customer orientation to home systems and train on use of digital twin for home management.' } },
    { id: '4.6', label: 'Photo and Documentation', levels: { '-1': 'No formal photo process. Some photos taken on phone.', '0': 'Photos taken at key milestones. Stored on phone or shared folder.', '1': 'Formal photo documentation process at defined milestones. Stored in job file system.', '2': 'Automated photo documentation triggered by schedule milestones. Uploaded directly to job portal.', '3': 'Drone and AI-powered visual inspection. Automated defect detection. 3D documentation at key milestones.' } },
    { id: '4.7', label: 'Inspection Management', levels: { '-1': 'Builder Rep schedules inspections by phone. Results communicated informally.', '0': 'Inspection scheduling tracked in spreadsheet or simple system.', '1': 'Inspection scheduling and results managed in field management app.', '2': 'Automated inspection scheduling triggered by construction schedule. Digital results stored in job file.', '3': 'AI predicts inspection readiness. Automated scheduling and digital results integrated with quality management system.' } },
    { id: '4.8', label: 'Safety and Compliance', levels: { '-1': 'Safety handled informally. OSHA compliance reactive.', '0': 'Basic safety requirements communicated to TPS. Occasional site inspections.', '1': 'Formal safety program. Site safety requirements documented and communicated. Regular audits.', '2': 'Digital safety management system. Near-miss reporting. Safety performance tracked by TPS.', '3': 'AI-powered safety risk prediction. IoT sensors monitor site conditions. Automated safety compliance reporting.' } },
  ],
  systems: [
    { id: '5.1', label: 'Customer-Facing Systems', levels: { '-1': 'Paper-based contract documents.', '0': 'There may be a web-based system for the Customer to shop for plans and options. Contract generated in a siloed system.', '1': 'A CRM system leverages digital marketing efforts. Customer may leverage online shopping for plan and option selection.', '2': 'E-commerce system manages complete home buyer experience with integration of CRM and digital marketing.', '3': 'AI-powered integrated platform. Stakeholder-specific interfaces with seamless data flow across all facets. Just-in-time manufacturing coordination.' } },
    { id: '5.2', label: 'Architectural Design Systems', levels: { '-1': 'CAD system to produce 2D paper plans.', '0': '3D CAD system for online viewable renderings and 2D plans. 2D plans printed for construction team.', '1': 'Internal team leveraging 3D CAD for rendering and modeling. Lot-specific plan sets. Output transmitted via manual interface to ERP.', '2': '3D CAD integrated with e-commerce and ERP systems through a supporting integration. All data shared automatically.', '3': 'Generative design platform. AI-assisted design optimization. Direct output to manufacturing and assembly specifications.' } },
    { id: '5.3', label: 'Interior Selections and Design System', levels: { '-1': 'Customer gets a list of places to visit with allowances.', '0': 'Customer meets with selections person or individual suppliers. Collected in spreadsheet and emailed.', '1': 'Online selections system with 3D visualization. Customer can make selections remotely.', '2': 'Fully integrated selections platform. Real-time pricing. Direct integration with purchasing and construction system.', '3': 'AI-assisted selection engine. Virtual reality showroom. Automated coordination with suppliers and installation scheduling.' } },
    { id: '5.4', label: 'Internal Operations - Accounting System', levels: { '-1': 'Manual checks written and recorded. Records forwarded to bookkeeping service.', '0': 'Invoices entered in accounting system, checks produced. Revenue and expenses recorded. Email or paper-based reporting.', '1': 'ERP system used across purchasing, accounting, G&A expenses. Jobs scheduled and purchased via lump sum bid on catalog basis.', '2': 'ERP used across all functions. Itemized resource TPS pricing. Closing, conveyance, and warranty managed through ERP. EFT payments.', '3': 'Fully automated accounting. AI-assisted financial management. Exception-only human involvement. Real-time financial dashboard.' } },
    { id: '5.5', label: 'Internal Operations - Purchasing System', levels: { '-1': 'Trade/Partner vendors submit bids per job. Award communicated by email or phone.', '0': 'Spreadsheets for purchasing and scheduling. Some builders using ERP segment to produce lump sum purchase/work orders.', '1': 'Full ERP purchasing module. Unit price catalog. POs issued electronically. TPS receives digital work orders.', '2': 'Automated PO generation. Real-time cost tracking. Integration with scheduling and accounting.', '3': 'AI-driven just-in-time purchasing. Automated supplier selection and ordering. Real-time material tracking from order to installation.' } },
    { id: '5.6', label: 'Field Management System', levels: { '-1': 'No formal field management system. Phone and paper.', '0': 'Basic scheduling tool or spreadsheet. Photos stored on personal phones.', '1': 'Field management app for scheduling, photos, and communication. TPS can receive schedule updates electronically.', '2': 'Integrated field management platform. Real-time job status. TPS portal. Issue tracking and resolution workflow.', '3': 'AI-powered field management. Drone integration. Automated QC documentation. Predictive schedule risk management.' } },
    { id: '5.7', label: 'Customer Communication Portal', levels: { '-1': 'Phone and email only. No dedicated customer communication system.', '0': 'Builder website with basic contact form. Email communication logged manually.', '1': 'Customer portal for tracking job progress, submitting questions, and accessing warranty information.', '2': 'Real-time customer portal with live job status, automated milestone notifications, and direct communication channels.', '3': 'AI-powered customer experience platform. Proactive communication. Predictive issue identification. Digital twin handover at closing.' } },
    { id: '5.8', label: 'Business Intelligence / Reporting', levels: { '-1': 'No formal reporting. Owner knows the business anecdotally.', '0': 'Basic financial reports from accounting system. Manual compilation of key metrics.', '1': 'Operational dashboard tracking key metrics: closings, margins, cycle times, customer satisfaction.', '2': 'Real-time BI dashboard. Automated variance alerts. Predictive margin analysis. KPI tracking across all departments.', '3': 'AI-powered business intelligence. Predictive modeling for sales, costs, and capacity. Automated strategic reporting.' } },
    { id: '5.9', label: 'Data Integration / Technology Architecture', levels: { '-1': 'No data integration. Each system is a silo.', '0': 'Some manual data transfer between systems. Key data re-entered multiple times.', '1': 'Some integration between CRM, ERP, and field management. Data flows with limited manual intervention.', '2': 'Integrated technology stack with real-time data flow between all key systems. Single source of truth for key data.', '3': 'Fully integrated digital backbone. API-first architecture. AI layer across all systems. Real-time decision support.' } },
  ],
}

const LEVEL_NAMES: Record<string, string> = {
  '-1': 'Anchor',
  '0': 'Typical',
  '1': 'Strategic Implementer',
  '2': 'Adaptive Innovator',
  '3': 'Guiding Star',
}

const LEVEL_COLORS: Record<string, string> = {
  '-1': '#dc2626',
  '0': '#f59e0b',
  '1': '#3b82f6',
  '2': '#8b5cf6',
  '3': '#16a34a',
}

function getScoreColor(pct: number): string {
  if (pct < 25) return '#dc2626'
  if (pct < 50) return '#f59e0b'
  if (pct < 75) return '#3b82f6'
  return '#16a34a'
}

function getLevelBadgeStyle(key: string | null) {
  if (key === '3') return { bg: '#dcfce7', color: '#15803d' }
  if (key === '2') return { bg: '#dbeafe', color: '#1d4ed8' }
  if (key === '1') return { bg: '#fef3c7', color: '#92400e' }
  if (key === '0') return { bg: '#f3f4f6', color: '#374151' }
  return { bg: '#fee2e2', color: '#991b1b' }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #e5e7eb', borderTop: '3px solid #1d4ed8', borderRadius: '50%', margin: '0 auto' }} />
        <p style={{ color: '#6b7280', fontSize: 14, marginTop: 16 }}>Loading your report...</p>
      </div>
    </div>
  )
}

export default function ResultsPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: a } = await supabase
        .from('assessments')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (!a) { setNotFound(true); setLoading(false); return }

      const { data: sub } = await supabase
        .from('subscriptions')
        .select('plan_type, status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      setAssessment(a)
      setSubscription(sub || null)
      setLoading(false)
    }
    load()
  }, [id, router])

  async function handleExportPDF() {
    if (!assessment) return
    const { default: jsPDF } = await import('jspdf')
    const doc = new jsPDF({ unit: 'mm', format: 'letter' })

    const MARGIN = 18
    const PAGE_W = 216
    const CONTENT_W = PAGE_W - MARGIN * 2
    const PAGE_H = 279
    const BOTTOM_SAFE = PAGE_H - 18
    let y = MARGIN

    const scoreColor = getScoreColor(assessment.overall_score)

    const hexToRgb = (hex: string): [number, number, number] => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [0, 0, 0]
    }

    function addPageHeader() {
      doc.setFillColor(15, 31, 61)
      doc.rect(0, 0, PAGE_W, 10, 'F')
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(160, 170, 190)
      doc.text('Builder Maturity Report', MARGIN, 7)
      doc.text(assessment?.company_name ?? '', PAGE_W - MARGIN, 7, { align: 'right' })
    }

    function addFooter() {
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      doc.text('Confidential - The Mainspring Group LLC | buildermaturity.com', MARGIN, PAGE_H - 8)
      doc.text(`Page ${doc.getNumberOfPages()}`, PAGE_W - MARGIN, PAGE_H - 8, { align: 'right' })
    }

    function checkPage(needed: number) {
      if (y + needed > BOTTOM_SAFE) {
        addFooter()
        doc.addPage()
        addPageHeader()
        y = 20
      }
    }

    function sectionDivider(title: string) {
      checkPage(16)
      y += 4
      doc.setDrawColor(229, 231, 235)
      doc.setLineWidth(0.3)
      doc.line(MARGIN, y, PAGE_W - MARGIN, y)
      y += 8
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(15, 31, 61)
      doc.text(title, MARGIN, y)
      y += 7
    }

    // ── PAGE 1 HEADER ─────────────────────────────────────────────
    doc.setFillColor(15, 31, 61)
    doc.rect(0, 0, PAGE_W, 28, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('Builder Maturity Report', MARGIN, 13)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(180, 190, 210)
    doc.text('The Mainspring Group LLC | buildermaturity.com', MARGIN, 21)
    doc.text(formatDate(assessment.completed_at || assessment.created_at), PAGE_W - MARGIN, 21, { align: 'right' })

    y = 38

    // Company + respondent
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(15, 31, 61)
    doc.text(assessment.company_name, MARGIN, y)
    y += 7

    if (assessment.respondent_name) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(107, 114, 128)
      let meta = assessment.respondent_name
      if (assessment.respondent_title) meta += `, ${assessment.respondent_title}`
      if (assessment.homes_per_year) meta += ` | ${assessment.homes_per_year} homes/yr`
      if (assessment.state_region) meta += ` | ${assessment.state_region}`
      doc.text(meta, MARGIN, y)
      y += 10
    } else {
      y += 4
    }

    // Score circle (top right)
    const circleX = PAGE_W - MARGIN - 22
    const circleY = y + 14
    const [sr, sg, sb] = hexToRgb(scoreColor)
    doc.setDrawColor(sr, sg, sb)
    doc.setLineWidth(2.5)
    doc.circle(circleX, circleY, 15)
    doc.setTextColor(sr, sg, sb)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text(`${assessment.overall_score}%`, circleX, circleY + 2, { align: 'center' })
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(150, 150, 150)
    doc.text('overall', circleX, circleY + 7, { align: 'center' })

    // Maturity level
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(15, 31, 61)
    doc.text(`Maturity Level: ${assessment.maturity_level || 'N/A'}`, MARGIN, y + 8)
    y += 18

    // ── DOMAIN SCORES ─────────────────────────────────────────────
    sectionDivider('Domain Scores')

    DOMAIN_ORDER.forEach(key => {
      const d = assessment.domain_scores?.[key]
      if (!d) return
      checkPage(14)
      const [dr, dg, db] = hexToRgb(getScoreColor(d.pct))
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(55, 65, 81)
      doc.text(DOMAIN_NAMES[key], MARGIN, y + 4)
      const barX = MARGIN + 72
      const barW = CONTENT_W - 72 - 18
      doc.setFillColor(243, 244, 246)
      doc.roundedRect(barX, y, barW, 5, 1, 1, 'F')
      doc.setFillColor(dr, dg, db)
      doc.roundedRect(barX, y, Math.max(2, (d.pct / 100) * barW), 5, 1, 1, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(dr, dg, db)
      doc.text(`${d.pct}%`, PAGE_W - MARGIN, y + 4, { align: 'right' })
      y += 12
    })

    // ── RECOMMENDATIONS ───────────────────────────────────────────
    sectionDivider('Recommendations')

    const recs = (assessment.ai_recommendations || '')
      .replace(/<h4>/g, '\n__HEADING__')
      .replace(/<\/h4>/g, '\n')
      .replace(/<strong>/g, '')
      .replace(/<\/strong>/g, '')
      .replace(/<br\/?>/g, '\n')
      .replace(/<p>/g, '')
      .replace(/<\/p>/g, '\n')
      .replace(/<[^>]+>/g, '')
      .trim()

    recs.split('\n').forEach(line => {
      const trimmed = line.trim()
      if (!trimmed) return
      if (trimmed.startsWith('__HEADING__')) {
        const heading = trimmed.replace('__HEADING__', '').trim()
        if (!heading) return
        checkPage(12)
        y += 3
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(15, 31, 61)
        doc.text(heading, MARGIN, y)
        y += 6
      } else {
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(55, 65, 81)
        const lines = doc.splitTextToSize(trimmed, CONTENT_W)
        lines.forEach((l: string) => {
          checkPage(6)
          doc.text(l, MARGIN, y)
          y += 5.5
        })
      }
    })

    // ── MATURITY LEVEL REFERENCE ──────────────────────────────────
    sectionDivider('Maturity Level Reference')

    const levels = [
      { key: '-1', name: 'Anchor', sentiment: 'Shoot from the hip', color: '#dc2626' },
      { key: '0', name: 'Typical', sentiment: 'Re-Active', color: '#f59e0b' },
      { key: '1', name: 'Strategic Implementer', sentiment: 'Pro-Active', color: '#3b82f6' },
      { key: '2', name: 'Adaptive Innovator', sentiment: 'Management by Exception', color: '#8b5cf6' },
      { key: '3', name: 'Guiding Star', sentiment: 'Digitally Optimized', color: '#16a34a' },
    ]

    levels.forEach(lv => {
      checkPage(10)
      const [lr, lg, lb] = hexToRgb(lv.color)
      const isCurrent = assessment.maturity_level_key === lv.key
      doc.setFillColor(lr, lg, lb)
      doc.circle(MARGIN + 2, y + 1, 2, 'F')
      doc.setFontSize(9)
      doc.setFont('helvetica', isCurrent ? 'bold' : 'normal')
      doc.setTextColor(lr, lg, lb)
      doc.text(lv.name, MARGIN + 7, y + 3)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(107, 114, 128)
      const nameW = doc.getTextWidth(lv.name)
      doc.text(`- ${lv.sentiment}${isCurrent ? ' (Your Level)' : ''}`, MARGIN + 7 + nameW + 2, y + 3)
      y += 8
    })

    // ── YOUR RESPONSES ────────────────────────────────────────────
    addFooter()
    doc.addPage()
    addPageHeader()
    y = 20

    // Section title
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(15, 31, 61)
    doc.text('Your Responses', MARGIN, y)
    y += 4
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(107, 114, 128)
    doc.text('A complete record of every answer you selected, organized by domain.', MARGIN, y + 4)
    y += 12

    const answers = assessment.answers || {}

    DOMAIN_ORDER.forEach(domainKey => {
      const questions = DOMAIN_QUESTIONS[domainKey]
      const domainScore = assessment.domain_scores?.[domainKey]
      if (!questions) return

      // Domain header
      checkPage(18)
      const [dr, dg, db] = hexToRgb(getScoreColor(domainScore?.pct || 0))
      doc.setFillColor(245, 247, 250)
      doc.roundedRect(MARGIN, y, CONTENT_W, 10, 2, 2, 'F')
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(15, 31, 61)
      doc.text(DOMAIN_NAMES[domainKey], MARGIN + 4, y + 7)
      if (domainScore) {
        doc.setTextColor(dr, dg, db)
        doc.text(`${domainScore.pct}%`, PAGE_W - MARGIN - 4, y + 7, { align: 'right' })
      }
      y += 14

      questions.forEach((q, qi) => {
        const answerKey = answers[q.id]
        const skipped = answerKey === undefined || answerKey === null

        if (skipped) return // skip unanswered questions

        const levelName = LEVEL_NAMES[answerKey] || answerKey
        const levelDesc = q.levels[answerKey] || ''
        const [lr, lg, lb] = hexToRgb(LEVEL_COLORS[answerKey] || '#6b7280')

        // Estimate height needed
        const descLines = doc.splitTextToSize(levelDesc, CONTENT_W - 8)
        const needed = 8 + descLines.length * 4.5 + 6
        checkPage(needed)

        // Question label
        doc.setFontSize(8.5)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(55, 65, 81)
        const qLabel = `${qi + 1}. ${q.label}`
        doc.text(qLabel, MARGIN, y)

        // Level badge inline
        const labelW = doc.getTextWidth(qLabel)
        doc.setFillColor(lr, lg, lb)
        doc.roundedRect(MARGIN + labelW + 4, y - 4, doc.getTextWidth(levelName) + 6, 5.5, 1, 1, 'F')
        doc.setFontSize(7)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(255, 255, 255)
        doc.text(levelName, MARGIN + labelW + 7, y - 0.5)
        y += 5

        // Description text
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(107, 114, 128)
        descLines.forEach((l: string) => {
          checkPage(5)
          doc.text(l, MARGIN + 4, y)
          y += 4.5
        })
        y += 4

        // Light separator between questions
        if (qi < questions.length - 1) {
          doc.setDrawColor(240, 242, 244)
          doc.setLineWidth(0.2)
          doc.line(MARGIN + 4, y - 2, PAGE_W - MARGIN - 4, y - 2)
        }
      })

      y += 6
    })

    addFooter()

    const dateStr = new Date(assessment.completed_at || assessment.created_at).toISOString().slice(0, 10)
    const filename = `${assessment.company_name.replace(/[^a-zA-Z0-9]/g, '-')}-Maturity-Report-${dateStr}.pdf`
    doc.save(filename)
  }

  if (loading) return <LoadingScreen />

  if (notFound) {
    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter',sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Report not found</h2>
          <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 20 }}>This report doesn't exist or you don't have access to it.</p>
          <a href="/dashboard" style={{ color: '#1d4ed8', fontSize: 14, fontWeight: 600 }}>Back to Dashboard</a>
        </div>
      </div>
    )
  }

  if (!assessment) return null

  const badgeStyle = getLevelBadgeStyle(assessment.maturity_level_key)
  const scoreColor = getScoreColor(assessment.overall_score)
  const isAnnual = subscription?.plan_type === 'annual'

  const domainsSorted = DOMAIN_ORDER
    .map(key => ({ key, ...(assessment.domain_scores?.[key] || { pct: 0, answered: 0, total: 0 }) }))
    .sort((a, b) => a.pct - b.pct)

  const lowestDomain = domainsSorted[0]
  const highestDomain = domainsSorted[domainsSorted.length - 1]

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: "'Inter',sans-serif" }}>
      {/* Nav */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <a href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 34, height: 34, background: '#0f1f3d', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
          </div>
          <div>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#0f1f3d', display: 'block', lineHeight: 1.2 }}>Builder Maturity</span>
            <span style={{ fontSize: 10, color: '#9ca3af', display: 'block', lineHeight: 1 }}>by The Mainspring Group</span>
          </div>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isAnnual && (
            <a href={`/assessment?edit=${assessment.id}`} style={{ fontSize: 13, fontWeight: 500, padding: '7px 14px', borderRadius: 7, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', textDecoration: 'none' }}>Edit Responses</a>
          )}
          <button onClick={handleExportPDF} style={{ fontSize: 13, fontWeight: 600, padding: '7px 16px', borderRadius: 7, border: 'none', background: '#0f1f3d', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export PDF
          </button>
          <a href="/dashboard" style={{ fontSize: 13, color: '#6b7280', textDecoration: 'none', fontWeight: 500 }}>Dashboard</a>
        </div>
      </nav>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px 80px' }}>

        {/* Header card */}
        <div style={{ background: '#0f1f3d', borderRadius: 16, padding: '32px', marginBottom: 24, color: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 24 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>
                {formatDate(assessment.completed_at || assessment.created_at)}
                {assessment.respondent_name && ` · ${assessment.respondent_name}`}
                {assessment.respondent_title && `, ${assessment.respondent_title}`}
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 12px', fontFamily: "'DM Serif Display',serif" }}>{assessment.company_name}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', padding: '5px 12px', borderRadius: 20, background: badgeStyle.bg, color: badgeStyle.color }}>
                  {assessment.maturity_level}
                </span>
                {assessment.homes_per_year && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{assessment.homes_per_year} homes/yr</span>}
                {assessment.state_region && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{assessment.state_region}</span>}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 110, height: 110, borderRadius: '50%', border: `5px solid ${scoreColor}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: 38, fontWeight: 700, lineHeight: 1, color: scoreColor, fontFamily: "'DM Serif Display',serif" }}>{assessment.overall_score}</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>out of 100</span>
              </div>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Overall Score</span>
            </div>
          </div>
        </div>

        {/* Focus / Strongest cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12, padding: '20px 22px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#c2410c', marginBottom: 8 }}>Priority Focus Area</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#7c2d12', marginBottom: 4 }}>{DOMAIN_NAMES[lowestDomain?.key] || '-'}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: getScoreColor(lowestDomain?.pct || 0) }}>{lowestDomain?.pct || 0}%</div>
            <div style={{ fontSize: 12, color: '#9a3412', marginTop: 4 }}>Lowest scoring domain - greatest opportunity for improvement</div>
          </div>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '20px 22px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#15803d', marginBottom: 8 }}>Strongest Area</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#14532d', marginBottom: 4 }}>{DOMAIN_NAMES[highestDomain?.key] || '-'}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: getScoreColor(highestDomain?.pct || 0) }}>{highestDomain?.pct || 0}%</div>
            <div style={{ fontSize: 12, color: '#166534', marginTop: 4 }}>Your competitive advantage - leverage this across the business</div>
          </div>
        </div>

        {/* Domain scores */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '28px', marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 20px' }}>Domain Scores</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {DOMAIN_ORDER.map(key => {
              const d = assessment.domain_scores?.[key]
              if (!d) return null
              return (
                <div key={key}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d={DOMAIN_ICONS[key]} /></svg>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', flex: 1 }}>{DOMAIN_NAMES[key]}</span>
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>{d.answered}/{d.total} answered</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: getScoreColor(d.pct), width: 40, textAlign: 'right' }}>{d.pct}%</span>
                  </div>
                  <div style={{ height: 8, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 4, width: `${d.pct}%`, background: getScoreColor(d.pct), transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recommendations */}
        {assessment.ai_recommendations && (
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '28px', marginBottom: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 20px' }}>Recommendations</h2>
            <div
              style={{ fontSize: 14, lineHeight: 1.75, color: '#374151' }}
              dangerouslySetInnerHTML={{ __html: assessment.ai_recommendations
                .replace(/<h4>/g, '<h4 style="font-size:15px;font-weight:700;color:#0f1f3d;margin:20px 0 8px;padding:0">')
                .replace(/<p>/g, '<p style="margin:0 0 12px;padding:0">')
              }}
            />
          </div>
        )}

        {/* Maturity level reference */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '28px', marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>Maturity Level Reference</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { key: '-1', name: 'Anchor', sentiment: 'Shoot from the hip', color: '#dc2626' },
              { key: '0', name: 'Typical', sentiment: 'Re-Active', color: '#f59e0b' },
              { key: '1', name: 'Strategic Implementer', sentiment: 'Pro-Active', color: '#3b82f6' },
              { key: '2', name: 'Adaptive Innovator', sentiment: 'Management by Exception', color: '#8b5cf6' },
              { key: '3', name: 'Guiding Star', sentiment: 'Digitally Optimized', color: '#16a34a' },
            ].map(lv => {
              const isCurrentLevel = assessment.maturity_level_key === lv.key
              return (
                <div key={lv.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, background: isCurrentLevel ? `${lv.color}10` : '#f9fafb', border: `1px solid ${isCurrentLevel ? lv.color + '40' : '#f3f4f6'}` }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: lv.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: lv.color, width: 180, flexShrink: 0 }}>{lv.name}</span>
                  <span style={{ fontSize: 13, color: '#6b7280' }}>{lv.sentiment}</span>
                  {isCurrentLevel && <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: lv.color, background: `${lv.color}15`, padding: '2px 8px', borderRadius: 10 }}>Your Level</span>}
                </div>
              )
            })}
          </div>
        </div>

        {/* Your Responses (on-screen preview) */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '28px', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>Your Responses</h2>
              <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>Every answer you selected, organized by domain. Included in your PDF export.</p>
            </div>
          </div>
          {DOMAIN_ORDER.map(domainKey => {
            const questions = DOMAIN_QUESTIONS[domainKey]
            const domainScore = assessment.domain_scores?.[domainKey]
            const answeredQs = questions.filter(q => assessment.answers?.[q.id] !== undefined)
            if (answeredQs.length === 0) return null
            return (
              <div key={domainKey} style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', background: '#f8fafc', borderRadius: 8, marginBottom: 12, border: '1px solid #e5e7eb' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0f1f3d' }}>{DOMAIN_NAMES[domainKey]}</span>
                  {domainScore && <span style={{ fontSize: 13, fontWeight: 700, color: getScoreColor(domainScore.pct) }}>{domainScore.pct}%</span>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {answeredQs.map((q, qi) => {
                    const answerKey = assessment.answers?.[q.id]
                    const levelName = LEVEL_NAMES[answerKey] || answerKey
                    const levelDesc = q.levels[answerKey] || ''
                    const levelColor = LEVEL_COLORS[answerKey] || '#6b7280'
                    return (
                      <div key={q.id} style={{ paddingLeft: 14, borderLeft: `3px solid ${levelColor}20` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{q.label}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: `${levelColor}15`, color: levelColor, flexShrink: 0 }}>{levelName}</span>
                        </div>
                        <p style={{ fontSize: 12, color: '#6b7280', margin: 0, lineHeight: 1.6 }}>{levelDesc}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button onClick={handleExportPDF} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '11px 20px', background: '#0f1f3d', color: '#fff', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export PDF
          </button>
          {isAnnual && (
            <a href={`/assessment?edit=${assessment.id}`} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '11px 20px', background: '#fff', color: '#374151', border: '1px solid #e5e7eb', borderRadius: 9, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
              Edit Responses
            </a>
          )}
          <a href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '11px 20px', background: '#fff', color: '#374151', border: '1px solid #e5e7eb', borderRadius: 9, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
            Back to Dashboard
          </a>
        </div>
      </main>
    </div>
  )
}
