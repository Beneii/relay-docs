const sizes = {
  xs: "w-3.5 h-3.5",
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-10 h-10",
} as const;

export function LoadingSpinner({
  size = "md",
  className = "",
}: {
  size?: keyof typeof sizes;
  className?: string;
}) {
  return (
    <div
      className={`${sizes[size]} border-2 border-accent border-t-transparent rounded-full animate-spin ${className}`}
    />
  );
}
