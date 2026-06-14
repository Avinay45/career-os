const INJECTION_KEYWORDS = [
  /ignore\s+(?:the\s+)?previous\s+instructions/i,
  /ignore\s+(?:the\s+)?above\s+instructions/i,
  /ignore\s+all\s+instructions/i,
  /system\s+override/i,
  /bypass\s+(?:the\s+)?restrictions/i,
  /you\s+are\s+now\s+a/i,
  /new\s+role\s*:/i,
  /forget\s+(?:your\s+)?rules/i,
  /ignore\s+(?:your\s+)?system/i,
  /override\s+system/i,
  /assistant\s*:/i,
  /system\s*:/i,
];

/**
 * Sanitizes untrusted user inputs (such as resume texts, chat queries, and job specs)
 * before injecting them into AI prompts.
 * 
 * 1. Restricts length to prevent token-exhaustion attacks.
 * 2. Neutralizes command overrides by replacing key injection phrases.
 * 3. Escapes XML tags to prevent users from closing prompt layout wrappers.
 */
export function sanitizePromptInput(text: string, maxLength = 15000): string {
  if (!text) return '';

  // 1. Enforce length constraints
  let sanitized = text.slice(0, maxLength);

  // 2. Scan and filter override expressions
  for (const pattern of INJECTION_KEYWORDS) {
    if (pattern.test(sanitized)) {
      sanitized = sanitized.replace(pattern, '[REMOVED_SECURITY_VIOLATION]');
    }
  }

  // 3. Neutralize any XML/HTML tag wrappers to prevent markup escaping
  sanitized = sanitized
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return sanitized;
}
