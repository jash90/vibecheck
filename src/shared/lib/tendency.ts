/**
 * Rubin's Four Tendencies scorer for the 2-question onboarding quiz.
 *
 * Each question has four answers, each mapping to one tendency. The quiz is
 * short, so we use a trivial rule: two matching answers → that tendency;
 * mismatched answers → `obliger`. Obliger is the safest default — external
 * accountability nudges help Obligers and don't actively harm the other three.
 */

export type Tendency = 'upholder' | 'questioner' | 'obliger' | 'rebel';

export const TENDENCIES = ['upholder', 'questioner', 'obliger', 'rebel'] as const;

/** Quiz answers are a sparse array of length 2. `null` means skipped. */
export type TendencyAnswers = readonly (Tendency | null)[];

export function computeTendency(answers: TendencyAnswers): Tendency {
  const valid = answers.filter((a): a is Tendency => a !== null);
  if (valid.length === 0) return 'obliger';
  if (valid.length === 1) return valid[0]!;
  return valid[0] === valid[1] ? valid[0]! : 'obliger';
}
