import fs from "fs";
import matter from "gray-matter";
import path from "path";

// Get all content folders
const getContentFolders = () => {
  const contentDir = "content"; // Adjust this path as needed
  return fs.readdirSync(contentDir).filter((dir) => fs.statSync(path.join(contentDir, dir)).isDirectory());
};

// Get list page data (ex: about.md)
const getListPageData = (folderPath, filename) => {
  const slug = filename.replace(".md", "");
  const fileData = fs.readFileSync(path.join(folderPath, filename), "utf-8");
  const { data } = matter(fileData);
  const content = matter(fileData).content;

  return {
    slug: slug,
    frontmatter: data,
    // content: content,
  };
};

// Get single page data (ex: blog/*.md)
const getSinglePageData = (folderPath, includeDrafts = false) => {
  const files = fs.readdirSync(folderPath);
  const markdownFiles = files.filter((file) => file.endsWith(".md"));
  const allPages = markdownFiles.map((filename) => getListPageData(folderPath, filename));
  const publishedPages = allPages.filter((page) => !page.frontmatter?.draft || includeDrafts);
  return publishedPages;
};

// Modified functions to handle dynamic folder names
const getThemesName = (folderPath) => {
  const allData = getSinglePageData(folderPath, false);
  return allData.map((item) => item.slug);
};

// ... (similar modifications for other functions like getThemesGithub, getCustomData, etc.)

// Get all data using dynamic folder paths
const contentFolders = getContentFolders();
const dynamicData = contentFolders.reduce((acc, folder) => {
  const folderPath = path.join("content", folder);
  acc[folder] = getSinglePageData(folderPath, false);
  return acc;
}, {});

// Write JSON files dynamically based on folder names
const jsonDir = "./.json";
const publicDir = "./public/data";

try {
  if (!fs.existsSync(jsonDir)) {
    fs.mkdirSync(jsonDir);
  }
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
  }

  contentFolders.forEach((folder) => {
    const folderPath = path.join("content", folder);
    const dataKey = folder.replace(/^\w/, (c) => c.toLowerCase()); // Convert to camelCase for JSON filenames
    const jsonData = getSinglePageData(folderPath, false);
    fs.writeFileSync(`${jsonDir}/${dataKey}.json`, JSON.stringify(jsonData));
    fs.writeFileSync(`${publicDir}/${dataKey}.json`, JSON.stringify(jsonData));

    // Call modified functions for custom data
    const themesName = getThemesName(folderPath);
    fs.writeFileSync(`${jsonDir}/${dataKey}-name.json`, JSON.stringify(themesName));
    // ... (similar calls for other custom data functions)
  });
} catch (err) {
  console.error(err);
}
