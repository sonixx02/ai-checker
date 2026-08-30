# AI Assessment Extraction & Answer Mapping

Upload a question paper and a student's handwritten answer sheet. The app
extracts the questions, extracts the answers, and links them: clicking a
question jumps the answer sheet to the right page and highlights the exact
region where that answer was written.

## Running locally

    npm install
    cp .env.local.example .env.local    # add your Gemini API key
    npm run dev

Tests:

    npm test

Sample PDFs to try are in `test-data/`, with a ground-truth table in
`test-data/README.md`.

## What it supports

**Input**

- PDFs or images for either file; pages are rasterized in the browser
- Multi-page answer sheets
- Question papers with sub-parts, e.g. `3(a)` and `3(b)`

**Extraction and mapping**

- Every question in printed order, with original numbering preserved
- Labelled sub-parts as separate entries
- Answers written out of order
- Questions left unanswered
- Answers that match no question on the paper
- One answer spanning a page break, tracked as several regions
- One answer split across several places on a page, e.g. a table of blanks

**Reading the result**

- Click a question to jump to its page and highlight the region
- Every answer on the current page is drawn: the selected one solid, the
  others faint and clickable, so two sub-parts on one page are distinguishable
- Each row shows the question number with its sub-part, the page the answer is
  on, and the score
- Expanding a row shows the extracted question text, every fragment of the
  answer, which page each came from, and how legibly each was read
- Zoom and window resize keep highlights aligned, because regions are stored
  as fractions and rendered as percentages

**Grading**

- Marks per question and one line of feedback, from the same pass that does
  the matching
- Low-confidence answers surface as "Needs review" rather than being presented
  as confident matches

**Providers**

- Google Gemini by default, using the server's key
- Any OpenRouter model, using a key you supply in Settings. The picker lists
  only models that accept image input, sorts free ones that support structured
  output first, and warns on models without a JSON mode
- The results screen states which provider and model actually served the run

**Cost and abuse control**

- Results are cached in the browser against a SHA-256 hash of both files plus
  the chosen provider and model. Re-running the same pair costs nothing: on a
  cache hit the pages are re-rasterized locally and no model call is made. The
  banner says when a result was reused.
- The cache stores extracted text and regions only, never page images, so it
  stays inside browser storage limits. Five results are kept, oldest evicted,
  expiring after seven days.
- Changing model or provider deliberately misses the cache, because a different
  model produces different output.
- Answer-sheet pages are requested three at a time, with retry and backoff, so
  one large upload cannot burst through the rate limit.

**Guardrails that avoid wasted API calls**

| Check | When | What it saves |
|---|---|---|
| Same file in both slots | before any call | every call |
| No questions extracted | after pass 1 | one call per answer page, plus the join |
| No handwriting found | after pass 2 | the join |
| Nothing matched at all | after the join | — |
| Answer sheet longer than the free tier allows | at upload | warns before you start |

Each names which file is at fault.

## Running costs, and what happens when the key runs out

The deployed app uses the operator's Gemini key, so visitors spend the
operator's quota. One full run of a seven-page answer sheet costs nine model
calls: one for the question paper, seven for the answer pages, one for the
join. The Gemini free tier allows roughly 10 requests per minute and a few
hundred per day, so a shared deployment supports a couple of dozen runs a day
before it is exhausted.

Three things reduce that pressure:

- **Caching.** Repeating the same pair of files costs nothing.
- **Guardrails.** A wrong upload is rejected before spending calls, not after.
- **Bring your own key.** Settings accepts an OpenRouter key, and the run then
  uses the visitor's quota rather than the operator's. The picker lists only
  models that can read images and marks the free ones.

If the built-in key is exhausted the app fails with the provider's own error
rather than silently degrading, and the visitor can switch to their own key
without reloading or losing the current result.

There is no server-side rate limiting or authentication, because the brief
excludes both. A public deployment is therefore usable by anyone who has the
link, bounded only by the quota of whichever key is in use.

## What it does not support

- **Rotated or badly skewed scans.** Untested; a photo taken at an angle will
  likely misplace regions.
- **Multi-column question papers.** Reading order assumes a single column.
- **Non-English handwriting.** Untested.
- **A question answered in two separate places on the sheet.** The answer is
  mapped to the first location found.
- **Editing the mapping.** If the model matches an answer to the wrong
  question, you can see that it did, but not correct it in the app.
- **Grading hand-drawn diagrams.** Diagrams are located and highlighted like
  any other region and described in text, but marks awarded for them are
  approximate.
- **Persistence.** Nothing is stored on a server. The browser keeps a small
  cache of recent results so repeats are free, but reloading with different
  files starts fresh, and no database is used.
- **Server-side rate limiting or authentication.** Excluded by the brief.
- **More than one student.** One answer sheet per run.

## Approach

### Three passes, not one

The obvious design is one call: "here are the questions, here is the sheet,
find each answer." It was rejected because the brief grades three edge cases
that such a prompt structurally cannot handle well — answers out of order,
unanswered questions, and answers matching no question. Framing the task around
questions means the model is never asked about writing that belongs to no
question, so it usually will not mention it.

Instead the pipeline splits into three:

1. **Extract questions** from the question paper, in printed order.
2. **Extract answer blocks** from the answer sheet, one page per request, with
   no knowledge of the questions.
3. **Join** the two lists. Text only, no images.

Because pass 2 never sees the questions, it reports what is actually on the
page. The edge cases then become set arithmetic in plain TypeScript rather than
something the model has to volunteer:

| Requirement | How it is derived |
|---|---|
| Answers out of order | pass 2 never assumed an order |
| Unanswered questions | questions minus matched question ids |
| Answers matching no question | blocks minus matched block ids |
| Sub-parts as separate entries | distinct rows from pass 1 |
| Answers spanning pages | a mapping holds several blocks |
| Illegible handwriting | confidence below threshold |

The join being text-only also makes it the cheapest step to iterate on: it can
be re-run against cached extraction output in seconds without re-reading any
images.

### Where state lives

The browser holds the files, the page rasters, and all derived state. The API
routes are stateless — input in, validated JSON out. This satisfies "no
database, in-memory is sufficient" by having no server-side memory at all,
which also avoids the problem that serverless invocations do not share memory
with each other.

### How the highlight works

PDFs are never sent to the model. The browser rasterizes each page to a JPEG
and sends the exact image the highlight will later be drawn on. Google
documents that the models are imprecise at locating content inside PDFs and may
hallucinate on handwriting in them; bounding boxes on images are the trained
path.

Gemini returns boxes as `[ymin, xmin, ymax, xmax]` normalised 0-1000. Those are
converted once, to fractions, and stored that way. The overlay is an absolutely
positioned element with percentage offsets inside a relatively positioned
container. Zoom and window resize therefore need no recalculation at all — the
container changes size and the box follows.

Boxes are padded slightly and drawn with a soft edge. A generous highlight that
contains the answer reads as correct; a tight box that clips it reads as broken.

### Sub-part handling

`3 (a)` and `3 (b)` become two entries, as the brief requires. The model
sometimes also emits the shared stem as a third row with no marks. That row can
never be answered, so `lib/normalizeQuestions.ts` drops it and carries its text
onto each sub-part as `context`, which is passed to the grading step but not
shown as its own question.

### Defensive parsing

Model output varies between runs even at the same settings. Three shapes of
`box_2d` were seen in testing — a flat array, a single-nested array, and an
array of repeated boxes — so boxes are normalised before use and a malformed
one drops a single block rather than the page. A missing `confidence` field
defaults instead of failing the whole response, and markdown code fences are
stripped before JSON parsing.

## AI model

**`gemini-3.5-flash-lite`** by default. Configurable with the `GEMINI_MODEL`
environment variable, or per-run through Settings when using OpenRouter.

Chosen by measurement, not preference. `gemini-2.5-flash` is still listed by
`models.list` but returns 404 for new API keys, with Google's own error
recommending `gemini-3.6-flash`. Comparing the two viable options on a real
image, three runs each:

| model | latency | JSON parse | box format |
|---|---|---|---|
| `gemini-3.6-flash` | 12s / 32s / 13s | ok | flat |
| `gemini-3.5-flash-lite` | 3.5s / 3.0s / 4.5s | ok | flat |

Latency is the binding constraint because answer sheets are multi-page and the
free tier allows only 10 requests per minute. Flash-lite is 4-8x faster and sits
in the higher-limit tier. Answer-sheet pages are requested three at a time
rather than all at once, with retry and backoff on rate-limit responses.

Authentication uses a Google AI Studio **authorization key** (`AQ.` prefix),
which is bound to a service account and restricted to the Gemini API. Standard
`AIzaSy` keys are being retired by Google in September 2026.

The pipeline has also been run end to end through OpenRouter on
`minimax/minimax-m3:free`, producing the expected mapping.

## Assumptions and limitations

- Printed question papers with a standard single-column layout.
- Handwritten answers in English.
- Answer regions are model-predicted and padded. A highlight indicates where an
  answer is, not a pixel-exact trace of it.
- Confidence is the model's own estimate and is not calibrated. It varies
  between runs on the same page. It is used to flag rows for review, not to
  make decisions.
- Scores and feedback are indicative. This is a marking aid, not a marker.
- Matching is done against the uploaded question paper only. Answer booklets
  often print the question above the answer; those printed questions are not
  used, so an answer to one of them is reported as unmatched.
- Upload limit is 10MB per file, matching the design.
- The sidebar navigation, school card, notifications and avatar are static.
  The brief excludes authentication and persistence, so nothing sits behind them.
- Accuracy has been measured against one constructed test pair, not a corpus.

## Project layout

    lib/geometry.ts           box conversion, padding, percentage styles
    lib/normalizeQuestions.ts sub-part stem collapsing
    lib/validateQuestions.ts  gap and duplicate detection in numbering
    lib/buildMappings.ts      the set arithmetic producing the four statuses
    lib/preflight.ts          the guardrails listed above
    lib/providers.ts          provider resolution, model ranking, key validation
    lib/settings.ts           provider choice persistence
    lib/answerPages.ts        page labels for a mapping
    lib/pageNotice.ts         the continuation notice on the answer sheet
    lib/questionLabel.ts      one source for question numbering in list and sheet
    lib/gemini.ts             the one place that calls a model
    lib/rasterize.ts          client-side PDF and image rasterization

    app/api/extract-questions/  pass 1
    app/api/extract-answers/    pass 2, one page per request
    app/api/map-answers/        pass 3, text only
    app/api/models/             lists usable OpenRouter models for a key
    app/page.tsx                pipeline orchestration and all state

Unit tests cover the pure logic — geometry, numbering validation, stem
collapsing, mapping arithmetic, guardrails, provider ranking, settings, page
labelling and question labelling. Components are verified by running the app.
