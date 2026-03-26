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
    key: 'org',
    name: 'Organization Culture',
    short: 'Org Culture',
    iconPath: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    desc: 'How is the business structured, led, and operated day to day?',
    questions: [
      {
        id: '0.1',
        label: 'Executive Leadership Engagement',
        levels: {
          '-1': `Not engaged unless something goes wrong â then suddenly everyone hears about it. No visibility into day-to-day operations, no interest in process. Team learns to avoid them.`,
          '0': `Occasionally checks in but mostly hands-off. Engagement is inconsistent â shows up for a few meetings, then disappears. Team isn't sure what decisions need owner input and what doesn't.`,
          '1': `Regularly involved in key decisions and process improvement conversations. Aware of what's working and what isn't. Starting to define where they want to lead vs. where they want to delegate.`,
          '2': `Clear, consistent engagement at the right level. Sets direction, removes roadblocks, trusts the team to execute. Not in the weeds, but always accessible when it matters.`,
          '3': `Engaged at exactly the right altitude â visible enough that the team feels supported, restrained enough that they feel trusted. Defines culture, sets strategy, and then gets out of the way. Team doesn't flounder and doesn't get micromanaged.`,
        },
      },
      {
        id: '0.2',
        label: 'Home Buyer Experience',
        levels: {
          '-1': `Buyer has no visibility until they're handed keys. Updates happen when the buyer complains loudly enough. No process for communicating progress.`,
          '0': `Periodic email updates sent inconsistently. Buyer calls the superintendent when worried. Builder reacts rather than communicates.`,
          '1': `Defined communication touchpoints at key milestones. Buyer knows what to expect and who to call. Builder initiates contact proactively at phase completions.`,
          '2': `Buyer receives consistent milestone updates with photos. Rarely needs to chase the builder. Experience feels organized and professional throughout the build.`,
          '3': `Buyer feels informed and respected at every stage. Communication is proactive, timely, and matched to what they actually want to know â not a flood of updates, not radio silence.`,
        },
      },
      {
        id: '0.3',
        label: 'Systems and Technology Adoption',
        levels: {
          '-1': `Running on spreadsheets, whiteboards, and memory. No system of record. Critical information lives in one person's head or phone.`,
          '0': `A system exists but adoption is partial. Staff work around it as often as in it. Data is inconsistent and hard to trust.`,
          '1': `Core functions â purchasing, scheduling, accounting â are in a system and generally used. Some manual workarounds remain. Leadership is pushing for better discipline.`,
          '2': `Systems are consistently used across the organization. Data is reliable enough to make decisions from. The team is integrating functions that used to run independently.`,
          '3': `Technology serves the business rather than the other way around. Right tools for each function, well-adopted, and connected. Information flows without manual re-entry. Team runs on data, not instinct.`,
        },
      },
      {
        id: '0.4',
        label: 'Organizational Structure and Role Clarity',
        levels: {
          '-1': `Everyone does everything. No defined roles. Owner is involved in decisions that should be handled three levels down. Team isn't sure who owns what.`,
          '0': `Roles exist on paper but aren't enforced in practice. Decisions escalate to the top by default. Accountability is fuzzy.`,
          '1': `Clear org chart with defined responsibilities. Most decisions are made at the right level. Owner involvement is deliberate rather than reflexive.`,
          '2': `Team operates with confidence inside their lanes. Escalation happens for the right reasons, not because no one wants to decide. Owner is managing the business, not working in it.`,
          '3': `Structure scales with growth without requiring reorganization every year. Accountability is built into how the company operates. Right people, right seats, clear ownership at every level.`,
        },
      },
      {
        id: '0.5',
        label: 'Value Engineering and Cost Culture',
        levels: {
          '-1': `No formal process. Cost decisions made on gut feel or whoever pushed hardest. No review of what things actually cost vs. what was expected.`,
          '0': `Cost conversations happen reactively â usually when a job goes sideways. 'Find someone cheaper' is the primary cost strategy. No systematic tracking of where money goes.`,
          '1': `Costs are tracked at the job level. Variances are visible after the fact. Starting to ask 'why did this cost more?' and using the answer to improve future estimates.`,
          '2': `Cost culture is proactive. Trade partners and internal team regularly review materials, methods, and pricing together. Savings ideas are solicited and acted on.`,
          '3': `Value engineering is a discipline, not an event. The team continuously improves cost performance through structured reviews, trade partner collaboration, and a culture where everyone is accountable for margin.`,
        },
      },
      {
        id: '0.6',
        label: 'Cost Visibility and Margin Management',
        levels: {
          '-1': `Margin is a guess until the job closes. Cost surprises are normal. No one knows if a job is profitable until accounting closes it out months later.`,
          '0': `Job-level estimates exist but aren't tracked in real time. Significant variances are discovered late. Margin management is mostly reactive.`,
          '1': `Unit-price cost system in place. Variances tracked per job. Finance and operations are starting to speak the same language.`,
          '2': `Cost visibility exists at the job and portfolio level in near real time. Margin managed proactively â variances trigger a conversation before they become a problem.`,
          '3': `Leadership has clear, current visibility into margin across every job. Cost surprises are rare and small. The team manages the business with financial clarity, not end-of-year revelations.`,
        },
      },
      {
        id: '0.7',
        label: 'Purchasing Discipline',
        levels: {
          '-1': `Trade partners called for bids job by job. Lowest price wins. No purchase orders. Invoices arrive whenever and get paid whenever.`,
          '0': `Purchasing team collects quotes and processes invoices. No unit pricing system. Cost control is informal and relationship-dependent.`,
          '1': `Purchase orders issued against a cost catalog. Trade partners know what to expect. Variances require a formal change process. Gross margin actively monitored.`,
          '2': `Purchasing is systematic and disciplined. Unit pricing established and maintained. Purchasing team is focused on value, not just price.`,
          '3': `Purchasing operates as a strategic function â not just processing paper but actively improving cost performance, managing trade partner relationships, and finding better ways to buy without sacrificing quality.`,
        },
      },
      {
        id: '0.8',
        label: 'Trade Partner and Supplier Relationships',
        levels: {
          '-1': `Builder calls whoever is available. No preferred list, no qualification process. Relationships are purely transactional and inconsistent.`,
          '0': `Informal preferred vendor list exists. Relationships are managed by whoever knows the trade partner personally. Performance issues handled case by case with no systemic approach.`,
          '1': `Formal qualification and onboarding process in place. Scopes of work and pricing documented. Performance issues addressed through a defined process rather than avoidance.`,
          '2': `Trade partner relationships are actively managed. Performance tracked and reviewed. Top performers rewarded with volume and preferred status. Underperformers given a path to improve or are replaced.`,
          '3': `Trade partners operate as true business partners â aligned on expectations, accountable to defined standards, and invested in the builder's success. Relationship built on mutual respect and clear performance metrics, not just familiarity.`,
        },
      },
      {
        id: '0.9',
        label: 'Production and Schedule Management',
        levels: {
          '-1': `Superintendent manages by walking around and memory. No formal schedule system. Closing dates are aspirational. Delays are normalized.`,
          '0': `Static schedules provided but rarely updated. Superintendent visits every job daily to stay on top of things. Schedule management is person-dependent, not system-dependent.`,
          '1': `Schedules are system-generated and maintained. Variances are tracked. Superintendent is managing exceptions rather than babysitting every trade. Closing predictability is improving.`,
          '2': `Scheduling is a system function. Variances trigger a process, not a phone call. Superintendent focused on quality and exception management rather than coordination. Closing reliability is high.`,
          '3': `Production operates like a machine. Schedules are reliable and capacity-driven. The field team manages by exception. Closings happen when they're supposed to, and when they don't, the team knows exactly why and fixes the root cause.`,
        },
      },
    ],
  },
  {
    key: 'customer',
    name: 'Customer Experience',
    short: 'Customer Experience',
    iconPath: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    desc: 'How does the builder attract, serve, and retain home buyers throughout the process?',
    questions: [
      {
        id: '1.1',
        label: 'Customer Discovery',
        levels: {
          '-1': `Buyers show up by accident â open houses, yard signs, word of mouth. No organized lead generation. No one knows where customers came from.`,
          '0': `Some intentional marketing â home shows, walk-ins, a basic website. Leads tracked in a spreadsheet if at all. Follow-up is inconsistent.`,
          '1': `Organized marketing approach with a defined lead generation process. Leads captured in a system and followed up consistently. Builder knows where their customers are coming from.`,
          '2': `Marketing is intentional and measurable. Leads are qualified before they reach sales. Builder understands which channels produce buyers, not just inquiries.`,
          '3': `The right buyers find the builder at the right time. Marketing is targeted, cost-efficient, and continuously refined based on what actually converts to closed homes.`,
        },
      },
      {
        id: '1.2',
        label: 'Customer Decision Process',
        levels: {
          '-1': `Customer has to push hard to get information. Process is confusing and dependent on which salesperson they talk to. No consistency.`,
          '0': `Sales process exists but is inconsistent. Customer gets information reactively. Builder doesn't proactively guide the buyer toward a decision.`,
          '1': `Defined sales process with clear steps. Customer knows what comes next. Pricing for plans and lots is accessible without having to ask.`,
          '2': `Customer can move through the decision process largely on their own terms. Information is available when they need it. Sales team facilitates rather than controls.`,
          '3': `Buying a home from this builder feels easy and low-pressure. The process is clear, the information is available, and the customer feels in control from first inquiry to signed contract.`,
        },
      },
      {
        id: '1.3',
        label: 'Contract Execution',
        levels: {
          '-1': `Paper contract, wet signatures, mailed or hand-delivered. Errors common. Process takes days.`,
          '0': `Some digital documents but process still largely manual. Customer has to be present or physically return paperwork.`,
          '1': `Contracts executed digitally. Customer can sign remotely. Process is faster and more reliable than paper.`,
          '2': `Entire contract process completed online. Customer can execute at their convenience. All documents stored and accessible in one place.`,
          '3': `Contract execution is frictionless. Customer completes the process on their timeline with no need to visit an office. Builder and customer both have instant access to executed documents.`,
        },
      },
      {
        id: '1.4',
        label: 'Option and Customization Selection',
        levels: {
          '-1': `Ad hoc customization. Customer asks for changes verbally. No formal process. Promises made that purchasing and field don't know about.`,
          '0': `Standard options available but selection process is informal. Changes communicated by email or paper. No real-time visibility into cost impact.`,
          '1': `Defined option catalog with documented pricing. Customer makes selections through a structured process. Changes are captured and communicated to the right teams.`,
          '2': `Customer selects options with full visibility into cost and schedule impact. Changes flow automatically to purchasing and production. No surprises at contract signing.`,
          '3': `Option selection is a positive experience, not a source of confusion and rework. Customer gets what they chose. The builder's systems make sure of it.`,
        },
      },
      {
        id: '1.5',
        label: 'Decorating and Interior Selections',
        levels: {
          '-1': `Customer given a list of suppliers and sent off on their own. No coordination. Allowances misunderstood. Builder has no visibility into what was selected.`,
          '0': `Selections made at builder office, design center, or supplier showrooms. Collected in a spreadsheet and emailed around. Errors and miscommunications common.`,
          '1': `Structured selections process with defined choices and documented outcomes. Customer knows what's included and what costs extra. Selections recorded and communicated to purchasing.`,
          '2': `Selections are made in an organized, guided environment. Costs are clear. Selections flow directly into purchasing and production without manual re-entry.`,
          '3': `Decorating selections feel like a highlight of the buying experience, not a chore. The process is clear, the choices are well-curated, and nothing gets lost between the design center and the job site.`,
        },
      },
      {
        id: '1.6',
        label: 'Construction Communication with Buyer',
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
        label: 'Warranty and Post-Close Service',
        levels: {
          '-1': `Buyer calls when something breaks. No formal process. Response is inconsistent and depends on who answers the phone.`,
          '0': `Warranty requests collected by phone or email. Tracked in a spreadsheet. Follow-through is inconsistent.`,
          '1': `Formal warranty submission process in place. Requests tracked and assigned. Buyer knows how to submit a request and what to expect.`,
          '2': `Warranty program is proactive and well-managed. Common items addressed before they become complaints. Completion tracked and confirmed with the homeowner.`,
          '3': `Warranty experience reinforces the buyer's decision to choose this builder. Issues are handled quickly, professionally, and without the homeowner having to push. Repeat problems get fixed at the root, not patched.`,
        },
      },
      {
        id: '1.8',
        label: 'Customer Satisfaction Measurement',
        levels: {
          '-1': `Builder hears about problems through rumors or online reviews. No formal feedback process. Satisfaction is assumed unless someone complains.`,
          '0': `Survey sent after closing, if remembered. Results compiled manually and rarely acted on.`,
          '1': `Formal satisfaction survey at defined points in the process. Results tracked over time. Leadership reviews them.`,
          '2': `Satisfaction data is collected consistently, reviewed regularly, and tied to operational improvement. Teams are held accountable for their scores.`,
          '3': `The builder knows exactly how buyers feel at every stage and uses that information to get better. Satisfaction scores are a management tool, not a report card filed away after the fact.`,
        },
      },
      {
        id: '1.9',
        label: 'Online Reviews and Reputation Management',
        levels: {
          '-1': `No formal process. Builder stumbles across negative reviews occasionally. No strategy for soliciting positive ones.`,
          '0': `Someone monitors reviews occasionally. Responses are sporadic and inconsistent. No proactive effort to generate reviews.`,
          '1': `Formal process to ask satisfied buyers for reviews at the right time. All reviews monitored and responded to consistently.`,
          '2': `Review generation is built into the closing and warranty process. Scores tracked across platforms. Patterns identified and acted on.`,
          '3': `Online reputation is a reflection of an operation that actually earns good reviews. The process for generating and responding to reviews is systematic, not an afterthought.`,
        },
      },
      {
        id: '1.10',
        label: 'Referral Program',
        levels: {
          '-1': `No referral program. Referrals happen by chance and are rarely acknowledged in any organized way.`,
          '0': `Referral fees paid informally when someone remembers to. No tracking, no consistency.`,
          '1': `Documented referral program with defined incentives. Referrals tracked and rewards fulfilled reliably.`,
          '2': `Referral program is actively promoted and integrated into the buyer experience. Referral sources tracked and nurtured.`,
          '3': `Referrals are a meaningful and reliable source of new buyers. The program is simple, generous, and consistently executed. Satisfied buyers become advocates because the process makes it easy.`,
        },
      },
      {
        id: '1.11',
        label: 'Model Home and Sales Environment',
        levels: {
          '-1': `Model home is the only selling tool. No digital component. Buyer has to be physically present to understand what they're buying.`,
          '0': `Model home with some printed materials and a basic website. Digital presence is minimal and not integrated with the sales process.`,
          '1': `Model home supplemented by quality renderings, virtual tours, and online plan information. Buyer can do meaningful research before visiting.`,
          '2': `Sales environment â physical and digital â works together. Buyer can explore, compare, and get pricing without needing a salesperson's help for every question.`,
          '3': `The sales experience â whether in person or online â makes the builder's homes easy to understand and easy to fall in love with. It earns confidence before the buyer ever meets a salesperson.`,
        },
      },
    ],
  },
  {
    key: 'trade',
    name: 'Trade Partners',
    short: 'Trade Partners',
    iconPath: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0',
    desc: 'How does the builder find, manage, and retain trade partners and suppliers?',
    questions: [
      {
        id: '2.1',
        label: 'Trade Partner Discovery',
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
        label: 'Trade Partner Qualification',
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
        label: 'Trade Partner Onboarding',
        levels: {
          '-1': `New trade partner handed a set of plans and pointed to a job site. No formal orientation.`,
          '0': `Basic information shared â plans, pay schedule, insurance requirements. Setup in accounting. No structured introduction to how the builder operates.`,
          '1': `Structured onboarding process. Scope of work documented, pricing established, scheduling expectations communicated, on-site rules explained.`,
          '2': `Trade partners understand exactly what is expected of them before they set foot on a job site. Onboarding is consistent regardless of who handles it.`,
          '3': `Onboarding sets trade partners up to succeed. They arrive knowing the builder's standards, processes, and expectations â and they're held to them from day one.`,
        },
      },
      {
        id: '2.4',
        label: 'Pricing and Contract Management',
        levels: {
          '-1': `Price negotiated verbally on the spot. Whatever the trade partner says becomes the budget. No purchase orders, no documentation.`,
          '0': `Job-specific pricing collected per project. Pricing varies widely with no catalog or baseline. Changes handled informally.`,
          '1': `Unit price catalog in place. Trade partners know the pricing structure. Changes go through a formal process before work begins.`,
          '2': `Pricing is consistent, documented, and managed. Variances are tracked and addressed. Trade partners understand the process and follow it.`,
          '3': `Pricing is fair, clear, and consistently applied. Trade partners know what to expect and respect the process. Cost management is a strength, not a source of conflict.`,
        },
      },
      {
        id: '2.5',
        label: 'Trade Partner Collaboration and Improvement',
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
        label: 'Scheduling and Capacity Management',
        levels: {
          '-1': `Builder calls each trade partner the day before to see if they can make it. No formal scheduling. Delays are routine.`,
          '0': `Schedule distributed but rarely followed. Trade partners confirm verbally. Conflicts discovered on the job site.`,
          '1': `System-generated schedules shared in advance. Trade partners confirm electronically. Most scheduling conflicts caught before they become problems.`,
          '2': `Trade partners have clear visibility into their upcoming schedule. Capacity constraints identified and resolved before they affect production.`,
          '3': `The schedule is a reliable operating tool, not a wish list. Trade partners plan around it. Surprises are rare and when they happen, the system catches them fast.`,
        },
      },
      {
        id: '2.7',
        label: 'Trade Partner Performance Management',
        levels: {
          '-1': `No formal measurement. Builder keeps mental notes about who is good and who isn't. Problems tolerated until they become crises.`,
          '0': `Problem trade partners are quietly dropped. No formal feedback, no corrective process, no documentation.`,
          '1': `Performance tracked on quality, schedule, and cost. Underperformance addressed in a documented conversation. Clear expectations set going forward.`,
          '2': `Performance reviewed regularly. Top performers recognized and given more work. Underperformers go through a formal corrective process before being removed.`,
          '3': `Trade partners know exactly how they're performing and what is expected. The system rewards excellence and addresses problems early â before they end up in a home that a buyer will live in for 30 years.`,
        },
      },
      {
        id: '2.8',
        label: 'Trade Partner Communication During Construction',
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
        label: 'Material and Supplier Management',
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
        label: 'Trade Partner Payment Process',
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
        label: 'Warranty Work by Trade Partners',
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
        label: 'Trade Partner Retention and Relationship Health',
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
    desc: 'How do internal teams â design, sales, accounting, and purchasing â perform and collaborate?',
    questions: [
      {
        id: '3.1',
        label: 'Design and Plan Management',
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
        label: 'Sales Team Structure and Effectiveness',
        levels: {
          '-1': `Sales handled by whoever is available â owner, superintendent, a part-time agent. No defined sales process or accountability.`,
          '0': `Dedicated sales staff in model homes. Results are relationship-dependent. No consistent process, no performance management.`,
          '1': `Sales team follows a defined process. Performance tracked. Customer handoff from sales to production is documented and reliable.`,
          '2': `Sales team is professional, accountable, and well-integrated with the rest of the operation. They know what they can promise and what they can't.`,
          '3': `Sales team is a competitive advantage. They close the right buyers, set accurate expectations, and hand off customers to production in a way that sets everyone up for success.`,
        },
      },
      {
        id: '3.3',
        label: 'Accounting and Financial Management',
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
        label: 'Purchasing Team Structure and Effectiveness',
        levels: {
          '-1': `Purchasing is whoever makes the calls. No defined process, no accountability, no cost system.`,
          '0': `Purchasing team exists but operates reactively â collecting bids, processing invoices, putting out fires. No unit pricing, no systematic cost management.`,
          '1': `Purchasing manages a cost catalog, issues purchase orders, and monitors gross margin. Trade partners know the process and follow it.`,
          '2': `Purchasing is proactive. Cost performance actively managed. Trade partner pricing reviewed and updated regularly. Team focused on value, not just price.`,
          '3': `Purchasing is a profit center, not just a processing function. The team continuously improves cost performance, strengthens trade partner relationships, and protects margin at every job.`,
        },
      },
    ],
  },
  {
    key: 'builder_rep',
    name: 'Field Management',
    short: 'Field Management',
    iconPath: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    desc: 'How does the field superintendent manage the construction process and the buyer experience on site?',
    questions: [
      {
        id: '4.1',
        label: 'Involvement in the Sales Process',
        levels: {
          '-1': `Sales makes promises. Field finds out at the pre-construction meeting â or on the job site.`,
          '0': `Superintendent occasionally consulted on whether a customization is feasible. No formal involvement.`,
          '1': `Customization requests and commitments routed through a defined process that includes field review before promises are made to the buyer.`,
          '2': `Field team has clear visibility into what was sold and committed. Handoff from sales to production is documented and reliable. No surprises.`,
          '3': `Sales and field operate as one team on behalf of the buyer. What gets sold is what gets built. Handoffs are clean, documentation is complete, and the buyer's experience is consistent from contract to keys.`,
        },
      },
      {
        id: '4.2',
        label: 'Schedule Management',
        levels: {
          '-1': `Superintendent gets a closing date and figures out the rest. No formal schedule. Sequencing managed by memory and experience.`,
          '0': `A schedule is provided but not actively managed. Superintendent visits each job daily to keep things moving. Schedule is more of a reference than a tool.`,
          '1': `System-generated schedule actively used. Variances tracked. Superintendent focused on exceptions, not on confirming that trades showed up.`,
          '2': `Schedule is reliable and current. Superintendent manages by exception. Trade partners know what's expected and when. Closing dates are commitments, not estimates.`,
          '3': `The schedule runs the job. Superintendent manages outcomes, not activity. Closings happen on time because the system is built to make that the default, not the exception.`,
        },
      },
      {
        id: '4.3',
        label: 'Pre-Construction Process',
        levels: {
          '-1': `Superintendent handed plans and a list of trade partners. No formal pre-construction meeting or process.`,
          '0': `Basic pre-construction review. Superintendent may meet with the buyer on site. Communication is informal and inconsistent.`,
          '1': `Defined pre-construction process. Buyer orientation completed before ground breaks. Superintendent prepared with complete job information before the first trade partner arrives.`,
          '2': `Pre-construction is organized, documented, and consistent regardless of which superintendent runs the job. Buyer and field team are aligned before work begins.`,
          '3': `Pre-construction sets every job up to succeed. The buyer knows what to expect. The superintendent has everything they need. The first day of construction is the smoothest day on the job.`,
        },
      },
      {
        id: '4.4',
        label: 'During Construction Management',
        levels: {
          '-1': `Superintendent manages reactively â responding to problems as they arise. Jobs run on tribal knowledge and constant presence.`,
          '0': `Superintendent visits every job site daily. Manages by walking around and making calls. System plays little role in day-to-day management.`,
          '1': `Superintendent manages by exception. System handles routine scheduling and communication. Field time focused on quality and problem resolution.`,
          '2': `Superintendent is a manager, not a babysitter. Trade partners execute reliably. Issues are caught early and resolved through a defined process.`,
          '3': `Superintendent manages a portfolio of homes with confidence because the system supports them. Their value is in judgment and leadership, not in being physically present at every job site every day.`,
        },
      },
      {
        id: '4.5',
        label: 'Closing and Homeowner Orientation',
        levels: {
          '-1': `Keys handed over with a handshake. No formal orientation. Homeowner left to figure out systems on their own.`,
          '0': `Closing walkthrough completed. Punchlist items noted. Homeowner gets a folder of manuals.`,
          '1': `Structured home orientation completed before closing. Punchlist items tracked and resolved. Homeowner knows who to call for warranty.`,
          '2': `Zero-defect standard pursued before closing. Orientation is thorough and consistent. Homeowner leaves feeling confident about their new home and about the builder.`,
          '3': `Closing is one of the best moments in the buyer's experience. The home is ready, the orientation is thorough, and the buyer feels taken care of â not relieved that it's finally over.`,
        },
      },
      {
        id: '4.6',
        label: 'Photo and Job Documentation',
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
        label: 'Inspection Management',
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
        label: 'Safety and Compliance',
        levels: {
          '-1': `Safety is informal. No program, no documentation, no accountability. Issues addressed only after an incident.`,
          '0': `Basic safety expectations communicated to trade partners. Occasional site walk. Compliance is assumed rather than verified.`,
          '1': `Formal safety program in place. Requirements documented and communicated. Site audits conducted on a defined schedule.`,
          '2': `Safety performance tracked by trade partner. Near-misses reported and reviewed. Corrective action documented and followed up.`,
          '3': `Safety is a value, not a compliance exercise. Trade partners are held to a clear standard. The job sites are safe because the culture demands it â not because someone occasionally walks through with a checklist.`,
        },
      },
    ],
  },
  {
    key: 'systems',
    name: 'Platform/Systems',
    short: 'Platform/Systems',
    iconPath: 'M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18',
    desc: 'What systems and technology support the builder across sales, operations, field management, and reporting?',
    questions: [
      {
        id: '5.1',
        label: 'Customer-Facing Technology',
        levels: {
          '-1': `Paper-based or no system. Buyer gets a printed contract and a handshake. No digital component to the buying experience.`,
          '0': `Basic website exists. Some information available online but buying process still requires in-person visits and manual paperwork.`,
          '1': `Core buying process supported by technology â leads captured in a system, contracts executed digitally, buyer communication tracked.`,
          '2': `Buyer experience is well-supported by technology at each stage â from inquiry to contract to construction updates. Systems work together rather than in silos.`,
          '3': `Technology makes buying a home from this builder easier than the competition. The buyer never feels like they're fighting the process â the process works for them.`,
        },
      },
      {
        id: '5.2',
        label: 'Design and Plan Systems',
        levels: {
          '-1': `Plans produced in a basic drawing tool or on paper. No digital connection between design and the rest of the business.`,
          '0': `Design software used to produce plans, but output is printed and distributed manually. No integration with purchasing or field.`,
          '1': `Plans produced in a system that supports the construction process. Lot-specific plan sets generated without starting from scratch each time.`,
          '2': `Design output feeds into purchasing and production with limited manual re-entry. Changes tracked and communicated systematically.`,
          '3': `Design is a connected function. What gets designed flows into what gets purchased and built, without information being lost or re-entered along the way.`,
        },
      },
      {
        id: '5.3',
        label: 'Interior Selections and Design Center Systems',
        levels: {
          '-1': `Selections collected on paper or in a spreadsheet. No connection to purchasing. Errors and missed items common.`,
          '0': `Selections process is manual but organized. Buyer meets with a selections coordinator. Results emailed to purchasing with room for error.`,
          '1': `Structured selections system in place. Buyer choices documented and communicated to purchasing reliably. Cost of selections tracked.`,
          '2': `Selections process is smooth and connected. Buyer choices flow directly into purchasing and construction systems without manual re-entry.`,
          '3': `Selections are a highlight of the buying experience. The process is clear, the choices well-curated, and what the buyer picks is exactly what gets installed â every time.`,
        },
      },
      {
        id: '5.4',
        label: 'Accounting System',
        levels: {
          '-1': `Manual processes. Checks written by hand. Records forwarded to an outside bookkeeper. No job-level financial visibility.`,
          '0': `Accounting software used for basic functions. Invoices entered manually. Financial reports produced periodically but not integrated with operations.`,
          '1': `Accounting system handles payables, payroll, draws, and job costs. Integrated with purchasing at a basic level. Reports available on demand.`,
          '2': `Accounting is fully integrated with operations. Job-level cost data current and accurate. Financial reporting supports real-time management decisions.`,
          '3': `Accounting is a trusted source of truth for the business. Costs are accurate, reports are current, and the financial system supports â rather than lags behind â how the business actually operates.`,
        },
      },
      {
        id: '5.5',
        label: 'Purchasing System',
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
        label: 'Field Management System',
        levels: {
          '-1': `Field runs on phone calls and paper. No formal system. Information lives with the superintendent.`,
          '0': `Basic scheduling tool or spreadsheet used. Photos stored on personal phones. Communication happens outside any system.`,
          '1': `Field management application used for scheduling, photo documentation, and trade partner communication. Updates captured in the system.`,
          '2': `Integrated field management platform. Job status visible in real time. Issues tracked and resolved through the system rather than through informal communication.`,
          '3': `The field team has the tools they need to manage their jobs without being dependent on constant communication up and down the chain. The system keeps everyone informed and the jobs moving.`,
        },
      },
      {
        id: '5.7',
        label: 'Buyer Communication System',
        levels: {
          '-1': `No system. Phone calls and emails from whoever thinks to reach out. Buyer communication is ad hoc and inconsistent.`,
          '0': `Builder website and email used for communication. No central log of what was communicated or when.`,
          '1': `Customer portal or defined communication process in place. Buyer can check status and submit questions through a defined channel.`,
          '2': `Real-time buyer communication supported by a system. Milestone updates, photo sharing, and issue resolution all handled through one platform.`,
          '3': `Buyers are never left wondering. The communication system keeps them informed at every stage and gives them confidence that the builder is running a professional operation â because they are.`,
        },
      },
      {
        id: '5.8',
        label: 'Business Reporting and Decision Support',
        levels: {
          '-1': `No formal reporting. Owner knows the business anecdotally. Decisions made on gut feel and end-of-year financials.`,
          '0': `Basic financial reports available from the accounting system. Key metrics tracked manually if at all.`,
          '1': `Regular operational reporting in place. Key metrics â closings, margins, cycle times, customer satisfaction â tracked and reviewed.`,
          '2': `Leadership has access to current, reliable data across the business. Variances identified and acted on before they become problems.`,
          '3': `The business is managed with data. Leadership knows where the business stands, where it's headed, and what needs attention â not because they dug through spreadsheets, but because the systems make it visible.`,
        },
      },
      {
        id: '5.9',
        label: 'System Integration and Information Flow',
        levels: {
          '-1': `Every system is a silo. The same information entered multiple times in multiple places. Nobody trusts the data.`,
          '0': `Some manual data transfer between systems. Key data re-entered by hand. Errors introduced at every handoff.`,
          '1': `Core systems share some data with limited manual intervention. Integration is partial but improving. Most teams work from the same version of key information.`,
          '2': `Key systems are connected. Information flows between sales, design, purchasing, field, and accounting without manual re-entry. Single source of truth for most data.`,
          '3': `The technology stack works together. Information entered once flows where it needs to go. The team spends their time running the business, not reconciling data between systems.`,
        },
      },
    ],
  },
]
