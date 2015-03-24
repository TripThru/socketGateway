module.exports = {
  port: 3300,
  db: {
    host: '127.0.0.1', 
    database: 'tripthru',
    user:'vagrant', 
    password:'vagrant'
  },
  kue: {
    prefix: 'q',
    redis: {
      port: 6379,
      host: '127.0.0.1',
      auth: ''
    }
  }
}