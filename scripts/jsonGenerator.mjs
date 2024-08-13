import fs from "fs";
import matter from "gray-matter";
import path from "path";

// Configuration for folder paths and output directories
const config = {
  regularFolders: {

    artifacts: "content/artifacts",
    kol: "content/kol",
    videos: "content/videos",
    authors: "content/authors",
    blog: "content/blog",
    // ... other regular folders  },
  filterOptions: {
    ssg: "content/ssg",
    css: "content/css",
    cms: "content/cms",
    category: "content/category",
    // ... other filter options
  },
  specialCases: {
    sponsors: {
      folder: "content/sponsors",
      filename: "index.md",
    },
    // ... other special cases
  },
  outputDir: "./.json",
  publicOutputDir: "public/data",
};

// Function to ensure output directories exist
const ensureOutputDirsExist = () => {
  if (!fs.existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir, { recursive: true });
  }
  if (!fs.existsSync(config.publicOutputDir)) {
    fs.mkdirSync(config.publicOutputDir, { recursive: true });
  }
};

// Function to get file data with frontmatter and content
const getFileData = (folder, filename) => {
  const fileContents = fs.readFileSync(path.join(folder, filename), "utf-8");
  const { data, content } = matter(fileContents);
  const slug = filename.replace(".md", "");

  return {
    slug,
    frontmatter: data,
    content: content.trim(),
  };
};

// Function to get list of pages with data for a given folder
const getPagesData = (folder, includeDrafts = false) => {
  const files = fs.readdirSync(folder);
  const markdownFiles = files.filter(file => file.endsWith(".md") && (includeDrafts || !file.startsWith("_") && file !== "index.md"));
  return markdownFiles.map(file => getFileData(folder, file));
};

// Function to write JSON data to a file
const writeJsonToFile = (data, outputFilePath) => {
  fs.writeFileSync(outputFilePath, JSON.stringify(data, null, 2));
};

// Function to process and output data for regular folders
const processRegularFolders = () => {
  Object.entries(config.regularFolders).forEach(([folderName, folderPath]) => {
    const pagesData = getPagesData(folderPath);
    const outputFilePath = path.join(config.outputDir, `${folderName}.json`);
    const publicOutputFilePath = path.join(config.publicOutputDir, `${folderName}.json`);
    writeJsonToFile(pagesData, outputFilePath);
    writeJsonToFile(pagesData, publicOutputFilePath);
  });
};

// Function to process and output data for filter options
const processFilterOptions = () => {
  Object.values(config.filterOptions).forEach(folderPath => {
    const pagesData = getPagesData(folderPath, false); // Assuming filter options do not include drafts
    const outputFilePath = path.join(config.outputDir, `${path.basename(folderPath)}.json`);
    const publicOutputFilePath = path.join(config.publicOutputDir, `${path.basename(folderPath)}.json`);
    writeJsonToFile(pagesData, outputFilePath);
    writeJsonToFile(pagesData, publicOutputFilePath);
  });
};

// Function to process special cases
const processSpecialCases = () => {
  Object.values(config.specialCases).forEach(({ folder, filename }) => {
    const pageData = getFileData(folder, filename);
    const outputFilePath = path.join(config.outputDir, `sponsors.json`);
    const publicOutputFilePath = path.join(config.publicOutputDir, `sponsors.json`);
    writeJsonToFile(pageData, outputFilePath);
    writeJsonToFile(pageData, publicOutputFilePath);
  });
};

// Custom data functions
const getThemesName = () => {
  const themesData = getPagesData(config.regularFolders.artifacts);
  return themesData.map((item) => item.slug);
};

const getThemesGithub = () => {
  const themesData = getPagesData(config.regularFolders.artifacts);
  return themesData
    .map((item) => item.frontmatter.github || "")
    .filter((item) => item !== "");
};

const getCustomData = () => {
  const authorsData = getPagesData(config.regularFolders.authors);
  const customData = authorsData.map((item) => item.frontmatter.author);
  const uniqueAuthors = Array.from(new Set(customData));
  return uniqueAuthors;
};

// Main execution function
const processAllData = async () => {
  try {
    ensureOutputDirsExist();
    processRegularFolders();
    processFilterOptions();
    processSpecialCases();

    // Custom JSON files for other data
    const themesNameData = getThemesName();
    const themesGithubData = getThemesGithub();
    const customData = getCustomData();

    const themesNameOutputPath = path.join(config.outputDir, "themes-name.json");
    const themesGithubOutputPath = path.join(config.outputDir, "themes-github.json");
    const customDataOutputPath = path.join(config.outputDir, "custom-data.json");

    writeJsonToFile(themesNameData, themesNameOutputPath);
    writeJsonToFile(themesGithubData, themesGithubOutputPath);
    writeJsonToFile(customData, customDataOutputPath);

  } catch (err) {
    console.error("Error processing data:", err);
  }
};

// Start the data processing
processAllData();
