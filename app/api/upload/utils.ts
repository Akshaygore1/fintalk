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
  const columns = headers
    .map((header, index) => {
      const columnName = `"${header}"`;
      const columnType = types[index];
      return `${columnName} ${columnType}`;
    })
    .join(", ");

  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS ${tableName} (
      ${columns},
      "transaction_type" VARCHAR(50)
    );
  `;

  return createTableQuery;
}
