# TomoIDV Demo 

## 프로젝트 clone 후 dependency 설치 
`docker compose`를 이용하여 container 내부 환경 진입 후 `npm i` 
```
docker compose run --rm --entrypoint sh demo

/app # npm i 
```

## 프로젝트 실행
`docker compose up` 실행 후 `localhost:3000` 접속 
```
docker compose up -d 
```
