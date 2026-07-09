import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg animate-rise py-16 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">404</p>
      <h1 className="mt-3 font-display text-3xl font-semibold">Page not found</h1>
      <p className="mt-2 text-sm text-muted">
        That route doesn&apos;t exist in{' '}
        <span className="font-semibold">
          <span className="text-[#071b45]">think</span>
          <span className="text-[#08c999]">Mern</span>
        </span>
        .
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex rounded-xl bg-ink px-5 py-2.5 text-sm font-medium text-paper"
      >
        Back to home
      </Link>
    </div>
  );
}
