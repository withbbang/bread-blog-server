const Query = require('./Query');
const Mutation = require('./Mutation');
const Subscription = require('./Subscription');
const Type = require('./Type');

// 리졸버
// 0) 실제 데이터를 가공해서 보내주는 객체.
// 1) 루트쿼리 Query, Mutation, Subscription 내부는 쿼리에 대한 반환값들을 함수 실행문으로 정의.
// 2) 타입정의 내부 필드들은 특별히 따로 함수 실행문으로 리턴할 수 있다. ex) Photo 타입의 url 필드.
module.exports = {
  Query,
  Mutation,
  Subscription,
  ...Type
};