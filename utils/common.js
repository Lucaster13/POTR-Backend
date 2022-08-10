import { execFile } from 'child_process';

export const execPython = (prog) => new Promise((success, error) => {
    execFile('python3', [prog], (err, stdout) => {
        if (err) {
            console.error(`error: ${err.message}`);
            error(err);
            return;
        }

        console.log(`successful execution of ${prog}`);

        success(stdout.split('\n').filter((x) => x.length));
    });
});
