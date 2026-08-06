import type { FingerprintFacts } from "./facts";
import type {
  FingerprintTrait,
  FingerprintTraitId,
  TraitFamily,
} from "./types";

export type FingerprintCandidate = FingerprintTrait & {
  opposingTraitIds: readonly FingerprintTraitId[];
  editorialPriority: number;
};

export type FingerprintRule = {
  id: FingerprintTraitId;
  family: TraitFamily;
  label: string;
  summary: string;
  editorialPriority: number;
  opposingTraitIds?: readonly FingerprintTraitId[];
  evaluate: (facts: FingerprintFacts) => FingerprintCandidate | null;
};
