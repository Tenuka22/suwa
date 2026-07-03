export default function Loader() {
  return (
    <div className="flex min-h-48 items-center justify-center" role="status" aria-label="Loading">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
    </div>
  );
}
