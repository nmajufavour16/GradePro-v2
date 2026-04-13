fetch('http://localhost:3000/api/session/current')
  .then(res => {
    console.log('Status:', res.status);
    return res.text();
  })
  .then(console.log)
  .catch(console.error);
