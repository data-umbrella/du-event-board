import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import yaml from "yaml";
import prompts from "prompts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EVENTS_FILE = path.resolve(__dirname, "../data/events.yaml");

async function main() {
  console.log("Welcome to the DU Event Board Interactive CLI\n");

  let fileContent;
  try {
    fileContent = fs.readFileSync(EVENTS_FILE, "utf8");
  } catch (err) {
    console.error(
      "Could not read data/events.yaml. Make sure you are in the project root.",
    );
    process.exit(1);
  }

  const parsed = yaml.parse(fileContent);
  const events = parsed.events || [];

  const existingIds = events
    .map((e) => parseInt(e.id, 10))
    .filter((id) => !isNaN(id));
  const nextId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;

  // Extract unique categories for helpful hints
  const uniqueCategories = [...new Set(events.map((e) => e.category))]
    .filter(Boolean)
    .sort();

  const response = await prompts([
    {
      type: "text",
      name: "title",
      message: 'Event Title (e.g. "React Workshop - São Paulo")?',
    },
    {
      type: "text",
      name: "description",
      message: "Brief Description (1-2 sentences)?",
    },
    {
      type: "text",
      name: "date",
      message: "Date (YYYY-MM-DD)?",
      validate: (value) =>
        /^\d{4}-\d{2}-\d{2}$/.test(value)
          ? true
          : "Please use YYYY-MM-DD format",
    },
    {
      type: "text",
      name: "time",
      message: "Time (HH:MM)?",
      validate: (value) =>
        /^\d{2}:\d{2}$/.test(value) ? true : "Please use HH:MM format",
    },
    {
      type: "text",
      name: "location",
      message: "Full Location Address?",
    },
    {
      type: "text",
      name: "region",
      message: 'Region/City (e.g. "São Paulo")?',
    },
    {
      type: "text",
      name: "category",
      message: `Category? (Existing: ${uniqueCategories.join(", ")})`,
    },
    {
      type: "text",
      name: "url",
      message: "Event URL (e.g. Meetup/Event link)?",
    },
    {
      type: "text",
      name: "image_url",
      message: "Event Cover Image URL (Optional, leave blank if none)?",
    },
    {
      type: "list",
      name: "tags",
      message: 'Tags (comma separated, e.g. "react, frontend, javascript")?',
      initial: "",
      separator: ",",
    },
  ]);

  if (!response.title) {
    console.log("\n Process cancelled.");
    process.exit(0);
  }

  const cleanTags = response.tags.map((t) => t.trim()).filter(Boolean);
  const tagsYaml =
    cleanTags.length > 0
      ? "\n    tags:\n" + cleanTags.map((t) => `      - ${t}`).join("\n")
      : "\n    tags: []";

  const imageYaml =
    response.image_url && response.image_url.trim()
      ? `\n    image_url: "${response.image_url.trim().replace(/"/g, '\\"')}"`
      : "";

  const newEventStr = `
  - id: "${nextId}"
    title: "${response.title.replace(/"/g, '\\"')}"
    description: "${response.description.replace(/"/g, '\\"')}"
    date: "${response.date}"
    time: "${response.time}"
    location: "${response.location.replace(/"/g, '\\"')}"
    region: "${response.region.replace(/"/g, '\\"')}"
    category: "${response.category.replace(/"/g, '\\"')}"
    url: "${response.url.replace(/"/g, '\\"')}"${imageYaml}${tagsYaml}
`;

  fs.appendFileSync(EVENTS_FILE, newEventStr);

  console.log(
    `\n Successfully added "${response.title}" to data/events.yaml!`,
  );
  console.log(`   Event ID: ${nextId}`);
  console.log(`   Run 'npm run dev' to see your new event.`);
}

main().catch(console.error);
