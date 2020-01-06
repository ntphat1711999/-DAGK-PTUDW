module.exports = (req, res, next) => {
    if (req.isAuthenticated() && req.user.type === 'admin') {
        return next();
    }
    res.redirect(`/login?retUrl=${req.originalUrl}`);
}