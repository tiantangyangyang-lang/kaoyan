import type { QuestionBank, SubjectCode } from "./types";

interface SubjectCatalog {
  subjects: Array<{
    code: SubjectCode;
    name: string;
    questionBankUrl?: string;
    enabled: boolean;
    questionCount: number;
  }>;
}

export async function loadSubjectCatalog(): Promise<SubjectCatalog> {
  const response = await fetch("/data/subjects.json");
  if (!response.ok) throw new Error("无法加载科目目录");
  return (await response.json()) as SubjectCatalog;
}

export async function loadQuestionBank(url: string): Promise<QuestionBank> {
  const response = await fetch(url);
  if (!response.ok) throw new Error("无法加载题库");
  const bank = (await response.json()) as QuestionBank;
  if (!Array.isArray(bank.questions)) throw new Error("题库格式不正确");
  return bank;
}
