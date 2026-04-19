/**
 * Duhigg reward-substitution map. Keyed by the reward category the user
 * identified in the bad-habit diagnostic. Each entry is an i18n key resolving
 * to a short actionable routine that targets the same reward through a
 * healthier behavior.
 *
 * Delivered as i18n keys so Polish ships as primary copy; other locales
 * follow from the JSON files.
 */

export type RewardType =
  | 'stimulation'
  | 'escape'
  | 'comfort'
  | 'connection'
  | 'control'
  | 'other';

export const REWARD_TYPES: RewardType[] = [
  'stimulation',
  'escape',
  'comfort',
  'connection',
  'control',
  'other',
];

export const SUBSTITUTE_KEYS: Record<RewardType, readonly string[]> = {
  stimulation: [
    'substitute.stimulation.pushups',
    'substitute.stimulation.coldWater',
    'substitute.stimulation.callSomeone',
  ],
  escape: [
    'substitute.escape.breathing',
    'substitute.escape.shortWalk',
    'substitute.escape.journal',
  ],
  comfort: [
    'substitute.comfort.warmDrink',
    'substitute.comfort.favoriteSong',
    'substitute.comfort.breathWork',
  ],
  connection: [
    'substitute.connection.textFriend',
    'substitute.connection.checkPartner',
    'substitute.connection.hugFamily',
  ],
  control: [
    'substitute.control.tidyOne',
    'substitute.control.listChoices',
    'substitute.control.pickOneMeal',
  ],
  other: [
    'substitute.other.pause',
    'substitute.other.nameFeeling',
    'substitute.other.fiveSenses',
  ],
};
