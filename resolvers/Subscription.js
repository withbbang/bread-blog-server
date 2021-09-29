module.exports = {
    addFakeUsers: {
        subscribe: (parent, args, { pubsub }) => {
            console.log(parent)
            return pubsub.asyncIterator('addFakeUsers')
        }
    },
    test: {
        subscribe: (parent, args, { currentUser, pubsub }) => {
            console.log(currentUser)
            return pubsub.asyncIterator('test')
        }
    }
}