import fs, { readFile, readdir, appendFile, access } from "fs/promises";
import * as path from "path";
import { EmbeddingInput } from "./embeddings.interface";

export async function createFolder(name: string) {
  // @todo working directory should be parameterized
  const newFolderPath = path.join("history", name);

  try {
    await fs.mkdir(newFolderPath);
    console.log("Folder created successfully:", newFolderPath);
  } catch (err: Error | any) {
    if (err.code === "EEXIST") {
      console.log("Folder already exists:", newFolderPath);
    } else {
      console.error("Error creating folder:", err);
    }
  }
}

export async function createFile(name: string, content: string) {
  // Define the path to the new file
  const filePath = path.join("history", name);
  try {
    // Write content to the file
    await fs.writeFile(filePath, content, "utf-8");
    console.log("File created and written successfully:", filePath);
  } catch (err) {
    console.error("Error creating or writing to file:", err);
  }
}

export async function readAllFilesInFolder(
  folderPath: string
): Promise<EmbeddingInput[]> {
  const inputs: EmbeddingInput[] = [];
  const files = await readdir(folderPath);
  for (const file of files) {
    const fileContent = await readFile(`${folderPath}/${file}`, "utf8");
    inputs.push({ label: file, value: fileContent });
  }
  return inputs;
}

async function fileExists(filePath: string) {
  try {
    await readFile(filePath, "utf8");
    return true;
  } catch (err) {
    return false;
  }
}

export async function appendLogToMDFile(name: number, content: string) {
  try {
    const filePath = path.join("history", `${name}`, "log.md");
    const exists = await fileExists(filePath);
    let mdContent = "";

    if (!exists) {
      const inputPath = path.join("history", `${name}`, "input.json");
      const inputFile = await readFile(inputPath, "utf-8");
      const input = JSON.parse(inputFile);
      mdContent += `Provider: ${input["provider"]}, Model: ${input["model"]}\n\n`;
    }

    mdContent += "```javascript\n" + content + "\n\n```\n\n";
    await fs.appendFile(filePath, mdContent, "utf-8");
    console.log("appended to file successfully");
  } catch (err) {
    console.error("Error appending to file:", err);
  }
}
