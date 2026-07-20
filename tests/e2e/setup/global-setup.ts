import { prepareFixtures } from "../../support/local-supabase/scenario-builder";

export default async function globalSetup(): Promise<void> {
  await prepareFixtures();
}
