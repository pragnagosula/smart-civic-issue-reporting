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
        
        let beforeLength = content.length;
        
        // Use a non-greedy regex to match: `\${process.env.REACT_APP_API_URL ... to ... }/api`}
        // The pattern exactly matches:
        // `\${process.env.REACT_APP_API_URL || `\${process.env.REACT_APP_NODE_URL || `\${process.env.REACT_APP_NODE_URL || 'http://localhost:5000'}`}/api`}
        
        let regex = /\`\\\$\{process\.env\.REACT_APP_API_URL.*?'http:\/\/localhost:5000'\}\`\}\/api\`\}/g;
        
        // Replace with simply: ${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}
        content = content.replace(regex, "${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}");

        // Just in case they replaced it such that the final '}' is missing or extra characters
        let backupRegex = /\`\\\$\{process\.env\.REACT_APP_API_URL.*?\/api\`\}/g;
        content = content.replace(backupRegex, "${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}");

        if (content.length !== beforeLength) {
            fs.writeFileSync(f, content, 'utf8');
            changedFiles++;
            console.log('Fixed:', f);
        }
    }
});

console.log('Total files fixed:', changedFiles);
