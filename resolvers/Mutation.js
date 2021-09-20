const metaData = require('../metaData');

module.exports = {
    async postPhoto(parent, args) {
        const newPhoto = {
          id: _id++,
          ...args.input,
          created: new Date()
        }
        metaData.photos.push(newPhoto);
        return newPhoto
    
      }
}