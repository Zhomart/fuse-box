/**
 * Matches assignment
 * foo.bar = 1
 * @param node ast
 * @param part1
 * @param part2
 */
export declare function matchesAssignmentExpression(node: any, part1: string, part2: string): boolean;
export declare function matchesLiteralStringExpression(node: any, text: string): boolean;
export declare function matchesDeadProcessEnvCode(node: any, variableName: string, envString: string): boolean;
export declare function matchesNodeEnv(node: any, veriableName?: string): boolean;
export declare function matchesEcmaScript6(node: any): boolean;
export declare function matchesSingleFunction(node: any, name: string): boolean;
export declare function trackRequireMember(node: any, name: string): string;
export declare function matchRequireIdentifier(node: any): string;
export declare function matchesTypeOf(node: any, name: string): boolean;
export declare function isExportMisused(node: any, fn: {
    (name: string);
}): any;
export declare function matchNamedExport(node: any, fn: any): boolean;
export declare function matchesDoubleMemberExpression(node: any, part1: string, part2?: string): any;
export declare function matchesExportReference(node: any): string;
export declare function matcheObjectDefineProperty(node: any, name: string): boolean;
export declare function astQuery(node: any, args: any[], value: string): boolean;