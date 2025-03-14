const cozeApi = {
  workflows: {
    runs: {
      stream: async () => ({
        str: "123" + Math.random(),
        number: 123,
        boolean: true,
        array: [1, 2, 3],
        object: {
          a: 1,
          b: 2,
          c: 3,
        },
        null: null,
        undefined,
      }),
    },
  },
};

export default cozeApi;
