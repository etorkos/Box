var path = require('path'),
    rootPath = path.normalize(__dirname + '/..'),
    env = process.env.NODE_ENV || 'development';

var config = {
  development: {
    root: rootPath,
    app: {
      name: 'intelbox'
    },
    port: 3000,
    db: 'mongodb://localhost/intelbox-development'
  },

  test: {
    root: rootPath,
    app: {
      name: 'intelbox'
    },
    port: 3000,
    db: 'mongodb://localhost/intelbox-test'
  },

  production: {
    root: rootPath,
    app: {
      name: 'intelbox'
    },
    port: 3000,
    db: 'mongodb://localhost/intelbox-production'
  }
};

module.exports = config[env];
