const apiUrl = 'http://localhost:9090/upload';

function uploadImage(path) {
  const photo = {
    uri: path,
    type: 'image/jpeg',
    name: 'photo.jpg',
  };

  console.log(photo);

  const body = new FormData();
  body.append('photo', photo);

  const xhr = new XMLHttpRequest();
  xhr.open('POST', apiUrl);
  xhr.send(body);
  console.log(xhr.status);
}

export {uploadImage};
