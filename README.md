# graphql-tutorial

# createComplexityLimitRule: 쿼리 코스트 제한

- createComplexityLimitRule(limit, cb)
- ex)
- query{
-       id              : 단일 필드일 경우 1
-       name            : 단일 필드일 경우 1
-       Users{
-           id          : 배열의 내부 필드일 경우 ^10 = 10
-           name        : 배열의 내부 필드일 경우 ^10 = 10
-           Photos{
-               id      : 배열의 내부 필드일 경우 ^10 = 100
-           }
-       }
- }
-                       : 합산 = 122
