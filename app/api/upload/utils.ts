import { prisma } from "@/lib/prisma";
import { rules } from "@/lib/rules";
import { mistral } from "@ai-sdk/mistral";
import { generateObject } from "ai";
import { z } from "zod";

export async function getHeadersandTypes(lines: string[]) {
  if (lines.length === 0) {
    return { headers: [], types: [] };
  }

  const { object } = await generateObject({
    model: mistral("mistral-small-latest"),
    schema: z.object({
      headers: z.array(z.string()),
      types: z.array(z.string()),
    }),
    prompt:
      "lines: ```" +
      lines.join("\n") +
      "```\n\nExtract the headers and their data types from the above lines. Return the headers as an array of strings and the types as an array of strings (e.g., string, number, date, boolean). I want to use this for SQL table creation, so headers and types should be accurate for PostgreSQL. Strictly return only a JSON object with 'headers' and 'types' keys, no other text, explanations, or formatting.",
  });
  return object;
}

export async function createTableSQL(
  tableName: string,
  headers: string[],
  types: string[]
) {
  const allHeaders = [...headers, "transaction_type"];
  const allTypes = [...types, "TEXT"];

  const columns = allHeaders
    .map((header, index) => {
      const type = allTypes[index] || "TEXT";
      return `"${header}" ${type.toUpperCase()}`;
    })
    .join(",\n  ");

  const query = `CREATE TABLE IF NOT EXISTS "${tableName}" (\n  ${columns}\n);`;

  await prisma.$executeRawUnsafe(query);

  return query;
}

// Classification function example
function classifyTransaction(
  description: string,
  amount: number | null
): string {
  const desc = description.toUpperCase();

  for (const rule of rules) {
    for (const kw of rule.keywords) {
      if (desc.includes(kw)) {
        return rule.type;
      }
    }
  }

  if (amount != null) {
    if (amount > 0) {
      return "INCOME.Unknown";
    } else if (amount < 0) {
      return "EXPENSE.Unknown";
    }
  }

  return "UNCLASSIFIED";
}
