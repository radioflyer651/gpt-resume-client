
// export type ResponseCreateParams = ResponseTypes.ResponseCreateParams;
// export type Tool = ResponseTypes.Tool;
// export type ResponseFunctionToolCall = ResponseTypes.ResponseFunctionToolCall;
// export type FunctionCallOutput = ResponseTypes.ResponseInputItem.FunctionCallOutput;
// export type ResponseOutputMessage = ResponseTypes.ResponseOutputMessage;

export type FunctionTool = { /**
    * The name of the function to call.
    */
    name: string;

    /**
     * A JSON schema object describing the parameters of the function.
     */
    parameters: Record<string, unknown>;

    /**
     * Whether to enforce strict parameter validation. Default `true`.
     */
    strict: boolean;

    /**
     * The type of the function tool. Always `function`.
     */
    type: 'function';

    /**
     * A description of the function. Used by the model to determine whether or not to
     * call the function.
     */
    description?: string | null;
}; //ResponseTypes.FunctionTool;


export type ResponseInputItem = {
    type: string;
    content?: any;
    role?: string;
}; //ResponseTypes.ResponseInputItem;