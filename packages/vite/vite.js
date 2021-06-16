const Koa = require('koa')
const cors = require('@koa/cors')
const path = require('path')
const fs = require('fs')
const compilerSfc = require("@vue/compiler-sfc");
const compilerDom = require("@vue/compiler-dom");
const { logServerInfo } = require("../common/utils");
const { PATHS } = require('../common/constant')

const app = new Koa()
app.use(cors())

function rewriteImport(content) {
    return content.replace(/ from ['|"]([^'"]+)['|"]/g, function (s0, s1) {
        if (s1.startsWith('./') || s1.startsWith('/') || s1.startsWith('../')) {
            return s0
        } else {
            return ` from '/@modules/${s1}'`
        }
    })
}

const cwd = process.cwd()
const viteDemoDir = path.join(cwd, 'demo')

app.use(async (ctx) => {
    const {
        url,
        query
    } = ctx.request
    if (url === '/') {
        ctx.type = 'text/html'
        const content = fs.readFileSync(path.join(viteDemoDir, 'index.html'), 'utf-8')
        ctx.body = content
    } else if (url.endsWith('.js')) {
        ctx.type = 'text/javascript'
        // test
        // if(url.indexOf('reactive.js') !== -1) {
        //     console.log('url :>> ', url);
        //     const ret = fs.readFileSync(path.join(PATHS.rootDir, 'packages', url), 'utf-8')
        //     // 重写裸模块导入部分
        //     ctx.body = rewriteImport(ret)
        // } else {
            const ret = fs.readFileSync(path.join(cwd, `${url}`), 'utf-8')
            // 重写裸模块导入部分
            ctx.body = rewriteImport(ret)
        // }
    } else if (url.startsWith('/@modules')) {
        const moduleName = url.replace("/@modules/", "");
        const prefix = path.join(PATHS.rootNodeModules, moduleName);
        const module = require(prefix + "/package.json").module;
        const filePath = path.join(prefix, module);
        const ret = fs.readFileSync(filePath, "utf8");
        ctx.type = "text/javascript";
        ctx.body = rewriteImport(ret);
    } else if (url.indexOf('.vue') > -1) {
        // SFC路径
        const p = path.join(cwd, url.split("?")[0]);
        const ret = compilerSfc.parse(fs.readFileSync(p, 'utf-8'))
        // SFC文件请求
        if (!query.type) {
            const scriptContent = ret.descriptor.script.content
            const script = scriptContent.replace('export default ', 'const __script = ')
            // 返回App.vue解析结果
            ctx.type = 'text/javascript'
            ctx.body = `
             ${rewriteImport(script)}
             import { render as __render } from '${url}?type=template'
             __script.render = __render
             export default __script
           `
        } else if (query.type === 'template') {
            // 模板内容
            const template = ret.descriptor.template.content
            // 编译为render
            const render = compilerDom.compile(template, {
                mode: 'module'
            }).code
            ctx.type = 'text/javascript'
            ctx.body = rewriteImport(render)
        }
    }

})

const port = 4000
app.listen(port, () => {
    logServerInfo(port)
})
