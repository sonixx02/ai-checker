export type Region = {
  page: number;
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
};

export type Question = {
  id: string;
  number: number;
  subpart: string | null;
  order: number;
  text: string;
  context: string | null;
  maxMarks: number | null;
};

export type AnswerBlock = {
  id: string;
  writtenLabel: string | null;
  text: string;
  regions: Region[];
  confidence: number;
};

export type MappingStatus =
  | "matched"
  | "unanswered"
  | "unmatched"
  | "low-confidence";

export type Mapping = {
  questionId: string | null;
  blockIds: string[];
  status: MappingStatus;
  score: { awarded: number; max: number } | null;
  feedback: string | null;
};
