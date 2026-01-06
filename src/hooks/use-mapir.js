import { useState, useEffect } from 'react';

const MAP_IR_JS_URL = 'https://cdn.map.ir/web-sdk/1.4.2/js/mapp.min.js';
const MAP_IR_CSS_URL = 'https://cdn.map.ir/web-sdk/1.4.2/css/mapp.min.css';

let scriptLoaded = false;
let scriptError = null;
const waitingCbs = [];

function useMapir() {
  const [isLoaded, setIsLoaded] = useState(scriptLoaded);
  const [error, setError] = useState(scriptError);

  useEffect(() => {
    if (scriptLoaded) {
      return;
    }

    const script = document.createElement('script');
    script.src = MAP_IR_JS_URL;
    script.async = true;

    const onScriptLoad = () => {
      scriptLoaded = true;
      waitingCbs.forEach((cb) => cb(null));
    };

    const onScriptError = (err) => {
      scriptError = err;
      waitingCbs.forEach((cb) => cb(err));
    };

    script.addEventListener('load', onScriptLoad);
    script.addEventListener('error', onScriptError);

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = MAP_IR_CSS_URL;

    document.head.appendChild(link);
    document.body.appendChild(script);

    const callback = (err) => {
      if (err) {
        setError(err);
      } else {
        setIsLoaded(true);
      }
    };
    
    waitingCbs.push(callback);

    return () => {
      script.removeEventListener('load', onScriptLoad);
      script.removeEventListener('error', onScriptError);
      const index = waitingCbs.indexOf(callback);
      if (index > -1) {
        waitingCbs.splice(index, 1);
      }
    };
  }, []);

  return [isLoaded, error];
}

export default useMapir;
