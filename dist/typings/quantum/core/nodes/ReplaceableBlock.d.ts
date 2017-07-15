import { GenericAst } from "./GenericAst";
export declare class ReplaceableBlock extends GenericAst {
    value: string;
    isConditional: boolean;
    activeAST: any;
    ifStatementAST: any;
    markedForRemoval: boolean;
    setValue(value: string): void;
    setIFStatementAST(ast: any): void;
    conditionalAnalysis(node: any, evaluatedValue: boolean): any;
    markForRemoval(): void;
    setConditional(): void;
    setActiveAST(ast: any): void;
    handleActiveCode(): void;
    replaceWithValue(): void;
}
