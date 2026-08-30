# AI Assessment Extraction & Answer Mapping — Assignment

Source: https://app.notion.com/p/AI-Assessment-Extraction-Answer-Mapping-Assignment-f63caaa84b0945168db6717563d4d87b

Figma: https://www.figma.com/design/GEjt1rt1s7AXvkcr4t8muE/VedaAI-Hiring-Assignment?node-id=0-1
Submission form: https://forms.gle/vFXzf3kcLmGougMr5

## Assignment

Build a web page that allows a teacher to upload:

1. A question paper (PDF or images)
2. One student handwritten answer sheet (PDF or images)

The application should extract the questions from the paper, extract the
student's answers, and display them side by side.

When a teacher clicks on a question, the corresponding answer should be
identified and the exact region of the answer sheet should be highlighted.

## Scope

This can include grading and AI-generated insights. The application may
include marks or scores, correct/incorrect evaluation, AI feedback (per
question and/or overall), and a clear grading summary.

Core flow: Question Extraction -> Answer Extraction -> Answer Mapping ->
Grading/Feedback

## Requirements

- Upload both files and show processing progress
- Extract every question in the correct printed order
- Treat labelled sub-parts as separate questions (11 (a) and 11 (b) are two entries)
- Preserve the original question numbering
- Handle questions answered out of order
- Handle unanswered questions
- Handle answers that don't match any question
- Highlight the exact answer region on the answer sheet
- Allow answers to span multiple pages where required

## Design

A Figma design has been provided as a reference for the expected interface and
overall experience. You are expected to follow the provided design closely
while implementing the product.

## Technical constraints

- Any tech stack is allowed
- Any AI model/API with a free tier is allowed
- Next.js is recommended but not mandatory
- No authentication required
- No database required
- In-memory storage is sufficient
- The application must be deployed and accessible through a live URL

## Submission

- Live deployed URL
- GitHub repository
- Brief explanation of approach
- AI model/API used
- Any important assumptions or limitations

## What is evaluated

- Accuracy of question extraction
- Accuracy of answer mapping
- Correct highlighting of answers
- Handling of edge cases
- Quality of implementation
- Overall product experience

## The goal

A teacher should be able to upload a question paper and answer sheet and
quickly understand: which question was answered, where the answer is, and
which questions were left unanswered.
