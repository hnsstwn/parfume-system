const { error } = require('../utils/response');

const authorize = (roles = []) => {
    if (typeof roles === 'string') {
        roles = [roles];
    }

    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return error(res, 'Access Denied. You do not have permission.', 403);
        }
        next();
    };
};

module.exports = authorize;

