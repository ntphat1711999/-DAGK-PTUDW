module.exports = (req, res, next) => {
    req.user.isVerified ? next() : res.redirect('/user/email/verify');
}