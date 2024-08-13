import fs from "fs";
import matter from "gray-matter";
import path from "path";

const contentDir = "./content"; // 内容目录
const jsonDir = "./.json"; // JSON 输出目录
const publicDir = "./public/data"; // 公共数据输出目录

// 递归创建目录，如果目录不存在
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// 获取所有内容文件夹
const getContentFolders = () => {
  return fs.readdirSync(contentDir).filter((dir) => fs.statSync(path.join(contentDir, dir)).isDirectory());
};

// 获取单页数据
const getSinglePageData = (folderPath, includeDrafts = false) => {
  const files = fs.readdirSync(folderPath).filter((file) => file.endsWith(".md"));
  return files.map((filename) => {
    const fileData = fs.readFileSync(path.join(folderPath, filename), "utf-8");
    const { data, content } = matter(fileData);
    const slug = path.basename(filename, ".md");
    return {
      slug,
      frontmatter: data,
      content: content.trim(),
    };
  }).filter((page) => includeDrafts || !page.frontmatter.draft);
};

// 写入JSON数据到文件
const writeJsonData = (data, dir, filename) => {
  ensureDir(dir);
  const filePath = path.join(dir, `${filename}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// 主逻辑
(async () => {
  const folders = getContentFolders();
  const dynamicData = {};

  // 为每个文件夹获取数据
  for (const folder of folders) {
    const folderPath = path.join(contentDir, folder);
    dynamicData[folder] = getSinglePageData(folderPath);
  }

  // 特别处理，创建theme-tools数组
  const toolsFolders = ['ssg', 'css', 'cms', 'category'];
  let themeTools = [];
  for (const toolFolder of toolsFolders) {
    if (dynamicData[toolFolder]) {
      themeTools = [...themeTools, ...dynamicData[toolFolder]];
    }
  }

  // 写入JSON数据
  for (const [folder, data] of Object.entries(dynamicData)) {
    writeJsonData(data, jsonDir, folder);
    writeJsonData(data, publicDir, folder);
  }

  // 写入theme-tools
  writeJsonData(themeTools, jsonDir, 'theme-tools');
  writeJsonData(themeTools, publicDir, 'theme-tools');

  console.log('JSON data has been written successfully.');
})();
