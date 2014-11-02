module.exports = {
  port: 3300,
  db: {
    url: 'mongodb://localhost:27017/tripthru', 
    user:'', 
    password:''
  },
  kue: {
    prefix: 'q',
    redis: {
      port: 6379,
      host: '10.0.50.20',
      auth: ''
    }
  }
}