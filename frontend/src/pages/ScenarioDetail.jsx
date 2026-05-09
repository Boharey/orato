import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/button';
import { ArrowLeft, BookOpen, CheckCircle, Lightbulb, FileText } from 'lucide-react';

// ── Scenario data ────────────────────────────────────────────────────────
const SCENARIO_DATA = {
  'behavioral-leadership': {
    title: 'Behavioral Interview: Leadership Under Pressure',
    theory: 'Employers use behavioral questions to see how you’ve handled real situations. The STAR method (Situation, Task, Action, Result) keeps your answer structured and impactful.',
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
    script: `“In my last role, our main client threatened to leave because of repeated delivery delays. I volunteered to lead a cross‑functional tiger team. First, I mapped the entire workflow and found three bottlenecks. I then implemented a daily 10‑min stand‑up and a shared tracking dashboard. Within six weeks, we improved on‑time delivery from 72% to 95%, and the client not only stayed but expanded their contract. That experience taught me that clear ownership and data‑driven fixes can turn even the toughest situations around.”`,
  },
  'technical-explain-project': {
    title: 'Technical Interview: Explain Your Project',
    theory: 'When explaining a project, start with the problem and your role. Avoid deep technical jargon unless asked – focus on impact.',
    approach: [
      'Problem: What was the challenge?',
      'Your Role: What were you specifically responsible for?',
      'Solution: High‑level overview of your technical approach.',
      'Result: Quantifiable outcome or lesson learned.',
    ],
    guidance: [
      'Use analogies to explain complex concepts.',
      'Be ready to dive deeper if the interviewer asks.',
      'Avoid acronyms unless you explain them first.',
      'End with what you learned or would do differently.',
    ],
    script: `“I was the backend lead for a mobile app serving 200k users. The main pain point was slow image uploads – sometimes 12 seconds. I redesigned the pipeline to use chunked uploads with parallel processing, and added a CDN for caching. The result was under 2‑second uploads and a 40% drop in support tickets. It taught me the importance of user‑perceived performance, not just backend metrics.”`,
  },
  'strength-question': {
    title: 'Interview: "What is your greatest strength?"',
    theory: 'Choose a strength that’s relevant to the role and back it up with a concrete example. Avoid generic answers like "I’m a hard worker."',
    approach: [
      'State the strength clearly.',
      'Give a specific example of when you demonstrated it.',
      'Explain how it will help you succeed in the role.',
    ],
    guidance: [
      'Pick a strength that matches the job description.',
      'Use a recent professional example.',
      'Keep it concise – 1 minute max.',
      'Show enthusiasm but don’t boast.',
    ],
    script: `“My greatest strength is turning ambiguous problems into structured plans. For example, when our team faced a vague ‘improve user engagement’ goal, I initiated a data‑driven audit that identified our onboarding drop‑off as the key issue. I then led the redesign of the first‑time user flow, which increased week‑1 retention by 28%. I’d apply that same analytical and execution‑oriented mindset to drive results in this role.”`,
  },
  'weakness-question': {
    title: 'Interview: "What is your biggest weakness?"',
    theory: 'Be honest but strategic – pick a real (non‑critical) weakness and show you’re actively improving it. Never say "I work too hard."',
    approach: [
      'State the weakness honestly.',
      'Explain the steps you’ve taken to improve.',
      'Share the positive outcome or progress.',
    ],
    guidance: [
      'Avoid weaknesses that are essential to the job (e.g., attention to detail for an accountant).',
      'Show measurable improvement.',
      'Keep it forward‑looking and positive.',
      'Practice so you don’t ramble.',
    ],
    script: `“I used to struggle with delegating tasks because I wanted everything to be perfect. I noticed that was slowing down my team. So I took a project management course and started using a shared task board with defined ownership. Over the last quarter, our team’s throughput increased by 30%, and I’ve become much better at trusting my team and focusing on high‑impact work.”`,
  },
  'group-discussion-opening': {
    title: 'Group Discussion: Strong Opening Statement',
    theory: 'In group discussions, the first 30 seconds can set the tone and establish your presence. A strong opening states your position clearly and invites collaboration.',
    approach: [
      'Acknowledge the topic or prompt.',
      'State your viewpoint concisely.',
      'Provide one key reason or example.',
      'End with an open‑ended question to involve others.',
    ],
    guidance: [
      'Speak at a measured pace – not too fast.',
      'Maintain eye contact with the group.',
      'Use a confident but friendly tone.',
      'Avoid dominating; your goal is to spark discussion.',
    ],
    script: `“Thanks for having me. On the topic of remote work, I believe a hybrid model offers the best of both worlds. It preserves flexibility and autonomy, while in‑person collaboration strengthens team bonds. I’ve seen companies like Shopify thrive with this approach. What has your experience been with fully remote vs. hybrid?”`,
  },
  'college-presentation-opening': {
    title: 'College Presentation: Confident Opening',
    theory: 'A strong academic opening grabs attention, states your thesis, and outlines your talk. It sets you up as credible and prepared.',
    approach: [
      'Start with a hook: a surprising fact, question, or quote.',
      'State your main argument or thesis.',
      'Preview your key points.',
      'Transition smoothly into the first section.',
    ],
    guidance: [
      'Memorize the first two sentences to start strong.',
      'Use a conversational tone – avoid reading.',
      'Stand still and make eye contact with the audience.',
      'Smile – it relaxes both you and the audience.',
    ],
    script: `“Did you know that over 60% of college students report high levels of anxiety? Today, I’ll argue that mindfulness practices can significantly reduce stress and improve academic performance. I’ll cover the science behind mindfulness, results from a campus study, and three simple exercises you can start today. Let’s begin with the neuroscience of stress.”`,
  },
};

export const ScenarioDetail = () => {
  const { scenarioId } = useParams();
  const navigate = useNavigate();
  const scenario = SCENARIO_DATA[scenarioId];

  if (!scenario) {
    return (
      <Layout>
        <div className="p-8">
          <p className="text-muted-foreground">Scenario not found.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/scenarios')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Scenarios
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-serif font-light tracking-tight mb-2">{scenario.title}</h1>
          <p className="text-muted-foreground text-sm">{scenario.description}</p>
        </div>

        {/* Theory */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-serif font-medium">Theory & Context</h2>
          </div>
          <p className="text-sm text-foreground leading-relaxed">{scenario.theory}</p>
        </div>

        {/* Approach */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-serif font-medium">How to Approach It</h2>
          </div>
          <ul className="space-y-3">
            {scenario.approach.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-sm">{step}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Guidance */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-serif font-medium">Key Tips</h2>
          </div>
          <ul className="list-disc pl-5 space-y-2">
            {scenario.guidance.map((tip, i) => (
              <li key={i} className="text-sm">{tip}</li>
            ))}
          </ul>
        </div>

        {/* Full Script */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-serif font-medium">Full Script</h2>
          </div>
          <div className="p-4 bg-muted/40 border border-border rounded-lg text-sm leading-relaxed italic">
            "{scenario.script}"
          </div>
        </div>

        {/* Use Script Button */}
        <Button
          onClick={() =>
            navigate('/evaluation', {
              state: { script: scenario.script, title: scenario.title },
            })
          }
          className="w-full py-3 rounded-xl font-semibold text-white"
          style={{ background: '#2E4F4F' }}
        >
          Use This Script in Evaluation
        </Button>
      </div>
    </Layout>
  );
};