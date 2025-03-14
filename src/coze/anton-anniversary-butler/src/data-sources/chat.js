"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const _workflow_1 = __importDefault(require("./_workflow"));
const createchat = (states) => new _workflow_1.default({
    type: "DataSource",
    from: "Workflow",
    id: "chat",
    settings: {
        workflowId: "7467578691573727268",
        workflowName: "chat",
        endType: 1,
        fromLibrary: null,
    },
}, states);
exports.default = createchat;
