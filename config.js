module.exports = {
  port: 3300,
  db: {
    host: '107.170.235.36', 
    database: 'tripthru',
    user:'tripuser', 
    password:'Tr1PServ1Ce@MySqL'
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