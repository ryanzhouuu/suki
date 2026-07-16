export const FIXTURE_PASSWORD = "LocalE2ePassword!234";

export const FIXTURE_USERS = {
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

export type FixtureUserName = keyof typeof FIXTURE_USERS;

export type FixtureUserIds = Record<FixtureUserName, string>;
