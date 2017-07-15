import { WebIndexPluginClass } from "../../plugins/WebIndexPlugin";
import { QuantumCore } from "./QuantumCore";
import { FileAbstraction } from "../core/FileAbstraction";
export interface ITreeShakeOptions {
    shouldRemove: {
        (file: FileAbstraction): void;
    };
}
export interface IQuantumExtensionParams {
    target?: string;
    uglify?: any;
    removeExportsInterop?: boolean;
    removeUseStrict?: boolean;
    replaceProcessEnv?: boolean;
    webIndexPlugin?: WebIndexPluginClass;
    ensureES5?: boolean;
    treeshake?: boolean | ITreeShakeOptions;
    api?: {
        (core: QuantumCore): void;
    };
    warnings?: boolean;
    bakeApiIntoBundle?: string;
    extendServerImport?: boolean;
    polyfills?: string[];
    processPolyfill?: boolean;
    hoisting?: boolean | {
        names: string[];
    };
    containedAPI?: boolean;
    manifest?: boolean | string;
}
export declare class QuantumOptions {
    private uglify;
    private removeExportsInterop;
    private removeUseStrict;
    private ensureES5;
    private replaceProcessEnv;
    private containedAPI;
    private processPolyfill;
    private bakeApiIntoBundle;
    private showWarnings;
    private treeshakeOptions;
    private hoisting;
    private polyfills;
    private hoistedNames;
    private extendServerImport;
    private manifestFile;
    apiCallback: {
        (core: QuantumCore): void;
    };
    optsTarget: string;
    treeshake: boolean;
    webIndexPlugin: WebIndexPluginClass;
    constructor(opts: IQuantumExtensionParams);
    shouldBundleProcessPolyfill(): boolean;
    enableContainedAPI(): boolean;
    getPromisePolyfill(): string;
    getManifestFilePath(): string;
    canBeRemovedByTreeShaking(file: FileAbstraction): true | void;
    isContained(): boolean;
    throwContainedAPIError(): void;
    shouldRemoveUseStrict(): boolean;
    shouldEnsureES5(): boolean;
    shouldDoHoisting(): boolean;
    getHoistedNames(): string[];
    isHoistingAllowed(name: string): boolean;
    shouldExtendServerImport(): boolean;
    shouldShowWarnings(): boolean;
    shouldUglify(): boolean;
    shouldBakeApiIntoBundle(): string;
    shouldTreeShake(): boolean;
    shouldRemoveExportsInterop(): boolean;
    shouldReplaceProcessEnv(): boolean;
    isTargetUniveral(): boolean;
    isTargetServer(): boolean;
    isTargetBrowser(): boolean;
}