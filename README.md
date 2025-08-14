# TomoIDV Demo 

## 프로젝트 clone 후 dependency 설치 
`docker compose`를 이용하여 container 내부 환경 진입 후 `npm i` (설치 후 exit으로 빠져나올 수 있음)
```
docker compose run --rm --entrypoint sh demo

/app # npm i 
```

## 프로젝트 실행
`docker compose up` 실행 후 `localhost:3000` 접속 
```
docker compose up -d 
```

## `docker-compose.yaml` 구성 
* 구동 환경을 바꿔주기 위한 `entrypoint` 명령어 선택 가능 (`start:dev`, `start:test`, `start`)
* `localhost:{port}` 접속 시 임의의 포트 지정 가능 (예: `localhost:5000` 접속하려면 `3000:3000 -> 5000:3000`)

```yaml
services:
  demo:
    image: node:20-alpine
    working_dir: /app

    volumes:
      - ./:/app

    entrypoint: ["npm", "run", "start"]

    ports:
      - "3000:3000"
      - "3001:3001"
```
