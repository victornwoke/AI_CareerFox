import { interviewQuestions } from "@/data/interviewQuestions";
import { targetRoles } from "@/data/roles";
import type { InterviewQuestion } from "@/types/career";

export type BehavioralLesson = InterviewQuestion & {
  lessonNumber: number;
  roleTitle: string;
  tags: string[];
};

const difficultyLabels = {
  advanced: "Advanced",
  beginner: "Beginner",
  intermediate: "Intermediate",
} satisfies Record<InterviewQuestion["difficulty"], string>;

const tagByDifficulty = {
  advanced: "Impact",
  beginner: "Confidence",
  intermediate: "Clarity",
} satisfies Record<InterviewQuestion["difficulty"], string>;

function getRoleTitle(roleId: string) {
  return targetRoles.find((role) => role.id === roleId)?.title ?? "Career";
}

export function getBehavioralLessons(selectedRoleId: string | null) {
  const behavioralQuestions = interviewQuestions.filter(
    (question) => question.category === "behavioral",
  );
  const preferredQuestions = selectedRoleId
    ? behavioralQuestions.filter((question) => question.roleId === selectedRoleId)
    : [];
  const remainingQuestions = behavioralQuestions.filter(
    (question) => question.roleId !== selectedRoleId,
  );

  return [...preferredQuestions, ...remainingQuestions].map(
    (question, index): BehavioralLesson => ({
      ...question,
      lessonNumber: index + 1,
      roleTitle: getRoleTitle(question.roleId),
      tags: [
        difficultyLabels[question.difficulty],
        question.expectedStructure,
        tagByDifficulty[question.difficulty],
      ],
    }),
  );
}

export function getActiveBehavioralLesson({
  activeQuestionId,
  completedQuestionIds,
  lessons,
}: {
  activeQuestionId: string | null;
  completedQuestionIds: string[];
  lessons: BehavioralLesson[];
}) {
  const completedQuestionIdSet = new Set(completedQuestionIds);

  return (
    lessons.find((lesson) => lesson.id === activeQuestionId) ??
    lessons.find((lesson) => !completedQuestionIdSet.has(lesson.id)) ??
    lessons[0] ??
    null
  );
}

export function getNextBehavioralLesson({
  currentQuestionId,
  lessons,
}: {
  currentQuestionId: string;
  lessons: BehavioralLesson[];
}) {
  const currentIndex = lessons.findIndex(
    (lesson) => lesson.id === currentQuestionId,
  );

  if (currentIndex < 0) {
    return lessons[0] ?? null;
  }

  return lessons[currentIndex + 1] ?? null;
}
