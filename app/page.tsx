"use client";

import { useEffect, useState } from "react";
import MappingScreen from "@/components/MappingScreen";
import ProcessingScreen, { type PipelineProgress } from "@/components/ProcessingScreen";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import ProblemScreen from "@/components/ProblemScreen";
import ProviderSettings from "@/components/ProviderSettings";
import UploadScreen, { type PickedFile } from "@/components/UploadScreen";
import {
  checkAnswerBlocks,
  checkMatchQuality,
  checkQuestions,
  checkSameFile,
  type PipelineProblem,
} from "@/lib/preflight";
import type { ProviderChoice } from "@/lib/providers";
import { loadSettings, saveSettings } from "@/lib/settings";
import { buildMappings, type JoinPair } from "@/lib/buildMappings";
import { countPages, rasterizeFile, type PageImage } from "@/lib/rasterize";
import { validateQuestions, type QuestionProblems } from "@/lib/validateQuestions";
import type { AnswerBlock, Mapping, Question } from "@/lib/types";

const CONFIDENCE_THRESHOLD = 0.5;
const MAX_CONCURRENT_PAGES = 3;
const MAX_FILE_BYTES = 10 * 1024 * 1024;

type Screen = "upload" | "processing" | "mapping" | "problem";

type Results = {
  usedProvider: { name: string; model: string } | null;
  questions: Question[];
  blocks: AnswerBlock[];
  mappings: Mapping[];
  answerPages: PageImage[];
  problems: QuestionProblems;
};

async function postJson(url: string, body: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? `Request to ${url} failed`);
  }

  return data;
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("upload");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [questionPaper, setQuestionPaper] = useState<PickedFile | null>(null);
  const [answerSheet, setAnswerSheet] = useState<PickedFile | null>(null);
  const [progress, setProgress] = useState<PipelineProgress>({
    stage: "questions",
    pageDone: 0,
    pageTotal: 0,
  });
  const [results, setResults] = useState<Results | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [problem, setProblem] = useState<PipelineProblem | null>(null);
  const [provider, setProvider] = useState<ProviderChoice>({
    name: "gemini",
    apiKey: "",
    model: "",
  });

  useEffect(() => {
    setProvider(loadSettings());
  }, []);

  const [settingsOpen, setSettingsOpen] = useState(false);

  function changeProvider(next: ProviderChoice) {
    setProvider(next);
    saveSettings(next);
  }

  async function pickFile(file: File, setter: (picked: PickedFile) => void) {
    setError(null);

    if (file.size > MAX_FILE_BYTES) {
      setError(`${file.name} is larger than 10MB.`);
      return;
    }

    try {
      const pageCount = await countPages(file);
      setter({ file, pageCount });
    } catch (caught) {
      const reason = caught instanceof Error ? caught.message : String(caught);
      setError(`Could not read ${file.name}: ${reason}`);
    }
  }

  async function runPipeline() {
    if (questionPaper === null || answerSheet === null) {
      return;
    }

    setError(null);
    setProblem(null);

    const duplicateUpload = checkSameFile(questionPaper.file, answerSheet.file);
    if (duplicateUpload !== null) {
      setProblem(duplicateUpload);
      setScreen("problem");
      return;
    }

    setScreen("processing");
    setProgress({ stage: "questions", pageDone: 0, pageTotal: 0 });

    try {
      const questionPages = await rasterizeFile(questionPaper.file);
      const answerPages = await rasterizeFile(answerSheet.file);

      const questionImages: string[] = [];
      for (const page of questionPages) {
        questionImages.push(page.base64);
      }

      const questionsResponse = await postJson("/api/extract-questions", {
        images: questionImages,
        provider,
      });
      const questions: Question[] = questionsResponse.questions;
      const usedProvider = questionsResponse.usedProvider ?? null;

      const emptyPaper = checkQuestions(questions, questionPaper.file.name);
      if (emptyPaper !== null) {
        setProblem(emptyPaper);
        setScreen("problem");
        return;
      }

      setProgress({
        stage: "answers",
        pageDone: 0,
        pageTotal: answerPages.length,
      });

      const blocks: AnswerBlock[] = [];
      let pagesDone = 0;

      for (
        let start = 0;
        start < answerPages.length;
        start = start + MAX_CONCURRENT_PAGES
      ) {
        const batch = answerPages.slice(start, start + MAX_CONCURRENT_PAGES);

        const batchResults = await Promise.all(
          batch.map(async (page) => {
            const response = await postJson("/api/extract-answers", {
              image: page.base64,
              page: page.page,
              provider,
            });

            pagesDone = pagesDone + 1;
            setProgress({
              stage: "answers",
              pageDone: pagesDone,
              pageTotal: answerPages.length,
            });

            return response.blocks as AnswerBlock[];
          }),
        );

        for (const pageBlocks of batchResults) {
          for (const block of pageBlocks) {
            blocks.push(block);
          }
        }
      }

      const emptySheet = checkAnswerBlocks(blocks, answerSheet.file.name);
      if (emptySheet !== null) {
        setProblem(emptySheet);
        setScreen("problem");
        return;
      }

      setProgress({
        stage: "mapping",
        pageDone: answerPages.length,
        pageTotal: answerPages.length,
      });

      const mapResponse = await postJson("/api/map-answers", {
        questions,
        blocks,
        provider,
      });
      const pairs: JoinPair[] = mapResponse.pairs;

      const mismatch = checkMatchQuality(questions, blocks, pairs);
      if (mismatch !== null) {
        setProblem(mismatch);
        setScreen("problem");
        return;
      }

      const mappings = buildMappings(
        questions,
        blocks,
        pairs,
        CONFIDENCE_THRESHOLD,
      );

      setResults({
        usedProvider,
        questions,
        blocks,
        mappings,
        answerPages,
        problems: validateQuestions(questions),
      });
      setScreen("mapping");
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Something went wrong";
      setError(message);
      setScreen("upload");
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        collapsed={sidebarCollapsed || screen !== "upload"}
        onToggle={() => setSidebarCollapsed((value) => !value)}
        onOpenSettings={() => {
          setScreen("upload");
          setSettingsOpen(true);
        }}
      />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <TopBar onOpenSettings={() => {
          setScreen("upload");
          setSettingsOpen(true);
        }} />

        {screen === "upload" && (
          <UploadScreen
            questionPaper={questionPaper}
            answerSheet={answerSheet}
            onPickQuestionPaper={(file) => pickFile(file, setQuestionPaper)}
            onPickAnswerSheet={(file) => pickFile(file, setAnswerSheet)}
            onClearQuestionPaper={() => setQuestionPaper(null)}
            onClearAnswerSheet={() => setAnswerSheet(null)}
            onStart={runPipeline}
            error={error}
            providerLabel={
              provider.name === "openrouter"
                ? `your OpenRouter key${provider.model ? ` (${provider.model})` : ""}`
                : "the built-in Gemini model"
            }
          />
        )}

        {screen === "processing" && <ProcessingScreen progress={progress} />}

        {screen === "problem" && problem !== null && (
          <ProblemScreen
            problem={problem}
            onStartOver={() => {
              setProblem(null);
              setQuestionPaper(null);
              setAnswerSheet(null);
              setScreen("upload");
            }}
          />
        )}

        {screen === "mapping" && results !== null && (
          <MappingScreen
            usedProvider={results.usedProvider}
            mappings={results.mappings}
            questions={results.questions}
            blocks={results.blocks}
            answerPages={results.answerPages}
            problems={results.problems}
          />
        )}
      </div>

      <ProviderSettings
        choice={provider}
        onChange={changeProvider}
        isOpen={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </div>
  );
}
