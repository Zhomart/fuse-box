import { VuePlugin, CSSPlugin } from "../../index";
import { createEnv } from "../stubs/TestEnvironment";
import { should } from "fuse-test-runner";
import * as path from "path";
import * as appRoot from "app-root-path";
import * as fs from "fs";
import * as fsExtra from "fs-extra";

const vueFileSource = `<template>
    <div>
        <p>{{ msg }}</p>
        <input type="text" v-model="msg" />
    </div>
</template>

<script>
    import './qwe'
    import './asd.css'
    export default {
        name: 'app',
        data () {
            return {
                msg: 'Welcome to Your Vue.js App'
            }
        }
    }
</script>

<style>
    body {
        background-color: #C0FFEE;
    }
</style>
`;

const vueBabelFileSource = `<template>
    <div>
        <p>{{ msg }}</p>
        <input type="text" v-model="msg" />
    </div>
</template>

<script lang="babel">
    let language = 'Babel';
    export default {
        name: 'app',
        data () {
            return {
                msg: 'Welcome to Your Vue.js App, ' + language
            }
        }
    }
</script>
`;

let tmp, shouldExist;

const makeTestFolder = () => {
    tmp = path.join(appRoot.path, ".fusebox", "vue-test", new Date().getTime().toString());
    fsExtra.ensureDirSync(tmp);
    shouldExist = (name) => {
        const fname = path.join(tmp, name);;
        should(fs.existsSync(fname)).equal(true);
        return fs.readFileSync(fname).toString();
    };
};

export class VuePluginTest {
    "Should return compiled TS vue code with render functions"() {
        // makeTestFolder();
        return createEnv({
            project: {
                files: {
                    "qwe.js": "exports.bar = 1;",
                    "app.vue": vueFileSource,
                    "asd.css": "body { color: pink; }"
                },
                plugins: [
                    [ VuePlugin({ css: { outFile: (file) => `${tmp}/${file}`, } }) ],
                    [ CSSPlugin() ]
                ],
                instructions: "app.vue *.js *.css",
            },
        }).then((result) => {
            const component = result.project.FuseBox.import('./app.vue');

            // shouldExist("app.css");
            const js = result.projectContents.toString();
            console.log(js)
            // should(js).findString(`require("fuse-box-css")("vue-styles.css");`);

            // //test for render functions
            should( component.render ).notEqual( undefined );
            should( component.staticRenderFns ).notEqual( undefined );

            // //test for not having a template string (would not work with runtime-only-vue)
            should( component.template ).equal( undefined );

            //test html output
            const Vue = require('vue')
            const renderer = require('vue-server-renderer').createRenderer()

            const app = new Vue(component)
            renderer.renderToString(app, (err, html) => {
                should(html).findString('<p>Welcome to Your Vue.js App</p>');
                should(html).findString('<input type="text" value="Welcome to Your Vue.js App">');
            })
        });
    }

    "Should return compiled Babel vue code with render functions"() {
        return null
        return createEnv({
            project: {
                files: {
                    "app.vue": vueBabelFileSource
                },
                plugins: [VuePlugin()],
                instructions: "app.vue",
            },
        }).then((result) => {
            const component = result.project.FuseBox.import('./app.vue');

            // //test for render functions
            should( component.render ).notEqual( undefined );
            should( component.staticRenderFns ).notEqual( undefined );

            // //test for not having a template string (would not work with runtime-only-vue)
            should( component.template ).equal( undefined );

            //test html output
            const Vue = require('vue')
            const renderer = require('vue-server-renderer').createRenderer()

            const app = new Vue(component)
            renderer.renderToString(app, (err, html) => {
                should(html).findString('<p>Welcome to Your Vue.js App, Babel</p>');
                should(html).findString('<input type="text" value="Welcome to Your Vue.js App, Babel">');
            })
        });
    }

}
