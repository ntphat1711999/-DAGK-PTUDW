const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Profile = require('../models/Profile');

// validating input
const { validationResult } = require('express-validator');

module.exports = (passport) => {
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser((id, done) => {
        User.findById(id, (err, user) => {
            done(err, user);
        });
    });

    // passport login
    passport.use('login', new LocalStrategy(
        {
            usernameField: 'username',
            passwordField: 'password',
            passReqToCallback: true
        },
        (req, username, password, done) => {
            User.findOne({ username })
                .then(user => {
                    if (!user) {
                        return done(null, false, { message: 'Tài khoản chưa đăng ký' });
                    }
                    bcrypt.compare(password, user.password, (err, isMatch) => {
                        if (err) {
                            return done(null, false);
                        }
                        if (isMatch) {
                            done(null, user);
                        } else {
                            done(null, false, { message: 'Sai mật khẩu' });
                        }
                    })
                })
        }
    ))
    // passport register
    passport.use('register', new LocalStrategy(
        {
            usernameField: 'username',
            passwordField: 'password',
            passReqToCallback: true
        },
        (req, username, password, done) => {
            // input valid
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return done(null, false, { message: errors.array()[0].msg });
            }

            const { fullName, email, address } = req.body;
            User.findOne({ username })
                .then(user => {
                    if (user) {
                        return done(null, false, { message: 'Tài khoản không tồn tại' });
                    }
                    Profile.findOne({ email })
                        .then(profile => {
                            if (profile) {
                                return done(null, false, { message: 'Email đã tồn tại' });
                            }
                            // new Profile
                            const newProfile = new Profile({
                                fullName,
                                email,
                                address
                            })
                            newProfile.save()
                                .then()
                                .catch(error => console.error(error.message))

                            // new guess User 
                            let newUser = new User({
                                username,
                                password,
                                profileId: newProfile.id,
                                roles: 'bidder'
                            })
                            // bcrypt
                            bcrypt.genSalt(10, (err, salt) => {
                                bcrypt.hash(newUser.password, salt, (err, hash) => {
                                    if (err) {
                                        return done(err, false);
                                    }
                                    newUser.password = hash;
                                    newUser.save()
                                        .then(user => done(null, user))
                                        .catch(error => console.log(error.message));
                                })
                            })
                        })
                })
        }
    ));
}