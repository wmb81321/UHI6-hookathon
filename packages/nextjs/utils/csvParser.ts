export interface FormField {
  field_key: string;
  label: string;
  type: string;
  required: boolean;
  description: string;
  example: string;
  options?: string[];
  upload: boolean;
  category: string;
}

export interface FormSchema {
  actor: string;
  fields: FormField[];
  categories: string[];
}

export async function parseCSV(csvPath: string): Promise<FormSchema> {
  try {
    const response = await fetch(csvPath);
    const csvText = await response.text();

    const lines = csvText.trim().split("\n");
    const headers = lines[0].split(",");

    const fields: FormField[] = [];
    const categories = new Set<string>();
    let actor = "";

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",");
      const row: any = {};

      headers.forEach((header, index) => {
        row[header] = values[index]?.trim();
      });

      if (i === 1) {
        actor = row.actor;
      }

      const field: FormField = {
        field_key: row.field_key,
        label: row.label,
        type: row.type,
        required: row.required === "True",
        description: row.description,
        example: row.example,
        options: row.options ? row.options.split("|") : undefined,
        upload: row.upload === "True",
        category: row.category,
      };

      fields.push(field);
      categories.add(row.category);
    }

    return {
      actor,
      fields,
      categories: Array.from(categories),
    };
  } catch (error) {
    console.error("Error parsing CSV:", error);
    throw new Error("Failed to parse CSV schema");
  }
}

export function groupFieldsByCategory(fields: FormField[]): Record<string, FormField[]> {
  return fields.reduce(
    (acc, field) => {
      if (!acc[field.category]) {
        acc[field.category] = [];
      }
      acc[field.category].push(field);
      return acc;
    },
    {} as Record<string, FormField[]>,
  );
}
