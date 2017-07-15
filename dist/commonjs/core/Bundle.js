"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const FuseBox_1 = require("./FuseBox");
const FuseProcess_1 = require("../FuseProcess");
const HotReloadPlugin_1 = require("../plugins/HotReloadPlugin");
const BundleSplit_1 = require("./BundleSplit");
const path = require("path");
const BundleTestRunner_1 = require("../BundleTestRunner");
const Config_1 = require("../Config");
class Bundle {
    constructor(name, fuse, producer) {
        this.name = name;
        this.fuse = fuse;
        this.producer = producer;
        this.process = new FuseProcess_1.FuseProcess(this);
        this.webIndexPriority = 0;
        this.webIndexed = true;
        this.context = fuse.context;
        this.context.bundle = this;
        fuse.producer = producer;
        this.setup();
    }
    watch(rules) {
        this.watchRule = rules ? rules : "**";
        return this;
    }
    globals(globals) {
        this.context.globals = globals;
        return this;
    }
    tsConfig(fpath) {
        this.context.tsConfig = fpath;
        return this;
    }
    shim(shimConfig) {
        this.context.shim = shimConfig;
        return this;
    }
    hmr(opts) {
        if (!this.producer.hmrAllowed) {
            return this;
        }
        if (!this.producer.hmrInjected) {
            opts = opts || {};
            opts.port = this.producer.devServerOptions && this.producer.devServerOptions.port || 4444;
            let plugin = HotReloadPlugin_1.HotReloadPlugin({ port: opts.port, uri: opts.socketURI });
            this.context.plugins = this.context.plugins || [];
            this.context.plugins.push(plugin);
            this.producer.hmrInjected = true;
        }
        this.producer.sharedEvents.on("SocketServerReady", (server) => {
            this.fuse.context.sourceChangedEmitter.on((info) => {
                if (this.fuse.context.isFirstTime() === false) {
                    this.fuse.context.log.echo(`Source changed for ${info.path}`);
                    server.send("source-changed", info);
                }
            });
        });
        return this;
    }
    alias(key, value) {
        this.context.addAlias(key, value);
        return this;
    }
    split(rule, str) {
        const arithmetics = str.match(/(\S+)\s*>\s(\S+)/i);
        if (!arithmetics) {
            throw new Error("Can't parse split arithmetics. Should look like:");
        }
        const bundleName = arithmetics[1];
        const mainFile = arithmetics[2];
        if (this.context.experimentalFeaturesEnabled) {
            this.producer.fuse.context.quantumSplit(rule, bundleName, mainFile);
        }
        else {
            if (!this.bundleSplit) {
                this.bundleSplit = new BundleSplit_1.BundleSplit(this);
            }
            this.bundleSplit.getFuseBoxInstance(bundleName, mainFile);
            this.bundleSplit.addRule(rule, bundleName);
        }
        return this;
    }
    cache(cache) {
        this.context.useCache = cache;
        return this;
    }
    splitConfig(opts) {
        if (this.context.experimentalFeaturesEnabled) {
            this.producer.fuse.context.configureQuantumSplitResolving(opts);
        }
        else {
            if (!this.bundleSplit) {
                this.bundleSplit = new BundleSplit_1.BundleSplit(this);
            }
            if (opts.browser) {
                this.bundleSplit.browserPath = opts.browser;
            }
            if (opts.server) {
                this.bundleSplit.serverPath = opts.server;
            }
            if (opts.dest) {
                this.bundleSplit.dest = opts.dest;
            }
        }
        return this;
    }
    log(log) {
        this.context.doLog = log;
        this.context.log.printLog = log;
        return this;
    }
    plugin(...args) {
        this.context.plugins = this.context.plugins || [];
        this.context.plugins.push(args.length === 1 ? args[0] : args);
        return this;
    }
    natives(opts) {
        this.context.natives = opts;
        return this;
    }
    instructions(arithmetics) {
        this.arithmetics = arithmetics;
        return this;
    }
    target(target) {
        this.context.target = target;
        return this;
    }
    sourceMaps(params) {
        this.context.setSourceMapsProperty(params);
        return this;
    }
    test(str = "**/*.test.ts", opts) {
        opts = opts || {};
        opts.reporter = opts.reporter || "fuse-test-reporter";
        opts.exit = true;
        const clonedOpts = Object.assign({}, this.fuse.opts);
        const testBundleFile = path.join(Config_1.Config.TEMP_FOLDER, "tests", new Date().getTime().toString(), "/$name.js");
        clonedOpts.output = testBundleFile;
        str += ` +fuse-test-runner ${opts.reporter} -ansi`;
        const fuse = FuseBox_1.FuseBox.init(clonedOpts);
        fuse.bundle("test")
            .instructions(str)
            .completed(proc => {
            const bundle = require(proc.filePath);
            let runner = new BundleTestRunner_1.BundleTestRunner(bundle, opts);
            runner.start();
        });
        fuse.run();
    }
    exec() {
        return new Promise((resolve, reject) => {
            this.fuse
                .initiateBundle(this.arithmetics || "", () => {
                this.process.setFilePath(this.fuse.context.output.lastWrittenPath);
                if (this.onDoneCallback && this.producer.writeBundles === true) {
                    this.onDoneCallback(this.process);
                }
                return resolve(this);
            }).then(source => {
            }).catch(e => {
                console.error(e);
                return reject(reject);
            });
            return this;
        });
    }
    completed(fn) {
        this.onDoneCallback = fn;
        return this;
    }
    setup() {
        this.context.output.setName(this.name);
        if (this.context.useCache) {
            this.context.initCache();
            this.context.cache.initialize();
        }
    }
}
exports.Bundle = Bundle;
