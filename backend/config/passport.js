import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import {
  findUserByEmail,
  findUserById,
  serializeUser,
} from "../db/usersCollection.js";

passport.use(
  new LocalStrategy(
    { usernameField: "email" },
    async (email, password, done) => {
      try {
        const user = await findUserByEmail(email);
        if (!user) {
          done(null, false, { message: "Invalid email or password." });
          return;
        }

        const isValidPassword = await bcrypt.compare(
          password,
          user.passwordHash,
        );

        if (!isValidPassword) {
          done(null, false, { message: "Invalid email or password." });
          return;
        }

        done(null, user);
      } catch (error) {
        done(error);
      }
    },
  ),
);

passport.serializeUser((user, done) => done(null, user._id.toString()));

passport.deserializeUser(async (id, done) => {
  try {
    const user = await findUserById(id);
    // Pass false (not null) when the user no longer exists so Passport
    // clears the stale session instead of setting req.user to null.
    done(null, user ? serializeUser(user) : false);
  } catch (error) {
    done(error);
  }
});

export default passport;
