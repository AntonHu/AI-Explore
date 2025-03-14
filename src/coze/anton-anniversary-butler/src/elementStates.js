"use strict";
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.elementViewModel = exports.useRefMethods = exports.useViewModelState = exports.elementViewModelContext = exports.ElementViewModel = exports.ScopeContext = void 0;
const react_1 = require("react");
const mobx_1 = require("mobx");
exports.ScopeContext = (0, react_1.createContext)({ id: "" });
let ElementViewModel = (() => {
    var _a, _b, _c, _d;
    let _instanceExtraInitializers = [];
    let _states_decorators;
    let _states_initializers = [];
    let _states_extraInitializers = [];
    let _createState_decorators;
    let _createRefMethods_decorators;
    let _setState_decorators;
    let _sureElementExist_decorators;
    return class ElementViewModel {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _states_decorators = [mobx_1.observable];
            _createState_decorators = [(_a = mobx_1.action).bound.bind(_a)];
            _createRefMethods_decorators = [(_b = mobx_1.action).bound.bind(_b)];
            _setState_decorators = [(_c = mobx_1.action).bound.bind(_c)];
            _sureElementExist_decorators = [(_d = mobx_1.action).bound.bind(_d)];
            __esDecorate(this, null, _createState_decorators, { kind: "method", name: "createState", static: false, private: false, access: { has: obj => "createState" in obj, get: obj => obj.createState }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _createRefMethods_decorators, { kind: "method", name: "createRefMethods", static: false, private: false, access: { has: obj => "createRefMethods" in obj, get: obj => obj.createRefMethods }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _setState_decorators, { kind: "method", name: "setState", static: false, private: false, access: { has: obj => "setState" in obj, get: obj => obj.setState }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _sureElementExist_decorators, { kind: "method", name: "sureElementExist", static: false, private: false, access: { has: obj => "sureElementExist" in obj, get: obj => obj.sureElementExist }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, null, _states_decorators, { kind: "field", name: "states", static: false, private: false, access: { has: obj => "states" in obj, get: obj => obj.states, set: (obj, value) => { obj.states = value; } }, metadata: _metadata }, _states_initializers, _states_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        constructor() {
            __runInitializers(this, _states_extraInitializers);
            (0, mobx_1.makeObservable)(this);
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        states = (__runInitializers(this, _instanceExtraInitializers), __runInitializers(this, _states_initializers, {}));
        createState(defaultValue, key, id) {
            const setState = (v) => this.setState(id, key, v);
            if (this.states[id] && this.states[id][key]) {
                return [this.states[id][key], setState];
            }
            this.sureElementExist(id);
            if (this.states[id][key] === undefined) {
                this.states[id][key] = defaultValue;
            }
            return [this.states[id][key], setState];
        }
        createRefMethods(methods, id) {
            this.sureElementExist(id);
            for (const name in methods) {
                if (Object.prototype.hasOwnProperty.call(methods, name)) {
                    this.states[id][name] = methods[name];
                }
            }
            return methods;
        }
        setState(id, key, value) {
            this.sureElementExist(id);
            this.states[id][key] = value;
        }
        sureElementExist(id) {
            if (!this.states[id]) {
                this.states[id] = {
                    hidden: false,
                    setHidden: (hidden) => {
                        this.states[id].hidden = hidden;
                    },
                };
            }
        }
    };
})();
exports.ElementViewModel = ElementViewModel;
exports.elementViewModelContext = (0, react_1.createContext)(null);
const useViewModelState = (defaultValue, key) => {
    const elementViewModel = (0, react_1.useContext)(exports.elementViewModelContext);
    const { id } = (0, react_1.useContext)(exports.ScopeContext);
    return elementViewModel
        ? elementViewModel.createState(defaultValue, key, id)
        : // eslint-disable-next-line react-hooks/rules-of-hooks
            (0, react_1.useState)(defaultValue);
};
exports.useViewModelState = useViewModelState;
const useRefMethods = (methods, ref) => {
    const { id } = (0, react_1.useContext)(exports.ScopeContext);
    const elementViewModel = (0, react_1.useContext)(exports.elementViewModelContext);
    const methodsRef = (0, react_1.useRef)(methods);
    methodsRef.current = methods;
    if (ref) {
        ref.current = methods;
    }
    if (elementViewModel) {
        elementViewModel.createRefMethods(methods, id);
    }
    return methodsRef;
};
exports.useRefMethods = useRefMethods;
const elementViewModel = new ElementViewModel();
exports.elementViewModel = elementViewModel;
