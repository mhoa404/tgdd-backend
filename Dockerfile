FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Install ts-node globally (bắt buộc cho runtime TS)
RUN npm install -g ts-node typescript

# Copy toàn bộ source
COPY . .

EXPOSE 5050

CMD ["npm", "start"]
