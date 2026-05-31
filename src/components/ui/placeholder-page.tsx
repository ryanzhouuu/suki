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
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {title}
        </h1>
        <p className="mt-2 max-w-xl text-zinc-600 dark:text-zinc-400">
          {description}
        </p>
      </div>
      {milestone ? (
        <p className="inline-flex rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          Planned: {milestone}
        </p>
      ) : null}
    </div>
  );
}
