const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const babel = require("@babel/core");

/**
 * @desc 分析模块，组装信息。包括解析文件、文件依赖、文件代码
 * @param {string} file file path
 * @returns
 */
function getModuleInfo(file) {
    // 读取⽂件
    const body = fs.readFileSync(file, "utf-8");
    // 转化AST语法树
    const ast = parser.parse(body, {
        sourceType: "module", //表示我们要解析的是ES模块
    });
    // 依赖收集
    const deps = {};
    traverse(ast, {
        ImportDeclaration({
            node
        }) {
            const dirname = path.dirname(file);
            const abspath = path.join(dirname, node.source.value);
            // path
            deps[node.source.value] = abspath;
        },
    })
    // ES6转成ES5
    const {
        code
    } = babel.transformFromAst(ast, null, {
        presets: ["@babel/preset-env"],
    });
    const moduleInfo = {
        file,
        deps,
        code
    };
    return moduleInfo;
}

/**
 * @desc 递归查找文件引用，扁平化存储到temp
 * @param {array} temp
 * @param {object} param
 * @property {object} param.deps filePathName: path
 */
 function getDeps(temp, {
    deps
}) {
    const keys = Object.keys(deps)
    if(keys.length <= 0) {
        return
    }
    Object.keys(deps).forEach((key) => {
        const child = getModuleInfo(deps[key]);
        temp.push(child);
        getDeps(temp, child);
    });
}

/**
 * 模块解析
 * @param {*} file
 * @returns
 */
function parseModules(file) {
    const entry = getModuleInfo(file);
    const temp = [entry];
    const depsGraph = {};
    getDeps(temp, entry);
    temp.forEach((moduleInfo) => {
        depsGraph[moduleInfo.file] = {
            deps: moduleInfo.deps,
            code: moduleInfo.code,
        };
    });
    return depsGraph;
}

function bundle(file) {
    const depsGraph = JSON.stringify(parseModules(file), null, 4);
    return `(function (graph) {
        function require(file) {
            // 取引用文件代码
            function absRequire(relPath) {
                return require(graph[file].deps[relPath])
            }
            var exports = {};
            // 按依赖顺序，执行代码
            (function (require, exports, code) {
                eval(code)
            })(absRequire, exports, graph[file].code)
            return exports
        }
        require('${file}')
    })(${depsGraph})`;
}

const entry = path.join(__dirname, 'demo/index.js')
const content = bundle(entry);

const output = path.join(__dirname, './dist');

!fs.existsSync(output) && fs.mkdirSync(output);
fs.writeFileSync(path.join(output, 'bundle.js'), content);
