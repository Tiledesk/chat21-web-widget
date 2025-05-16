var glob = require("glob")
var replace = require("replace");

initReplacement()


function initReplacement(){
    console.log('init replacement HEREEE')
    fileToBeReplaced = {
        'main' : {name: 'main', extension: '.js', regex: /(?<=\/main\.)(.+?)(?=\.js|$)/},
        'runtime' : {name: 'runtime', extension: '.js', regex: /(?<=\/runtime\.)(.+?)(?=\.js|$)/},
        'polyfills' : {name: 'polyfills', extension: '.js', regex: /(?<=\/polyfills\.)(.+?)(?=\.js|$)/},
        'vendor' : {name: 'vendor', extension: '.js', regex: /(?<=\/vendor\.)(.+?)(?=\.js|$)/},
        'styles' : {name: 'styles', extension: '.css', regex: /(?<=\/styles\.)(.+?)(?=\.css|$)/},
    }

    Object.keys(fileToBeReplaced).forEach(key => {
        replaceFile(key, fileToBeReplaced[key])
    })
    // glob("./dist/main*", function (er, files) {
    //     // files is an array of filenames.
    //     // If the `nonull` option is set, and nothing
    //     // was found, then files is ["**/*.js"]
    //     // er is an error object or null.
    //     console.log('fileeeeee', files)
    //     hashCode = files[0].match(/(?<=\/main\.)(.+?)(?=\.js|$)/)[0]
    //     console.log('hashhh',hashCode )
    //     replace({
    //         regex: "main",
    //         replacement: "main."+hashCode ,
    //         paths: [ './dist/launch.js' ],
    //         recursive: true,
    //         silent: false,
    //     }, (error,changedFiles)=>{
    //         if (error) {
    //             return console.error('Error occurred:', error);
    //           }
    //           console.log('Modified files:', changedFiles.join(', '));
    //     });
        
    // })
    
}



function replaceFile(name, element){
    let hashCode = ''
    glob("./dist/"+name+"*", function (er, files) {
        // files is an array of filenames.
        // If the `nonull` option is set, and nothing
        // was found, then files is ["**/*.js"]
        // er is an error object or null.
        console.log('fileeeeee', files, element)
        hashCode = files[0].match(element.regex)[0]
        console.log('hashhh',hashCode ,name )
        replace({
            regex: '{{'+ name + '}}'+ element.extension,
            replacement: name + "." + hashCode + element.extension ,
            paths: [ './dist/launch.js' ],
            recursive: true,
            silent: false,
        }, (error,changedFiles)=>{
            if (error) {
                return console.error('Error occurred:', error);
            }
              console.log('Modified files:', changedFiles);
        });
        
    })
}