const success = (code = 200, message = "successfull", data = []) => {
  return {
    code,
    message,
    data,
  };
};
const error = (code = 500, message = "fail", data = null) => {
  return {
    code,
    message,
    data,
  };
};

module.exports = { success, error };
