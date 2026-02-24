import entry from './entry';

const files = import.meta.globEager('./*.js');
let api = {};
Object.keys(files).forEach((key) => {
  api = {
    ...api,
    [key.replace(/(.*\/)*([^.]+).*/gi, '$2')]: files[key].default,
  };
});

api = {
  ...api,
  entry,
};

export default api;
