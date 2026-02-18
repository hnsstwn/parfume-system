const { error } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    error(res, err.message || 'Server Error', 500, err);
};

module.exports = errorHandler;

