exports.success = (res, data, message = 'Success', code = 200) => {
    res.status(code).json({
        status: true,
        message,
        data
    });
};

exports.error = (res, message = 'Internal Server Error', code = 500, error = null) => {
    res.status(code).json({
        status: false,
        message,
        error: process.env.NODE_ENV === 'development' ? error : undefined
    });
};

