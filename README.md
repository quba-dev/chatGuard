## Usage

* Provide environment variables file
```shell script
cp .env.sample .env
```    

* Run with docker-compose 
```shell script
docker-compose up
```  

* Format and lint source code files
```shell script
npm run format
npm run lint
```

* Generate database migration file
```shell script
npm run db:migration:generate <file-name>
```

* Run database migrations
```shell script
npm run db:migration:run
```
