import { QuestionView } from "@/features/questions/components/question-view";
import type { QuestionResponse } from "@/lib/questions/answer-key";
import type { CandidateQuestion } from "@/lib/questions/public";

/** Question et réponse du candidat, en lecture seule, avec les bonnes propositions signalées. */
export function ReadOnlyQuestion({
  question,
  response,
  correctLabels,
}: {
  question: CandidateQuestion;
  response: QuestionResponse | null;
  correctLabels: string[];
}) {
  return <QuestionView question={question} response={response} disabled feedback={{ correctLabels }} />;
}
