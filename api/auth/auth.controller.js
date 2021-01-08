const { User } = require("../../models/user");
const auth = require("./auth.service");
const passport = require("passport");

exports.login = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  if (!email) {
    const exception = new Error("Email is required");
    next(exception);
  }
  if (!password) {
    const exception = new Error("Password is required");
    next(exception);
  }

  return passport.authenticate(
    "local",
    { session: false },
    (err, passportUser, info) => {
      if (err) {
        return next(err);
      }
      if (passportUser) {
        const user = passportUser;
        user.token = passportUser.generateJWT();
        return next({ user: user.toAuthJSON(user.token) });
      }
      return next(new Error("Failed to authenticate"));
    }
  )(req, res, next);
};

exports.signup = async (req, res, next) => {
  await auth
    .signup(req.body)
    .then((result) => next(result))
    .catch((err) => next(err));
};

exports.forgotPassword = async (req, res, next) => {
  const email = req.body.email;
  await auth
    .forgotPassword(email)
    .then((result) => next(result))
    .catch((err) => next(err));
};

exports.changePassword = async (req, res, next) => {
  await auth
    .changePassword(req.body)
    .then((result) => next(result))
    .catch((err) => next(err));
};
