# Test Material

The test uses real handwritten answers from Cambridge IGCSE Biology 0610,
*Example Candidate Responses* (Paper 4).

Pages from one candidate's answers were cropped and rearranged into a 7-page
answer sheet. A question paper was written to match the answers.

The source material is Cambridge copyright and was used only locally to build
these fixtures. Pages 7, 17, 29, 36, 47 and 59 of that booklet were rendered at
150dpi and cropped to the answer column. The source pages are not included in
the repository.

## Files

* `question-paper.pdf` — 6 numbered questions, 8 entries, 26 marks
* `answer-sheet.pdf` — 7 pages of handwritten answers
* `blank-answer-sheet.pdf` — 2 blank pages, fixture for the empty-sheet guard

## Rasterize for API Testing

```bash
gs -dNOPAUSE -dBATCH -sDEVICE=png16m -r150 \
  -sOutputFile=/tmp/as%d.png test-data/answer-sheet.pdf
```

## Ground Truth

Expected mapping for the test:

| Question              | Marks | Answered on | Expected   |
| --------------------- | ----: | ----------- | ---------- |
| 1. Heart anatomy      |     4 | Page 1      | Matched    |
| 2. Nervous system     |     3 | Page 3      | Matched    |
| 3(a). Define gene     |     2 | Page 2      | Matched    |
| 3(b). Genotypes       |     3 | Page 2      | Matched    |
| 4(a). Gases           |     3 | Page 4      | Matched    |
| 4(b). Water potential |     3 | Pages 4–5   | Matched    |
| 5. Wild fish catch    |     4 | Page 7      | Matched    |
| 6. Transpiration      |     4 | —           | Unanswered |

Questions 2 and 3 are answered out of order. Question 4(b) continues onto the
next page.

One answer does not match any question:

* Photosynthesis equation — page 6

The answer sheet is a Cambridge answer booklet, so its pages carry printed
questions from the original paper. The photosynthesis question is one of those
and is deliberately absent from our question paper, so its answer must be
reported as unmatched. The answer itself is correct and balanced; unmatched is
a statement about coverage, not correctness.

## Cases Covered

* Sub-parts in two separate groups: `3(a)`/`3(b)` and `4(a)`/`4(b)`
* Answers written out of order
* Unanswered questions
* Answers with no matching question
* Answers spanning multiple pages
* Messy handwriting and crossings-out

## Pipeline

Tested with `gemini-3.5-flash-lite`.

The pipeline produced the expected mapping:

```text
Matched:      7
Unanswered:   1
Unmatched:    1
Multi-page:   1
```

Detailed output:

| QID | Status     | Blocks                 | Pages | Score |
| --- | ---------- | ---------------------- | ----- | ----- |
| 1   | Matched    | p0b0, p0b1, p0b2, p0b3 | 1     | 3/4   |
| 2   | Matched    | p2b0, p2b1, p2b2       | 3     | 3/3   |
| 3a  | Matched    | p1b0                   | 2     | 2/2   |
| 3b  | Matched    | p1b1                   | 2     | 3/3   |
| 4a  | Matched    | p3b0                   | 4     | 3/3   |
| 4b  | Matched    | p3b1, p4b0             | 4–5   | 2/3   |
| 5   | Matched    | p6b0                   | 7     | 4/4   |
| 6   | Unanswered | —                      | —     | —     |
| —   | Unmatched  | p5b0                   | 6     | —     |

All expected mapping cases were identified correctly.

## Reproduce

Write the pipeline output to `/tmp/full.json`, then run:

```bash
node --experimental-strip-types scripts/check-full.mts
```
