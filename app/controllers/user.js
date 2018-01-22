import User from './../models/user';

/**
 * User controller - All functions related to users
 * @module controllers/user
 */

const userController = {
    /**
     * Create a new user
     *
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     * @returns {undefined}
     */
    async createUser(req, res, next) {
        const { email, password } = req.body;
        try {
            await User.createUser(email, password);
            return next();
        } catch (e) {
            console.log(e);
            return next(); // TODO: This should break here !!
        }
    },
    /**
     * Add tvshow to user
     *
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {undefined}
     */
    async addTvshowToUser(req, res) {
        const { tvshowId } = req.params;
        const userId = req.user;
        try {
            const isUserFollowingTvshow = await User.isFollowingTvshow(userId, tvshowId);
            if (isUserFollowingTvshow) {
                return res.status(400).json({ error: 'You are already following this tvshow.' });
            }
            const addTvshowToUser = await User.addTvshow(userId, tvshowId);
            if (addTvshowToUser) {
                return res.json({ tvshowId });
            }
            throw new Error();
        } catch (e) {
            console.log(e);
            return res.status(500).json({ error: 'Server error. Please try again later.' });
        }
    },
    /**
     * Remove tvshow from user
     *
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {undefined}
     */
    async removeTvshowFromUser(req, res) {
        const { tvshowId } = req.params;
        const userId = req.user;
        try {
            const isUserFollowingTvshow = await User.isFollowingTvshow(userId, tvshowId);
            if (!isUserFollowingTvshow) {
                return res.status(400).json({ error: 'You are not following this tvshow.' });
            }
            const removeTvshowFromUser = await User.removeTvshow(userId, tvshowId);
            if (removeTvshowFromUser) {
                return res.json({ tvshowId });
            }
            throw new Error();
        } catch (e) {
            console.log(e);
            return res.status(500).json({ error: 'Server error. Please try again later.' });
        }
    },
};

module.exports = userController;
