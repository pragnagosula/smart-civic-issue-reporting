const fs = require('fs');

function walk(dir) {
    let results = [];
    let list = fs.readdirSync(dir);
    list.forEach(file => {
        file = dir + '/' + file;
        let stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            results.push(file);
        }
    });
    return results;
}

let files = walk('./src');
let changedFiles = 0;

files.forEach(f => {
    if (f.endsWith('.jsx') || f.endsWith('.js')) {
        let content = fs.readFileSync(f, 'utf8');
        let beforeContent = content;
        
        // Literal backslash followed by backtick
        content = content.split("\\`${process.env.REACT_APP_API_URL").join("`${process.env.REACT_APP_API_URL");

        if (content !== beforeContent) {
            fs.writeFileSync(f, content, 'utf8');
            changedFiles++;
            console.log('Fixed syntax:', f);
        }
    }
});
