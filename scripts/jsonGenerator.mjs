import fs from 'fs';
import matter from 'gray-matter';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG_PATH = path.join(__dirname, 'config.json');
const JSON_DIR = path.join(__dirname, '..', 'data');
const PUBLIC_DIR = path.join('public', 'data');

// Load configuration
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));

// Extract folder paths from configuration
const { folders } = config;
const FOLDERS = {
  ...folders,
  filters: folders.filters,
};

// Ensure the JSON directory exists
const ensureJsonDir = () => {
  if (!fs.existsSync(JSON_DIR)) {
    fs.mkdirSync(JSON_DIR);
  }
};

// Write data to a JSON file
const writeJsonFile = (filename, data) => {
  fs.writeFileSync(path.join(JSON_DIR, filename), JSON.stringify(data, null, 2));
};

// Get list page data
const getListPageData = (folder, filename) => {
  const slug = filename.replace('.md', '');
  const fileData = fs.readFileSync(path.join(folder, filename), 'utf-8');
  const { data } = matter(fileData);
  const content = matter(fileData).content;

  return {
    slug,
    frontmatter: data,
    content,
  };
};

// Get single page data
const getSinglePageData = (folder, includeDrafts) => {
  const getPath = fs.readdirSync(folder);
  const sanitizeData = getPath.filter((item) => item.endsWith('.md'));
  const filterData = sanitizeData.filter((item) => !item.startsWith('_'));
  const allPages = filterData.map((filename) =>
    getListPageData(folder, filename),
  );
  return includeDrafts ? allPages : allPages.filter((page) => !page.frontmatter?.draft);
};

// Get custom data functions
const getThemesName = (folder) => {
  const getAllData = getSinglePageData(folder, false);
  return getAllData.map((item) => item.slug);
};

const getThemesGithub = (folder) => {
  const getAllData = getSinglePageData(folder, false);
  return getAllData
    .map((item) => item.frontmatter.github || '')
    .filter((item) => item !== '');
};

const getCustomData = (folder) => {
  const getAllData = getSinglePageData(folder, false);
  const customData = getAllData.map((item) => item.frontmatter.author);
  return [...new Set(customData)];
};

// Main logic
const dynamicFolders = {
  themes: getSinglePageData(FOLDERS.artifacts, false),
  tools: getSinglePageData(FOLDERS.kol, false),
  examples: getSinglePageData(FOLDERS.videos, false),
  authors: getSinglePageData(FOLDERS.authors, false),
  blog: getSinglePageData(FOLDERS.blog, false),
  sponsors: getListPageData(FOLDERS.sponsors, 'index.md'),
};

const dynamicFilters = {
  ssg: getSinglePageData(FOLDERS.filters.ssg, true),
  css: getSinglePageData(FOLDERS.filters.css, true),
  cms: getSinglePageData(FOLDERS.filters.cms, true),
  category: getSinglePageData(FOLDERS.filters.category, true),
};

// Combine filter folders into a single array
const themeTools = [
  ...dynamicFilters.ssg,
  ...dynamicFilters.css,
  ...dynamicFilters.cms,
  ...dynamicFilters.category,
];

// Write JSON files based on dynamic folder names
const writeDataFiles = () => {
  try {
    ensureJsonDir();

    Object.keys(dynamicFolders).forEach((key) => {
      writeJsonFile(`${key}.json`, dynamicFolders[key]);
    });

    writeJsonFile('theme-tools.json', themeTools);
    writeJsonFile('themes-name.json', getThemesName(FOLDERS.artifacts));
    writeJsonFile('themes-github.json', getThemesGithub(FOLDERS.artifacts));
    writeJsonFile('custom-data.json', getCustomData(FOLDERS.artifacts));

    // Also write public data
    Object.keys(dynamicFolders).forEach((key) => {
      fs.writeFileSync(path.join(PUBLIC_DIR, `${key}.json`), JSON.stringify(dynamicFolders[key], null, 2));
    });
    fs.writeFileSync(path.join(PUBLIC_DIR, 'theme-tools.json'), JSON.stringify(themeTools, null, 2));
  } catch (err) {
    console.error(err);
  }
};

writeDataFiles();
