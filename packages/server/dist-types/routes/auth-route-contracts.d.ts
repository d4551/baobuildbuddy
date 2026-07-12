import Type, { StandardSchemaV1, type StaticParse } from "baobox";
export declare const authBootstrapBodySchema: Type.TObject<{
    readonly setupToken: Type.TOptional<Type.TString>;
}, never, "setupToken">;
export type AuthBootstrapBody = StaticParse<typeof authBootstrapBodySchema>;
export declare const authBootstrapBody: Type.TObject<{
    readonly setupToken: Type.TOptional<Type.TString>;
}, never, "setupToken"> & StandardSchemaV1<unknown, {} & {
    setupToken?: string | undefined;
}>;
