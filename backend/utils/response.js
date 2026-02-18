// ===============================
// SUCCESS RESPONSE
// ===============================
exports.success = (
  res,
  message = "Success",
  data = null,
  statusCode = 200
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

// ===============================
// ERROR RESPONSE
// ===============================
exports.error = (
  res,
  message = "Internal Server Error",
  statusCode = 500,
  error = null
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && error && { error })
  });
};
