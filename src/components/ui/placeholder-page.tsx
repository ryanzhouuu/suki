type PlaceholderPageProps = {
  title: string;
  description: string;
  milestone?: string;
};

export function PlaceholderPage({
  title,
  description,
  milestone,
}: PlaceholderPageProps) {
  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center text-center">
      <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft font-display text-2xl font-semibold text-accent">
        友
      </span>
      <h1 className="text-4xl font-semibold">{title}</h1>
      <p className="mt-3 max-w-md text-muted">{description}</p>
      {milestone ? (
        <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface px-3.5 py-1.5 text-xs font-medium text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          Coming in {milestone}
        </p>
      ) : null}
    </div>
  );
}
