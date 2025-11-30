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
  const lines = fileContent.split("\n").filter((line) => line.trim() !== "");

  const first3Rows = lines.slice(0, 3);
  console.time("Header and Type Extraction");
  const { headers, types } = await getHeadersandTypes(first3Rows);
  console.timeEnd("Header and Type Extraction");
  console.log("Extracted Headers:", headers);
  console.log("Extracted Types:", types);
  const createTableQuery = await createTableSQL(
    "your_table_name",
    headers,
    types
  );

  // Execute the create table query
  try {
    await prisma.$executeRawUnsafe(createTableQuery);
  } catch (error) {
    console.error("Failed to create table:", error);
  }

  const dataRows = lines.slice(1);
  const validRows = dataRows.filter((row) => row.trim() !== "");
  console.time("Total classification time");
  for (const row of validRows) {
    const values = row.split(",").map((value) => value.trim());
    if (values.length !== headers.length) {
      console.warn(`Skipping row with incorrect number of values: ${row}`);
      continue;
    }
    const formattedValues = formatAndClassifyValues(values, types);
    const columns = [...headers, "transaction_type"]
      .map((h) => `"${h}"`)
      .join(", ");
    const insertQuery = `
      INSERT INTO your_table_name (${columns})
      VALUES (${formattedValues.join(", ")});
    `;
    try {
      await prisma.$executeRawUnsafe(insertQuery);
    } catch (error) {
      console.error(`Failed to insert row: ${row}`, error);
    }
  }

  console.timeEnd("Total classification time");

  return NextResponse.json({ response, headers, types }, { status: 200 });
}
