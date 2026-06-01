type FilterMatchCountProps = {
  matched: number;
  total: number;
  noun: string;
};

export function FilterMatchCount({ matched, total, noun }: FilterMatchCountProps) {
  return (
    <p className="text-sm text-muted">
      {matched} of {total} {total === 1 ? noun : `${noun}s`} match
    </p>
  );
}
