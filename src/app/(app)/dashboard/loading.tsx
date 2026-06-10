export default function DashboardLoading() {
  return (
    <div className="space-y-ds-20" aria-label="Loading dashboard">
      <div className="h-ds-64 animate-pulse rounded-lg bg-surface-subtle" />
      <div className="h-ds-96 animate-pulse rounded-lg bg-surface-subtle" />
      <div className="min-h-panel-lg animate-pulse rounded-lg bg-surface-subtle" />
    </div>
  );
}
