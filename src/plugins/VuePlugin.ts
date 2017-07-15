import { File } from "../core/File";
import { WorkFlowContext } from "../core/WorkflowContext";
import { Plugin } from "../core/WorkflowContext";
import { IPathInformation } from "../core/PathMaster";
// import { Concat, ensureUserPath, write, isStylesheetExtension } from "../../Utils";
// import { utils } from "realm-utils";
import * as fs from "fs";
import * as path from "path";

export interface VuePluginCSSOptions {
    outFile?: { (file: string): string } | string;
}

export interface VuePluginOptions {
    lang?: string, // ts, babel
    babel?: any,
    css?: VuePluginCSSOptions,
}

let vueCompiler;
let vueTranspiler;
let typescriptTranspiler;
let babelCore;
let babelConfig;
export class VuePluginClass implements Plugin {
    public test: RegExp = /\.vue$/;

    //
    constructor(public options: VuePluginOptions = {}) {}

    public init(context: WorkFlowContext) {
        context.allowExtension(".vue");
    }

    public transform(file: File) {
        const context = file.context;

        // caching ...
        if (context.useCache) {
            let cached = context.cache.getStaticCache(file);
            if (cached) {
                file.isLoaded = true;
                if (cached.sourceMap) {
                    file.sourceMap = cached.sourceMap;
                }
                file.analysis.skip();
                file.analysis.dependencies = cached.dependencies;
                file.contents = cached.contents;

                return;
            }
        }

        file.loadContents();

        if (!vueCompiler) {
            vueCompiler = require("vue-template-compiler");
            vueTranspiler = require("vue-template-es2015-compiler");
        }

        let result = vueCompiler.parseComponent(file.contents, this.options);
        if (result.template && result.template.type === "template") {
            let templateLang = (result.template.attrs) ? result.template.attrs.lang : null;
            return compileTemplateContent(context, templateLang, result.template.content).then(html => {

                let cssFile = buildCSSFile(this.options, file, result.styles)

                file.contents = compileScript(this.options, context, html, cssFile, result.script)
                file.analysis.parseUsingAcorn();
                file.analysis.analyze();

                if (context.useCache) {
                    context.emitJavascriptHotReload(file);
                    context.cache.writeStaticCache(file, file.sourceMap);
                }
                return true
            }).catch(err => {
                console.error(err);
            });
        }
    }

    public transformGroup(group: File) {
        let contents = [];
        group.subFiles.forEach(file => {
            contents.push(file.contents);
        });
        let safeContents = JSON.stringify(contents.join("\n"));
        group.contents = `require("fuse-box-css")("${group.info.fuseBoxPath}", ${safeContents});`;
    }

};

function toFunction (code) {
  return vueTranspiler('function render () {' + code + '}')
}

function compileTemplateContent (context: any, engine: string, content: string) {
    return new Promise((resolve, reject) => {
        if (!engine) { return resolve(content); }

        const cons = require('consolidate');
        if (!cons[engine]) { return content; }

        cons[engine].render(content, {
            filename: 'base',
            basedir: context.homeDir,
            includeDir: context.homeDir
        }, (err, html) => {
            if (err) { return reject(err); }
            resolve(html)
        });
    });
}
function compileScript(options, context, html, cssFile, script) : string {
    let lang = script.attrs.lang || options.lang || 'ts';
    let transpiler = {
        babel: compileBabel,
        ts: compileTypeScript,
    }[lang];
    if (transpiler === undefined){
        console.log(`Unsupported lang "${lang}"`)
        return ''
    }
    try {
        let jsTranspiled = transpiler(options, context, script);
        return reduceVueToScript(jsTranspiled, html, cssFile);
    } catch (err) {
        console.log(err);
    }
    return ''
}
function compileTypeScript(options, context, script) : string {
    if (!typescriptTranspiler) {
        typescriptTranspiler = require("typescript");
    }
    return typescriptTranspiler.transpileModule(script.content, context.getTypeScriptConfig()).outputText;
}
function compileBabel(options, context, script) : string {
    if (!babelCore) {
        babelCore = require("babel-core");
        if (options.babel !== undefined) {
            babelConfig = options.babel.config;
        } else {
            let babelRcPath = path.join(context.appRoot, `.babelrc`);
            if (fs.existsSync(babelRcPath)) {
                let babelRcConfig = fs.readFileSync(babelRcPath).toString();
                if (babelRcConfig)
                    babelConfig = JSON.parse(babelRcConfig);
            }
        }
        if (babelConfig === undefined) {
            babelConfig = { plugins: ['transform-es2015-modules-commonjs'] }
        }
    }
    return babelCore.transform(script.content, babelConfig).code;
}
function buildCSSFile(options: VuePluginOptions, vueFile : File, styles) : File {
    let info = <IPathInformation>{};
    info.absPath = vueFile.absPath + ".css";
    let cssFile = new File(vueFile.context, info);
    cssFile.relativePath = vueFile.relativePath + '.css';
    cssFile.contents = styles.map(style => style.content).join("\n");
    cssFile.isLoaded = true;
    cssFile.tryPlugins();
    return cssFile;
}
function reduceVueToScript(jsContent : string, html : string, cssFile : File) : string {
    const compiled = vueCompiler.compile(html);
    console.log(cssFile.absPath)
    console.log(cssFile.relativePath)
    console.log(jsContent)
    return `var _p = {};
var _v = function(exports){${jsContent}
// require('${cssFile.relativePath}');
};
_p.render = ` + toFunction(compiled.render) + `
_p.staticRenderFns = [ ` + compiled.staticRenderFns.map(toFunction).join(',') + ` ];
var _e = {}; _v(_e); _p = Object.assign(_e.default, _p)
module.exports =_p
    `;
}

export const VuePlugin = (options?: VuePluginOptions) => {
    return new VuePluginClass(options);
};
