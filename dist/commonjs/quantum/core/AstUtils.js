"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function matchesAssignmentExpression(node, part1, part2) {
    if (node.type === "ExpressionStatement") {
        if (node.expression && node.expression.type === "AssignmentExpression") {
            const expr = node.expression;
            if (expr.left && expr.left.type === "MemberExpression") {
                const left = expr.left;
                let part1Matched = false;
                let part2Matched = false;
                if (left.object && left.object.type === "Identifier") {
                    if (left.object.name === part1) {
                        part1Matched = true;
                    }
                }
                if (left.property && left.property.type === "Identifier") {
                    if (left.property.name === part2) {
                        part2Matched = true;
                    }
                }
                return part1Matched && part2Matched;
            }
        }
    }
}
exports.matchesAssignmentExpression = matchesAssignmentExpression;
function matchesLiteralStringExpression(node, text) {
    return node.type === "ExpressionStatement"
        && node.expression.type === "Literal"
        && node.expression.value === text;
}
exports.matchesLiteralStringExpression = matchesLiteralStringExpression;
const ES6_TYPES = new Set([
    "ClassDeclaration",
    "SpreadElement",
    "ArrowFunctionExpression"
]);
function matchesDeadProcessEnvCode(node, variableName, envString) {
    if (node.type && node.type === "IfStatement") {
        if (node.test && node.test.type === "BinaryExpression") {
            if (node.test.left) {
                if (matchesNodeEnv(node.test.left, variableName)) {
                    const right = node.test.right;
                    if (right && right.type === "Literal") {
                        const value = right.value;
                        const operator = node.test.operator;
                        if (operator === "===" || operator === "==") {
                            return value === envString;
                        }
                        if (operator === "!==" || operator === "!=") {
                            return value !== envString;
                        }
                    }
                }
            }
        }
    }
}
exports.matchesDeadProcessEnvCode = matchesDeadProcessEnvCode;
function matchesNodeEnv(node, veriableName = "NODE_ENV") {
    let isProcess, isEnv, isNodeEnv;
    isProcess = astQuery(node, ["/MemberExpression", ".object", "/MemberExpression", ".object", ".name"], 'process');
    if (!isProcess) {
        return false;
    }
    isEnv =
        astQuery(node, ["/MemberExpression", ".object", "/MemberExpression", ".property", ".name"], "env");
    if (!isEnv) {
        return false;
    }
    isNodeEnv =
        astQuery(node, ["/MemberExpression", ".property", ".name"], veriableName);
    if (!isNodeEnv) {
        return false;
    }
    return true;
}
exports.matchesNodeEnv = matchesNodeEnv;
function matchesEcmaScript6(node) {
    if (node) {
        if (ES6_TYPES.has(node.type)) {
            return true;
        }
        if (node.type === "VariableDeclaration" && node.kind !== "var") {
            return true;
        }
    }
    return false;
}
exports.matchesEcmaScript6 = matchesEcmaScript6;
function matchesSingleFunction(node, name) {
    return node.callee && node.callee.type === "Identifier" && node.callee.name === name;
}
exports.matchesSingleFunction = matchesSingleFunction;
function trackRequireMember(node, name) {
    if (node && node.type === "MemberExpression") {
        if (node.object && node.object.type === "Identifier" && node.object.name === name) {
            if (node.property && node.property.type === "Identifier") {
                return node.property.name;
            }
        }
    }
}
exports.trackRequireMember = trackRequireMember;
function matchRequireIdentifier(node) {
    let name;
    if (node && node.type === "VariableDeclarator") {
        if (node.id && node.id.type === "Identifier") {
            name = node.id.name;
            if (node.init && node.init.type === "CallExpression") {
                if (matchesSingleFunction(node.init, "require")) {
                    return name;
                }
            }
        }
    }
}
exports.matchRequireIdentifier = matchRequireIdentifier;
function matchesTypeOf(node, name) {
    return node && node.operator === "typeof"
        && node.argument && node.argument.type === "Identifier" && node.argument.name === name;
}
exports.matchesTypeOf = matchesTypeOf;
function isExportMisused(node, fn) {
    const isMisused = astQuery(node, [
        "/MemberExpression", ".object", "/MemberExpression",
        ".object", ".name"
    ], "exports");
    if (isMisused) {
        if (node.object.property && node.object.property.name) {
            return fn(node.object.property.name);
        }
    }
}
exports.isExportMisused = isExportMisused;
function matchNamedExport(node, fn) {
    if (astQuery(node, ["/ExpressionStatement",
        ".expression", "/AssignmentExpression", ".left", "/MemberExpression",
        ".object", ".name"], "exports")) {
        if (node.expression.left.property.type === "Identifier") {
            fn(node.expression.left.property.name);
            return true;
        }
    }
}
exports.matchNamedExport = matchNamedExport;
function matchesDoubleMemberExpression(node, part1, part2) {
    const matches = node.type === "MemberExpression"
        && node.object
        && node.object.type === "Identifier"
        && node.object && node.object.name === part1 && node.property;
    if (!part2) {
        return matches;
    }
    return node.property && node.property.name === part2;
}
exports.matchesDoubleMemberExpression = matchesDoubleMemberExpression;
function matchesExportReference(node) {
    if (node.type === "MemberExpression"
        && node.object
        && node.object.type === "Identifier"
        && node.object && node.object.name === "exports" && node.property) {
        if (node.property.type === "Identifier") {
            return node.property.name;
        }
    }
}
exports.matchesExportReference = matchesExportReference;
function matcheObjectDefineProperty(node, name) {
    if (astQuery(node, ["/ExpressionStatement", ".expression", "/CallExpression",
        ".callee", "/MemberExpression",
        ".object",
        ".name"], "Object")) {
        return astQuery(node, ["/ExpressionStatement", ".expression", "/CallExpression", ".arguments", 0, ".name"], name);
    }
}
exports.matcheObjectDefineProperty = matcheObjectDefineProperty;
function astQuery(node, args, value) {
    let obj = node;
    for (const i in args) {
        if (obj === undefined) {
            return;
        }
        let spec = args[i];
        let item;
        let lookForType = false;
        let lookForProp = false;
        if (typeof spec === "number") {
            item = spec;
            lookForProp = true;
        }
        else {
            item = spec.slice(1);
            if (spec.charAt(0) === "/") {
                lookForType = true;
            }
            if (spec.charAt(0) === ".") {
                lookForProp = true;
            }
        }
        if (lookForType) {
            if (!obj.type) {
                return;
            }
            if (obj.type !== item) {
                obj = undefined;
            }
        }
        if (lookForProp) {
            obj = obj[item];
        }
    }
    return obj === value;
}
exports.astQuery = astQuery;