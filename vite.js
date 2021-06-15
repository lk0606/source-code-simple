const Koa = require('koa')
const path = require('path')
const fs = require('fs')
const compilerSfc = require("@vue/compiler-sfc");
const compilerDom = require("@vue/compiler-dom");

const app = new Koa()

function rewriteImport(content) {
    return content.replace(/ from ['|"]([^'"]+)['|"]/g, function (s0, s1) {
        if (s1.startsWith('./') || s1.startsWith('/') || s1.startsWith('../')) {
            return s0
        } else {
            return ` from '/@modules/${s1}'`
        }
    })
}

app.use(async (ctx) => {
    const {
        url,
        query
    } = ctx.request
    if (url === '/') {
        ctx.type = 'text/html'
        const content = fs.readFileSync(path.join(__dirname, './index.html'), 'utf-8')
        ctx.body = content
    } else if (url.endsWith('.js')) {
        ctx.type = 'text/javascript'
        const ret = fs.readFileSync(path.join(__dirname, url), 'utf-8')
        // 重写裸模块导入部分
        ctx.body = rewriteImport(ret)
    } else if (url.startsWith('/@modules')) {
        const moduleName = url.replace("/@modules/", "");
        const prefix = path.join(__dirname, "./node_modules", moduleName);
        const module = require(prefix + "/package.json").module;
        const filePath = path.join(prefix, module);
        const ret = fs.readFileSync(filePath, "utf8");
        ctx.type = "text/javascript";
        ctx.body = rewriteImport(ret);
    } else if (url.indexOf('.vue') > -1) {
        // SFC路径
        const p = path.join(__dirname, url.split("?")[0]);
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

app.listen(4000, () => {
    console.log('simple vite start...');
})