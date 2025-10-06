// inpage.js - This script runs in the page's own context.

(function() {
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info,
    debug: console.debug,
  };

  // Function to serialize arguments for sending
  const serializeArgs = (args) => {
    try {
      return args.map(arg => {
        if (arg instanceof Error) {
          return {
            message: arg.message,
            stack: arg.stack,
            name: arg.name,
            __isError__: true
          };
        }
        // A simple way to handle circular references and complex objects.
        // For a more robust solution, a specialized library might be needed.
        return JSON.parse(JSON.stringify(arg, (key, value) => {
            if (typeof value === 'function') {
                return `[Function: ${value.name || 'anonymous'}]`;
            }
            return value;
        }));
      });
    } catch (e) {
      return ['Could not serialize arguments'];
    }
  };
  
  // Override each console method
  Object.keys(originalConsole).forEach(level => {
    console[level] = function(...args) {
      // 1. Call the original console method to maintain default behavior
      originalConsole[level].apply(console, args);

      // 2. Capture stack trace to find the source
      const stack = new Error().stack.split('\n');
      // The first line is 'Error', the second is this function, the third is the caller.
      const sourceLine = stack[2] ? stack[2].trim() : 'Unknown source';
      
      // 3. Construct the log entry
      const logEntry = {
        level,
        message: serializeArgs(args),
        timestamp: new Date().toISOString(),
        source: sourceLine,
      };
      
      // 4. Send the log entry to the content script
      window.postMessage({ type: 'LOGTAILER_LOG', payload: logEntry }, '*');
    };
  });
})();
