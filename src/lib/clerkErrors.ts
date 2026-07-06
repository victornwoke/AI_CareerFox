type ClerkLikeError = {
  longMessage?: string;
  message?: string;
  global?: {
    longMessage?: string;
    message?: string;
  }[];
  raw?: {
    longMessage?: string;
    message?: string;
  }[];
  errors?: {
    code?: string;
    longMessage?: string;
    long_message?: string;
    message?: string;
  }[];
};

const fallbackMessage = "Something went wrong. Please try again.";

export function getClerkErrorMessage(error: unknown): string {
  if (!error) {
    return fallbackMessage;
  }

  if (typeof error === "string") {
    return error;
  }

  if (typeof error !== "object") {
    return fallbackMessage;
  }

  const clerkError = error as ClerkLikeError;
  const firstNestedError = clerkError.errors?.[0];
  const firstGlobalError = clerkError.global?.[0];
  const firstRawError = clerkError.raw?.[0];

  return (
    firstNestedError?.longMessage ||
    firstNestedError?.long_message ||
    firstNestedError?.message ||
    firstGlobalError?.longMessage ||
    firstGlobalError?.message ||
    firstRawError?.longMessage ||
    firstRawError?.message ||
    clerkError.longMessage ||
    clerkError.message ||
    (error instanceof Error ? error.message : undefined) ||
    fallbackMessage
  );
}
