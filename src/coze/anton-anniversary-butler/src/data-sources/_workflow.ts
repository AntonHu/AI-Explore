import { makeObservable, observable } from "mobx";
import { AbortController } from "@coze/taro-api";

class WorkflowDataSource {
  @observable
  error?: string = undefined;

  @observable
  data?: unknown = undefined;

  @observable
  loading = false;

  id: string;

  dsl;

  workflowId: string;

  platformContext: Record<string, any>;

  abortController?: any;

  constructor(
    dsl,
    platformContext: {
      cozeAPIClient: any;
      execute_mode?: string;
      connector_id?: string;
    }
  ) {
    this.dsl = dsl;
    this.id = dsl.id;
    this.workflowId = dsl.settings.workflowId;

    this.platformContext = platformContext;
    makeObservable(this);
  }

  clearAbortController() {
    this.abortController = undefined;
  }

  initAbortController() {
    this.abortController = new AbortController();
    return this.abortController;
  }

  trigger(value = {}, _context?: Record<string, unknown>) {
    if (this.abortController) {
      this.abortController.abort();
      this.clearAbortController();
    }
    return runWorkflow(this.dsl.settings, this, value);
  }
}

const runWorkflow = async (
  workflow: any,
  dataSource: WorkflowDataSource,
  value = {}
) => {
  try {
    dataSource.loading = true;
    const abortController = dataSource.initAbortController();

    const res =
      await dataSource.platformContext.cozeApiClient?.workflows.runs.stream(
        {
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
        } as any,
        {
          // signal: abortController.signal,
        }
      );

    if (!res) {
      return;
    }

    let msgStr = "";
    let jsonChunk = "";
    for await (const chunk of res) {
      console.log("call workflow response chunk ->", chunk);
      if (chunk.event === "Error") {
        const errorMsg =
          (chunk?.data as { error_message: string })?.error_message ||
          "something wrong happened!";
        throw Error(errorMsg);
      }

      if (chunk.event === "Interrupt") {
        throw Error("the workflow type is not supported");
      }

      if (chunk.event === "Done") {
        break;
      }

      msgStr += (chunk?.data as { content: string })?.content ?? "";
      // endType 表示是否为 json，当为 0 是为 json 类型，不为 0 时需要流式更新 data

      if (workflow.endType !== 0) {
        dataSource.data = msgStr;
      } else {
        jsonChunk = (chunk?.data as { content: string })?.content ?? "";
      }

      dataSource.error = undefined;
    }
    // endType 表示是否为 json，当为 0 是为 json 类型，需要 parse 最后一个 message
    if (workflow.endType === 0) {
      dataSource.data = JSON.parse(jsonChunk as string);
    }
  } catch (ex) {
    console.error(ex);
    if ((ex as Error).name !== "UserAbortError") {
      dataSource.error = (ex as Error).message;
    }
  } finally {
    dataSource.loading = false;
  }
  return dataSource;
};

export default WorkflowDataSource;
