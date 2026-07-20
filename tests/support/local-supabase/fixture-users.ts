export const FIXTURE_PASSWORD = "LocalE2ePassword!234";

export const E2E_FIXTURE_USERS = {
  onboarding: {
    email: "e2e-onboarding@example.test",
    username: "onboarding_user",
    displayName: "Onboarding Fixture",
  },
  library: {
    email: "e2e-library@example.test",
    username: "library_user",
    displayName: "Library Fixture",
  },
  signout: {
    email: "e2e-signout@example.test",
    username: "signout_user",
    displayName: "Sign Out Fixture",
  },
} as const;

export const ACTION_FIXTURE_USERS = {
  actionAlice: {
    email: "action-alice@example.test",
    username: "action_alice",
    displayName: "Action Alice",
  },
  actionBob: {
    email: "action-bob@example.test",
    username: "action_bob",
    displayName: "Action Bob",
  },
  actionCarol: {
    email: "action-carol@example.test",
    username: "action_carol",
    displayName: "Action Carol",
  },
  actionAdmin: {
    email: "action-admin@example.test",
    username: "action_admin",
    displayName: "Action Admin",
  },
  actionNonAdmin: {
    email: "action-non-admin@example.test",
    username: "action_non_admin",
    displayName: "Action Non-admin",
  },
} as const;

export const FIXTURE_USERS = E2E_FIXTURE_USERS;

export type FixtureUserName = keyof typeof E2E_FIXTURE_USERS;
export type ActionFixtureUserName = keyof typeof ACTION_FIXTURE_USERS;
export type FixtureUserIds = Record<FixtureUserName, string>;
export type ActionFixtureUserIds = Record<ActionFixtureUserName, string>;
