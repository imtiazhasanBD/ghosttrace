/**
 * SQL Redaction, Formatting, and Span Classification Utilities
 * Provides safe formatting and redaction for SQL and Prisma ORM telemetry.
 */

// Regex patterns for sensitive database values
const SENSITIVE_SQL_CLAUSES = [
  /(password|secret|token|bearer|apikey|api_key|access_token|refresh_token|card_number|cvv|ssn)\s*(=|LIKE|ILIKE|IN)\s*(?:'[^']*'|"[^"]*"|\S+)/gi,
  /(?:Bearer\s+)[A-Za-z0-9_\-\.]+/gi,
  /\beyJ[A-Za-z0-9_\-]+\.eyJ[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+\b/g,
  /\b(?:\d{4}[ -]?){3}\d{4}\b/g,
];

/**
 * Redact sensitive secrets from a SQL statement before storage or display.
 */
export function redactSql(sql?: string | null): string {
  if (!sql || typeof sql !== 'string') return '';
  let sanitized = sql;

  for (const pattern of SENSITIVE_SQL_CLAUSES) {
    sanitized = sanitized.replace(pattern, (match, field, op) => {
      if (field && op) {
        return `${field} ${op} '[REDACTED]'`;
      }
      if (match.toLowerCase().startsWith('bearer')) {
        return 'Bearer [REDACTED]';
      }
      return '[REDACTED]';
    });
  }

  return sanitized;
}

/**
 * Major SQL keywords that start new lines with top-level alignment
 */
const MAJOR_SQL_KEYWORDS = [
  'SELECT',
  'FROM',
  'WHERE',
  'AND',
  'OR',
  'INNER JOIN',
  'LEFT JOIN',
  'RIGHT JOIN',
  'FULL JOIN',
  'CROSS JOIN',
  'JOIN',
  'ON',
  'GROUP BY',
  'ORDER BY',
  'HAVING',
  'LIMIT',
  'OFFSET',
  'INSERT INTO',
  'VALUES',
  'UPDATE',
  'SET',
  'DELETE FROM',
  'RETURNING',
  'UNION ALL',
  'UNION',
];

/**
 * Format raw SQL safely with indentation and uppercase clauses without external heavy dependencies.
 * If raw SQL is not parseable or empty, returns gracefully.
 */
export function formatSql(rawSql?: string | null): string {
  if (!rawSql || typeof rawSql !== 'string') return '';
  const trimmed = rawSql.trim();
  if (!trimmed) return '';

  try {
    // 1. Tokenize into string literals and non-string chunks to avoid altering strings
    const tokens: Array<{ isString: boolean; text: string }> = [];
    let current = '';
    let inQuote: "'" | '"' | null = null;

    for (let i = 0; i < trimmed.length; i++) {
      const char = trimmed[i];
      if ((char === "'" || char === '"') && (i === 0 || trimmed[i - 1] !== '\\')) {
        if (!inQuote) {
          if (current.length > 0) {
            tokens.push({ isString: false, text: current });
            current = '';
          }
          inQuote = char;
          current += char;
        } else if (inQuote === char) {
          current += char;
          tokens.push({ isString: true, text: current });
          current = '';
          inQuote = null;
        } else {
          current += char;
        }
      } else {
        current += char;
      }
    }
    if (current.length > 0) {
      tokens.push({ isString: !!inQuote, text: current });
    }

    // 2. Normalize whitespace in non-string tokens
    let normalized = '';
    for (const token of tokens) {
      if (token.isString) {
        normalized += token.text;
      } else {
        normalized += token.text.replace(/\s+/g, ' ');
      }
    }

    // 3. Insert newlines before major SQL keywords (case-insensitively)
    let formatted = normalized;
    for (const kw of MAJOR_SQL_KEYWORDS) {
      const regex = new RegExp(`\\b(${kw})\\b`, 'gi');
      formatted = formatted.replace(regex, '\n$1');
    }

    // 4. Clean up lines and indentation
    const lines = formatted
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const indentedLines = lines.map((line, idx) => {
      const upper = line.toUpperCase();
      if (idx === 0) return line;

      if (
        upper.startsWith('AND') ||
        upper.startsWith('OR') ||
        upper.startsWith('ON') ||
        upper.startsWith('SET') ||
        upper.startsWith('VALUES')
      ) {
        return `  ${line}`;
      }
      return line;
    });

    return indentedLines.join('\n');
  } catch {
    return trimmed;
  }
}

/**
 * Check if a span represents a database query/operation.
 */
export function isDatabaseSpan(span: { name?: string; attributes?: Record<string, any> }): boolean {
  if (!span) return false;
  const name = span.name || '';
  const attrs = span.attributes || {};

  if (name.startsWith('prisma.') || name.startsWith('db.')) return true;
  if (attrs['db.system'] || attrs['db.operation'] || attrs['db.statement'] || attrs['sql']) return true;

  const upper = name.toUpperCase();
  if (
    upper.startsWith('SELECT') ||
    upper.startsWith('INSERT') ||
    upper.startsWith('UPDATE') ||
    upper.startsWith('DELETE')
  ) {
    return true;
  }

  return false;
}

/**
 * Extract structured database metadata from a span.
 * Handles both Prisma ORM spans (without raw SQL) and raw SQL spans safely.
 */
export function parseDatabaseSpanInfo(span: {
  name: string;
  attributes?: Record<string, any>;
  durationMs?: number;
}): {
  dbSystem: string;
  operation: string;
  model?: string;
  statement: string | null;
  formattedStatement: string | null;
  isRawSql: boolean;
  displaySummary: string;
} {
  const attrs = span.attributes || {};
  const name = span.name || '';

  const dbSystem = String(attrs['db.system'] || (name.startsWith('prisma.') ? 'prisma' : 'database'));
  let operation = String(attrs['db.operation'] || '');
  let model = attrs['db.sql.table'] || attrs['prisma.model'] || undefined;

  // Extract from Prisma span name: prisma.<model>.<action>
  if (name.startsWith('prisma.')) {
    const parts = name.split('.');
    if (parts.length >= 3) {
      if (!model) model = parts[1];
      if (!operation) operation = parts[2];
    } else if (parts.length === 2 && !operation) {
      operation = parts[1];
    }
  }

  if (!operation) {
    operation = name.split(' ')[0] || 'QUERY';
  }

  const rawStatement = attrs['db.statement'] || attrs['sql'] || null;
  const hasRawSql = Boolean(rawStatement && typeof rawStatement === 'string' && rawStatement.trim().length > 0);

  const redactedStatement = hasRawSql ? redactSql(rawStatement) : null;
  const formattedStatement = hasRawSql ? formatSql(redactedStatement) : null;

  // Generate clean display summary
  let displaySummary = '';
  if (hasRawSql) {
    displaySummary = rawStatement.replace(/\s+/g, ' ').slice(0, 120);
  } else if (model) {
    displaySummary = `prisma.${model}.${operation}()`;
  } else {
    displaySummary = `${dbSystem}.${operation}`;
  }

  return {
    dbSystem,
    operation,
    model: model ? String(model) : undefined,
    statement: redactedStatement,
    formattedStatement,
    isRawSql: hasRawSql,
    displaySummary,
  };
}
