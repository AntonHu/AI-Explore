import tools from "./tools.js";

export const functionCallTemplate = `你是一个智能助手，可以根据用户需求调用工具。以下是可用工具：
${tools.map((item) => `-${item.name}: ${item.description}`).join("\n")}

用户问题：{question}
请根据问题选择合适的工具并返回一个JSON数据格式的结果:
{ name: 工具名称, args: { 参数名: 参数值 } }
`;
