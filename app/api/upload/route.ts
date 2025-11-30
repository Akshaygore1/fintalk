import { NextResponse } from "next/server";
import { createTableSQL, getHeadersandTypes } from "./utils";
import { prisma } from "@/lib/prisma";
import { formatAndClassifyValues } from "./classify";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  const response = {
    size: file.size,
    name: file.name,
    type: file.type,
  };

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const fileContent = await file.text();
  const lines = fileContent.split("\n").filter((line) => line.trim() !== ""); // Remove empty lines

  // Get the first 5 rows (assuming each line is a row)
  const first5Rows = lines.slice(0, 5);
  const { headers, types } = await getHeadersandTypes(first5Rows);

  // create table
  const createTableQuery = await createTableSQL(
    "your_table_name",
    headers,
    types
  );
  console.log("Create Table Query:", createTableQuery);

  // Insert data into the table
  const dataRows = lines.slice(1); // Skip the header row
  console.log("Data Rows:", dataRows.length);
  // Filter out empty rows and process data
  const validRows = dataRows.filter((row) => row.trim() !== "");

  for (const row of validRows) {
    const values = row.split(",").map((value) => value.trim());

    // Ensure we have the right number of values
    if (values.length !== headers.length) {
      console.warn(`Skipping row with incorrect number of values: ${row}`);
      continue;
    }

    // Format values based on their types
    const formattedValues = formatAndClassifyValues(values, types);

    // Insert each row individually to better handle errors
    const columns = [...headers, "transaction_type"]
      .map((h) => `"${h}"`)
      .join(", ");
    const insertQuery = `
      INSERT INTO your_table_name (${columns})
      VALUES (${formattedValues.join(", ")});
    `;
    console.log("Insert Query:", insertQuery);
    try {
      await prisma.$executeRawUnsafe(insertQuery);
    } catch (error) {
      console.error(`Failed to insert row: ${row}`, error);
      // Continue with next row instead of failing completely
    }
  }

  return NextResponse.json({ response, headers, types }, { status: 200 });
}
