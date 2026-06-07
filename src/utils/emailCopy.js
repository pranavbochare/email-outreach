export function generateEmail(contact) {
  const { firstName, name, title, company, industry } = contact;

  const subject = subjects(company, industry);
  const body = buildBody(firstName, title, company, industry);

  return { subject, body };
}

function subjects(company, industry) {
  const options = [
    `Quick idea for ${company}`,
    `${company} + Vocallabs — worth a 15-min call?`,
    `Cutting outreach time for ${industry || "your"} teams`,
    `How ${company} could automate its sales pipeline`,
    `One thing that moves the needle at ${company}`,
  ];
  return options[company.length % options.length];
}

function buildBody(firstName, title, company, industry) {
  const execHook =
    title.toLowerCase().includes("ceo") || title.toLowerCase().includes("founder")
      ? `As someone steering ${company}'s direction`
      : `As ${article(title)} ${title}`;

  const industryLine = industry
    ? `The ${industry} space is moving fast, and the teams winning are the ones that removed humans from repetitive outreach loops entirely.`
    : `The fastest-moving teams right now are the ones that removed humans from repetitive outreach loops entirely.`;

  return `Hi ${firstName},

${execHook}, you know better than most that the bottleneck in B2B sales isn't talent — it's time.

${industryLine}

We built an end-to-end pipeline at Vocallabs that takes a single company domain and, with zero manual steps, finds lookalike customers, surfaces the right decision-makers, resolves their verified work emails, and fires personalized outreach — all automatically.

For ${company} specifically, this could mean:
  • Filling your pipeline with qualified lookalikes of your best customers
  • Reaching VP/C-suite contacts you'd normally spend hours sourcing
  • Sending the first email within minutes of identifying a target

I'd love to show you a live demo — 15 minutes, no deck.

Would Thursday or Friday this week work for a quick call?

Best,
[Your Name]
[Your Title] · Vocallabs
[your@domain.com]
[Phone / Calendar link]

P.S. — Happy to send a short Loom walkthrough first if that's easier.
`;
}

function article(word = "") {
  return /^[aeiou]/i.test(word) ? "an" : "a";
}
