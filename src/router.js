const puffin = require("./puffin")

function parseURL(url){
    const parsedURL = url.toString().split(/(\/)|(#)/g).filter(x => Boolean(x))
    let paths = []
    parsedURL.map(function(path,index){
        if(index > 3 && path != "#"){
            paths.push({
                name:path
            })
        }
    })
    const returnURL = {
            protocol:parsedURL[0],
            domain:parsedURL[3],
            paths:paths
    }
    return returnURL
}

function matchPath(objectURL,arrayPaths,additional){
    let message = {
        status:false
    }
    arrayPaths.map(function(pathComponent){
        const splittedPath = pathComponent.path == "/" ? ["/"] : pathComponent.path.split('/').filter(Boolean)
        objectURL.paths.map(function(currentPath,index){
            if(( splittedPath[index-1] == currentPath.name && splittedPath[index-1] !== "/" && splittedPath[index] == undefined) || (splittedPath[index-1] === "/" && objectURL.paths.length == splittedPath.length) ){
                if(pathComponent.paths != undefined && objectURL.paths[objectURL.paths.length-1].name != currentPath.name){
                    objectURL.paths.splice(0,3)
                    const paths =  {paths:[{name:"/"},...objectURL.paths]}
                    message = matchPath(paths,pathComponent.paths,{
                        lost:pathComponent.lost == undefined?additional.lost:pathComponent.lost
                    })
                }else{
                    message = {
                        status : true,
                        component : pathComponent.component
                    }
                }
                
            }
        })
    })
    if(message.status == false){
        message = {
            status : true,
            component : additional.lost.component
        }
    }
    return message;
}

function renderBox(configuration,boxId,additionalConfig){
    const currentURL = parseURL(window.location)
    const result = matchPath(currentURL,configuration,additionalConfig)
    if(result.status){
        puffin.render(result.component,document.getElementById(boxId),{
            removeContent:true
        })
    }
}

function goToPath(configuration,boxId,additionalConfig,path){
    history.replaceState({}, "", path)
    renderBox(configuration,boxId,additionalConfig)
}

function puffinRouter(configuration,additionalConfig){
    const boxId = Math.random()
    const data = {
        box: puffin.element(`
            <div id="${boxId}"></div>
        `),
        link: puffin.element(`
                <a click="$click" path="{{path}}" href="#">{{text}}</a>
            `,{
                methods:[
                    function click(){
                        goToPath(configuration,boxId,additionalConfig,this.getAttribute("path"))
                    }
                ],
                props:["text","path"]
            })
    }
    window.addEventListener("load",function(){
        renderBox(configuration,boxId,additionalConfig)          
    })
    return data 
}

module.exports = puffinRouter