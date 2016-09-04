const fs = require('fs');
const exec = require('child_process').exec;

let x = JSON.parse(fs.readFileSync('./package.json'));

exec('git rev-parse --short=7 HEAD', (err, stdout) => {
    if (err) {
        console.error(err);
        return;
    }
    x.commit = stdout.replace('\n', '');
    fs.writeFileSync('./package.json', JSON.stringify(x, null, 4));
});
