module.exports = {
    _id:  0,
    photos: [
        {
            id: '0',
            name: 'fucking shit',
            description: 'fucking shit like love',
            category: 'ACTION',
            githubUser: 'Bread',
            created: "3-28-1977"
        },
        {
            id: '1',
            name: 'fucking bitch',
            description: 'fucking bitch like love',
            category: 'SELFIE',
            githubUser: 'Youngsun',
            created: "1-2-1985"
        },
        {
            id: '2',
            name: 'fucking sucking',
            description: 'fucking sucking like love',
            category: 'LANDSCAPE',
            githubUser: 'Youngsun',
            created: "2018-04-15T19:09:57.308Z"
        }
    ],
    users: [
        {
            githubLogin: 'Bread',
            name: 'Bread Kim'
        },
        {
            githubLogin: 'Youngsun',
            name: 'Youngsun Kim'
        },
        {
            githubLogin: 'KYS',
            name: 'Kim Young sun'
        }
    ],
    tags: [
        {photoID: '1', userID: 'Bread'},
        {photoID: '2', userID: 'Youngsun'},
        {photoID: '2', userID: 'KYS'},
        {photoID: '2', userID: 'Bread'}
    ]
};