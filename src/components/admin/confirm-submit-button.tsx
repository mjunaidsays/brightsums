"use client";

/**
 * Submit button for a destructive `<form action={...}>` (delete/remove
 * actions) that gates the submit behind a native confirm() prompt — this
 * repo has no confirm-dialog UI primitive yet, and a plain confirm() is the
 * minimal way to stop an accidental click on an irreversible action.
 */
export function ConfirmSubmitButton({
  confirmMessage,
  className,
  children,
}: {
  confirmMessage: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(confirmMessage)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
