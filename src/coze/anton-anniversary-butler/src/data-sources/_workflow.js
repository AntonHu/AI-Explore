"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
Object.defineProperty(exports, "__esModule", { value: true });
const mobx_1 = require("mobx");
const taro_api_1 = require("@coze/taro-api");
let WorkflowDataSource = (() => {
    let _error_decorators;
    let _error_initializers = [];
    let _error_extraInitializers = [];
    let _data_decorators;
    let _data_initializers = [];
    let _data_extraInitializers = [];
    let _loading_decorators;
    let _loading_initializers = [];
    let _loading_extraInitializers = [];
    return class WorkflowDataSource {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _error_decorators = [mobx_1.observable];
            _data_decorators = [mobx_1.observable];
            _loading_decorators = [mobx_1.observable];
            __esDecorate(null, null, _error_decorators, { kind: "field", name: "error", static: false, private: false, access: { has: obj => "error" in obj, get: obj => obj.error, set: (obj, value) => { obj.error = value; } }, metadata: _metadata }, _error_initializers, _error_extraInitializers);
            __esDecorate(null, null, _data_decorators, { kind: "field", name: "data", static: false, private: false, access: { has: obj => "data" in obj, get: obj => obj.data, set: (obj, value) => { obj.data = value; } }, metadata: _metadata }, _data_initializers, _data_extraInitializers);
            __esDecorate(null, null, _loading_decorators, { kind: "field", name: "loading", static: false, private: false, access: { has: obj => "loading" in obj, get: obj => obj.loading, set: (obj, value) => { obj.loading = value; } }, metadata: _metadata }, _loading_initializers, _loading_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        error = __runInitializers(this, _error_initializers, undefined);
        data = (__runInitializers(this, _error_extraInitializers), __runInitializers(this, _data_initializers, undefined));
        loading = (__runInitializers(this, _data_extraInitializers), __runInitializers(this, _loading_initializers, false));
        id = __runInitializers(this, _loading_extraInitializers);
        dsl;
        workflowId;
        platformContext;
        abortController;
        constructor(dsl, platformContext) {
            this.dsl = dsl;
            this.id = dsl.id;
            this.workflowId = dsl.settings.workflowId;
            this.platformContext = platformContext;
            (0, mobx_1.makeObservable)(this);
        }
        clearAbortController() {
            this.abortController = undefined;
        }
        initAbortController() {
            this.abortController = new taro_api_1.AbortController();
            return this.abortController;
        }
        trigger(value = {}, _context) {
            if (this.abortController) {
                this.abortController.abort();
                this.clearAbortController();
            }
            return runWorkflow(this.dsl.settings, this, value);
        }
    };
})();
const runWorkflow = async (workflow, dataSource, value = {}) => {
    try {
        dataSource.loading = true;
        const abortController = dataSource.initAbortController();
        const res = await dataSource.platformContext.cozeApiClient?.workflows.runs.stream({
            workflow_id: workflow.workflowId,
            parameters: value,
            execute_mode: dataSource.platformContext.execute_mode,
            connector_id: dataSource.platformContext.connector_id,
            ext: {
                _caller: "UI_BUILDER",
                user_id: dataSource.platformContext.user_id,
            },
            app_id: dataSource.platformContext.app_id,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }, {
        // signal: abortController.signal,
        });
        if (!res) {
            return;
        }
        let msgStr = "";
        let jsonChunk = "";
        for await (const chunk of res) {
            console.log("call workflow response chunk ->", chunk);
            if (chunk.event === "Error") {
                const errorMsg = chunk?.data?.error_message ||
                    "something wrong happened!";
                throw Error(errorMsg);
            }
            if (chunk.event === "Interrupt") {
                throw Error("the workflow type is not supported");
            }
            if (chunk.event === "Done") {
                break;
            }
            msgStr += chunk?.data?.content ?? "";
            // endType 表示是否为 json，当为 0 是为 json 类型，不为 0 时需要流式更新 data
            if (workflow.endType !== 0) {
                dataSource.data = msgStr;
            }
            else {
                jsonChunk = chunk?.data?.content ?? "";
            }
            dataSource.error = undefined;
        }
        // endType 表示是否为 json，当为 0 是为 json 类型，需要 parse 最后一个 message
        if (workflow.endType === 0) {
            dataSource.data = JSON.parse(jsonChunk);
        }
    }
    catch (ex) {
        console.error(ex);
        if (ex.name !== "UserAbortError") {
            dataSource.error = ex.message;
        }
    }
    finally {
        dataSource.loading = false;
    }
    return dataSource;
};
exports.default = WorkflowDataSource;
