"use client";

import { useState } from "react";

export type ProfileTab = {
  id: string;
  label: string;
  count?: number | null;
  content: React.ReactNode;
};

type ProfileTabsProps = {
  tabs: ProfileTab[];
};

export function ProfileTabs({ tabs }: ProfileTabsProps) {
  const [active, setActive] = useState(tabs[0]?.id ?? "");

  return (
    <div className="space-y-6">
      <div className="profile-tabbar" role="tablist" aria-label="Profile sections">
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              data-active={isActive}
              className="profile-tabbar__tab"
              onClick={() => setActive(tab.id)}
            >
              <span>{tab.label}</span>
              {typeof tab.count === "number" ? (
                <span className="profile-tabbar__count">{tab.count}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {tabs.map((tab) =>
        tab.id === active ? (
          <div key={tab.id} role="tabpanel" className="animate-rise">
            {tab.content}
          </div>
        ) : null,
      )}
    </div>
  );
}
