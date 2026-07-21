
export function safeJsonStringify(obj: any): string {
  if (obj === undefined) return "undefined";
  if (obj === null) return "null";
  
  const seen = new WeakSet();
  
  const replacer = (key: string, value: any) => {
    // Basic types don't need circularity checks
    if (value === null || typeof value !== "object") {
      return value;
    }

    // Handle special types that might have circularity or non-serializable parts
    if (value instanceof Error) {
      return {
        name: value.name,
        message: value.message,
        stack: value.stack
      };
    }

    // Skip DOM nodes and other complex native objects that shouldn't be serialized
    if (value instanceof Node || (value.constructor && (value.constructor.name === 'Window' || value.constructor.name === 'Location'))) {
      return `[Native ${value.constructor?.name || 'Object'}]`;
    }

    // Circularity check
    if (seen.has(value)) {
      return "[Circular]";
    }
    seen.add(value);

    // If it's a known non-serializable type, stringify it
    if (typeof value.toMillis === 'function') return value.toMillis();
    if (typeof value.isEqual === 'function' && value.path) return value.path;

    return value;
  };

  try {
    return JSON.stringify(obj, replacer);
  } catch (e) {
    return `{"error": "Failed to stringify object", "message": "${e instanceof Error ? e.message : String(e)}"}`;
  }
}
