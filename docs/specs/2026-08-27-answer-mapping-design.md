# Design: AI Assessment Extraction & Answer Mapping

Date: 2026-08-27
Status: awaiting review
Budget: 1-2 days

## Summary

The browser rasterizes both uploaded PDFs to page images, sends those images to
Gemini in three passes (read questions, read answers, join them), and renders a
two-pane view where selecting a question positions a percentage-based highlight
over the answer sheet.

## Constraints taken as given

- Gemini via an AI Studio key is the only model provider.
- No sample material exists. Test data is built as the first task.
- The app must be deployed and clickable.
- The Figma is to be followed closely.

## Why three passes

The brief grades edge-case handling explicitly: answers out of order, unanswered
questions, and answers matching no question.

A single question-anchored pass ("for each question, find its answer") makes
those cases depend on the model volunteering information it was not asked for.
Unmatched answers in particular are structurally invisible to a prompt framed
around questions.

Splitting extraction of questions from extraction of answers, and joining them
afterwards, turns all three into set operations over two independent lists. The
cost is one extra API call.

The join is text-only. It can be re-run against cached extraction output in
seconds, which makes the hardest step the cheapest one to iterate on. On a
two-day budget that matters more than call count.

## Execution model

Browser holds the files, the page rasters, and all derived state in React.
Server API routes are stateless: input in, validated JSON out.

This satisfies "no database, in-memory is sufficient" by having no server-side
memory at all, avoids the serverless shared-memory trap, and keeps the API key
off the client.

## Data model

    Question {
      id: string          // "11a" — stable across reordering
      number: number
      subpart: string | null
      order: number       // printed position; sort key
      text: string
      maxMarks: number | null
    }

    Region {
      page: number
      box: [ymin, xmin, ymax, xmax]   // fractions 0..1, per axis
    }

    AnswerBlock {
      id: string
      writtenLabel: string | null     // what the student wrote, if anything
      text: string
      regions: Region[]               // >1 means the answer spans pages
      confidence: number              // 0..1
    }

    Mapping {
      questionId: string | null
      blockId: string | null
      status: "matched" | "unanswered" | "unmatched" | "low-confidence"
      score: { awarded: number, max: number } | null
      feedback: string | null
    }

`writtenLabel` records what the student wrote, not what the answer is. A label
is evidence for the join, not a conclusion. Conflating the two loses
out-of-order handling.

`regions` is a list from the first commit. Retrofitting multi-page support
means touching every component that reads a region.

## Pipeline

### Pass 1 — question paper to ordered questions

Input: question-paper page rasters. Output: `Question[]`, schema-enforced.

The prompt requires every question in printed order, labelled sub-parts as
separate entries, original numbering preserved verbatim, and printed marks
captured where present.

A local validation step (plain code, no model) flags gaps and duplicates in the
extracted numbering. A paper running 1,2,3,5 is reported as a gap rather than
silently shipped.

### Pass 2 — answer sheet to answer blocks

Input: one answer-sheet page raster per request. Output: `AnswerBlock[]`.

This pass does not see the question list. It cannot be biased into finding an
answer that is not there, and cannot skip one that belongs to no question.

Per-page requests give honest progress for the loading screen and keep each
request small enough that function timeouts are not a threat.

### Pass 3 — join

Input: the question list and the block list, as text. No images.
Output: `Mapping[]` including score and one-line feedback per matched pair.

Signals, in priority order: the student's written label, then semantic match of
the answer text against the question text.

## Edge cases

Derived after pass 3, in TypeScript:

| Requirement            | Derivation                          |
|------------------------|-------------------------------------|
| Answers out of order   | pass 2 never assumed an order       |
| Unanswered questions   | questions minus matched question ids|
| Unmatched answers      | blocks minus matched block ids      |
| Sub-parts separate     | distinct Question rows from pass 1  |
| Multi-page answers     | regions.length > 1                  |
| Messy handwriting      | confidence below threshold          |

None of these depend on the model remembering to mention something.

## Highlight mechanism

1. Client renders each PDF page to canvas at ~1600px wide, retains dimensions,
   exports JPEG.
2. That exact JPEG is sent to Gemini. Coordinates return in 0-1000 space
   relative to a 1000x1000 view; each axis descales independently.
3. Stored as fractions, never pixels.
4. Rendered as an absolutely positioned element with percentage offsets inside
   a relatively positioned container holding the page image.

Zoom and resize require no recalculation: the container changes size and the
percentage box follows. The zoom control in the Figma becomes a transform on
the container.

Selecting a question sets the active page to `regions[0].page`, renders every
region on that page, and shows a continuation affordance when regions exist on
other pages.

Boxes are padded slightly and drawn with a soft edge. A generous highlight that
contains the answer reads as correct; a tight box that clips it reads as broken.

## Screens

Single route, four states.

**Upload empty.** Sidebar, topbar, two dropzones, disabled CTA. Per mock.

**Upload filled.** File chips with name, size, page count.

**Processing.** Sparkle and "Extracting...", with a substage readout: reading
question paper, reading answer sheet page N of M, mapping answers.

**Mapping.** Left pane: question rows with numbered badge, text, score chip,
chevron expanding to AI feedback; selected row takes the orange border. Right
pane: answer sheet, zoom, pager, green region with corner tag.

States not present in the Figma, added to meet stated requirements:

- Unmatched answers section below the question list. Clickable, highlights,
  no question number.
- Unanswered rows read "Not attempted", not "0/2". Zero-out-of-two means
  attempted and wrong, which is a different fact.
- Low-confidence rows carry a "Needs review" badge; the region is still shown.

Mobile collapses the two panes into the segmented toggle from the mock.

## Deliberately faked

Home, My Classroom, Assignments, My Library, Settings, the school card,
notifications, avatar, the toolkit pill, and the breadcrumb are static. No
routes behind them. They match the design at near-zero cost; wiring them would
spend hours on what the brief excluded.

## Stack

Next.js, TypeScript, Tailwind, `pdfjs-dist` for client rasterization,
`@google/genai` with zod schemas enforced on every response. Deployed on
Vercel.

## Order of work

Day 1, correctness:
1. Build test data: a question paper with genuine 11(a)/11(b) sub-parts, and a
   handwritten sheet containing an out-of-order answer, a skipped question, an
   answer to nothing, and an answer crossing a page break.
2. Scaffold, PDF rasterization, upload screens.
3. Passes 1 and 2 against the real files, output inspected directly.
4. Pass 3 and the set arithmetic.

Day 2, presentation:
5. Mapping screen and highlight overlay.
6. Processing substages, the four edge-case states, mobile toggle.
7. Deploy, run the full flow against the live URL, write submission notes.

Accuracy precedes chrome. Running short on day 2 ships a plainer screen that
maps correctly. The reverse ships a polished screen that highlights the wrong
place, which is the first thing a reviewer will click.

## Expected failure modes

Box precision on handwriting is approximate. Mitigated by padding and soft
edges rather than pretending otherwise.

Model confidence may be poorly calibrated. If the threshold proves useless the
flagging is dropped rather than shipped as a misleading badge, and said so.

Test material is synthetic and not real student handwriting. Stated plainly in
the submission rather than implying broader validation.

## Assumptions for the submission

- Printed question papers, standard single-column layout. Multi-column and
  rotated scans out of scope.
- Handwritten answers in English. Mixed-script untested.
- Equations and diagrams are located and highlighted like any other region.
  Their contents are transcribed best-effort; grading of hand-drawn diagrams is
  approximate.
- Answer regions are model-predicted and padded. Highlights indicate location,
  not a pixel-exact trace.
- Confidence flagging is heuristic. Low-confidence rows are surfaced for
  teacher review rather than silently mapped.

## Open

- Deadline unknown.
- Whether reviewers will upload their own material or evaluate the submitted
  samples. Assumed the former.
