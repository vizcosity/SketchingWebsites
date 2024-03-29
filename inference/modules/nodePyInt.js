/**
 * Node interface for communicating with Python scripts.
 *
 * Takes arguments from the module entry point, then passes it to the
 * Python script through STDIN and relays the response from the scritpt's STDOUT
 * to an accumulating variable which is collected on close of the script by a
 * callback.
 *
 *  [1] "STDIN / STDOUT Documentation On Node",
 *  https://nodejs.org/api/child_process.html#child_process_child_process
 */

// Child process handles spawning new process instances.
const { spawn } = require('child_process');

// Define module entry point.
module.exports = (path, args, ops) => {

  // Prepare args if empty.
  if (!args) args = [];

  log(`Instantiated NodePyInt with path ${path} and args ${args}`);

  // Return a function which is invoked with data, and returns promise with results.
  return (data) => {

      return new Promise((resolve, reject) => {

        __DEBUG = ops && ops.debug ? ops.debug : false;

        var spawnOps = (ops && ops.cwd ? {cwd: ops.cwd} : {});

        // Spawn the child process.
        var pyProc = spawn((ops && ops.pythonCmd ? ops.pythonCmd : "python3"), [path, ...args], spawnOps);

        // Inject data.
        if (data) pyProc.stdin.write(JSON.stringify(data));

        // Notify end of data write.
        if (data) pyProc.stdin.end();

        var output = "";

        // On successful data output, resolve the Promise.s
        pyProc.stdout.on('data', (data) => {
          data = data.toString('utf8');
          output += data;
        });

        pyProc.stderr.on('data', data => reject(data.toString('utf8')));

        // On close, resolve the promise as empty.
        pyProc.on('close', () => {

          // Attempt to parse as JSON.
          try {
            var parsed = JSON.parse(output);
            output = parsed;
          } catch(e){
            // Data is not JSON. Return raw string.
            log(`Warning: Data returned by ${path} is not in JSON format:`, output);
            reject(output);
          }

          resolve(output);
        });


        // On error, reject the promise.s
        pyProc.stdout.on('error', (err) => {
          reject(err);
        });

      });

}


}

function log(msg){
  if (process.env.DEBUG) console.log(`nodePyInt | ${msg}`);
}
