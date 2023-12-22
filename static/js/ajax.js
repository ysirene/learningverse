function ajax(src, options) {
  return new Promise(function (resolve, reject) {
    fetch(src, options)
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        resolve(data);
      })
      .catch((error) => {
        reject(error);
      });
  });
}
