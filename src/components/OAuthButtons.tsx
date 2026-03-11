import { GitHubIcon, GoogleIcon } from './OAuthIcons';
import type { ReactNode } from 'react';

type Provider = 'google' | 'github';

interface OAuthButtonsProps {
  onGoogleClick: () => void;
  onGitHubClick: () => void;
  loadingProvider: Provider | null;
  disabled?: boolean;
}

function Button({
  onClick,
  disabled,
  loading,
  icon,
  label,
}: {
  onClick: () => void;
  disabled?: boolean;
  loading: boolean;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-bg py-2.5 px-4 text-sm font-medium text-text-main hover:bg-surface-hover transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-text-muted border-t-transparent rounded-full animate-spin" />
      ) : (
        icon
      )}
      {loading ? 'Connecting...' : label}
    </button>
  );
}

export function OAuthButtons({ onGoogleClick, onGitHubClick, loadingProvider, disabled }: OAuthButtonsProps) {
  return (
    <div className="space-y-3">
      <Button
        onClick={onGoogleClick}
        disabled={disabled || !!loadingProvider}
        loading={loadingProvider === 'google'}
        icon={<GoogleIcon />}
        label="Continue with Google"
      />
      <Button
        onClick={onGitHubClick}
        disabled={disabled || !!loadingProvider}
        loading={loadingProvider === 'github'}
        icon={<GitHubIcon />}
        label="Continue with GitHub"
      />
    </div>
  );
}
