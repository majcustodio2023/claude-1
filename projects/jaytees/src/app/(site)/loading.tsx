export default function Loading() {
  return (
    <div className="min-h-[100svh] bg-ink">
      <div className="topbar" />
      <div className="wrap pt-[110px]">
        <div className="skeleton-dark h-4 w-40" />
        <div className="skeleton-dark mt-6 h-14 w-3/4 max-w-2xl" />
        <div className="skeleton-dark mt-3 h-14 w-1/2 max-w-xl" />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <div className="skeleton-dark h-44" /><div className="skeleton-dark h-44" /><div className="skeleton-dark h-44" />
        </div>
      </div>
    </div>
  );
}
