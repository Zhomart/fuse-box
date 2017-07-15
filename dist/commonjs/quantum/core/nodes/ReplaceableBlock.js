"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const GenericAst_1 = require("./GenericAst");
class ReplaceableBlock extends GenericAst_1.GenericAst {
    constructor() {
        super(...arguments);
        this.isConditional = false;
        this.markedForRemoval = false;
    }
    setValue(value) {
        this.value = value;
    }
    setIFStatementAST(ast) {
        this.ifStatementAST = ast;
    }
    conditionalAnalysis(node, evaluatedValue) {
        this.setConditional();
        this.setIFStatementAST(node);
        if (evaluatedValue === false) {
            if (node.alternate) {
                this.setActiveAST(node.alternate);
                return node.alternate;
            }
            else {
                this.markForRemoval();
                return false;
            }
        }
        else {
            this.setActiveAST(node.consequent);
            return node.consequent;
        }
    }
    markForRemoval() {
        this.markedForRemoval = true;
    }
    setConditional() {
        this.isConditional = true;
    }
    setActiveAST(ast) {
        this.activeAST = ast;
    }
    handleActiveCode() {
        const parent = this.ifStatementAST.$parent;
        const prop = this.ifStatementAST.$prop;
        if (this.markedForRemoval) {
            if (parent[prop]) {
                if (Array.isArray(parent[prop])) {
                    const index = parent[prop].indexOf(this.ifStatementAST);
                    if (index > -1) {
                        parent[prop].splice(index, 1);
                    }
                }
            }
        }
        else {
            if (parent && prop && this.activeAST) {
                if (parent[prop]) {
                    if (Array.isArray(parent[prop])) {
                        const index = parent[prop].indexOf(this.ifStatementAST);
                        if (index > -1) {
                            parent[prop][index] = this.activeAST;
                        }
                    }
                }
            }
        }
    }
    replaceWithValue() {
        if (this.value) {
            this.replaceWithString(this.value);
        }
    }
}
exports.ReplaceableBlock = ReplaceableBlock;
