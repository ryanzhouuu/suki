import { prepareFixtures } from "../support/scenario-builder";

export default async function globalSetup(): Promise<void> {
  await prepareFixtures();
}
