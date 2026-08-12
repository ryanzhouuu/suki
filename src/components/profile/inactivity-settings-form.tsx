"use client";

import { useActionState } from "react";

import {
  updateInactivitySettings,
  type InactivityActionState,
} from "@/actions/inactivity";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_AUTO_PAUSE_DAYS,
  DEFAULT_DROP_PROMPT_DAYS,
  MAX_INACTIVITY_DAYS,
  MIN_INACTIVITY_DAYS,
} from "@/lib/inactivity/settings";

type InactivitySettingsFormProps = {
  autoPauseDays?: number;
  dropPromptDays?: number;
  action?: (
    previous: InactivityActionState,
    formData: FormData,
  ) => Promise<InactivityActionState>;
};

export function InactivitySettingsForm({
  autoPauseDays = DEFAULT_AUTO_PAUSE_DAYS,
  dropPromptDays = DEFAULT_DROP_PROMPT_DAYS,
  action = updateInactivitySettings,
}: InactivitySettingsFormProps) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-4 border-t border-line pt-6">
      <div>
        <p className="text-sm font-semibold text-ink">Library automation</p>
        <p className="mt-1 text-xs text-muted">
          Keep inactive titles tidy. Only watching more episodes resets the
          activity timer; manually resuming a title starts a fresh window.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="auto_pause_days">Auto-pause after</Label>
          <div className="mt-1 flex items-center gap-2">
            <Input
              id="auto_pause_days"
              name="auto_pause_days"
              type="number"
              min={MIN_INACTIVITY_DAYS}
              max={MAX_INACTIVITY_DAYS}
              defaultValue={autoPauseDays}
              required
            />
            <span className="text-sm text-muted">days</span>
          </div>
          <p className="mt-1 text-xs text-faint">
            Move inactive watching titles to paused.
          </p>
        </div>

        <div>
          <Label htmlFor="drop_prompt_days">Ask about dropping after</Label>
          <div className="mt-1 flex items-center gap-2">
            <Input
              id="drop_prompt_days"
              name="drop_prompt_days"
              type="number"
              min={MIN_INACTIVITY_DAYS}
              max={MAX_INACTIVITY_DAYS}
              defaultValue={dropPromptDays}
              required
            />
            <span className="text-sm text-muted">days</span>
          </div>
          <p className="mt-1 text-xs text-faint">
            Remind you again after the same interval if kept paused.
          </p>
        </div>
      </div>

      {state.error ? (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.message ? (
        <p className="text-sm text-success" role="status">
          {state.message}
        </p>
      ) : null}

      <Button type="submit" variant="secondary" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Save automation settings"}
      </Button>
    </form>
  );
}
