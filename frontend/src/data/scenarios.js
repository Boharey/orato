export const SCENARIOS = [
  // ── Interview ──────────────────────────────────────────────────────────────
  {
    id: 'behavioral-leadership',
    title: 'Behavioral Interview: Leadership Under Pressure',
    difficulty: 'Intermediate',
    duration: '2 min',
    description: 'Answer a leadership question using a clear STAR structure.',
    category: 'Interview',
    accent: '#2E4F4F',
    theory: 'Employers use behavioral questions to see how you\'ve handled real situations. The STAR method (Situation, Task, Action, Result) keeps your answer structured and impactful.',
    approach: [
      'Situation: Briefly set the context (single sentence).',
      'Task: Explain what you needed to accomplish.',
      'Action: Describe the specific steps you took (most important part).',
      'Result: Highlight the positive outcome, using numbers if possible.',
    ],
    guidance: [
      'Spend 60% of your time on the Action part.',
      'Use "I" not "we" to take ownership.',
      'Keep the entire answer under 2 minutes.',
      'Practice until it feels natural, not rehearsed.',
    ],
    script: `"About a year ago, our largest client was seriously considering ending their contract because we had missed multiple delivery deadlines in a row. Morale inside the team was low, and communication between departments had almost completely broken down.

I volunteered to coordinate a small cross-functional task force to stabilize the situation. My first step was understanding where delays were actually happening instead of making assumptions. I spent two days mapping the workflow from design all the way to deployment, and discovered that most delays came from unclear task ownership and late QA feedback.

After identifying the bottlenecks, I introduced a shared tracking dashboard, shorter review cycles, and a daily 10-minute stand-up focused only on blockers and priorities. I also worked directly with stakeholders to reset expectations and improve transparency.

Within six weeks, on-time delivery improved from 72% to 95%, support escalations dropped significantly, and the client not only renewed their contract but expanded the partnership for another year.

That experience taught me something important — leadership during pressure is less about controlling people and more about creating clarity, accountability, and momentum when uncertainty is high."`,
  },
  {
    id: 'technical-explain-project',
    title: 'Technical Interview: Explain Your Project',
    difficulty: 'Intermediate',
    duration: '2 min',
    description: 'Present a technical project clearly without overwhelming the interviewer.',
    category: 'Interview',
    accent: '#FF6B35',
    theory: 'When explaining a project, start with the problem and your role. Avoid deep technical jargon unless asked — focus on impact.',
    approach: [
      'Problem: What was the challenge?',
      'Your Role: What were you specifically responsible for?',
      'Solution: High-level overview of your technical approach.',
      'Result: Quantifiable outcome or lesson learned.',
    ],
    guidance: [
      'Use analogies to explain complex concepts.',
      'Be ready to dive deeper if the interviewer asks.',
      'Avoid acronyms unless you explain them first.',
      'End with what you learned or would do differently.',
    ],
    script: `"I was the backend lead for a mobile app serving 200,000 users. The main pain point was slow image uploads — sometimes up to 12 seconds. Users were abandoning the flow mid-upload, which directly hurt retention.

I redesigned the pipeline to use chunked uploads with parallel processing and added a CDN layer for caching frequently accessed assets. I also introduced client-side compression before the upload even started.

The result was under 2-second uploads on average, and we saw a 40% drop in support tickets related to uploads within the first month.

It taught me the importance of measuring user-perceived performance, not just raw backend metrics. The backend was technically fast — the bottleneck was in the client-side experience."`,
  },
  {
    id: 'strength-question',
    title: 'Interview: "What is your greatest strength?"',
    difficulty: 'Beginner',
    duration: '1 min',
    description: 'Answer confidently without sounding arrogant.',
    category: 'Interview',
    accent: '#2E4F4F',
    theory: 'Choose a strength that\'s relevant to the role and back it up with a concrete example. Avoid generic answers like "I\'m a hard worker."',
    approach: [
      'State the strength clearly.',
      'Give a specific example of when you demonstrated it.',
      'Explain how it will help you succeed in the role.',
    ],
    guidance: [
      'Pick a strength that matches the job description.',
      'Use a recent professional example.',
      'Keep it concise — 1 minute max.',
      'Show enthusiasm but don\'t boast.',
    ],
    script: `"My greatest strength is turning ambiguous problems into structured plans.

For example, when our team faced a vague 'improve user engagement' goal, I initiated a data-driven audit that identified our onboarding drop-off as the key issue. I then led the redesign of the first-time user flow, which increased week-1 retention by 28%.

I'd apply that same analytical and execution-oriented mindset to drive results in this role."`,
  },
  {
    id: 'weakness-question',
    title: 'Interview: "What is your biggest weakness?"',
    difficulty: 'Intermediate',
    duration: '1 min',
    description: 'Show self-awareness and growth instead of self-destruction.',
    category: 'Interview',
    accent: '#FF6B35',
    theory: 'Be honest but strategic — pick a real (non-critical) weakness and show you\'re actively improving it. Never say "I work too hard."',
    approach: [
      'State the weakness honestly.',
      'Explain the steps you\'ve taken to improve.',
      'Share the positive outcome or progress.',
    ],
    guidance: [
      'Avoid weaknesses that are essential to the job.',
      'Show measurable improvement.',
      'Keep it forward-looking and positive.',
      'Practice so you don\'t ramble.',
    ],
    script: `"I used to struggle with delegating tasks because I wanted everything to meet my own standard of quality. I noticed that was creating a bottleneck — my team was waiting on me, and I was burning out.

So I took a project management course and started using a shared task board with clearly defined ownership and acceptance criteria. Over the last quarter, our team's throughput increased by 30%, and I've become much better at trusting my team and focusing on high-impact work rather than getting pulled into execution details."`,
  },
  {
    id: 'salary-negotiation',
    title: 'Interview: Salary Negotiation',
    difficulty: 'Advanced',
    duration: '2 min',
    description: 'Confidently negotiate your compensation without damaging rapport.',
    category: 'Interview',
    accent: '#2E4F4F',
    theory: 'Salary negotiation is expected. Employers often make an initial offer with room to negotiate. Knowing your market value and articulating it calmly is key.',
    approach: [
      'Acknowledge the offer positively before negotiating.',
      'State your target range based on market research.',
      'Justify with your experience, skills, or competing offers.',
      'Invite a collaborative solution — don\'t issue ultimatums.',
    ],
    guidance: [
      'Research market rates on Glassdoor, LinkedIn, and Levels.fyi.',
      'Always give a range with your target at the lower end.',
      'Silence after stating your number is powerful — don\'t fill it.',
      'Consider total comp: equity, bonus, benefits.',
    ],
    script: `"Thank you so much for the offer — I'm genuinely excited about the role and the team.

Based on my research into market rates for this level and location, and given my background in leading cross-functional projects at scale, I was expecting something in the range of 95 to 110 thousand. Is there flexibility to move closer to that range?

I'm very motivated to make this work and I'm confident I'll add significant value quickly. I just want to make sure we start on a foundation that reflects that."`,
  },
  {
    id: 'why-this-company',
    title: 'Interview: "Why do you want to work here?"',
    difficulty: 'Beginner',
    duration: '1 min',
    description: 'Show genuine research and enthusiasm for the role and company.',
    category: 'Interview',
    accent: '#FF6B35',
    theory: 'Interviewers want to see genuine interest, not flattery. Specific research about the company, team, or product shows you\'re serious.',
    approach: [
      'Reference something specific you researched about the company.',
      'Connect it to your personal values or career direction.',
      'Mention how this role fits your growth trajectory.',
    ],
    guidance: [
      'Never say "because it\'s a great company" — be specific.',
      'Read recent news, blog posts, or product announcements.',
      'Connect the company\'s mission to something you genuinely care about.',
      'Keep it under 90 seconds.',
    ],
    script: `"What drew me here is the way your engineering team has approached reliability at scale — specifically the incident retrospectives you publish publicly. That level of transparency about failures is rare and signals a culture where learning is prioritised over blame.

On the product side, I've been using the platform for two years and the recent shift toward developer-first tooling aligns closely with what I want to build next.

I want to be somewhere I can grow technically while contributing to a product I genuinely believe in — and this role checks both."`,
  },
  {
    id: 'tell-me-about-yourself',
    title: 'Interview: "Tell me about yourself"',
    difficulty: 'Beginner',
    duration: '2 min',
    description: 'Craft a compelling 90-second professional narrative.',
    category: 'Interview',
    accent: '#2E4F4F',
    theory: 'This is your 90-second pitch. Think of it as: past (where you came from), present (what you do now), future (why you\'re here). Keep it professional and relevant.',
    approach: [
      'Past: Brief background relevant to the role.',
      'Present: Your current role and key responsibilities.',
      'Future: Why you\'re excited about this opportunity.',
    ],
    guidance: [
      'Don\'t recite your CV — synthesise it.',
      'End by connecting your background to why you applied.',
      'Practice until it flows naturally in under 90 seconds.',
      'Match your energy to the role — calm for finance, energetic for startups.',
    ],
    script: `"I started my career as a software engineer, which gave me a strong foundation in how products are built. After three years, I moved into product management because I was more interested in the why behind features than the how.

Over the last four years I've led cross-functional teams at a B2B SaaS company, shipping products used by over 50,000 businesses globally. Most recently I led the launch of our analytics suite, which became our fastest-growing product segment within 18 months.

I'm looking for a role where I can operate with more ownership and help shape the product direction from a earlier stage — which is exactly what drew me to this opportunity."`,
  },
  {
    id: 'conflict-at-work',
    title: 'Interview: Handling Conflict at Work',
    difficulty: 'Intermediate',
    duration: '2 min',
    description: 'Demonstrate emotional intelligence and problem-solving skills.',
    category: 'Interview',
    accent: '#FF6B35',
    theory: 'Conflict questions assess emotional intelligence and professionalism. Interviewers want to see that you can navigate disagreement without damaging relationships.',
    approach: [
      'Describe the conflict briefly and neutrally — no blame.',
      'Explain how you addressed it directly and calmly.',
      'Share the resolution and what you learned.',
    ],
    guidance: [
      'Never badmouth the other person.',
      'Focus on the process, not the drama.',
      'Show that you initiated resolution — don\'t wait for someone else.',
      'End with a positive outcome or lesson.',
    ],
    script: `"I once had a significant disagreement with a colleague on the design team over the scope of a new feature. They felt we were shipping something incomplete; I felt delaying would cost us a critical market window.

Rather than escalating, I asked if we could block an hour to align on the user outcomes we were both trying to achieve. Once we agreed on what success looked like, we found a middle ground — a phased rollout that let us ship to early adopters while continuing to build out the full experience.

The feature launched on time, received strong early feedback, and the colleague and I actually became much closer collaborators after that. The disagreement forced us to get clearer on shared goals."`,
  },
  // ── Presentation ───────────────────────────────────────────────────────────
  {
    id: 'college-presentation-opening',
    title: 'College Presentation: Confident Opening',
    difficulty: 'Beginner',
    duration: '1 min',
    description: 'Start an academic presentation with authority and clarity.',
    category: 'Presentation',
    accent: '#FF6B35',
    theory: 'A strong academic opening grabs attention, states your thesis, and outlines your talk. It sets you up as credible and prepared.',
    approach: [
      'Start with a hook: a surprising fact, question, or quote.',
      'State your main argument or thesis.',
      'Preview your key points.',
      'Transition smoothly into the first section.',
    ],
    guidance: [
      'Memorize the first two sentences to start strong.',
      'Use a conversational tone — avoid reading.',
      'Stand still and make eye contact with the audience.',
      'Smile — it relaxes both you and the audience.',
    ],
    script: `"Did you know that over 60% of college students report high levels of anxiety? Today, I'll argue that mindfulness practices can significantly reduce stress and improve academic performance.

I'll cover the neuroscience of stress, results from a campus study conducted last year, and three simple exercises you can start using today.

Let's begin with what happens inside your brain under pressure."`,
  },
  {
    id: 'college-presentation-conclusion',
    title: 'College Presentation: Strong Conclusion',
    difficulty: 'Beginner',
    duration: '1 min',
    description: 'End your presentation memorably and invite questions with confidence.',
    category: 'Presentation',
    accent: '#2E4F4F',
    theory: 'The conclusion is your last impression. Summarise clearly, restate your thesis, and end with a call to action or thought-provoking statement.',
    approach: [
      'Signal the conclusion clearly — don\'t trail off.',
      'Summarise your key points in 2–3 sentences.',
      'Restate your thesis in light of your evidence.',
      'End with a memorable closing line and invite questions.',
    ],
    guidance: [
      'Never introduce new information in the conclusion.',
      'Slow down — this is your most important moment.',
      'Make eye contact as you deliver the final line.',
      'Pause before asking for questions — let it land.',
    ],
    script: `"To summarise — we've seen that mindfulness reduces cortisol levels, improves focus, and has measurable academic benefits even when practised for as little as 10 minutes a day.

The evidence from our campus study supports what neuroscience has been telling us for years: managing stress isn't a soft skill, it's a performance strategy.

So the question isn't whether mindfulness works. The question is whether you're willing to give it five minutes to find out.

I'm happy to take any questions."`,
  },
  {
    id: 'product-demo',
    title: 'Product Demo to Stakeholders',
    difficulty: 'Intermediate',
    duration: '3 min',
    description: 'Walk executives through a product demo without losing them in details.',
    category: 'Presentation',
    accent: '#FF6B35',
    theory: 'A product demo to non-technical stakeholders must lead with business value, not features. Show the problem first — then show the solution.',
    approach: [
      'Open with the problem the product solves.',
      'Walk through the user journey, not the feature list.',
      'Highlight the business impact at each step.',
      'Close with next steps and a clear ask.',
    ],
    guidance: [
      'Never click through every feature — curate what you show.',
      'Speak to the outcome, not the button.',
      'Anticipate "what\'s the ROI?" and answer it proactively.',
      'Leave 30% of your time for questions.',
    ],
    script: `"Before I show you anything on screen, let me show you the problem we're solving.

Right now, your sales team spends an average of 4 hours a week updating CRM records manually. That's 200 hours a month across the team — time that should be in front of customers.

What you're about to see is how the new automation layer eliminates that entirely.

[Demo] — Notice how the record updates in real time as the call happens. No manual entry, no lag, no errors.

For a team of 50 reps, this recovers roughly 10,000 hours a year. At your average quota, that's equivalent to hiring four additional salespeople — without the headcount.

We'd like to run a 30-day pilot with your team. I've outlined what that looks like on the last slide. Can we align on a start date today?"`,
  },
  {
    id: 'data-presentation',
    title: 'Presenting Data & Findings',
    difficulty: 'Intermediate',
    duration: '2 min',
    description: 'Turn complex data into a clear, compelling story for any audience.',
    category: 'Presentation',
    accent: '#2E4F4F',
    theory: 'Data doesn\'t speak for itself — you do. Your job is to translate numbers into a narrative that tells the audience what to think and what to do next.',
    approach: [
      'Lead with the insight, not the methodology.',
      'Use one chart per point — don\'t overload slides.',
      'Explain what the trend means, not just what it shows.',
      'End with a clear recommendation.',
    ],
    guidance: [
      'Say the headline of each chart out loud before explaining it.',
      'Avoid reading numbers — round and interpret instead.',
      'Anticipate "so what?" for every data point.',
      'Use contrast to highlight what matters most.',
    ],
    script: `"The headline from this data is straightforward: user retention dropped 18% in Q3, and we can pinpoint exactly why.

When you look at where users dropped off — and this is the important part — 70% of churn happened within the first three days. This isn't a product quality problem. It's an onboarding problem.

The second chart confirms this. Users who completed our setup checklist had a 90-day retention rate of 74%. Users who didn't had a 31% retention rate. Same product — entirely different outcomes based on a single onboarding behaviour.

My recommendation is we make checklist completion the top priority for Q4. Based on current conversion, improving completion from 40% to 70% would recover approximately 12 percentage points of retention. That's the highest-leverage change we can make."`,
  },
  // ── Group Discussion ───────────────────────────────────────────────────────
  {
    id: 'group-discussion-opening',
    title: 'Group Discussion: Strong Opening Statement',
    difficulty: 'Advanced',
    duration: '1 min',
    description: 'Start a discussion confidently and establish leadership presence.',
    category: 'Group Discussion',
    accent: '#2E4F4F',
    theory: 'In group discussions, the first 30 seconds can set the tone and establish your presence. A strong opening states your position clearly and invites collaboration.',
    approach: [
      'Acknowledge the topic or prompt.',
      'State your viewpoint concisely.',
      'Provide one key reason or example.',
      'End with an open-ended question to involve others.',
    ],
    guidance: [
      'Speak at a measured pace — not too fast.',
      'Maintain eye contact with the group.',
      'Use a confident but friendly tone.',
      'Avoid dominating — your goal is to spark discussion.',
    ],
    script: `"On the topic of remote work, I believe a hybrid model offers the best of both worlds. It preserves flexibility and autonomy while in-person collaboration strengthens team bonds and speeds up complex decision-making.

Companies like Shopify and Atlassian have published data showing hybrid teams outperform both fully remote and fully in-office setups on long-term project delivery.

I'm curious — what has your experience been with fully remote versus hybrid, particularly on team alignment?"`,
  },
  {
    id: 'group-discussion-disagreement',
    title: 'Group Discussion: Polite Disagreement',
    difficulty: 'Advanced',
    duration: '1 min',
    description: 'Push back on a viewpoint diplomatically while keeping the group onside.',
    category: 'Group Discussion',
    accent: '#FF6B35',
    theory: 'Disagreeing well is a leadership skill. The goal is to challenge the idea, not the person — and to do it in a way that advances the discussion rather than shutting it down.',
    approach: [
      'Acknowledge what\'s valid in the other person\'s point.',
      'Signal your disagreement clearly but without aggression.',
      'Offer your alternative view with evidence.',
      'Invite others to weigh in.',
    ],
    guidance: [
      'Use "I see it differently" rather than "You\'re wrong."',
      'Don\'t interrupt — wait for a natural pause.',
      'Keep your tone even — emotion undermines credibility.',
      'Back your position with data or a concrete example.',
    ],
    script: `"That's a fair point, and I think the concern about implementation cost is valid. Where I see it differently is on the timeline.

If we wait until the system is fully optimised before launching, we risk losing the window entirely — and the data from similar launches suggests that early feedback from a limited rollout actually accelerates optimisation faster than internal testing alone.

I'd advocate for a phased approach: launch with 20% of users, monitor closely, then scale. Does anyone see a risk in that approach I'm not accounting for?"`,
  },
  {
    id: 'group-discussion-summary',
    title: 'Group Discussion: Summarising the Room',
    difficulty: 'Intermediate',
    duration: '1 min',
    description: 'Synthesise multiple viewpoints and bring a discussion to a productive close.',
    category: 'Group Discussion',
    accent: '#2E4F4F',
    theory: 'Summarising a discussion shows listening skills and leadership. It demonstrates that you can synthesise multiple viewpoints and move a group toward alignment.',
    approach: [
      'Signal that you\'re about to summarise.',
      'Capture the key points from different speakers fairly.',
      'Identify where there is consensus.',
      'Propose a direction or next step.',
    ],
    guidance: [
      'Don\'t editorialise — represent others\' views accurately.',
      'Use names to show you were listening.',
      'Keep it under 60 seconds.',
      'End with a question to confirm alignment.',
    ],
    script: `"Before we move on, let me try to capture where we are.

We've heard strong arguments on both sides — the concern about cost and timeline from the first half of the discussion, and the case for speed-to-market and competitive positioning that came through later.

It sounds like there's broad agreement that doing nothing isn't an option, and that the question is really about sequencing and resource allocation.

If I'm reading the room correctly, a phased approach with defined go/no-go criteria has the most support. Does that reflect where everyone is, or am I missing something?"`,
  },
  // ── Communication ──────────────────────────────────────────────────────────
  {
    id: 'networking-introduction',
    title: 'Networking: 30-Second Introduction',
    difficulty: 'Beginner',
    duration: '1 min',
    description: 'Introduce yourself at a networking event in a memorable, natural way.',
    category: 'Communication',
    accent: '#FF6B35',
    theory: 'A networking introduction should be conversational, not a pitch. The goal is to spark genuine interest and open a dialogue — not to impress.',
    approach: [
      'State who you are and what you do clearly.',
      'Add one memorable or specific detail.',
      'Express genuine interest in the other person.',
      'Create an opening for a real conversation.',
    ],
    guidance: [
      'Avoid jargon and job titles that need explanation.',
      'Smile and make it feel human, not transactional.',
      'End by asking a question — conversation is two-way.',
      'Practice so it sounds natural, not rehearsed.',
    ],
    script: `"I'm a product designer — I spend most of my time figuring out why people abandon apps halfway through and then redesigning the parts they're stuck on.

Most recently I've been obsessing over checkout flows — there's something almost perversely interesting about how much friction a single extra field can create.

What brings you here tonight? Are you working on anything product-side?"`,
  },
  {
    id: 'difficult-feedback',
    title: 'Giving Difficult Feedback',
    difficulty: 'Advanced',
    duration: '2 min',
    description: 'Deliver constructive criticism clearly, kindly, and without defensiveness.',
    category: 'Communication',
    accent: '#2E4F4F',
    theory: 'Difficult feedback is a gift when delivered well. The goal is clarity, not comfort — but the delivery should be respectful and specific, not vague or personal.',
    approach: [
      'Set the context — make it clear this is feedback, not criticism.',
      'Be specific about the behaviour, not the person.',
      'Explain the impact it\'s having.',
      'Invite a response and discuss a path forward.',
    ],
    guidance: [
      'Never give hard feedback in public.',
      'Separate observation from interpretation.',
      'Use "I noticed" not "you always."',
      'End with support — you\'re on their side.',
    ],
    script: `"I wanted to have a direct conversation with you about something I've noticed, because I think it's worth addressing and I'd rather talk about it than let it build.

In the last three team meetings, when others have been speaking, I've noticed you checking your phone or laptop fairly consistently. I don't think it's intentional, but it's being noticed by the team — two people have mentioned feeling like their input isn't valued.

I know you're stretched right now, and I'm not questioning your commitment. I just want us to be deliberate about the signals we send in group settings.

How are you experiencing those meetings? I want to understand your side before we figure out how to approach this."`,
  },
  {
    id: 'asking-for-promotion',
    title: 'Asking for a Promotion',
    difficulty: 'Advanced',
    duration: '2 min',
    description: 'Make the case for your advancement with evidence and confidence.',
    category: 'Communication',
    accent: '#FF6B35',
    theory: 'A promotion conversation should feel like presenting evidence, not asking for a favour. Come prepared with specific accomplishments, impact, and a clear case for your readiness.',
    approach: [
      'State your intention clearly upfront.',
      'Present your case with specific evidence.',
      'Demonstrate you\'re already operating at the next level.',
      'Ask for a clear path forward if the answer isn\'t immediate.',
    ],
    guidance: [
      'Don\'t make it about tenure — make it about impact.',
      'Use numbers wherever possible.',
      'Prepare for "not yet" and ask what would change that.',
      'Schedule a dedicated meeting — don\'t ambush.',
    ],
    script: `"I wanted to have a direct conversation about my growth trajectory and make the case for moving into a senior role.

Over the last 18 months, I've led three major projects end-to-end — including the platform migration that reduced infrastructure costs by 32% and the analytics dashboard that's now used by 80% of enterprise clients daily. I've also been mentoring two junior developers and running our weekly technical review sessions.

Looking at the scope of what I'm taking on and the outcomes I'm driving, I believe I'm already operating at the senior level. I'd like to make that official.

I'd love to understand your perspective — do you see it the same way? And if there are gaps you'd want to see me close first, I'd really value that feedback."`,
  },
];