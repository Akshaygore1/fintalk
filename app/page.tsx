/** biome-ignore-all assist/source/organizeImports: false positive */
"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<{
    size: number;
    name: string;
    type: string;
  } | null>(null);
  const [headers, setHeaders] = useState<string[] | null>(null);
  const [types, setTypes] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);

  const upload = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    if (
      file.type !== "text/csv" &&
      file.type !==
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      toast.error("File type is not supported", {
        description: "Please upload a csv or xls file",
      });
      return;
    }
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    setData(data.response);
    setHeaders(data.headers);
    setTypes(data.types);
    setLoading(false);
    toast.success("File has been uploaded successfully");
  };

  return (
    <div className="flex min-h-screen flex-col gap-4 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <div className="grid w-full max-w-sm items-center gap-3">
        <Label htmlFor="file">Upload the file</Label>
        <Input
          id="file"
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <button type="button" onClick={upload}>
          {loading ? "Uploading..." : "Upload"}
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {data && (
          <div className="flex flex-col gap-1">
            <p>{data.size}</p>
            <p>{data.name}</p>
            <p>{data.type}</p>
            <p>{headers?.join(", ")}</p>
            <p>{types?.join(", ")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
