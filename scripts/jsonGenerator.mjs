import fs from "fs";
import matter from "gray-matter";
import path from "path";

const contentDir = "./content";
const jsonDir = "./.json";
const publicDir = "./public/data";

// Ensure directory exists
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Get list page data
const getListPageData = (folderPath, filename) => {
  const fileData = fs.readFileSync(path.join(folderPath, filename), "utf-8");
  const { data, content } = matter(fileData);
  const slug = filename.replace(".md", "");
  return {
    slug,
    frontmatter: data,
    content: content.trim(),
  };
};

// Get single page data
const getSinglePageData = (folderPath, includeDrafts = false) => {
  const files = fs.readdirSync(folderPath).filter((file) => file.endsWith(".md"));
  return files.map((filename) => getListPageData(folderPath, filename))
    .filter((page) => includeDrafts || !page.frontmatter?.draft);
};

// Get content folders
const getContentFolders = (dir = contentDir) => {
  return fs.readdirSync(dir).filter((name) => fs.statSync(path.join(dir, name)).isDirectory());
};

// Write JSON data to files
const writeJsonData = (data, dir, filename) => {
  ensureDir(dir);
  const filePath = path.join(dir, `${filename}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// Main logic
(async () => {
  // Get all content folders within the content directory
  const contentFolders = getContentFolders();
  const dynamicData = {};

  // Process each folder
  for (const folder of contentFolders) {
    const folderPath = path.join(contentDir, folder);
    dynamicData[folder] = getSinglePageData(folderPath);
  }

  // Sponsors data
  const sponsorsData = getListPageData(path.join(contentDir, "sponsors"), "index.md");
  dynamicData.sponsors = sponsorsData;

  // Concatenate theme tools
  const themeTools = [...(dynamicData.ssg || []), ...(dynamicData.css || []), ...(dynamicData.cms || []), ...(dynamicData.category || [])];

  // Write JSON files
  for (const [key, value] of Object.entries(dynamicData)) {
    writeJsonData(value, jsonDir, key);
    writeJsonData(value, publicDir, key);
  }

  console.log('JSON data has been written successfully.');
})();
