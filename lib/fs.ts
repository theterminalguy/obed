import fs, { readFile, readdir } from "fs/promises";
import * as path from "path";
import { EmbeddingInput } from "./embeddings.interface";

export async function createFolder(name: string) {
  const newFolderPath = path.join(__dirname, "history", name);

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
  const filePath = path.join(__dirname, "history", name);
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
