import Workflow from "./_workflow";

const createchat = (states) =>
  new Workflow(
    {
      type: "DataSource",
      from: "Workflow",
      id: "chat",
      settings: {
        workflowId: "7467578691573727268",
        workflowName: "chat",
        endType: 1,
        fromLibrary: null,
      },
    },
    states
  );

export default createchat;
