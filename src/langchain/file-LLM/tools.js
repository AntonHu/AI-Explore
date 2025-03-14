import { Tool } from "@langchain/core/tools";
import fs from "fs";
import path from "path";

/**
 * 读取指定文件的内容
 * @param {string} filePath - 文件的路径
 * @returns {Promise<string>} - 文件内容
 */
class ReadFile extends Tool {
  name = "read_file";
  description = "读取指定路径的文件内容";

  async _call(input) {
    const { path: filePath } = JSON.parse(input);
    try {
      const absolutePath = path.resolve(filePath); // 将路径解析为绝对路径
      const content = await fs.promises.readFile(absolutePath, "utf-8");
      return content;
    } catch (error) {
      throw new Error(`读取文件失败: ${error.message}`);
    }
  }
}

/**
 * 创建文件
 * @param {string} filePath - 文件的路径
 * @param {string} content - 文件内容
 * @returns {Promise<void>}
 */
class CreateFile extends Tool {
  name = "create_file";
  description = "新建文件";

  async _call(input) {
    const { filePath, content = "" } = JSON.parse(input);
    try {
      const absolutePath = path.resolve(filePath); // 将路径解析为绝对路径
      await fs.promises.writeFile(absolutePath, content, "utf-8");
      console.log("文件创建成功:", absolutePath);
    } catch (error) {
      throw new Error(`创建文件失败: ${error.message}`);
    }
  }
}

/**
 * 往文件里写内容
 * @param {string} filePath - 文件的路径
 * @param {string} content - 要写入的内容
 * @param {boolean} append - 是否追加内容（默认覆盖）
 * @returns {Promise<void>}
 */
class WriteFile extends Tool {
  name = "write_file";
  description = "写入文件内容";

  async _call(input) {
    const { filePath, content, append = false } = JSON.parse(input);
    try {
      const absolutePath = path.resolve(filePath); // 将路径解析为绝对路径
      const flag = append ? "a" : "w"; // 追加模式为 'a'，覆盖模式为 'w'
      await fs.promises.writeFile(absolutePath, content, {
        encoding: "utf-8",
        flag,
      });
      console.log("文件写入成功:", absolutePath);
    } catch (error) {
      throw new Error(`写入文件失败: ${error.message}`);
    }
  }
}

/** 列出目录结构 */
class DirectionStructure extends Tool {
  name = "directionStructure";
  description = "获取指定目录或当前目录下的文件目录结构";

  async _call(input) {
    const { dirPath = process.cwd() } = JSON.parse(input);

    function traverse(currentPath) {
      const structure = {};
      const items = fs.readdirSync(currentPath);
      for (const item of items) {
        if (item === "node_modules" || item === ".git") continue;
        const itemPath = path.join(currentPath, item);
        const stat = fs.statSync(itemPath);
        if (stat.isDirectory()) {
          structure[item] = traverse(itemPath); // 递归遍历子目录
        } else {
          structure[item] = itemPath; // 文件直接添加到结构
        }
      }
      return structure;
    }

    let directoryTreeStr = "";
    function printDirectoryTree(structure, prefix = "") {
      const keys = Object.keys(structure);
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const isLast = i === keys.length - 1;
        const currentPath = `${prefix}${isLast ? "└─ " : "├─ "}${key}`;
        directoryTreeStr += currentPath + "\n";
        if (structure[key] instanceof Object) {
          const newPrefix = `${prefix}${isLast ? "   " : "│  "}`;
          printDirectoryTree(structure[key], newPrefix);
        }
      }
      return directoryTreeStr;
    }

    printDirectoryTree(traverse(dirPath));

    return directoryTreeStr;
  }
}

// 创建工具实例
export default [
  new ReadFile(),
  new CreateFile(),
  new WriteFile(),
  new DirectionStructure(),
];
