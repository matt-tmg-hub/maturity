import { DOMAINS_V1 } from './maturityDataV1'

export interface Question {
  id: string
  label: string
  levels: Record<string, string>
}

export interface Domain {
  key: string
  name: string
  short: string
  iconPath: string
  desc: string
  questions: Question[]
}

export const LEVEL_KEYS = ['-1', '0', '1', '2', '3']

export const LEVEL_SCORES: Record<string, number> = {
  '-1': 0, '0': 25, '1': 50, '2': 75, '3': 100,
}

export const LEVEL_NAMES: Record<string, string> = {
  '-1': 'Anchor',
  '0': 'Typical',
  '1': 'Strategic Implementer',
  '2': 'Adaptive Innovator',
  '3': 'Guiding Star',
}

export const LEVEL_SENTIMENTS: Record<string, string> = {
  '-1': 'Shoot from the hip',
  '0': 'Re-Active',
  '1': 'Pro-Active',
  '2': 'Management by Exception',
  '3': 'Digitally Optimized',
}

export const DOMAINS: Domain[] = [
  {
    key: 'leadership',
    name: 'Leadership & Culture',
    short: 'Leadership',
    iconPath: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
    desc: `How healthy, aligned, and clear is the leadership team, and does that clarity reach the whole company?`,
    questions: [
      {
        id: 'L.1',
        label: `Leadership Team Cohesion`,
        levels: {
          '-1': `The "leadership team" is really a set of department heads who each report to the owner separately. They stay out of each other's areas, disagreements get settled in the parking lot, and when something goes wrong the first move is to find out whose fault it was.`,
          '0': `Leaders get along, but keep it polite. Real disagreements are avoided in the room and worked out in side conversations or pushed up to the owner. Each leader protects their own department's numbers first.`,
          '1': `The team meets regularly and is starting to argue productively about real issues. Most decisions stick, though some get reopened later. Leaders occasionally challenge each other, but the owner is still the main source of accountability.`,
          '2': `Leaders trust each other enough to admit mistakes and push back openly. Decisions made in the room hold outside it. Peers hold each other accountable without waiting for the owner, and company results come before department wins.`,
          '3': `Every leader treats the leadership team as their first team, ahead of the department they run. Debate is open, fast, and about ideas rather than people. Everyone leaves committed even when they didn't get their way, and the team judges itself on company results, not on who looked best.`,
        },
      },
      {
        id: 'L.2',
        label: `Purpose, Values & Strategy`,
        levels: {
          '-1': `Nobody could say what the company stands for beyond building houses and making money. Values, if they exist, are a plaque on the wall. Strategy is whatever the owner decides this month.`,
          '0': `A mission statement and values were written once and are rarely mentioned. Ask the leaders separately and you'd get different versions of the strategy. Deals and opportunities get chased because they showed up.`,
          '1': `Leadership has defined core values and a basic strategy: who we build for, where, and how we win. Most leaders can repeat them, but they aren't yet used to make hard calls.`,
          '2': `Purpose, values, and strategy are specific to this company and consistent across the leadership team. They're used to turn down land, plans, buyers, hires, and trade partners that don't fit.`,
          '3': `Every leader describes the company's purpose, expected behaviors, market, and path to winning the same way. Those answers drive real decisions from land to hiring, and the company is known in its market for them.`,
        },
      },
      {
        id: 'L.3',
        label: `Priorities & Focus`,
        levels: {
          '-1': `Everything is urgent. Priorities change with the loudest problem of the week, and the team is worn out from chasing all of them at once.`,
          '0': `There's a long list of goals, often one per department, and no agreement on which matters most. Big initiatives start strong and fade when the next fire hits.`,
          '1': `Leadership sets annual goals and a few company priorities. Progress is reviewed now and then, but departments still pull in different directions when resources get tight.`,
          '2': `The leadership team agrees on one top priority for the next several months, broken into a few concrete objectives with owners. When something has to give, everyone knows what comes first.`,
          '3': `Anyone in the company can name the single most important thing leadership is working on and why. The top priority is reset every few months and tracked openly, while the everyday measures (starts, closings, margin, cycle time, buyer satisfaction) are watched so the core business doesn't slip.`,
        },
      },
      {
        id: 'L.4',
        label: `Roles & Accountability`,
        levels: {
          '-1': `Titles exist, but nobody's sure who owns what. Work falls through the cracks or gets done twice, and the owner is the default answer to every question.`,
          '0': `Roles are loosely defined and job descriptions are outdated or missing. Handoffs between sales, purchasing, and construction cause regular friction and finger-pointing.`,
          '1': `Core roles have written responsibilities and the org chart matches reality. Handoffs are defined for the main processes, though gray areas still land on whoever is most responsive.`,
          '2': `Every role has clear outcomes it's measured on. Ownership of key processes, and of the handoffs between departments, is explicit, and people are held to it consistently.`,
          '3': `Everyone knows what they own, what success looks like, and who owns everything they touch. The org chart is drawn for the business three years out, with roles defined as functions rather than people (the owner is a person, not a role), and key hires are made before the breaking point, not after.`,
        },
      },
      {
        id: 'L.5',
        label: `Communication & Meeting Rhythm`,
        levels: {
          '-1': `Meetings are rare or chaotic. Information moves by rumor, and the field hears about decisions after they're made, sometimes from a trade partner.`,
          '0': `There's a weekly meeting, but it's mostly status updates and venting. It's unclear what was decided, and what each leader tells their team afterward varies.`,
          '1': `Leadership meetings have an agenda and produce decisions. Key messages get passed down, though not consistently, and strategic topics keep getting crowded out by day-to-day issues.`,
          '2': `A set meeting rhythm separates quick tactical check-ins from deeper strategic discussions and periodic off-site reviews. Leaders agree on what to tell their teams at the end of each meeting, and the message reaches the field intact.`,
          '3': `Meetings are the most valuable hours of the week: focused, decisive, and sometimes heated. Leaders repeat the company's direction constantly, the office and the field hear the same message, and nobody is surprised by a decision that affects them.`,
        },
      },
      {
        id: 'L.6',
        label: `People Systems`,
        levels: {
          '-1': `Hiring is based on who's available. There's no real onboarding, reviews don't happen, and poor performers stay because letting them go feels harder than keeping them.`,
          '0': `Hiring looks at experience and skills. Onboarding is a day of paperwork and "shadow so-and-so." Reviews happen once a year if at all and have no link to company values or goals.`,
          '1': `Hiring includes some screening for fit. There's a basic onboarding plan and regular reviews, though pay and recognition follow tenure and output more than values.`,
          '2': `Values and role outcomes are built into hiring, onboarding, reviews, and recognition. People who don't fit are dealt with promptly rather than tolerated.`,
          '3': `The company's values show up in every people decision: who gets hired, how they're brought on, reviewed, paid, and recognized, and when necessary, let go. The culture reinforces itself without leadership having to police it.`,
        },
      },
    ],
  },
  {
    key: 'customer',
    name: 'Customer Experience',
    short: 'Customer Experience',
    iconPath: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    desc: `How does the builder attract, serve, and retain home buyers throughout the process?`,
    questions: [
      {
        id: '1.1',
        label: `Customer Discovery Process`,
        levels: {
          '-1': `Buyers show up by accident \u2014 open houses, yard signs, word of mouth. No organized lead generation. No one knows where customers came from.`,
          '0': `Some intentional marketing \u2014 home shows, walk-ins, a basic website. Leads tracked in a spreadsheet if at all. Follow-up is inconsistent.`,
          '1': `Organized marketing approach with a defined lead generation process. Leads captured in a system and followed up consistently. Builder knows where their customers are coming from.`,
          '2': `Marketing is intentional and measurable. Leads are qualified before they reach sales. Builder understands which channels produce buyers, not just inquiries.`,
          '3': `The right buyers find the builder at the right time. Marketing is targeted, cost-efficient, and continuously refined based on what actually converts to closed homes.`,
        },
      },
      {
        id: '1.12',
        label: `Buying & Contract Process`,
        levels: {
          '-1': `Buyers have to push to get information, and the experience depends on which salesperson they talk to. Contracts are on paper, errors are common, and signing takes days.`,
          '0': `A sales process exists but isn't followed consistently. Buyers get information only when they ask. Some documents are digital, but buyers still have to come in or return paperwork.`,
          '1': `A defined sales process with clear steps. Buyers know what comes next, plan and lot pricing is available without asking, and contracts can be signed digitally from anywhere.`,
          '2': `Buyers can move through the decision largely at their own pace, with the information they need when they need it. The whole contract process is online, and every document is stored in one place.`,
          '3': `Buying from this builder feels easy and low-pressure. The process is clear, signing is frictionless, and the buyer feels in control from first inquiry to signed contract.`,
        },
      },
      {
        id: '1.13',
        label: `Options & Selections`,
        levels: {
          '-1': `Customization happens verbally, and promises get made that purchasing and the field never hear about. Buyers are sent off to suppliers on their own, and allowances are misunderstood.`,
          '0': `Standard options and a selections meeting exist, but choices are captured on paper or spreadsheets and emailed around. The cost impact isn't clear until later, and errors are common.`,
          '1': `A defined option catalog with documented pricing and a structured selections process. Buyers know what's included and what costs extra, and their choices reach purchasing reliably.`,
          '2': `Buyers choose with full visibility into cost and schedule impact. Options and selections flow straight into purchasing and production without re-entry. Offerings are sized to what buyers actually pick, not every choice a supplier carries.`,
          '3': `Options and selections are a highlight of buying, not a source of rework. Choices are well-curated and profitable, and what the buyer picks is exactly what gets installed, every time.`,
        },
      },
      {
        id: '1.6',
        label: `Construction Communication with Buyer`,
        levels: {
          '-1': `Buyer calls the superintendent when worried. No scheduled updates. Builder reacts to complaints rather than proactively communicating.`,
          '0': `Occasional email updates, but no consistent schedule or format. Buyer is often unsure of where things stand.`,
          '1': `Defined communication touchpoints at key milestones. Buyer knows what to expect and who to call. Builder initiates contact proactively.`,
          '2': `Buyer receives consistent updates with photos at each milestone. Rarely needs to chase the builder. Feels informed and confident throughout the build.`,
          '3': `Communication is one of the things buyers brag about after closing. They always knew where things stood, felt respected throughout the process, and were never left guessing.`,
        },
      },
      {
        id: '1.7',
        label: `Warranty and Post-Close Service`,
        levels: {
          '-1': `Buyer calls when something breaks. No formal process. Response is inconsistent and depends on who answers the phone.`,
          '0': `Warranty requests collected by phone or email. Tracked in a spreadsheet. Follow-through is inconsistent.`,
          '1': `Formal warranty submission process in place. Requests tracked and assigned. Buyer knows how to submit a request and what to expect.`,
          '2': `Warranty program is proactive and well-managed. Common items addressed before they become complaints. Completion tracked and confirmed with the homeowner.`,
          '3': `Warranty experience reinforces the buyer's decision to choose this builder. Issues are handled quickly, professionally, and without the homeowner having to push. Repeat problems get fixed at the root, not patched.`,
        },
      },
      {
        id: '1.14',
        label: `Feedback, Reviews & Referrals`,
        levels: {
          '-1': `Problems surface through rumors or online reviews. There's no feedback process, no plan for reviews, and referrals happen by chance.`,
          '0': `A survey goes out after closing, if someone remembers. Reviews are checked now and then, and referral fees are paid informally.`,
          '1': `Surveys go out at set points in the process, happy buyers are asked for reviews, and there's a documented referral program. Results are tracked and leadership sees them.`,
          '2': `Feedback is tied to operational improvement, and teams are accountable for their scores. Reviews are built into closing and warranty, patterns get acted on, and referral sources are tracked and nurtured.`,
          '3': `The builder knows how buyers feel at every stage and uses it to get better. Strong reviews and steady referrals reflect an operation that earns them, not a marketing campaign.`,
        },
      },
    ],
  },
  {
    key: 'trade',
    name: 'Trade Partners',
    short: 'Trade Partners',
    iconPath: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0',
    desc: `How does the builder find, manage, and retain trade partners and suppliers?`,
    questions: [
      {
        id: '2.1',
        label: `Trade Partner Discovery`,
        levels: {
          '-1': `Builder calls whoever is available or asks around on a job site. No organized approach to finding qualified trade partners.`,
          '0': `Trade partners find the builder by calling the office or showing up at a job. Builder may connect at association meetings. Reactive rather than strategic.`,
          '1': `Purchasing team actively looks for trade partners based on what the schedule requires. Sources include referrals, associations, and targeted outreach.`,
          '2': `Builder has a defined process for attracting and evaluating new trade partners. Capacity gaps are identified in advance and filled proactively.`,
          '3': `The builder always has qualified trade partners available when needed. Discovery is systematic, capacity is planned ahead, and the right partners are in place before the need becomes urgent.`,
        },
      },
      {
        id: '2.2',
        label: `Trade Partner Qualification`,
        levels: {
          '-1': `If they show up and seem capable, they get the work. No vetting process whatsoever.`,
          '0': `Builder may ask for references but rarely calls them. Insurance certificates collected inconsistently.`,
          '1': `Defined qualification checklist. References checked, insurance verified, scope and pricing requirements communicated before work is awarded.`,
          '2': `Formal qualification process with documented standards. New trade partners are evaluated consistently before being added to the active roster.`,
          '3': `Trade partners earn their place on the roster and know it. The qualification bar is clear, consistently applied, and reflects the standards the builder expects on every job site.`,
        },
      },
      {
        id: '2.3',
        label: `Trade Partner Onboarding`,
        levels: {
          '-1': `New trade partner handed a set of plans and pointed to a job site. No formal orientation.`,
          '0': `Basic information shared \u2014 plans, pay schedule, insurance requirements. Setup in accounting. No structured introduction to how the builder operates.`,
          '1': `Structured onboarding process. Scope of work documented, pricing established, scheduling expectations communicated, on-site rules explained.`,
          '2': `Trade partners understand exactly what is expected of them before they set foot on a job site. Onboarding is consistent regardless of who handles it.`,
          '3': `Onboarding sets trade partners up to succeed. They arrive knowing the builder's standards, processes, and expectations \u2014 and they're held to them from day one.`,
        },
      },
      {
        id: '2.13',
        label: `Trade Contracts, Negotiation & Price Changes`,
        levels: {
          '-1': `Price is negotiated verbally on the spot. Whatever the trade partner says becomes the budget. No written agreements.`,
          '0': `Trades submit bids and the lowest usually wins. Contracts are basic, and price increase requests are accepted or fought case by case with no consistent process.`,
          '1': `Written trade agreements define scope, pricing, and terms. Price increases require notice and documentation and go through a formal approval before they take effect.`,
          '2': `Negotiations are prepared, not improvised. The builder knows the trade's cost drivers and comes in with data, aiming for agreements both sides can live with. Price changes are tied to real market movement and applied on a set cadence.`,
          '3': `Pricing is fair, transparent, and grounded in the real cost of doing the work. Trade partners trust the process because it protects their profit as well as the builder's. Negotiation is a trained skill, and agreements are revisited on a regular cycle rather than in a crisis.`,
        },
      },
      {
        id: '2.5',
        label: `Trade Partner Collaboration and Improvement`,
        levels: {
          '-1': `No collaboration. Trade partners do their work and leave. No one asks for their input.`,
          '0': `Trade partners occasionally suggest better ways to do things informally. Builder listens sometimes, acts rarely.`,
          '1': `Builder actively engages top trade partners in improving materials, methods, and processes. Their input is solicited and sometimes implemented.`,
          '2': `Key trade partners are included in product and process improvement conversations. Ideas are evaluated and acted on. Partners feel like stakeholders, not just vendors.`,
          '3': `The best trade partners want to work for this builder because they're treated as collaborators. Their field knowledge improves the product, reduces cost, and builds loyalty that's hard for competitors to replicate.`,
        },
      },
      {
        id: '2.6',
        label: `Scheduling and Capacity Management`,
        levels: {
          '-1': `Builder calls each trade partner the day before to see if they can make it. No formal scheduling. Delays are routine.`,
          '0': `Schedule distributed but rarely followed. Trade partners confirm verbally. Conflicts discovered on the job site.`,
          '1': `System-generated schedules shared in advance. Trade partners confirm electronically. Most scheduling conflicts caught before they become problems.`,
          '2': `Trade partners see their upcoming work well in advance. Starts are paced to what trades can actually handle, so crews aren't overloaded and then blamed when they fall behind.`,
          '3': `The schedule is a reliable operating tool, not a wish list. Trades plan their crews around it, capacity problems are seen weeks ahead, and when surprises happen the system catches them fast.`,
        },
      },
      {
        id: '2.7',
        label: `Trade Partner Performance Management`,
        levels: {
          '-1': `No formal measurement. Builder keeps mental notes about who is good and who isn't. Problems tolerated until they become crises.`,
          '0': `Problem trade partners are quietly dropped. No formal feedback, no corrective process, no documentation.`,
          '1': `Performance tracked on quality, schedule, and cost. Underperformance addressed in a documented conversation. Clear expectations set going forward.`,
          '2': `Every major trade is measured on a consistent scorecard: quality, schedule reliability, variances, communication, safety, and warranty callbacks. Scores are shared with trades regularly, and top performers earn more work.`,
          '3': `Trade partners know exactly how they score, how it's weighted, and what great looks like, and they use the scorecard to improve. Performance drives how work is allocated, problems are addressed early, and the relationship feels like a partnership, not a report card.`,
        },
      },
      {
        id: '2.8',
        label: `Trade Partner Communication During Construction`,
        levels: {
          '-1': `Phone calls and voicemails. No documentation. Critical information shared verbally and frequently lost.`,
          '0': `Email used for some communication but nothing is centralized. Issues discovered on the job site, not before.`,
          '1': `Field management tools used for scheduling updates and issue tracking. Trade partners can receive and confirm information electronically.`,
          '2': `Communication with trade partners is organized and documented. Issues logged, assigned, and resolved through a defined process rather than phone tag.`,
          '3': `Trade partners always know where they stand, what's expected of them, and who to contact when something comes up. Communication is clear, documented, and efficient.`,
        },
      },
      {
        id: '2.9',
        label: `Material and Supplier Management`,
        levels: {
          '-1': `Trade partners buy their own materials. Builder has no visibility into what was purchased, at what price, or when it will arrive.`,
          '0': `Builder provides material lists but doesn't actively manage suppliers. Material decisions largely left to trade partners.`,
          '1': `Builder manages key supplier relationships directly. Pricing agreements in place for major material categories. Delivery coordination improving.`,
          '2': `Material procurement is coordinated with the construction schedule. Supplier relationships actively managed for cost and reliability.`,
          '3': `Materials arrive when they're supposed to, at the price that was agreed on. Builder has real relationships with key suppliers, not just a list of vendors to call when something runs out.`,
        },
      },
      {
        id: '2.10',
        label: `Trade Partner Payment Process`,
        levels: {
          '-1': `Invoices arrive whenever. Checks written manually when someone gets around to it. Trade partners have no idea when they'll get paid.`,
          '0': `Invoice submitted, check eventually produced. Process works but is slow and manual. Trade partners follow up frequently.`,
          '1': `Purchase order system in place. Payment tied to completed work and approval. Trade partners know what triggers payment.`,
          '2': `Payment process is systematic and reliable. Trade partners submit through a defined process and get paid on a predictable schedule.`,
          '3': `Trade partners get paid on time, every time. The process is clear, the timeline is predictable, and it's one of the reasons the best trade partners prioritize this builder's jobs.`,
        },
      },
      {
        id: '2.11',
        label: `Trade Partner Warranty Work`,
        levels: {
          '-1': `Builder calls the trade partner when a homeowner complains. Response is inconsistent. Some trade partners respond, some don't.`,
          '0': `Warranty work assigned informally. Completion tracked inconsistently. Homeowner often has to follow up multiple times.`,
          '1': `Warranty assignments tracked by trade partner. Completion required and confirmed. Response time expectations clearly communicated.`,
          '2': `Warranty performance tracked as part of the overall trade partner relationship. Recurring issues addressed at the root, not just patched.`,
          '3': `Warranty callbacks are rare because quality is built in on the front end. When they do occur, trade partners respond quickly because it's a condition of doing business with this builder.`,
        },
      },
      {
        id: '2.12',
        label: `Trade Partner Retention and Relationship Health`,
        levels: {
          '-1': `No retention strategy. Trade partners come and go. The good ones leave for builders who treat them better.`,
          '0': `Builder maintains a preferred list but the relationship is purely transactional. Volume is the only incentive offered.`,
          '1': `Top trade partners are recognized and given preferential scheduling. Annual review conversations happen. Expectations are clearly communicated.`,
          '2': `Strategic relationships developed with key trade partners. Mutual investment in tools, training, and process improvement. Both sides benefit.`,
          '3': `The best trade partners in the market want to be on this builder's roster. The relationship is professional, fair, consistent, and worth protecting from their side too.`,
        },
      },
    ],
  },
  {
    key: 'internal',
    name: 'Internal Operations',
    short: 'Internal Operations',
    iconPath: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
    desc: `How do internal teams (design, sales, accounting, and purchasing) perform, collaborate, and hand work to each other?`,
    questions: [
      {
        id: '3.1',
        label: `Design and Plan Management`,
        levels: {
          '-1': `No designer on staff. Plans outsourced or borrowed from a previous project. Customization handled through redlines and verbal instructions.`,
          '0': `Stock plans maintained. Minor changes made in-house. Custom changes sent to an outside designer with no formal process for communicating results to the field.`,
          '1': `Plan management is organized. Changes are documented, versioned, and communicated to the right people. Field teams work from current plans, not guesswork.`,
          '2': `Design function is proactive. Plans are developed with input from purchasing and field to minimize changes and cost surprises during construction.`,
          '3': `Design is a strategic function, not a bottleneck. Plans are accurate, current, and built to be built. Changes go through a defined process that protects schedule and margin.`,
        },
      },
      {
        id: '3.2',
        label: `Sales Team Structure and Effectiveness`,
        levels: {
          '-1': `Sales handled by whoever is available \u2014 owner, superintendent, a part-time agent. No defined sales process or accountability.`,
          '0': `Dedicated sales staff in model homes. Results are relationship-dependent. No consistent process, no performance management.`,
          '1': `Sales team follows a defined process. Performance tracked. Customer handoff from sales to production is documented and reliable.`,
          '2': `Sales team is professional, accountable, and well-integrated with the rest of the operation. They know what they can promise and what they can't.`,
          '3': `Sales team is a competitive advantage. They close the right buyers, set accurate expectations, and hand off customers to production in a way that sets everyone up for success.`,
        },
      },
      {
        id: '3.3',
        label: `Accounting and Financial Management`,
        levels: {
          '-1': `Accounting is informal or outsourced entirely. No job-level financial visibility. Owner relies on bank balance to gauge health of the business.`,
          '0': `Basic accounting system in place. Financial reporting is periodic and backward-looking. Job profitability understood only after closing.`,
          '1': `Accounting handles payables, receivables, payroll, and construction draws in a defined system. Job-level costs tracked. Reports produced regularly.`,
          '2': `Financial function is reliable and timely. Leadership has access to current job-level and company-level financial data. Accounting is a business partner, not just a record-keeper.`,
          '3': `Finance is a management tool. Leadership makes decisions based on current, accurate financial data. Accounting runs cleanly, exceptions are caught fast, and the numbers are trusted.`,
        },
      },
      {
        id: '3.4',
        label: `Purchasing Team Structure and Effectiveness`,
        levels: {
          '-1': `Purchasing is whoever makes the calls. No defined role, no process, no accountability for cost.`,
          '0': `Someone owns purchasing, but the job is mostly processing paperwork and chasing invoices. There's no time left for improving cost.`,
          '1': `Purchasing has defined roles, clear authority over pricing and purchase orders, and is held accountable for budget accuracy.`,
          '2': `The purchasing team spends as much time improving cost as processing it: negotiating, itemizing, reviewing variances, and working with trades on better ways to build.`,
          '3': `Purchasing is a profit center. The team is staffed and skilled for negotiation, cost analysis, and trade partnership, and leads the company's cost reduction work, not just its paperwork.`,
        },
      },
      {
        id: '3.5',
        label: `Handoffs & Process Documentation`,
        levels: {
          '-1': `Work moves between departments by hallway conversation. Things get lost between sales, selections, purchasing, and construction, and each group blames the one before it.`,
          '0': `Some handoffs have forms or checklists, but they're used inconsistently. The same problems at the same handoff come up job after job.`,
          '1': `The key handoffs from land through delivery are identified. Each has a defined list of what must be complete before work passes to the next role.`,
          '2': `Every role knows exactly what it receives, what it produces, and by when. Handoffs are written as SOPs, and what one role produces is exactly what the next role needs. Handoff failures are tracked and fixed.`,
          '3': `Operations don't break at the arrows. Every handoff is defined, timed, and measured. SOPs stay current as the company grows, roles are documented before people are hired into them, and new hires learn the process from the documents rather than tribal knowledge.`,
        },
      },
    ],
  },
  {
    key: 'builder_rep',
    name: 'Field Management',
    short: 'Field Management',
    iconPath: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    desc: `How does the field team get jobs ready, schedule and run construction, and improve cycle time?`,
    questions: [
      {
        id: '4.1',
        label: `Field Team Involvement in the Sales Process`,
        levels: {
          '-1': `Sales makes promises. Field finds out at the pre-construction meeting \u2014 or on the job site.`,
          '0': `Superintendent occasionally consulted on whether a customization is feasible. No formal involvement.`,
          '1': `Customization requests and commitments routed through a defined process that includes field review before promises are made to the buyer.`,
          '2': `Field team has clear visibility into what was sold and committed. Handoff from sales to production is documented and reliable. No surprises.`,
          '3': `Sales and field operate as one team on behalf of the buyer. What gets sold is what gets built. Handoffs are clean, documentation is complete, and the buyer's experience is consistent from contract to keys.`,
        },
      },
      {
        id: '4.11',
        label: `Soft Cycle (Contract to Start)`,
        levels: {
          '-1': `Nobody owns the stretch between signed contract and construction start. Permits, selections, financing, and plans get chased as they come up, and start dates slip without anyone knowing why.`,
          '0': `A checklist or spreadsheet tracks some pre-start tasks, but who owns each step and how long it should take isn't clear. Soft cycle time varies widely from job to job.`,
          '1': `The soft cycle has a defined workflow: the actions, the accountable role for each, expected durations, and dependencies. Superintendents get complete job information before the first trade arrives.`,
          '2': `The soft cycle runs on a schedule in the system, just like production: a base template for the typical job plus option schedules for things like municipal review, HOA, or septic. Soft cycle time is measured, and the team huddles daily on jobs that are waiting.`,
          '3': `The soft cycle is managed as tightly as the build. Every job moves from contract to start on a predictable timeline, the buyer knows what's next, and the first day of construction is the smoothest day on the job. Soft cycle time keeps shrinking.`,
        },
      },
      {
        id: '4.10',
        label: `Schedule Templates & Planning`,
        levels: {
          '-1': `Superintendent gets a closing date and figures out the rest. No formal schedule. Sequencing managed by memory and experience.`,
          '0': `A schedule template exists, but it's generic or outdated, so superintendents rebuild or ignore it. Durations are optimistic and leave no room for weather or delays.`,
          '1': `Plan-based schedule templates are built in the system and used for every start. Activities, durations, and logic were agreed on by construction, purchasing, and trades, so everyone builds from the same schedule.`,
          '2': `Templates are built for the 85% case, and option schedules handle the rest: structural options, long-lead items, and municipal or code requirements. Expected downtime is planned in rather than hoped away, so the schedule is realistic from day one.`,
          '3': `The schedule runs the job. Templates are accurate enough that closing dates are promised with confidence, and they're kept current as plans, options, and trades change. On-time closings are the default, not the exception.`,
        },
      },
      {
        id: '4.9',
        label: `Schedule Reliability & Improvement`,
        levels: {
          '-1': `No one compares actual build time to what was scheduled. Slippage is blamed on weather and trades.`,
          '0': `Slippage is noticed but not measured. Superintendents move dates manually all the time, and trades get overloaded and then yelled at when they fall behind.`,
          '1': `Scheduled vs. actual cycle time is tracked by job, and the main causes of delay (weather, communication, trade capacity, predecessors) are known.`,
          '2': `Slippage is reviewed regularly by cause. Manual schedule changes are the exception and follow defined rules. Capacity constraints are planned around instead of discovered on site.`,
          '3': `The team has two jobs: run the schedule and improve it. Regular retrospectives turn what happened on past jobs into better durations, logic, and templates. Cycle time keeps getting shorter and more predictable.`,
        },
      },
      {
        id: '4.4',
        label: `Job Management During Construction`,
        levels: {
          '-1': `Superintendent manages reactively \u2014 responding to problems as they arise. Jobs run on tribal knowledge and constant presence.`,
          '0': `Superintendent visits every job site daily. Manages by walking around and making calls. System plays little role in day-to-day management.`,
          '1': `Superintendent manages by exception. System handles routine scheduling and communication. Field time focused on quality and problem resolution.`,
          '2': `Superintendent is a manager, not a babysitter. Trade partners execute reliably. Issues are caught early and resolved through a defined process.`,
          '3': `Superintendent manages a portfolio of homes with confidence because the system supports them. Their value is in judgment and leadership, not in being physically present at every job site every day.`,
        },
      },
      {
        id: '4.5',
        label: `Closing and Homeowner Orientation`,
        levels: {
          '-1': `Keys handed over with a handshake. No formal orientation. Homeowner left to figure out systems on their own.`,
          '0': `Closing walkthrough completed. Punchlist items noted. Homeowner gets a folder of manuals.`,
          '1': `Structured home orientation completed before closing. Punchlist items tracked and resolved. Homeowner knows who to call for warranty.`,
          '2': `Zero-defect standard pursued before closing. Orientation is thorough and consistent. Homeowner leaves feeling confident about their new home and about the builder.`,
          '3': `Closing is one of the best moments in the buyer's experience. The home is ready, the orientation is thorough, and the buyer feels taken care of \u2014 not relieved that it's finally over.`,
        },
      },
      {
        id: '4.6',
        label: `Photo and Job Documentation`,
        levels: {
          '-1': `No formal documentation process. Some photos taken on personal phones and stored nowhere useful.`,
          '0': `Photos taken at key milestones and stored in a shared folder or email chain. No consistent standard for what to capture or when.`,
          '1': `Defined photo and documentation requirements at each milestone. Stored in a job file system accessible to the right people.`,
          '2': `Documentation is consistent and complete. Photos, inspection results, and field notes all captured in one place. Accessible when needed, especially when something goes wrong.`,
          '3': `Job documentation is a business asset. Complete photo and field records protect the builder, support warranty management, and demonstrate professionalism that buyers and trade partners notice.`,
        },
      },
      {
        id: '4.7',
        label: `Inspection Management`,
        levels: {
          '-1': `Inspections scheduled by phone when someone remembers. Results communicated informally. Failed inspections handled reactively.`,
          '0': `Inspection scheduling tracked loosely. Results recorded somewhere. Process is person-dependent.`,
          '1': `Inspection scheduling and results managed in a field management system. Failed inspections trigger a defined process.`,
          '2': `Inspections scheduled automatically based on the construction schedule. Results documented and filed. Patterns tracked to prevent repeat failures.`,
          '3': `Inspections pass the first time because the work is done right the first time. The process for scheduling, tracking, and learning from inspections is built into how every job is managed.`,
        },
      },
      {
        id: '4.8',
        label: `Safety and Compliance`,
        levels: {
          '-1': `Safety is informal. No program, no documentation, no accountability. Issues addressed only after an incident.`,
          '0': `Basic safety expectations communicated to trade partners. Occasional site walk. Compliance is assumed rather than verified.`,
          '1': `Formal safety program in place. Requirements documented and communicated. Site audits conducted on a defined schedule.`,
          '2': `Safety performance tracked by trade partner. Near-misses reported and reviewed. Corrective action documented and followed up.`,
          '3': `Safety is a value, not a compliance exercise. Trade partners are held to a clear standard. The job sites are safe because the culture demands it \u2014 not because someone occasionally walks through with a checklist.`,
        },
      },
    ],
  },
  {
    key: 'systems',
    name: 'Platform/Systems',
    short: 'Platform/Systems',
    iconPath: 'M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18',
    desc: `What systems and technology support the builder across sales, operations, field management, and reporting?`,
    questions: [
      {
        id: '5.11',
        label: `Buyer-Facing Technology`,
        levels: {
          '-1': `No digital buying experience and no communication system. Buyers get paper documents and phone calls from whoever thinks to reach out.`,
          '0': `A basic website and email. The buying process still needs in-person visits, and there's no central record of what was communicated to the buyer.`,
          '1': `Leads, contracts, and buyer communication run through a system. A portal or defined channel lets buyers check status and ask questions.`,
          '2': `Technology supports the buyer at every stage, from inquiry to contract to construction updates. Milestones, photos, and issue resolution are handled in one place.`,
          '3': `Technology makes buying from this builder easier than from the competition. Buyers are never left wondering, and the systems show them a professionally run operation.`,
        },
      },
      {
        id: '5.12',
        label: `Design, Plan & Selections Systems`,
        levels: {
          '-1': `Plans are drawn in a basic tool or on paper, and selections live on paper or spreadsheets. Neither connects to purchasing.`,
          '0': `Design software produces plans and a coordinator gathers selections, but the output is printed or emailed and retyped into other systems.`,
          '1': `Lot-specific plan sets are generated without starting from scratch. Selections are recorded in a system and reach purchasing reliably, with costs tracked.`,
          '2': `Plans and selections feed purchasing and production with little manual re-entry. Changes are tracked and communicated through the system.`,
          '3': `What gets designed and selected flows into what gets purchased and built, with nothing lost or retyped along the way.`,
        },
      },
      {
        id: '5.4',
        label: `Accounting System`,
        levels: {
          '-1': `Manual processes. Checks written by hand. Records forwarded to an outside bookkeeper. No job-level financial visibility.`,
          '0': `Accounting software used for basic functions. Invoices entered manually. Financial reports produced periodically but not integrated with operations.`,
          '1': `Accounting system handles payables, payroll, draws, and job costs. Integrated with purchasing at a basic level. Reports available on demand.`,
          '2': `Accounting is fully integrated with operations. Job-level cost data current and accurate. Financial reporting supports real-time management decisions.`,
          '3': `Accounting is a trusted source of truth for the business. Costs are accurate, reports are current, and the financial system supports \u2014 rather than lags behind \u2014 how the business actually operates.`,
        },
      },
      {
        id: '5.5',
        label: `Purchasing System`,
        levels: {
          '-1': `Bids collected by phone or email. Awards communicated informally. No purchase orders. No system.`,
          '0': `Spreadsheets used for purchasing. Some purchase orders produced. Process is manual and inconsistent.`,
          '1': `Purchasing system in place. Unit price catalog maintained. Purchase orders issued electronically to trade partners.`,
          '2': `Purchasing system connected to scheduling and accounting. Cost tracking current. Trade partners receive and confirm work orders through the system.`,
          '3': `Purchasing runs on a system that the whole team trusts and uses. Trade partners get clear work orders. Costs are tracked in real time. Nothing falls through the cracks.`,
        },
      },
      {
        id: '5.6',
        label: `Field Management System`,
        levels: {
          '-1': `Field runs on phone calls and paper. No formal system. Information lives with the superintendent.`,
          '0': `Basic scheduling tool or spreadsheet used. Photos stored on personal phones. Communication happens outside any system.`,
          '1': `Field management application used for scheduling, photo documentation, and trade partner communication. Updates captured in the system.`,
          '2': `Integrated field management platform. Job status visible in real time. Issues tracked and resolved through the system rather than through informal communication.`,
          '3': `The field team has the tools they need to manage their jobs without being dependent on constant communication up and down the chain. The system keeps everyone informed and the jobs moving.`,
        },
      },
      {
        id: '5.13',
        label: `Reporting, KPIs & Visibility`,
        levels: {
          '-1': `No formal reporting. The owner knows the business by feel and learns how the year went from year-end financials.`,
          '0': `Reports exist, but they're mostly data dumps: lots of numbers, little insight. Most decisions still come from experience and gut.`,
          '1': `Key company metrics (closings, margin, cycle time, customer satisfaction) are tracked and reviewed on a set schedule.`,
          '2': `Each role has one to three indicators that drive its decisions, delivered by the right tool at the right frequency. Reports answer "what should we do next," not just "what happened."`,
          '3': `Decisions across the company are driven by insight, not just gut. Systems carry the data and surface what needs attention, so leadership can hand off decisions as the company grows without losing control.`,
        },
      },
      {
        id: '5.9',
        label: `System Integration and Information Flow`,
        levels: {
          '-1': `Every system is a silo. The same information entered multiple times in multiple places. Nobody trusts the data.`,
          '0': `Some manual data transfer between systems. Key data re-entered by hand. Errors introduced at every handoff.`,
          '1': `Core systems share some data with limited manual intervention. Integration is partial but improving. Most teams work from the same version of key information.`,
          '2': `Key systems are connected. Information flows between sales, design, purchasing, field, and accounting without manual re-entry. Single source of truth for most data.`,
          '3': `The technology stack works together. Information entered once flows where it needs to go. The team spends their time running the business, not reconciling data between systems.`,
        },
      },
      {
        id: '5.10',
        label: `Platform Architecture & Scalability`,
        levels: {
          '-1': `The business runs point-to-point: spreadsheets, email, paper, and knowledge in people's heads. Nobody has asked whether it would survive more volume.`,
          '0': `Several tools are in place, added one at a time as problems came up. Nobody has mapped how they fit together or where they'll break as volume grows.`,
          '1': `Leadership knows which kind of platform it runs (point-to-point, integrated tools, or a single ERP), along with its strengths and gaps. New tools are chosen to fit that structure.`,
          '2': `The platform has been stress-tested against the volume the business plans to reach. Known breaking points have solutions chosen and scheduled before volume forces the issue.`,
          '3': `The platform is designed like a factory floor, so new capability can be added as the company grows. System changes happen on the company's timing, never in a panic because the current system is failing under volume.`,
        },
      },
    ],
  },
  {
    key: 'cost',
    name: 'Cost & Margin',
    short: 'Cost & Margin',
    iconPath: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    desc: `Do you understand and control what you pay, or do your vendors?`,
    questions: [
      {
        id: 'C.1',
        label: `Itemization & Cost Alignment`,
        levels: {
          '-1': `Most scopes are bought as one lump-sum number per trade. Nobody can say what's inside the framing or electrical price, and vendors understand the builder's costs far better than the builder does.`,
          '0': `A few categories are broken out, usually lumber or appliances, but most labor and major trades are still lump sum. Where itemization has been tried, it went too deep: the team counted small items and never controlled the cost.`,
          '1': `The largest categories are itemized by what actually drives the vendor's cost, such as square footage, tonnage, stories, fixtures, or trips. Detail stops where counting no longer changes the price. The remaining lump-sum scopes are known and on a list.`,
          '2': `Most of the house is itemized by its real cost drivers, so when a plan, elevation, or option changes, the cost changes with it automatically. The builder's cost tracks the vendor's cost closely, and the gap between them stays steady.`,
          '3': `The builder understands its costs as well as its vendors do. Every major category is itemized to the right level: no mystery, and no counting for its own sake. New itemization is validated on past jobs before converting, one category at a time. Trades keep a fair profit, and the builder stops paying for their risk.`,
        },
      },
      {
        id: 'C.2',
        label: `Quantities for Variable Scopes`,
        levels: {
          '-1': `Scopes like concrete, stone, fill, and paving are paid for by whatever the invoice says. The builder finds out what it cost after the work is done.`,
          '0': `Rough allowances are budgeted for variable scopes, but invoices are paid as billed. Overages get noticed at job close, if at all.`,
          '1': `Quantities for the main variable scopes are estimated from the plans before the work (yards of concrete, square feet of driveway, tons of stone) and priced at agreed unit rates. Invoices are compared against the estimate.`,
          '2': `Every variable scope has a takeoff quantity by plan, elevation, and lot condition. Invoices that exceed the expected quantity beyond a set tolerance are held and reviewed before payment.`,
          '3': `The builder tells the vendor what the quantity should be; the invoice is never the first time anyone sees the number. Estimated vs. billed quantities are tracked and used to sharpen takeoffs, so surprises get rarer with every home.`,
        },
      },
      {
        id: 'C.3',
        label: `Budget Accuracy & Variance Management`,
        levels: {
          '-1': `There's no real budget to measure against. Extra charges get paid when they show up, and nobody tracks why.`,
          '0': `Budgets exist, but extras and variance POs are common and approved without much question. Total variance is known, at best, at year end.`,
          '1': `Every cost outside the original purchase order requires a variance with a reason code. Variances are reported by job and category, and the big ones get discussed.`,
          '2': `Variances are reviewed regularly by category, trade, and superintendent. Repeat causes are traced back to where they started (plan, takeoff, trade, or field) and fixed there.`,
          '3': `Budgets are trusted because they're accurate. Variances are rare, small, and always explained. Every recurring variance is treated as a gap in the system and fixed at the source, so the same mistake is never paid for twice.`,
        },
      },
      {
        id: 'C.4',
        label: `Margin Visibility`,
        levels: {
          '-1': `Margin is a guess until the job closes. No one knows if a house made money until accounting closes it out months later.`,
          '0': `Margin is estimated at contract and checked at closing. In between, cost surprises are normal and show up too late to do anything about.`,
          '1': `Margin is tracked per job during construction against budget. Finance and operations use the same numbers and are starting to speak the same language.`,
          '2': `Leadership sees current margin by job, community, and plan, and knows which are slipping while there's still time to act. Cost surprises are the exception.`,
          '3': `Margin is visible every day, not just at year end. Leadership knows what each plan, option, and community really earns and uses that to set pricing, product, and where to build next.`,
        },
      },
      {
        id: 'C.5',
        label: `Value Engineering & Cost Reduction`,
        levels: {
          '-1': `Cost reduction happens when margins get squeezed, usually by beating up trades on price or cutting corners the buyer will notice.`,
          '0': `Value engineering ideas come up occasionally, often from a trade or superintendent, but there's no process to evaluate or roll them out. Savings, if any, aren't measured.`,
          '1': `The team reviews plans and specs for savings on a set schedule, mostly material swaps. Ideas are tracked and the good ones get implemented.`,
          '2': `Cost reduction works all four levers: value (smarter specs), process (fewer trips and less rework), supply chain (rebates, prompt-pay, stocking), and market (spending only on what buyers value). Each idea is judged against who the buyer is; what an entry-level buyer loves, a luxury buyer may hate.`,
          '3': `Value engineering is a habit, not a project. Waste means any cost the customer didn't value, and eliminating it is part of everyone's job, from purchasing to the field to trade partners. Savings are measured per home and multiplied across volume, and the pipeline of ideas never runs dry.`,
        },
      },
      {
        id: 'C.6',
        label: `Job Cost Review & Waste`,
        levels: {
          '-1': `Once a house closes, nobody looks back at what it cost. The next job repeats the same waste.`,
          '0': `Over-budget jobs get discussed, usually as blame, but invoices and returns aren't reviewed. Coming in under budget is assumed to mean the job went well.`,
          '1': `Completed jobs are reviewed against budget. The biggest overruns are investigated by pulling invoices and asking why.`,
          '2': `Recent jobs are reviewed on a regular schedule, including invoices, returns, and what went in the dumpster. The team knows under budget doesn't mean efficient and looks for waste even on jobs that came in on budget.`,
          '3': `Every closed job teaches something. Findings from job reviews feed straight into takeoffs, specs, schedules, and trade agreements, so waste found once is prevented from then on. The past is used to make the next house cheaper to build.`,
        },
      },
    ],
  },
]

// ---- Question set versioning ----
// v2 (2026-09): 52 items, 7 domains. Questions that changed meaning got new IDs so answers saved
// against v1 never attach to different wording. Unchanged questions kept their v1 IDs.
export const QUESTION_SET_VERSION = 2

export { DOMAINS_V1 }

const V2_IDS = new Set(DOMAINS.flatMap(d => d.questions.map(q => q.id)))
const V1_IDS = new Set(DOMAINS_V1.flatMap(d => d.questions.map(q => q.id)))
const V2_ONLY = new Set([...V2_IDS].filter(id => !V1_IDS.has(id)))
const V1_ONLY = new Set([...V1_IDS].filter(id => !V2_IDS.has(id)))

/** Which question set a saved assessment was answered against. */
export function getQuestionSetVersion(
  answers?: Record<string, unknown> | null,
  domainScores?: Record<string, unknown> | null
): 1 | 2 {
  if (domainScores && 'org' in domainScores) return 1
  const keys = Object.keys(answers || {})
  if (keys.some(k => V2_ONLY.has(k))) return 2
  if (keys.some(k => V1_ONLY.has(k))) return 1
  return 2
}

/** The domains (with questions) to use for a saved assessment. */
export function getDomainsFor(
  answers?: Record<string, unknown> | null,
  domainScores?: Record<string, unknown> | null
): Domain[] {
  return getQuestionSetVersion(answers, domainScores) === 1 ? DOMAINS_V1 : DOMAINS
}

export const TOTAL_QUESTIONS = DOMAINS.reduce((n, d) => n + d.questions.length, 0)
export const TOTAL_DOMAINS = DOMAINS.length
