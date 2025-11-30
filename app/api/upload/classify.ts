import { rules } from "@/lib/rules";

export function formatAndClassifyValues(values: string[], types: string[]) {
  const formattedValues = values.map((value, index) => {
    const type = types[index].toUpperCase();

    if (!value || value === "") {
      return "NULL";
    }

    if (isDateType(type)) {
      return formatDateValue(value);
    }

    if (isTextType(type)) {
      return formatTextValue(value);
    }

    if (isNumericType(type)) {
      return formatNumericValue(value);
    }

    if (isBooleanType(type)) {
      return formatBooleanValue(value);
    }

    // Default: treat as text
    return formatTextValue(value);
  });

  // Classify transaction based on narration (index 1) and add as new value
  if (values[1]) {
    const transactionType = classifyTransaction(values[1]);
    formattedValues.push(formatTextValue(transactionType));
  }

  return formattedValues;
}

function classifyTransaction(narration: string): string {
  const upperNarration = narration.toUpperCase();

  for (const rule of rules) {
    for (const keyword of rule.keywords) {
      if (upperNarration.includes(keyword)) {
        return rule.type;
      }
    }
  }

  // Default category if no rule matches
  return "OTHER";
}

function isDateType(type: string): boolean {
  return type.includes("DATE") || type.includes("TIMESTAMP");
}

function isTextType(type: string): boolean {
  return type === "TEXT" || type === "VARCHAR" || type.includes("CHAR");
}

function isNumericType(type: string): boolean {
  const numericTypes = [
    "INTEGER",
    "NUMERIC",
    "DECIMAL",
    "FLOAT",
    "BIGINT",
    "SMALLINT",
  ];
  return numericTypes.includes(type);
}

function isBooleanType(type: string): boolean {
  return type === "BOOLEAN" || type === "BOOL";
}

function formatDateValue(value: string): string {
  try {
    // DD/MM/YY or DD/MM/YYYY
    if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(value)) {
      const [day, month, year] = value.split("/");
      const fullYear = year.length === 2 ? `20${year}` : year;
      return `'${fullYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}'`;
    }

    // MM/DD/YYYY (US format - when first part > 12)
    if (
      /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value) &&
      parseInt(value.split("/")[0]) > 12
    ) {
      const [month, day, year] = value.split("/");
      return `'${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}'`;
    }

    // DD-MM-YYYY
    if (/^\d{1,2}-\d{1,2}-\d{2,4}$/.test(value)) {
      const [day, month, year] = value.split("-");
      const fullYear = year.length === 2 ? `20${year}` : year;
      return `'${fullYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}'`;
    }

    return `'${value}'`;
  } catch (e) {
    console.error(`Failed to parse date: ${value}`, e);
    return "NULL";
  }
}

function formatTextValue(value: string): string {
  const escaped = value
    .replace(/'/g, "''") // Escape single quotes
    .replace(/\\/g, "\\\\") // Escape backslashes
    .replace(/"/g, '""'); // Escape double quotes
  return `'${escaped}'`;
}

function formatNumericValue(value: string): string {
  const numericValue = value.replace(/[^0-9.-]/g, "");
  return numericValue || "NULL";
}

function formatBooleanValue(value: string): string {
  const lowerValue = value.toLowerCase();
  const truthy = ["true", "t", "1", "yes"];
  const falsy = ["false", "f", "0", "no"];

  if (truthy.includes(lowerValue)) return "true";
  if (falsy.includes(lowerValue)) return "false";
  return "NULL";
}
