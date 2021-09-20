const metaData = require('../metaData');

module.exports = {
    totalPhotos: () => metaData.photos.length,
    allPhotos: () => metaData.photos,
    allUsers: () => metaData.users
}