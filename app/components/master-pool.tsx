"use client";

interface MasterPoolProps {
  masters: string[];
}

export function MasterPool({ masters }: MasterPoolProps) {
  if (masters.length === 0) {
    return (
      <p className="text-sm text-stone-gray">No masters registered</p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {masters.map((id) => (
        <span
          key={id}
          className="rounded-xl bg-terracotta/10 px-3 py-1 text-sm font-medium text-terracotta"
        >
          {id}
        </span>
      ))}
    </div>
  );
}
