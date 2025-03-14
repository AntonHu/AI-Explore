import { Tool } from "@langchain/core/tools";
import fs from "fs";
import path from "path";

class MultiplyTool extends Tool {
  name = "multiply";
  description = "计算两个数的乘积";

  async _call(input) {
    const { x, y } = JSON.parse(input);
    console.log("🚀 ~ MultiplyTool ~ _call ~ x, y:", x, y);
    return (x * y).toString();
  }
}

class AddTool extends Tool {
  name = "add";
  description = "计算两个数的和";

  async _call(input) {
    const { x, y } = JSON.parse(input);
    return (x + y).toString();
  }
}

class DirectionStructure extends Tool {
  name = "directionStructure";
  description = "获取指定目录或当前目录下的文件目录结构";

  async _call(input) {
    const { dirPath = process.cwd() } = JSON.parse(input);

    function traverse(currentPath) {
      const structure = {};
      const items = fs.readdirSync(currentPath);
      for (const item of items) {
        if (item === "node_modules") continue;
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

class BirthdayTool extends Tool {
  name = "birthday";
  description = "获取指定人的生日";

  async _call(input) {
    console.log("🚀 ~ BirthdayTool ~ _call ~ input:", input);
    const { person } = JSON.parse(input);
    switch (person) {
      case "Anton":
        return `Anton的生日是2004年5月19日`;
    }
    return "没有这个人生日的记录";
  }
}

// 创建工具实例
export default [
  new MultiplyTool(),
  new AddTool(),
  new DirectionStructure(),
  new BirthdayTool(),
];
