import { Link } from 'react-router-dom';
import { RelayIcon } from '../components/RelayLogo';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg text-text-main font-sans flex flex-col items-center justify-center px-6">
      <div className="mb-8">
        <RelayIcon size={64} className="text-accent opacity-20" />
      </div>
      
      <div className="text-center max-w-md bg-surface border border-border p-12 rounded-2xl shadow-sm">
        <p className="text-sm font-bold text-accent uppercase tracking-widest mb-2">404 Error</p>
        <h1 className="text-4xl font-bold tracking-tight mb-4">Lost in orbit?</h1>
        <p className="text-text-muted mb-10 leading-relaxed text-lg">
          The page you&apos;re looking for doesn&apos;t exist or has been moved to a different coordinate.
        </p>
        
        <Link
          to="/"
          className="inline-flex h-12 px-8 rounded-lg bg-accent text-white font-medium items-center justify-center hover:bg-emerald-600 transition-all w-full shadow-lg shadow-accent/10"
        >
          Return to base
        </Link>
      </div>
      
      <p className="mt-12 text-sm text-text-muted">
        &copy; {new Date().getFullYear()} Relay. All systems operational.
      </p>
    </div>
  );
}
