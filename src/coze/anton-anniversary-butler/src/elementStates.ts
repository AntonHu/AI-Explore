import {
  createContext,
  useContext,
  useState,
  useRef,
  type MutableRefObject,
} from "react";
import { action, makeObservable, observable } from "mobx";

export const ScopeContext = createContext({ id: "" });

export class ElementViewModel {
  constructor() {
    makeObservable(this);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @observable states: Record<string, any> = {};

  @action.bound
  createState<T>(
    defaultValue: T,
    key: string,
    id: string
  ): [T, (next: T) => void] {
    const setState = (v: T) => this.setState(id, key, v);
    if (this.states[id] && this.states[id][key]) {
      return [this.states[id][key], setState];
    }

    this.sureElementExist(id);

    if (this.states[id][key] === undefined) {
      this.states[id][key] = defaultValue;
    }

    return [this.states[id][key], setState];
  }

  @action.bound
  createRefMethods<T>(methods: T, id: string): T {
    this.sureElementExist(id);

    for (const name in methods) {
      if (Object.prototype.hasOwnProperty.call(methods, name)) {
        this.states[id][name] = methods[name];
      }
    }

    return methods;
  }

  @action.bound
  setState<T>(id: string, key: string, value: T) {
    this.sureElementExist(id);

    this.states[id][key] = value;
  }

  @action.bound
  sureElementExist(id: string) {
    if (!this.states[id]) {
      this.states[id] = {
        hidden: false,
        setHidden: (hidden: boolean) => {
          this.states[id].hidden = hidden;
        },
      };
    }
  }
}

export const elementViewModelContext = createContext<ElementViewModel | null>(
  null
);

export const useViewModelState: <T>(
  defaultValue: T,
  key: string
) => [T, (next: T) => void] = (defaultValue, key) => {
  const elementViewModel = useContext(elementViewModelContext);
  const { id } = useContext(ScopeContext);

  return elementViewModel
    ? elementViewModel.createState(defaultValue, key, id)
    : // eslint-disable-next-line react-hooks/rules-of-hooks
      useState(defaultValue);
};

export const useRefMethods: <T>(
  methods: T,
  ref?: MutableRefObject<T>
) => MutableRefObject<T> = (methods, ref) => {
  const { id } = useContext(ScopeContext);
  const elementViewModel = useContext(elementViewModelContext);
  const methodsRef = useRef(methods);
  methodsRef.current = methods;

  if (ref) {
    ref.current = methods;
  }

  if (elementViewModel) {
    elementViewModel.createRefMethods(methods, id);
  }

  return methodsRef;
};

const elementViewModel = new ElementViewModel();

export { elementViewModel };
