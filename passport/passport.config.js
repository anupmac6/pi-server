const mongoose = require("mongoose");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const { User } = require("../models/user");

passport.use(
  "local",
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (email, password, done) => {
      User.findOne({ email: email })
        .then((user) => {
          if (!user || !user.validatePassword(password)) {
            return done(null, false, {
              errors: { "email or password": "is invalid" },
            });
          }
          return done(null, user);
        })
        .catch(done);
    }
  )
);
