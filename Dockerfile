FROM node:14.17-stretch AS development

WORKDIR /usr/src/app
COPY package.json ./
COPY yarn.lock ./

RUN #npm install -g yarn
RUN yarn install

COPY . .
RUN yarn run build

FROM node:14.17-stretch AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app
COPY package.json ./
COPY yarn.lock ./

RUN #npm install -g yarn
RUN yarn install --production=true

COPY . .
COPY --from=development /usr/src/app/dist ./dist

CMD ["node", "dist/main"]
