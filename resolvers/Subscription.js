module.exports = {
    addFakeUsers: {
        subscribe: (parent, args, { pubsub }) => {
            console.log(parent)
            console.log('============================================================================================================')
            console.log(args)
            console.log('============================================================================================================')
            console.log(pubsub)
            console.log('============================================================================================================')
            return pubsub.asyncIterator('addFakeUsers')
        }
    },
    test: {
        subscribe: (parent, args, { pubsub }) => {
            console.log(parent)
            console.log('============================================================================================================')
            console.log(args)
            console.log('============================================================================================================')
            console.log(pubsub)
            console.log('============================================================================================================')
            return pubsub.asyncIterator('test')
        }
    }
}