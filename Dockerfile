FROM node:23.11.0-alpine3.20

WORKDIR /usr/src/app

COPY package.json package-lock.json tsconfig.json ./

#install dependencied
RUN npm i

COPY ./ ./

#build the app

RUN npm run build

#start the app

CMD [ "npm", "run", "start" ]
