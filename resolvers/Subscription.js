module.exports = {
    addFakeUsers: {
        subscribe: (parent, args, { pubsub }) => {
            console.log(parent)
            console.log('============================================================================================================')
            return pubsub.asyncIterator('addFakeUsers')
        }
    },
    test: {
        subscribe: (parent, args, { pubsub }) => {
            console.log(parent)
            console.log('============================================================================================================')
            return pubsub.asyncIterator('test')
        }
    }
}