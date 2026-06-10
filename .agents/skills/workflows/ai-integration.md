# Skill: AI Integration

InterLog uses the DeepSeek API for three distinct tasks: activity categorization, insight generation, and Wrapped summary generation. Each has different inputs, outputs, latency tolerance, and privacy constraints. This skill covers all three.

---

## Absolute Rules

- **`DEEPSEEK_API_KEY` is server-only.** It must never appear in a Client Component, be passed to the browser, or be readable in a public Route Handler. Any violation is a critical security bug.
- **All AI calls go through `src/lib/ai/`.** No component or action calls the DeepSeek API directly.
- **Reflection text and mood data never enter AI prompts.** They are private by default. If a future feature requires this, it must be opt-in with explicit user disclosure.
- **PII (name, email) never enters AI prompts.** Pass anonymized statistics and activity titles only.
- **AI content is always visually marked** — but without novelty effects (no sparkle animations, no theatrical borders).

---

## DeepSeek Client

`src/lib/ai/client.ts` — the single point of contact with the API:

```ts
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'

interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface DeepSeekOptions {
  model?:       string   // default: 'deepseek-chat'
  maxTokens?:   number
  temperature?: number
}

export async function callDeepSeek(
  messages: DeepSeekMessage[],
  options: DeepSeekOptions = {}
): Promise<string> {
  const response = await fetch(DEEPSEEK_API_URL, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model:      options.model      ?? 'deepseek-chat',
      max_tokens: options.maxTokens  ?? 512,
      temperature: options.temperature ?? 0.2,
      messages,
    }),
  })

  if (!response.ok) {
    throw new AIError(`DeepSeek API error: ${response.status}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}
```

All three AI functions (`categorizeActivity`, `generateInsights`, `generateWrapped`) import `callDeepSeek` — they do not construct their own fetch calls.

---

## 1. Activity Categorization

**File:** `src/lib/ai/categorize.ts`  
**Called from:** `actions/activity.ts` (authenticated) and `app/api/categorize/route.ts` (guest, rate-limited)  
**Latency tolerance:** Low — this is in the critical path of activity creation.

### Categories (match `Category` table exactly)

`deep-work` · `learning` · `reflection` · `exercise` · `social` · `meeting` · `admin` · `break` · `personal`

### Prompt Design

Keep it short and deterministic. Low temperature (0.1–0.2). Expect JSON output.

```ts
const SYSTEM_PROMPT = `
You are an activity categorizer for a personal time-tracking app.
Given an activity title, return the most appropriate category.

Categories and their meanings:
- deep-work: focused coding, writing, designing, building
- learning: reading, courses, studying, research
- reflection: journaling, meditation, planning, self-review
- exercise: physical activity, gym, sports, walking
- social: conversations, calls, social events
- meeting: work meetings, standups, interviews
- admin: email, admin tasks, errands, scheduling
- break: rest, meals, downtime
- personal: personal appointments, family, hobbies

Respond ONLY with valid JSON in this exact format:
{"category": "<category-key>", "confidence": <0.0-1.0>}

No explanation. No other text.
`.trim()

export async function categorizeActivity(title: string): Promise<{
  categoryId: string
  confidence: number
}> {
  try {
    const raw = await callDeepSeek([
      { role: 'system',  content: SYSTEM_PROMPT },
      { role: 'user',    content: title.trim().slice(0, 200) }, // enforce max length
    ], { maxTokens: 64, temperature: 0.1 })

    const parsed = JSON.parse(raw)
    const category = VALID_CATEGORIES.includes(parsed.category)
      ? parsed.category
      : 'admin' // safe fallback

    // Map category key to DB category ID
    const dbCategory = await getCategoryByKey(category)
    return { categoryId: dbCategory.id, confidence: parsed.confidence ?? 0.5 }

  } catch {
    // Never throw — AI failure must not block activity creation
    const fallback = await getCategoryByKey('admin')
    return { categoryId: fallback.id, confidence: 0 }
  }
}
```

**Failure behavior:** On any error (network, parse, invalid JSON), return the `admin` category with `confidence: 0`. The calling action records the low confidence and the client can show a subtle *"Category auto-assigned — tap to change"* notice.

---

## 2. Insight Generation

**File:** `src/lib/ai/insights.ts`  
**Called from:** `actions/wrapped.ts` or a background job  
**Latency tolerance:** High — insights load in a separate Suspense boundary; they never block analytics.

### What Goes Into the Prompt

```ts
interface InsightInput {
  periodLabel: string          // "the last 14 days"
  totalTrackedHours: number
  focusHours: number
  categoryBreakdown: {         // category key + hours + session count
    category: string
    hours: number
    sessions: number
  }[]
  focusSessionsByHour: {       // hour of day (0–23) + average session length
    hour: number
    avgDurationMinutes: number
  }[]
  reflectionDaysCount: number
  // ❌ NO reflection text
  // ❌ NO mood data
  // ❌ NO name or email
}
```

### Output Schema

```ts
interface InsightOutput {
  insights: {
    observation:     string   // what the data shows — factual
    interpretation:  string   // what it might mean — hedged
    recommendation?: string   // optional — framed as an experiment
    evidence:        string   // "Across N sessions in the last X days"
    confidence:      'emerging' | 'consistent' | 'strong'
    category?:       string   // related category key, if applicable
  }[]
}
```

### Prompt Design

```ts
const SYSTEM_PROMPT = `
You are an insight generator for a personal time-tracking app.
Analyze the user's activity patterns and produce 2-4 insights.

Rules:
- Separate observation, interpretation, and recommendation clearly.
- State evidence and timeframe in every insight.
- Use confidence labels: "emerging" (1-2 data points), "consistent" (3-6), "strong" (7+).
- Recommendations are optional. When included, frame them as experiments: "You might try..."
- Do NOT infer health status, emotional state, diagnosis, or intent.
- Do NOT use moral labels ("unproductive", "bad habits").
- Do NOT compare to other users.
- Be concise. Each field should be 1-2 sentences.

Respond ONLY with valid JSON matching the InsightOutput schema.
No preamble. No explanation outside the JSON.
`.trim()
```

### Rendering Insights

Every `InsightCard` must include:

1. The observation text
2. The interpretation text
3. The evidence string (verbatim from AI output)
4. Confidence badge: `Emerging` / `Consistent` / `Strong`
5. *"Why am I seeing this?"* toggle → shows the evidence field expanded
6. Helpful / Not helpful feedback buttons
7. Dismiss control

Recommendation (if present) is displayed in a visually distinct section below, introduced with *"You might try:"*

---

## 3. Wrapped Summary Generation

**File:** `src/lib/ai/wrapped.ts`  
**Called from:** `actions/wrapped.ts`  
**Latency tolerance:** High — generated async, cached, displayed on demand.

### Input

Aggregate server-side before calling AI. The action queries the DB, builds the stats object, then calls `generateWrapped`. The AI never queries the DB.

```ts
interface WrappedInput {
  period:            'monthly' | 'yearly'
  periodLabel:       string        // "October 2024" or "2024"
  totalTrackedHours: number
  focusHours:        number
  topCategories:     { category: string; hours: number; percentage: number }[]
  longestFocusSession: { durationMinutes: number; title: string; date: string }
  mostProductiveDay: { dayName: string; avgHours: number }
  reflectionDaysCount: number
  streakHighlight?:  string        // "6 reflection days in a row" — pre-computed, not raw data
  // ❌ NO reflection answers
  // ❌ NO mood data
}
```

### Output Schema

```ts
interface WrappedOutput {
  cards: {
    type: 'orientation' | 'time-overview' | 'category-story' |
          'focus-pattern' | 'reflection-highlight' | 'achievement' | 'forward-prompt'
    headline:    string
    body:        string
    stat?:       { value: string; label: string }  // e.g. { value: "38%", label: "learning" }
    ctaLabel?:   string                            // for forward-prompt card
  }[]
}
```

Monthly: 5–7 cards. Yearly: 8–12 cards. The `orientation` and `forward-prompt` types are always present; others are selected based on what the data supports.

### Achievement Rules

- Achievements must be factual and grounded in the data provided.
- No invented superlatives (*"Your best month ever!"* is invalid unless the data shows it).
- No comparisons to other users.
- Valid example: *"You completed 14 focus sessions this month — your highest count since you started."* (only if historical data confirms it)
- Invalid example: *"You're crushing it this month!"*

---

## Error Handling Across All AI Calls

| Scenario | Behavior |
|---|---|
| Network error | Catch, log server-side, return typed error result |
| Non-200 response | Same as network error |
| Invalid JSON in response | Catch parse error, use fallback (categorization) or return error (insights/wrapped) |
| Timeout (>10s) | Abort with `AbortSignal.timeout(10000)`, return error |
| Rate limit (429) | Return error with `retryAfter` hint if available |

For insights and Wrapped: on failure, the UI must:
- Preserve all non-AI content (analytics, timeline)
- Show a calm error state: *"Insights could not be loaded."* with a Retry button
- Never show a spinner indefinitely — set a max wait of 10 seconds then show the error state

For categorization: on failure, always fall back silently to `admin` — never surface an error to the user for a background classification task.

---

## Loading States

- **Categorization:** no visible loading state needed — it resolves before the activity is confirmed.
- **Insights:** stable skeleton matching `InsightCard` geometry. Do not use a generic spinner.
- **Wrapped:** skeleton for each card slot. Cards render progressively as the response streams (if streaming is implemented) or all at once from cache.

---

## Rate Limiting

- Guest categorization endpoint (`/api/categorize`): 30 requests per IP per hour.
- Authenticated insight generation: 10 requests per user per day (insights are cached; regeneration is triggered manually).
- Wrapped generation: 5 requests per user per period (monthly/yearly).
- Configure limits at the Vercel edge in `vercel.json` and enforce additionally in the Route Handler / Server Action.
