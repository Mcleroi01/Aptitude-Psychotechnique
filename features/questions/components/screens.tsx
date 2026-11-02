import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppError } from "@/lib/errors";
import { bankPaths, type BankRef } from "@/features/questions/bank";
import { CategoryManager } from "@/features/questions/components/category-manager";
import { QuestionEditor } from "@/features/questions/components/question-editor";
import { parseQuestionFilters, QuestionList } from "@/features/questions/components/question-list";
import { emptyEditorValues, toEditorValues } from "@/schemas/question";
import { listCategories } from "@/services/category.service";
import { getQuestion, type BankScope } from "@/services/question.service";
import { signedReadUrl } from "@/services/storage.service";

/**
 * Écrans communs à la banque Aptitude (administration) et aux banques privées.
 * Les pages appelantes vérifient les droits avant de les afficher.
 */

type Bank = { bank: BankRef; scope: BankScope; title: string; description: string };

export async function QuestionBankScreen({
  bank,
  scope,
  title,
  description,
  searchParams,
}: Bank & { searchParams: Record<string, string | string[] | undefined> }) {
  const paths = bankPaths(bank);
  const categories = await listCategories(scope);

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">{title}</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>
        </div>
        <Button asChild size="lg">
          <Link href={paths.newQuestion}>
            <Plus data-icon="inline-start" /> Nouvelle question
          </Link>
        </Button>
      </div>
      <div className="mt-8">
        <QuestionList bank={bank} scope={scope} filters={parseQuestionFilters(searchParams)} categories={categories} />
      </div>
    </>
  );
}

export async function QuestionEditorScreen({ bank, scope, questionId }: { bank: BankRef; scope: BankScope; questionId?: string }) {
  const paths = bankPaths(bank);
  const categories = (await listCategories(scope)).map(({ id, name }) => ({ id, name }));

  let question: Awaited<ReturnType<typeof getQuestion>> | null = null;
  if (questionId) {
    try {
      question = await getQuestion(scope, questionId);
    } catch (error) {
      if (error instanceof AppError && error.code === "NOT_FOUND") notFound();
      throw error;
    }
  }

  const [imageUrl, attachmentUrl] = await Promise.all([
    signedReadUrl("image", question?.imagePath ?? null),
    signedReadUrl("attachment", question?.attachmentPath ?? null),
  ]);

  const editable = !question || question.isLatest;

  return (
    <>
      <Link href={paths.questions} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> Banque de questions
      </Link>
      <h1 className="mt-3 text-3xl font-semibold">
        {question ? `Modifier la question${question.version > 1 ? ` (v${question.version})` : ""}` : "Nouvelle question"}
      </h1>
      {!editable ? (
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Cette version a été remplacée par une version plus récente et n&apos;est plus modifiable.
        </p>
      ) : (
        <div className="mt-8">
          <QuestionEditor
            bank={bank}
            questionId={question?.id ?? null}
            initialValues={question ? toEditorValues(question) : emptyEditorValues()}
            initialMedia={{
              image: question?.imagePath ? { path: question.imagePath, name: "Image actuelle", previewUrl: imageUrl } : null,
              attachment: question?.attachmentPath
                ? { path: question.attachmentPath, name: question.attachmentName ?? "Document", previewUrl: attachmentUrl }
                : null,
            }}
            categories={categories}
            listPath={paths.questions}
            versionedOnSave={(question?._count.answers ?? 0) > 0}
          />
        </div>
      )}
    </>
  );
}

export async function CategoriesScreen({ bank, scope, title, description }: Bank) {
  const categories = await listCategories(scope);
  return (
    <>
      <h1 className="text-3xl font-semibold">{title}</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>
      <div className="mt-8">
        <CategoryManager
          bank={bank}
          categories={categories.map((c) => ({
            id: c.id,
            name: c.name,
            description: c.description,
            questionCount: c._count.questions,
          }))}
        />
      </div>
    </>
  );
}
